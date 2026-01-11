from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import json
from datetime import datetime

from database import get_db, engine, Base
from models import User, Game
from schemas import (
    StartGameRequest, StartGameResponse,
    MakeDecisionRequest, DecisionResponse,
    GameStateResponse, StatsResponse, ChoiceOption,
    ErrorResponse
)
from ollama_service import (
    generate_initial_situation,
    generate_decision_outcome,
    check_ollama_health,
    OllamaError
)

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Geopolitical Simulation Game API",
    description="API pour un jeu de simulation géopolitique assisté par IA",
    version="1.0.0"
)

# Configure CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Health check endpoint"""
    return {"status": "ok", "message": "Geopolitical Simulation API"}


# ===== TTS ENDPOINT =====
from fastapi.responses import Response
from tts_service import generate_speech_python, FRENCH_MODEL


@app.post("/tts")
async def text_to_speech(request: dict):
    """Generate speech from text using Piper TTS"""
    text = request.get("text", "")
    
    if not text:
        raise HTTPException(status_code=400, detail="Text is required")
    
    if not FRENCH_MODEL.exists():
        raise HTTPException(
            status_code=500, 
            detail="TTS model not available. Please download the French voice model."
        )
    
    try:
        audio_data = generate_speech_python(text)
        return Response(
            content=audio_data,
            media_type="audio/wav",
            headers={
                "Content-Disposition": "inline; filename=speech.wav"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS generation failed: {str(e)}")


@app.get("/health/ollama")
async def check_ollama():
    """Check if Ollama is available"""
    is_healthy = await check_ollama_health()
    if is_healthy:
        return {"status": "ok", "message": "Ollama is running"}
    else:
        return {"status": "error", "message": "Ollama is not available. Run 'ollama serve' to start it."}


# ===== AUTHENTICATION ENDPOINTS =====
import hashlib

def hash_password(password: str) -> str:
    """Simple password hashing (use bcrypt in production)"""
    return hashlib.sha256(password.encode()).hexdigest()


@app.post("/auth/register")
async def register(request: dict, db: Session = Depends(get_db)):
    """Register a new user"""
    username = request.get("username", "").strip()
    password = request.get("password", "")
    
    if not username or not password:
        raise HTTPException(status_code=400, detail="Nom d'utilisateur et mot de passe requis")
    
    if len(username) < 3:
        raise HTTPException(status_code=400, detail="Nom d'utilisateur trop court (min 3 caractères)")
    
    if len(password) < 4:
        raise HTTPException(status_code=400, detail="Mot de passe trop court (min 4 caractères)")
    
    # Check if user exists
    existing = db.query(User).filter(User.username == username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ce nom d'utilisateur existe déjà")
    
    # Create user
    user = User(
        username=username,
        password_hash=hash_password(password)
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return {
        "success": True,
        "user": {"id": user.id, "username": user.username},
        "token": f"user_{user.id}"  # Simple token for demo
    }


@app.post("/auth/login")
async def login(request: dict, db: Session = Depends(get_db)):
    """Login a user"""
    username = request.get("username", "").strip()
    password = request.get("password", "")
    
    user = db.query(User).filter(User.username == username).first()
    
    if not user or user.password_hash != hash_password(password):
        raise HTTPException(status_code=401, detail="Identifiants incorrects")
    
    return {
        "success": True,
        "user": {"id": user.id, "username": user.username},
        "token": f"user_{user.id}"
    }


@app.get("/auth/me")
async def get_current_user(user_id: int, db: Session = Depends(get_db)):
    """Get current user info"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    return {"id": user.id, "username": user.username}


@app.post("/start_game", response_model=StartGameResponse)
async def start_game(request: StartGameRequest, db: Session = Depends(get_db)):
    """
    Initialize a new game session.
    Takes a country name and starting year, generates initial situation via Ollama.
    """
    try:
        # Check Ollama availability
        if not await check_ollama_health():
            raise OllamaError(
                "Ollama n'est pas disponible. Démarrez-le avec 'ollama serve' "
                "puis 'ollama run mistral' (ou un autre modèle)."
            )
        
        # Generate initial situation from Ollama
        situation = await generate_initial_situation(request.country, request.year)
        
        # Create game record
        game = Game(
            user_id=request.user_id,
            country=request.country,
            country_code=request.country_code,
            current_date=str(request.year),
            stats=situation.get("stats", {
                "gold": 1000,
                "stability": 60,
                "army": 50000,
                "population": 1000000,
                "diplomacy": 50
            }),
            narrative_history=[{
                "role": "system",
                "content": situation.get("narrative", ""),
                "timestamp": datetime.now().isoformat()
            }],
            current_choices=situation.get("choices", [])
        )
        
        db.add(game)
        db.commit()
        db.refresh(game)
        
        # Build response
        stats = game.stats
        choices = [
            ChoiceOption(
                index=c.get("index", i),
                text=c.get("text", ""),
                risk_level=c.get("risk_level", "medium")
            )
            for i, c in enumerate(game.current_choices)
        ]
        
        game_state = GameStateResponse(
            game_id=game.id,
            country=game.country,
            current_date=game.current_date,
            stats=StatsResponse(**stats),
            narrative=situation.get("narrative", ""),
            choices=choices
        )
        
        return StartGameResponse(success=True, game=game_state)
        
    except OllamaError as e:
        return StartGameResponse(success=False, error=str(e))
    except Exception as e:
        return StartGameResponse(success=False, error=f"Erreur serveur: {str(e)}")


@app.post("/make_decision", response_model=DecisionResponse)
async def make_decision(request: MakeDecisionRequest, db: Session = Depends(get_db)):
    """
    Process a player's decision and generate the outcome.
    """
    try:
        # Get the game
        game = db.query(Game).filter(Game.id == request.game_id).first()
        if not game:
            return DecisionResponse(success=False, error="Partie non trouvée")
        
        # Get the selected choice
        choices = game.current_choices or []
        if request.choice_index >= len(choices):
            return DecisionResponse(success=False, error="Choix invalide")
        
        selected_choice = choices[request.choice_index]
        choice_text = selected_choice.get("text", "")
        
        # Check Ollama
        if not await check_ollama_health():
            raise OllamaError("Ollama n'est pas disponible")
        
        # Generate outcome
        current_year = int(game.current_date)
        outcome = await generate_decision_outcome(
            country=game.country,
            year=current_year,
            current_stats=game.stats,
            choice_text=choice_text,
            narrative_history=game.narrative_history or []
        )
        
        # Apply stat changes
        stat_changes = outcome.get("stat_changes", {})
        new_stats = game.stats.copy()
        for stat, change in stat_changes.items():
            if stat in new_stats:
                new_stats[stat] = max(0, new_stats[stat] + change)
        
        # Update game state
        new_narrative = outcome.get("outcome_narrative", "")
        new_history = (game.narrative_history or []) + [{
            "role": "player",
            "content": f"Décision: {choice_text}",
            "timestamp": datetime.now().isoformat()
        }, {
            "role": "system",
            "content": new_narrative,
            "timestamp": datetime.now().isoformat()
        }]
        
        new_year = outcome.get("new_year", current_year + 1)
        new_choices = outcome.get("new_choices", [])
        
        # Update database
        game.stats = new_stats
        game.narrative_history = new_history
        game.current_date = str(new_year)
        game.current_choices = new_choices
        
        db.commit()
        db.refresh(game)
        
        # Build response
        choices_response = [
            ChoiceOption(
                index=c.get("index", i),
                text=c.get("text", ""),
                risk_level=c.get("risk_level", "medium")
            )
            for i, c in enumerate(new_choices)
        ]
        
        game_state = GameStateResponse(
            game_id=game.id,
            country=game.country,
            current_date=game.current_date,
            stats=StatsResponse(**new_stats),
            narrative=new_narrative,
            choices=choices_response
        )
        
        return DecisionResponse(
            success=True,
            game=game_state,
            outcome_narrative=new_narrative,
            stat_changes=stat_changes
        )
        
    except OllamaError as e:
        return DecisionResponse(success=False, error=str(e))
    except Exception as e:
        return DecisionResponse(success=False, error=f"Erreur serveur: {str(e)}")


@app.get("/games/{game_id}", response_model=GameStateResponse)
async def get_game(game_id: int, db: Session = Depends(get_db)):
    """Get current game state"""
    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        raise HTTPException(status_code=404, detail="Partie non trouvée")
    
    choices = [
        ChoiceOption(
            index=c.get("index", i),
            text=c.get("text", ""),
            risk_level=c.get("risk_level", "medium")
        )
        for i, c in enumerate(game.current_choices or [])
    ]
    
    # Get last narrative
    narrative = ""
    if game.narrative_history:
        for entry in reversed(game.narrative_history):
            if entry.get("role") == "system":
                narrative = entry.get("content", "")
                break
    
    return GameStateResponse(
        game_id=game.id,
        country=game.country,
        current_date=game.current_date,
        stats=StatsResponse(**game.stats),
        narrative=narrative,
        choices=choices
    )


@app.get("/games", response_model=List[dict])
async def list_games(db: Session = Depends(get_db)):
    """List all games"""
    games = db.query(Game).order_by(Game.created_at.desc()).limit(10).all()
    return [
        {
            "id": g.id,
            "country": g.country,
            "current_date": g.current_date,
            "created_at": g.created_at.isoformat() if g.created_at else None
        }
        for g in games
    ]


@app.delete("/games/{game_id}")
async def delete_game(game_id: int, db: Session = Depends(get_db)):
    """Delete a saved game"""
    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        raise HTTPException(status_code=404, detail="Partie non trouvée")
    db.delete(game)
    db.commit()
    return {"success": True, "message": "Partie supprimée"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

import httpx
import json
from typing import Dict, Any, List, Optional
import os

OLLAMA_BASE_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "ministral-3:3b")


class OllamaError(Exception):
    """Exception raised when Ollama is unavailable or returns an error"""
    pass


async def check_ollama_health() -> bool:
    """Check if Ollama server is running"""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
            return response.status_code == 200
    except Exception:
        return False


async def generate_completion(prompt: str, system_prompt: str = "") -> str:
    """
    Send a prompt to Ollama and get a completion.
    Raises OllamaError if Ollama is not available.
    """
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            payload = {
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False,
                "format": "json"
            }
            
            if system_prompt:
                payload["system"] = system_prompt
            
            response = await client.post(
                f"{OLLAMA_BASE_URL}/api/generate",
                json=payload
            )
            
            if response.status_code != 200:
                raise OllamaError(f"Ollama returned status {response.status_code}")
            
            result = response.json()
            return result.get("response", "")
            
    except httpx.ConnectError:
        raise OllamaError(
            "Impossible de se connecter à Ollama. "
            "Assurez-vous qu'Ollama est démarré avec 'ollama serve'"
        )
    except httpx.TimeoutException:
        raise OllamaError("Délai d'attente dépassé pour la réponse d'Ollama")
    except Exception as e:
        raise OllamaError(f"Erreur Ollama: {str(e)}")


async def generate_initial_situation(country: str, year: int) -> Dict[str, Any]:
    """
    Generate the initial game situation for a country at a given year.
    Returns a structured JSON with narrative, stats, and choices.
    """
    system_prompt = """Tu es un maître du jeu pour un jeu de simulation géopolitique historique.
Tu dois générer des situations réalistes et engageantes basées sur l'histoire réelle.
IMPORTANT: Ignore les frontières modernes. Considère le territoire et le contexte politique de l'époque demandée.
Tu dois TOUJOURS répondre en JSON valide avec la structure exacte demandée."""

    prompt = f"""Génère la situation initiale pour un joueur qui prend le contrôle de {country} en l'an {year}.

Réponds UNIQUEMENT avec un JSON valide dans ce format exact:
{{
    "narrative": "Un paragraphe décrivant la situation politique, économique et militaire du pays à cette époque (150-200 mots)",
    "stats": {{
        "gold": <nombre entre 500 et 5000>,
        "stability": <nombre entre 20 et 100>,
        "army": <nombre entre 10000 et 500000>,
        "population": <nombre entre 100000 et 50000000>,
        "diplomacy": <nombre entre 20 et 100>
    }},
    "choices": [
        {{"index": 0, "text": "Premier choix stratégique disponible", "risk_level": "low"}},
        {{"index": 1, "text": "Deuxième choix stratégique disponible", "risk_level": "medium"}},
        {{"index": 2, "text": "Troisième choix stratégique disponible", "risk_level": "high"}}
    ],
    "historical_context": "Contexte historique bref de cette période"
}}

Assure-toi que les choix sont pertinents pour {country} en {year} et reflètent les défis réels de l'époque."""

    response_text = await generate_completion(prompt, system_prompt)
    
    try:
        # Parse the JSON response
        result = json.loads(response_text)
        return result
    except json.JSONDecodeError:
        # If parsing fails, try to extract JSON from the response
        import re
        json_match = re.search(r'\{[\s\S]*\}', response_text)
        if json_match:
            try:
                return json.loads(json_match.group())
            except json.JSONDecodeError:
                pass
        
        # Return a fallback response
        return {
            "narrative": f"Vous prenez le contrôle de {country} en {year}. La nation fait face à des défis importants sur les plans politique, économique et militaire.",
            "stats": {
                "gold": 1000,
                "stability": 60,
                "army": 50000,
                "population": 1000000,
                "diplomacy": 50
            },
            "choices": [
                {"index": 0, "text": "Renforcer l'économie nationale", "risk_level": "low"},
                {"index": 1, "text": "Moderniser l'armée", "risk_level": "medium"},
                {"index": 2, "text": "Lancer une offensive diplomatique", "risk_level": "medium"}
            ],
            "historical_context": "Période de transition majeure."
        }


async def generate_decision_outcome(
    country: str,
    year: int,
    current_stats: Dict[str, int],
    choice_text: str,
    narrative_history: List[Dict[str, str]]
) -> Dict[str, Any]:
    """
    Generate the outcome of a player's decision.
    Returns narrative, stat changes, and new choices.
    """
    system_prompt = """Tu es un maître du jeu pour un jeu de simulation géopolitique historique.
Tu dois générer des conséquences réalistes aux décisions du joueur.
Les conséquences doivent être équilibrées - les choix risqués peuvent avoir de grandes récompenses ou de grandes pertes.
Tu dois TOUJOURS répondre en JSON valide."""

    # Build context from history
    history_context = ""
    if narrative_history:
        recent_history = narrative_history[-3:]  # Last 3 events
        history_context = "Événements récents:\n" + "\n".join(
            [f"- {h.get('content', '')[:100]}..." for h in recent_history]
        )

    prompt = f"""Le joueur contrôle {country} en {year}.

Statistiques actuelles:
- Or: {current_stats.get('gold', 1000)}
- Stabilité: {current_stats.get('stability', 50)}%
- Armée: {current_stats.get('army', 50000)} hommes
- Population: {current_stats.get('population', 1000000)}
- Diplomatie: {current_stats.get('diplomacy', 50)}%

{history_context}

Le joueur a choisi: "{choice_text}"

Génère les conséquences de cette décision en JSON:
{{
    "outcome_narrative": "Description des conséquences de cette décision (100-150 mots)",
    "stat_changes": {{
        "gold": <changement, peut être négatif, entre -500 et +500>,
        "stability": <changement entre -20 et +20>,
        "army": <changement entre -10000 et +20000>,
        "population": <changement entre -50000 et +100000>,
        "diplomacy": <changement entre -15 et +15>
    }},
    "new_year": {year + 1},
    "new_choices": [
        {{"index": 0, "text": "Nouveau choix 1", "risk_level": "low"}},
        {{"index": 1, "text": "Nouveau choix 2", "risk_level": "medium"}},
        {{"index": 2, "text": "Nouveau choix 3", "risk_level": "high"}}
    ],
    "event": "Événement aléatoire qui s'est produit (ou null)"
}}"""

    response_text = await generate_completion(prompt, system_prompt)
    
    try:
        result = json.loads(response_text)
        return result
    except json.JSONDecodeError:
        import re
        json_match = re.search(r'\{[\s\S]*\}', response_text)
        if json_match:
            try:
                return json.loads(json_match.group())
            except json.JSONDecodeError:
                pass
        
        # Fallback response
        return {
            "outcome_narrative": f"Votre décision concernant '{choice_text}' a des conséquences mitigées.",
            "stat_changes": {
                "gold": -100,
                "stability": 5,
                "army": 0,
                "population": 1000,
                "diplomacy": 0
            },
            "new_year": year + 1,
            "new_choices": [
                {"index": 0, "text": "Consolider les gains", "risk_level": "low"},
                {"index": 1, "text": "Prendre une nouvelle initiative", "risk_level": "medium"},
                {"index": 2, "text": "Action audacieuse", "risk_level": "high"}
            ],
            "event": None
        }

from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


# ========== Request Schemas ==========

class StartGameRequest(BaseModel):
    country: str
    country_code: Optional[str] = None
    year: int
    user_id: Optional[int] = None


class MakeDecisionRequest(BaseModel):
    game_id: int
    choice_index: int


# ========== Response Schemas ==========

class StatsResponse(BaseModel):
    gold: int
    stability: int
    army: int
    population: int
    diplomacy: int


class ChoiceOption(BaseModel):
    index: int
    text: str
    risk_level: Optional[str] = None  # "low", "medium", "high"


class GameStateResponse(BaseModel):
    game_id: int
    country: str
    current_date: str
    stats: StatsResponse
    narrative: str
    choices: List[ChoiceOption]
    

class StartGameResponse(BaseModel):
    success: bool
    game: Optional[GameStateResponse] = None
    error: Optional[str] = None


class DecisionResponse(BaseModel):
    success: bool
    game: Optional[GameStateResponse] = None
    outcome_narrative: Optional[str] = None
    stat_changes: Optional[Dict[str, int]] = None
    error: Optional[str] = None


class ErrorResponse(BaseModel):
    success: bool = False
    error: str
    details: Optional[str] = None

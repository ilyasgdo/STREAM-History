from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    games = relationship("Game", back_populates="user")


class Game(Base):
    __tablename__ = "games"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    country = Column(String(100), nullable=False)
    country_code = Column(String(10), nullable=True)
    current_date = Column(String(50), nullable=False)
    
    # Stats du pays en JSON: {"gold": 1000, "stability": 75, "army": 50000, ...}
    stats = Column(JSON, default={
        "gold": 1000,
        "stability": 75,
        "army": 50000,
        "population": 1000000,
        "diplomacy": 50
    })
    
    # Historique narratif: liste de {role, content, timestamp}
    narrative_history = Column(JSON, default=[])
    
    # Choix disponibles actuels
    current_choices = Column(JSON, default=[])
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    user = relationship("User", back_populates="games")

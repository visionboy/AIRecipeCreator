from sqlalchemy import Column, Integer, String, ForeignKey, Text, JSON, TIMESTAMP
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True)
    hashed_password = Column(String(255), nullable=False)
    profile_image = Column(String(500), nullable=True)
    
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    email = Column(String(255), nullable=True)
    password = Column(String(255), nullable=True)
    updated_at = Column(String(100), nullable=True)
    kling_ai_access_key = Column(String(255), nullable=True)
    kling_ai_secret_key = Column(String(255), nullable=True)
    deapi_api_key = Column(String(255), nullable=True)

    histories = relationship("History", back_populates="user")
    favorites = relationship("Favorite", back_populates="user")

class History(Base):
    __tablename__ = "histories"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    input_image_path = Column(String(255), nullable=True)
    prompt_text = Column(Text, nullable=True)
    analysis_result = Column(JSON, nullable=True) # or Text
    
    user = relationship("User", back_populates="histories")

class Recipe(Base):
    __tablename__ = "recipes"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), index=True)
    details = Column(Text)
    ingredients = Column(Text)

class Favorite(Base):
    __tablename__ = "favorites"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    recipe_data = Column(JSON) # Storing full recipe snapshot for simplicity
    
    user = relationship("User", back_populates="favorites")

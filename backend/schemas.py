from pydantic import BaseModel
from typing import Optional, List, Any

class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None
    profile_image: Optional[str] = None

class User(UserBase):
    id: int
    profile_image: Optional[str] = None
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class HistoryBase(BaseModel):
    prompt_text: Optional[str] = None
    input_image_path: Optional[str] = None
    analysis_result: Optional[Any] = None

class HistoryCreate(HistoryBase):
    pass

class History(HistoryBase):
    id: int
    user_id: int
    class Config:
        from_attributes = True

class FavoriteCreate(BaseModel):
    recipe_data: Any

class Favorite(BaseModel):
    id: int
    user_id: int
    recipe_data: Any
    class Config:
        from_attributes = True

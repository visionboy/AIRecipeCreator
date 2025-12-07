from sqlalchemy.orm import Session
from . import models, schemas
from .auth import get_password_hash

def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = models.User(username=user.username, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user_profile(db: Session, user_id: int, profile_data: schemas.UserUpdate):
    db_user = get_user(db, user_id)
    if not db_user:
        return None
    if profile_data.username:
        db_user.username = profile_data.username
    if profile_data.password:
        db_user.hashed_password = get_password_hash(profile_data.password)
    if profile_data.profile_image:
        db_user.profile_image = profile_data.profile_image
    db.commit()
    db.refresh(db_user)
    return db_user

def create_history(db: Session, history: schemas.HistoryCreate, user_id: int):
    db_history = models.History(**history.dict(), user_id=user_id)
    db.add(db_history)
    db.commit()
    db.refresh(db_history)
    return db_history

def get_histories(db: Session, user_id: int):
    return db.query(models.History).filter(models.History.user_id == user_id).all()

def create_favorite(db: Session, favorite: schemas.FavoriteCreate, user_id: int):
    # Check if already exists? Skipping for mvp
    db_fav = models.Favorite(user_id=user_id, recipe_data=favorite.recipe_data)
    db.add(db_fav)
    db.commit()
    db.refresh(db_fav)
    return db_fav

def get_favorites(db: Session, user_id: int):
    return db.query(models.Favorite).filter(models.Favorite.user_id == user_id).all()

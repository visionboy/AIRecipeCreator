from sqlalchemy.orm import Session
import models, schemas
from auth import get_password_hash

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

def get_histories(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.History).filter(models.History.user_id == user_id).order_by(models.History.id.desc()).offset(skip).limit(limit).all()

def create_favorite(db: Session, favorite: schemas.FavoriteCreate, user_id: int):
    # Check if already exists? Skipping for mvp
    db_fav = models.Favorite(user_id=user_id, recipe_data=favorite.recipe_data)
    db.add(db_fav)
    db.commit()
    db.refresh(db_fav)
    return db_fav

def get_favorites(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.Favorite).filter(models.Favorite.user_id == user_id).order_by(models.Favorite.id.desc()).offset(skip).limit(limit).all()
def delete_favorite_by_id(db: Session, favorite_id: int, user_id: int):
    fav = db.query(models.Favorite).filter(models.Favorite.id == favorite_id, models.Favorite.user_id == user_id).first()
    if fav:
        db.delete(fav)
        db.commit()
        return True
    return False

def delete_history(db: Session, history_id: int, user_id: int):
    history = db.query(models.History).filter(models.History.id == history_id, models.History.user_id == user_id).first()
    if history:
        db.delete(history)
        db.commit()
        return True
    return False
def delete_favorite(db: Session, favorite_name: str, user_id: int):
    # This is a bit tricky as we only stored recipe_data json. 
    # We need to find the favorite by name inside the json structure or if we passed ID.
    # Since client passes full recipe object to toggle, we might need a better way. 
    # For now, let's look up all favorites for user and find the one with matching name.
    # This is inefficient but works for MVP without schema change.
    favs = db.query(models.Favorite).filter(models.Favorite.user_id == user_id).all()
    for fav in favs:
        if fav.recipe_data.get('name') == favorite_name:
            db.delete(fav)
            db.commit()
            return True
    return False

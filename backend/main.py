from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile, Form
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from datetime import timedelta
import shutil
import os
import uuid
import json

import models, schemas, crud, auth, ai_agent, database

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()

# CORS configuration
origins = [
    "http://localhost:5173", # Vite default
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Use absolute path for uploads directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Dependency
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/token", response_model=schemas.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.get_user_by_username(db, username=form_data.username)
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/signup", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    return crud.create_user(db=db, user=user)

@app.get("/users/me", response_model=schemas.User)
async def read_users_me(current_user: schemas.User = Depends(auth.get_current_user)):
    return current_user

@app.put("/users/me", response_model=schemas.User)
def update_user(user_update: schemas.UserUpdate, current_user: schemas.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    # Verify current password if password update is requested
    if user_update.password:
        if not user_update.current_password:
             raise HTTPException(status_code=400, detail="Current password is required to change password")
        if not auth.verify_password(user_update.current_password, current_user.hashed_password):
            raise HTTPException(status_code=400, detail="Incorrect current password")
            
    return crud.update_user_profile(db, current_user.id, user_update)

@app.post("/analyze")
async def analyze_fridge(
    files: list[UploadFile] = File(...), 
    prompt: str = Form(""), 
    current_user: schemas.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    saved_paths = []
    relative_paths = []
    
    for file in files:
        file_extension = file.filename.split(".")[-1]
        file_name = f"{uuid.uuid4()}.{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, file_name)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        saved_paths.append(file_path)
        relative_paths.append(f"uploads/{file_name}")
        
    # AI Analysis
    result = ai_agent.analyze_fridge_image(saved_paths, prompt)
    
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])

    # Save history - join multiple paths with comma
    combined_relative_path = ",".join(relative_paths)
    
    history_in = schemas.HistoryCreate(
        prompt_text=prompt,
        input_image_path=combined_relative_path,
        analysis_result=result
    )
    crud.create_history(db, history_in, current_user.id)
    
    return result

@app.get("/history", response_model=list[schemas.History])
def read_history(skip: int = 0, limit: int = 100, current_user: schemas.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    return crud.get_histories(db, current_user.id, skip=skip, limit=limit)

@app.post("/favorites", response_model=schemas.Favorite)
def add_favorite(favorite: schemas.FavoriteCreate, current_user: schemas.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    return crud.create_favorite(db, favorite, current_user.id)

@app.get("/favorites", response_model=list[schemas.Favorite])
def read_favorites(skip: int = 0, limit: int = 100, current_user: schemas.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    return crud.get_favorites(db, current_user.id, skip=skip, limit=limit)

@app.delete("/favorites/{recipe_name}")
def delete_favorite(recipe_name: str, current_user: schemas.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    success = crud.delete_favorite(db, recipe_name, current_user.id)
@app.post("/users/me/image", response_model=schemas.User)
async def upload_user_image(
    file: UploadFile = File(...), 
    current_user: schemas.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    file_extension = file.filename.split(".")[-1]
    file_name = f"profile_{current_user.id}_{uuid.uuid4()}.{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, file_name)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Update user profile
    # URL relative to backend base
    relative_path = f"http://localhost:8000/uploads/{file_name}"
    user_update = schemas.UserUpdate(profile_image=relative_path)
    return crud.update_user_profile(db, current_user.id, user_update)

@app.delete("/history/{history_id}")
def delete_history(history_id: int, current_user: schemas.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    success = crud.delete_history(db, history_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="History not found")
    return {"message": "Deleted successfully"}

@app.delete("/favorites/id/{favorite_id}")
def delete_favorite_by_id(favorite_id: int, current_user: schemas.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    success = crud.delete_favorite_by_id(db, favorite_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Favorite not found")
    return {"message": "Deleted successfully"}

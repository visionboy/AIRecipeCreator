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

from . import models, schemas, crud, auth, ai_agent, database

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

app.mount("/uploads", StaticFiles(directory="backend/uploads"), name="uploads")

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
async def update_user_me(user_update: schemas.UserUpdate, current_user: schemas.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    return crud.update_user_profile(db, current_user.id, user_update)

@app.post("/analyze")
async def analyze_fridge(
    file: UploadFile = File(...), 
    prompt: str = Form(""), 
    current_user: schemas.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Save file
    file_extension = file.filename.split(".")[-1]
    file_name = f"{uuid.uuid4()}.{file_extension}"
    file_path = f"backend/uploads/{file_name}"
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # AI Analysis
    result = ai_agent.analyze_fridge_image(file_path, prompt)
    
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])

    # Save history
    # Note: result is a list of recipes (JSON)
    # Ideally should verify format
    
    history_in = schemas.HistoryCreate(
        prompt_text=prompt,
        input_image_path=file_path,
        analysis_result=result
    )
    crud.create_history(db, history_in, current_user.id)
    
    return result

@app.get("/history", response_model=list[schemas.History])
def read_history(current_user: schemas.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    return crud.get_histories(db, current_user.id)

@app.post("/favorites", response_model=schemas.Favorite)
def add_favorite(favorite: schemas.FavoriteCreate, current_user: schemas.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    return crud.create_favorite(db, favorite, current_user.id)

@app.get("/favorites", response_model=list[schemas.Favorite])
def read_favorites(current_user: schemas.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    return crud.get_favorites(db, current_user.id)

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv
from urllib.parse import quote_plus

load_dotenv()

user = os.getenv("DB_USER", "root")
password = os.getenv("DB_PASSWORD", "")
host = os.getenv("DB_HOST", "127.0.0.1")
port = os.getenv("DB_PORT", "3306")
db_name = os.getenv("DB_NAME", "cook_ai")

encoded_password = quote_plus(password)

# Fallback to sqlite if connection params are obviously dummy or missing, 
# but user asked for MariaDB, so we default to that URL structure.
# If you are running locally without MariaDB, you might want to uncomment the sqlite line for testing.
SQLALCHEMY_DATABASE_URL = f"mysql+pymysql://{user}:{encoded_password}@{host}:{port}/{db_name}"
# SQLALCHEMY_DATABASE_URL = "sqlite:///./sql_app.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL
    # , connect_args={"check_same_thread": False} # Needed for SQLite
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

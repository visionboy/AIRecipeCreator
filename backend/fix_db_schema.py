import os
from sqlalchemy import create_engine, text, inspect
from dotenv import load_dotenv
from urllib.parse import quote_plus

# Load env variables
load_dotenv()

user = os.getenv("DB_USER", "root")
password = os.getenv("DB_PASSWORD", "")
host = os.getenv("DB_HOST", "127.0.0.1")
port = os.getenv("DB_PORT", "3306")
db_name = os.getenv("DB_NAME", "cook_ai")

encoded_password = quote_plus(password)
DATABASE_URL = f"mysql+pymysql://{user}:{encoded_password}@{host}:{port}/{db_name}"

engine = create_engine(DATABASE_URL)

def fix_schema():
    inspector = inspect(engine)
    
    # Check if users table exists
    if not inspector.has_table("users"):
        print("users table does not exist. It will be created by the app.")
        return

    columns = [col['name'] for col in inspector.get_columns("users")]
    
    with engine.connect() as conn:
        # 1. Add created_at
        if "created_at" not in columns:
            print("Adding created_at column...")
            try:
                conn.execute(text("ALTER TABLE users ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT current_timestamp()"))
                conn.commit()
            except Exception as e:
                print(f"Error adding created_at: {e}")

        # 2. Add email
        if "email" not in columns:
            print("Adding email column...")
            try:
                conn.execute(text("ALTER TABLE users ADD COLUMN email VARCHAR(255) DEFAULT NULL"))
                conn.commit()
            except Exception as e:
                print(f"Error adding email: {e}")

        # 3. Add password (plain)
        if "password" not in columns:
            print("Adding password column...")
            try:
                conn.execute(text("ALTER TABLE users ADD COLUMN password VARCHAR(255) DEFAULT NULL"))
                conn.commit()
            except Exception as e:
                print(f"Error adding password: {e}")

        # 4. Add updated_at
        if "updated_at" not in columns:
            print("Adding updated_at column...")
            try:
                conn.execute(text("ALTER TABLE users ADD COLUMN updated_at VARCHAR(100) DEFAULT NULL"))
                conn.commit()
            except Exception as e:
                print(f"Error adding updated_at: {e}")

        # 5. Add kling_ai_access_key
        if "kling_ai_access_key" not in columns:
            print("Adding kling_ai_access_key column...")
            try:
                conn.execute(text("ALTER TABLE users ADD COLUMN kling_ai_access_key VARCHAR(255) DEFAULT NULL"))
                conn.commit()
            except Exception as e:
                print(f"Error adding kling_ai_access_key: {e}")
        
        # 6. Add kling_ai_secret_key
        if "kling_ai_secret_key" not in columns:
            print("Adding kling_ai_secret_key column...")
            try:
                conn.execute(text("ALTER TABLE users ADD COLUMN kling_ai_secret_key VARCHAR(255) DEFAULT NULL"))
                conn.commit()
            except Exception as e:
                print(f"Error adding kling_ai_secret_key: {e}")
        
        # 7. Add deapi_api_key
        if "deapi_api_key" not in columns:
            print("Adding deapi_api_key column...")
            try:
                conn.execute(text("ALTER TABLE users ADD COLUMN deapi_api_key VARCHAR(255) DEFAULT NULL"))
                conn.commit()
            except Exception as e:
                print(f"Error adding deapi_api_key: {e}")

        # 8. Modify hashed_password length
        print("Modifying hashed_password length to 255...")
        try:
            conn.execute(text("ALTER TABLE users MODIFY COLUMN hashed_password VARCHAR(255) NOT NULL"))
            conn.commit()
        except Exception as e:
            print(f"Error modifying hashed_password: {e}")

        # 9. Modify profile_image length
        print("Modifying profile_image length to 500...")
        try:
            conn.execute(text("ALTER TABLE users MODIFY COLUMN profile_image VARCHAR(500) DEFAULT NULL"))
            conn.commit()
        except Exception as e:
            print(f"Error modifying profile_image: {e}")
            
    print("Schema fix completed.")

if __name__ == "__main__":
    try:
        fix_schema()
    except Exception as e:
        print(f"Migration failed: {e}")

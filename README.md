# AI Recipe Creator (Cooking Room)

AI Chef Web Application that analyzes fridge photos and suggests recipes.

## Features
- **Frontend**: React (Vite) + Vanilla CSS (VS Code Style)
- **Backend**: FastAPI + SQLAlchemy (MariaDB/SQLite)
- **AI**: Gemini 1.5 Flash (via Google Generative AI)

## Prerequisites
- Python 3.10+
- Node.js & npm (for frontend)
- MariaDB (optional, defaults to MariaDB config in .env)

## Setup

### Backend
1. Navigate to `backend` folder.
2. Create virtual environment and install dependencies:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```
3. Configure `.env` file (copy from `.env.example` if available, or check code).
   **Important**: Add your `GEMINI_API_KEY` in `backend/.env`.
4. Run the server:
   ```bash
   uvicorn main:app --reload
   ```
   Server runs at `http://localhost:8000`.

### Frontend
1. Navigate to `frontend` folder.
2. Install dependencies:
   ```bash
   npm install
   ```
   *(If npm is not found, please install Node.js)*
3. Run the development server:
   ```bash
   npm run dev
   ```
   Frontend runs at `http://localhost:5173`.

## Usage
1. Sign up / Login.
2. Go to "AI Chef" page.
3. Upload a photo of your fridge ingredients.
4. Add optional prompt (e.g., "vegan", "spicy").
5. Click "Analyze".
6. View, Favorite, or Download PDF of the recipes.

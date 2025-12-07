import os
import google.generativeai as genai
import PIL.Image
import json
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")

genai.configure(api_key=API_KEY)
model = genai.GenerativeModel('gemini-1.5-flash')

def analyze_fridge_image(image_path: str, user_prompt: str = ""):
    try:
        img = PIL.Image.open(image_path)
    except Exception as e:
        return {"error": f"Failed to open image: {str(e)}"}

    prompt = f"""
    You are an AI Chef. Look at the ingredients in this image.
    User's additional info: {user_prompt}
    
    Identify the ingredients and suggest 3 possible recipes.
    For each recipe provide:
    - Recipe Name
    - List of ingredients (from fridge + common pantry items)
    - Step-by-step instructions.
    
    Output the result in strictly valid JSON format like:
    [
      {{
        "name": "Recipe Name",
        "ingredients": ["item1", "item2"],
        "instructions": "Step 1... Step 2..."
      }},
      ...
    ]
    Do not add any markdown formatting like ```json ... ```. Just the raw JSON string.
    """
    
    try:
        response = model.generate_content([prompt, img])
        text = response.text.replace("```json", "").replace("```", "").strip()
        return json.loads(text)
    except Exception as e:
        return {"error": str(e), "raw": response.text if 'response' in locals() else ""}

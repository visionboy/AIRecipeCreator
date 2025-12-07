import os
import google.generativeai as genai
import PIL.Image
import json
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")

genai.configure(api_key=API_KEY)
model = genai.GenerativeModel('gemini-flash-latest')

def analyze_fridge_image(image_paths: list[str], user_prompt: str = ""):
    imgs = []
    try:
        for path in image_paths:
            img = PIL.Image.open(path)
            # Convert to RGB to ensure validation and supported format for Gemini
            img = img.convert('RGB')
            imgs.append(img)
    except Exception as e:
        return {"error": f"Failed to open image: {str(e)}"}

    prompt = f"""
    당신은 전문 AI 셰프입니다. 이 이미지들에 있는 재료들을 분석해주세요.
    사용자의 추가 정보: {user_prompt}
    
    1. 이미지들에서 식별된 재료들을 종합하여 나열해주세요.
    2. 그 재료들로 만들 수 있는 맛있는 요리를 추천해주세요. 사용자가 '3개', '2개' 등 구체적인 개수를 명시했다면 반드시 그 개수에 맞춰 추천하고, 명시하지 않았다면 기본적으로 3가지를 추천해주세요.
    3. 만약 사용자가 '한식', '양식' 등 특정 스타일을 요청했다면 그에 맞춰 추천해주세요.
    
    각 요리에 대해 다음 정보를 제공해주세요:
    - 요리 이름 (name)
    - 요리 이름의 영어 표기 (이미지 생성용) (english_name)
    - 재료 목록: 냉장고 재료와 기본 양념 등을 포함하며, 모든 재료(특히 소금, 설탕, 후추 등의 양념)에 대해 구체적인 계량 정보(예: 1티스푼, 10g, 1큰술 등)를 반드시 명시해주세요. (ingredients)
    - 상세 조리 순서 (1. 2. 3. 순서로 번호를 매겨서 체계적으로 작성) (instructions)
    
    결과는 반드시 다음 구조의 유효한 JSON 형식이어야 합니다:
    {{
      "detected_ingredients": ["식별된 재료1", "식별된 재료2", ...],
      "recipes": [
        {{
          "name": "요리 이름",
          "english_name": "Recipe Name in English",
          "ingredients": ["재료1", "재료2"],
          "instructions": "1. 첫 번째 단계...\\n2. 두 번째 단계..."
        }},
        ...
      ]
    }}
    
    markdown 포맷(```json 등)은 사용하지 말고 순수 JSON 문자열만 출력해주세요.
    모든 내용은 **한국어**로 작성하되, english_name 필드만 영문으로 작성해주세요.
    """
    
    try:
        import time
        
        max_retries = 3
        retry_delay = 2 # seconds
        data = None
        
        for attempt in range(max_retries):
            try:
                # Enforce JSON output using generation_config
                response = model.generate_content(
                    [prompt, *imgs],
                    generation_config={"response_mime_type": "application/json"}
                )
                text = response.text.strip()
                # Handle cases where model might still wrap in markdown despite mime_type
                if text.startswith("```json"):
                    text = text.replace("```json", "", 1)
                if text.endswith("```"):
                    text = text.replace("```", "", 1)
                text = text.strip()
                
                data = json.loads(text)
                break # Success, exit loop
            except Exception as e:
                error_str = str(e).lower()
                if attempt < max_retries - 1 and ("429" in error_str or "quota" in error_str or "limit" in error_str):
                    print(f"[AI Chef] Rate limit hit. Retrying in {retry_delay} seconds... (Attempt {attempt + 1}/{max_retries})")
                    time.sleep(retry_delay)
                    retry_delay *= 2 # Exponential backoff
                else:
                    raise e # Re-raise if not a rate limit issue or max retries reached
        
        if not data:
            return {"error": "Failed to generate recipes after retries."}

        # Download images for each recipe
        import requests
        import uuid
        
        # Ensure directory exists
        save_dir = os.path.join(os.path.dirname(__file__), "uploads", "foodImgs")
        os.makedirs(save_dir, exist_ok=True)
        
        if "recipes" in data:
            print(f"[AI Chef] Generated {len(data['recipes'])} recipes. Starting image downloads...")
            import urllib.parse
            for recipe in data["recipes"]:
                query = recipe.get("english_name", recipe["name"])
                # Encode the ENTIRE prompt segment to handle spaces and special chars correctly
                full_prompt = f"{query} delicious food photorealistic"
                encoded_prompt = urllib.parse.quote(full_prompt)
                
                # Use Bing Image Search (Thumbnail) for instant results
                # "c=7" scales the image, "w" and "h" set dimensions.
                image_url = f"https://tse2.mm.bing.net/th?q={encoded_prompt}&w=800&h=500&c=7&rs=1&p=0"
                print(f"[AI Chef] Downloading image for {query}: {image_url}")
                
                try:
                    # Short timeout (5s) is usually enough for these static assets
                    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
                    img_resp = requests.get(image_url, headers=headers, timeout=5)
                    if img_resp.status_code == 200:
                        filename = f"{uuid.uuid4()}.jpg"
                        file_path = os.path.join(save_dir, filename)
                        with open(file_path, "wb") as f:
                            f.write(img_resp.content)
                        # Store relative path for frontend
                        recipe["image_path"] = f"uploads/foodImgs/{filename}"
                        print(f"[AI Chef] Saved image to {file_path}")
                    else:
                        print(f"[AI Chef] Failed to download image. Status code: {img_resp.status_code}")
                except Exception as e:
                    print(f"[AI Chef] Failed to download image from {image_url}: {e}")
        else:
             print(f"[AI Chef] No recipes found in response data: {data.keys()}")
                    
        return data
    except Exception as e:
        print(f"Error in AI Agent: {e}")
        raw_text = response.text if 'response' in locals() else "No response"
        print(f"Raw Text: {raw_text}")
        return {"error": str(e), "raw": raw_text}

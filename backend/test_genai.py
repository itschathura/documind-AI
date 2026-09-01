import google.generativeai as genai
from app.core.config import settings

genai.configure(api_key=settings.GEMINI_API_KEY)
_model = genai.GenerativeModel(settings.LLM_MODEL)

try:
    response = _model.generate_content("hello")
    print("Success:", response.text)
except Exception as e:
    print("Error:")
    import traceback
    traceback.print_exc()

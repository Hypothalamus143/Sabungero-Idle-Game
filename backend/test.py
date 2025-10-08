# backend/main.py
import google.generativeai as genai
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure the API
genai.configure(api_key=os.getenv('AIzaSyDxBnvGsjX_q-5lh4M8_hLhEb2gIlazC6Q'))

# Test the configuration
def list_available_models():
    try:
        models = genai.list_models()
        print("=== Available Gemini Models ===")
        for model in models:
            print(f"Name: {model.name}")
            print(f"Supported Generation Methods: {model.supported_generation_methods}")
            print(f"Input Token Limit: {model.input_token_limit}")
            print(f"Output Token Limit: {model.output_token_limit}")
            print("---")
        return models
    except Exception as e:
        print(f"Error listing models: {e}")
        return []
    
def test_gemini():
    try:
        model = genai.GenerativeModel('gemini-2.0-flash_lite')
        response = model.generate_content("Hello, say 'API is working' if you can read this.")
        print("Gemini API Response:", response.text)
        return True
    except Exception as e:
        print("Error:", e)
        return False

if __name__ == "__main__":
    #test_gemini()
    models = list_available_models()
    print(models)
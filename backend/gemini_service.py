import google.generativeai as genai
import os
import json
from dotenv import load_dotenv

load_dotenv()

class GeminiService:
    def __init__(self, model_name='models/gemini-2.0-flash'):
        """Initialize Gemini AI service"""
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")
        
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel(model_name)
        print(f"✅ Gemini Service initialized with model: {model_name}")
    
    def generate_content(self, topic: str, content_type: str):
        """Generate educational content based on topic and type"""
        try:
            prompt = self._create_prompt(topic, content_type)
            response = self.model.generate_content(prompt)
            
            if content_type == "article":
                return {"type": "article", "content": response.text}
            else:
                return self._parse_json_response(response.text, content_type)
                
        except Exception as e:
            return {"error": f"Generation failed: {str(e)}"}
    
    def verify_understanding(self, user_answers: dict, original_content: str, content_type: str):
        """Verify if user understood the content"""
        try:
            prompt = self._create_verification_prompt(user_answers, original_content, content_type)
            response = self.model.generate_content(prompt)
            result = self._parse_verification_response(response.text)
            return result
        except Exception as e:
            return self._default_verification_result(f"Verification failed: {str(e)}")
    
    def _create_prompt(self, topic: str, content_type: str) -> str:
        """Create appropriate prompt based on content type"""
        prompts = {
            "flashcards": f"""
            Create 10 educational flashcards about {topic}.
            Make them clear and engaging for a learning game.
            Return ONLY valid JSON:
            {{
                "flashcards": [
                    {{
                        "question": "clear question text",
                        "answer": "clear answer text"
                    }}
                ]
            }}
            Do not include any other text outside the JSON.
            """,
            
            "quiz": f"""
            Create 10 multiple choice questions about {topic}.
            Make them educational and varied.
            Return ONLY valid JSON:
            {{
                "questions": [
                    {{
                        "question": "question text",
                        "options": ["Option A", "Option B", "Option C", "Option D"],
                        "correct_index": 0 #index of the correct answer,
                        "explanation": "brief explanation of why this is correct"
                    }}
                ]
            }}
            Do not include any other text outside the JSON.
            """,
            
            "article": f"""
            Give me 10 paragraph article about {topic}.
            Use double newline sparingly.
            """
        }
        
        return prompts.get(content_type, f"Create educational content about {topic}")
    
    def _create_verification_prompt(self, user_answers: dict, original_content: str, content_type: str) -> str:
        """Create verification prompt"""
        return f"""
        Original {content_type} content: {original_content}
        
        User's answers/responses: {user_answers}
        
        Analyze if the user demonstrates understanding of the content.
        Be fair but thorough in your assessment.
        
        Return ONLY valid JSON:
        {{
            "verified": true/false,
            "score": 0.0-1.0,
            "feedback": "constructive feedback for the user",
            "multiplier_boost": 0.0-0.3
        }}
        """
    
    def _parse_json_response(self, text: str, content_type: str):
        """Parse Gemini response into JSON"""
        try:
            clean_text = text.strip()
            # Remove markdown code blocks if present
            if clean_text.startswith('```json'):
                clean_text = clean_text[7:]
            if clean_text.endswith('```'):
                clean_text = clean_text[:-3]
            
            parsed = json.loads(clean_text.strip())
            parsed["type"] = content_type
            return parsed
            
        except json.JSONDecodeError as e:
            # Fallback: return as text content
            return {
                "type": content_type,
                "content": text,
                "error": "JSON parsing failed",
                "raw_response": text
            }
    
    def _parse_verification_response(self, text: str) -> dict:
        """Parse verification response"""
        try:
            clean_text = text.strip()
            if clean_text.startswith('```json'):
                clean_text = clean_text[7:-3].strip()
            return json.loads(clean_text)
        except json.JSONDecodeError:
            return self._default_verification_result("Could not parse verification response")
    
    def _default_verification_result(self, error_msg: str) -> dict:
        """Return default verification result on error"""
        return {
            "verified": False,
            "score": 0.0,
            "feedback": error_msg,
            "multiplier_boost": 0.0
        }
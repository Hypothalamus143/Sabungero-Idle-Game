from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from gemini_service import GeminiService
from dummy_gemini_service import DummyGeminiService

# Initialize services
#gemini_service = GeminiService()
gemini_service = DummyGeminiService()  # Instead of GeminiService()

class AIGenerationRequest(BaseModel):
    topic: str
    content_type: str

app = FastAPI(title="Sabungero Idle Game API")

# CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Sabungero Idle Game API is running!"}

@app.post("/learning/generate-with-validation")
async def generate_with_validation(request: AIGenerationRequest):
    try:
        
        # Generate content with Gemini
        content = gemini_service.generate_content(request.topic, request.content_type)
        
        return {
            "success": True,
            "content": content,
            "message": f"Successfully generated {request.content_type} content for '{request.topic}'"
        }
        
    except Exception as e:
        return {"success": False, "detail": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # This enables auto-reload
        reload_dirs=["backend"]  # Optional: specify which directories to watch
    )
import random
import json

class DummyGeminiService:
    def __init__(self):
        print("✅ Using Dummy Gemini Service - No tokens used!")
    
    def generate_content(self, topic: str, content_type: str):
        if content_type == "reading":
            return self._generate_reading(topic)
        elif content_type == "flashcards":
            return self._generate_flashcards(topic)
        elif content_type == "quiz":
            return self._generate_quiz(topic)
        else:
            return {"error": f"Unknown content type: {content_type}"}
    
    def _generate_reading(self, topic: str):
        articles = [
            f"{topic} is a fascinating subject that has captivated minds for generations. This comprehensive overview will explore the fundamental concepts and practical applications.",
            f"Introduction to {topic}: Understanding the core principles and how they impact our daily lives. From basic theory to advanced implementations.",
            f"The Complete Guide to {topic}: Learn everything you need to know about this important field, including history, key figures, and future developments."
        ]
        return {
            "content": random.choice(articles),
            "type": "reading"
        }
    
    def _generate_flashcards(self, topic: str):
        question_templates = [
            f"What is the main purpose of {topic}?",
            f"Which of these is NOT related to {topic}?",
            f"How does {topic} benefit modern society?",
            f"What year was {topic} first introduced?",
            f"Who is considered the founder of {topic}?"
        ]
        
        flashcards = []
        for i in range(5):
            flashcards.append({
                "question": random.choice(question_templates),
                "answer": f"Sample answer for {topic} question {i+1}",
                "explanation": f"This explains why this is important for understanding {topic}."
            })
        
        return {
            "flashcards": flashcards,
            "type": "flashcards"
        }
    
    def _generate_quiz(self, topic: str):
        questions = []
        for i in range(5):
            correct_index = 0
            questions.append({
                "question": f"Quiz question {i+1} about {topic}?",
                "options": [
                    f"Correct answer for {topic}",
                    f"Wrong option 1 for {topic}", 
                    f"Wrong option 2 for {topic}",
                    f"Wrong option 3 for {topic}"
                ],
                "correct_index": correct_index,  # Consistent naming
                "explanation": f"This is the correct answer because it relates to {topic}."
            })
        
        # Shuffle options while maintaining correct_index
        for question in questions:
            correct_answer_text = question['options'][question['correct_index']]
            random.shuffle(question['options'])
            question['correct_index'] = question['options'].index(correct_answer_text)
        
        return {
            "questions": questions,
            "type": "quiz"
        }
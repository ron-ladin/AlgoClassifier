import json
from datetime import datetime, timezone
from google import genai  # המנוע החדש והיציב
from tenacity import retry, stop_after_attempt, wait_exponential

from app.core.config import settings
from app.models.question import QuestionDocument
from app.services.user_service import user_service

# Initialize the modern Gemini Client
# The Client manages the connection pool and authentication
client = genai.Client(api_key=settings.GEMINI_API_KEY)

class ClassifierService:
    """
    Expert-level service for algorithmic problem classification.
    Uses Google's Gemini 1.5 Flash to extract deep technical insights.
    """

    @retry(
        stop=stop_after_attempt(3), 
        wait=wait_exponential(multiplier=1, min=2, max=10)
    )
    async def _call_gemini(self, text: str) -> dict:
        """
        Calls Gemini API using the new google-genai SDK.
        Implements a high-precision prompt for algorithmic analysis.
        """
        
        # Defining the expert persona and precise guidelines for the AI
        system_instruction = """
        You are a Teaching Assistant for the Algorithms course at Bar-Ilan University. 
        Your goal is to simplify complex problems using the standard Israeli CS curriculum terminology.
        
        STRICT RULES:
        1. LANGUAGE: All values in the JSON MUST be written in HEBREW.
        2. NO MATH NOTATION: Never use $ symbols, LaTeX, or variables like f(e). Use plain Hebrew words (e.g., 'הזרימה', 'קיבול', 'צומת שורש').
        3. HUMAN-FRIENDLY: Explain like a peer or a helpful TA. Avoid robotic or overly formal academic language.
        4. CHRONOLOGICAL LOGIC: Provide a single string with 3-5 short, intuitive steps starting with a dash (-). Focus on the order of actions.
        5. THE PUNCHLINE (The Catch): 
           - Start by naming a famous Theorem, Lemma, or Property in Hebrew (e.g., 'משפט זרימה מקסימלית - חתך מינימלי', 'למת ההחלפה', 'תכונת תת-מבנה אופטימלי').
           - Explain the "Eureka" moment: Why is this specific trick efficient? Focus on why we avoid a full re-calculation.
        6. COMPLEXITY: Provide the Big-O notation .
        """

        user_input = f"""
        Analyze this problem description:
        ---
        {text}
        ---
        
      Return ONLY a JSON object with EXACTLY these keys:
        - catchyTitle (str)
        - categoryName (str)
        - specificTechnique (str)
        - chronologicalLogic (str: use dashes for steps in Hebrew)
        - thePunchline (str: start with a famous theorem in Hebrew)
        - runtimeComplexity (str: in Hebrew)
        """
        
        full_prompt = f"{system_instruction}\n\n{user_input}"
        
        # Execute the AI generation asynchronously using the new SDK syntax
        # Using gemini-1.5-flash for speed and reliability in classification tasks
        response = await client.aio.models.generate_content(
            model='gemini-3-flash-preview',
            contents=full_prompt
        )
        
        # Cleaning: Extract text and remove potential Markdown code blocks (```json ... ```)
        raw_text = response.text
        clean_json_str = raw_text.replace("```json", "").replace("```", "").strip()
        
        try:
            return json.loads(clean_json_str)
        except json.JSONDecodeError as e:
            # Critical for error tracing: Log the exact failed output
            raise RuntimeError(f"AI returned invalid JSON: {clean_json_str}") from e

    async def classify_and_save(self, text: str, user_id: str) -> QuestionDocument:
        """
        The main workflow: AI Classification -> Pydantic Validation -> Atomic Save.
        """
        # 1. Get the expert-level analysis from Gemini
        ai_data = await self._call_gemini(text)
        
        # 2. Map the response to our formal Pydantic document model
        question_doc = QuestionDocument(
            userId=user_id,
            isPublic=False,
            originalText=text,
            catchyTitle=ai_data["catchyTitle"],
            categoryName=ai_data["categoryName"],
            specificTechnique=ai_data["specificTechnique"],
            chronologicalLogic=ai_data["chronologicalLogic"],
            thePunchline=ai_data["thePunchline"],
            runtimeComplexity=ai_data["runtimeComplexity"],
            confidenceScore=1.0,  # Default high confidence for Flash model
            createdAt=datetime.now(timezone.utc)
        )
        
        # 3. Save to MongoDB via user_service
        # We ensure ACID compliance by using the transaction logic in user_service
        question_dict = question_doc.model_dump(by_alias=True, exclude_none=True)
        
        await user_service.save_question_with_transaction(
            question_doc_dict=question_dict, 
            user_id=user_id
        )
            
        return question_doc

# Global singleton for the application
classifier_service = ClassifierService()
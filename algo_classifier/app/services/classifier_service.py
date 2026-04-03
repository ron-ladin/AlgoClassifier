import json
from datetime import datetime, timezone
from google import genai
from google.genai import errors
from google.genai.types import GenerateContentConfig
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_not_exception_type

from app.core.config import settings
from app.models.question import QuestionDocument
from app.services.user_service import user_service

# Initialize the modern Gemini Client
client = genai.Client(api_key=settings.GEMINI_API_KEY)

class ClassifierService:
    @retry(
        stop=stop_after_attempt(3), 
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_not_exception_type(errors.ClientError)
    )
    async def _call_gemini(self, text: str) -> dict:
        system_instruction = """
        You are a Teaching Assistant for the Algorithms course at Bar-Ilan University. 
        Your goal is to simplify complex problems using the standard Israeli CS curriculum terminology.
        
        STRICT RULES:
        1. LANGUAGE: All values in the JSON MUST be written in HEBREW.
        2. NO MATH NOTATION: Never use $ symbols, LaTeX, or variables like f(e). Use plain Hebrew words.
        3. HUMAN-FRIENDLY: Explain like a peer or a helpful TA. Avoid robotic or overly formal academic language.
        4. CHRONOLOGICAL LOGIC: Provide a single string with 3-5 short, intuitive steps starting with a dash (-).
        5. THE PUNCHLINE (The Catch): 
           - Start by naming a famous Theorem, Lemma, or Property in Hebrew.
           - Explain the "Eureka" moment: Why is this specific trick efficient?
        6. COMPLEXITY: Provide the Big-O notation.
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
        
        # CRITICAL FIX: Passing the actual full_prompt instead of a hardcoded string
        response = await client.aio.models.generate_content(
            model='gemini-2.5-flash', # CRITICAL FIX: Using the correct, globally available model name
            contents=full_prompt,
            config= GenerateContentConfig(
                response_mime_type="application/json",
            )
        )
        
        raw_text = response.text
        clean_json_str = raw_text.replace("```json", "").replace("```", "").strip()
        
        try:
            return json.loads(clean_json_str)
        except json.JSONDecodeError as e:
            raise RuntimeError(f"AI returned invalid JSON: {clean_json_str}") from e

    async def classify_and_save(self, text: str, user_id: str) -> QuestionDocument:
        ai_data = await self._call_gemini(text)
        
        # Defensive programming to prevent KeyErrors if AI skips a field
        question_doc = QuestionDocument(
            userId=user_id,
            isPublic=False,
            originalText=text,
            catchyTitle=ai_data.get("catchyTitle", "Untitled"),
            categoryName=ai_data.get("categoryName", "General"),
            specificTechnique=ai_data.get("specificTechnique", "Not specified"),
            chronologicalLogic=ai_data.get("chronologicalLogic", "Not specified"),
            thePunchline=ai_data.get("thePunchline", "Not specified"),
            runtimeComplexity=ai_data.get("runtimeComplexity", "Not specified"),
            confidenceScore=1.0,
            createdAt=datetime.now(timezone.utc)
        )
        
        await user_service.save_question_with_transaction(
            question_doc_dict=question_doc.model_dump(by_alias=True, exclude_none=True), 
            user_id=user_id
        )
        
        return question_doc

classifier_service = ClassifierService()
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
        You are a Senior Algorithms Professor and Competitive Programming Coach. 
        Your task is to analyze problem descriptions and identify their 'Algorithmic Core'.

        ANALYSIS GUIDELINES:
        1. CATEGORY: Identify the general formal domain (e.g., 'Flow Networks', 'Dynamic Programming', 'Graph Theory').
        2. SPECIFIC_TECHNIQUE: Be precise. Identify the specific transformation or reduction required.
           EXAMPLES: 'Reduction to Max-Flow', 'Dummy Node for Multi-Source Reachability', 'Weight Function Transformation (Log-Scaling)'.
        3. CATCHY_TITLE: Create a professional 3-5 word title for the problem.
        4. SOLUTION_ESSENCE: Explain the 'Eureka' moment in 1-2 sentences.
        """

        user_input = f"""
        Analyze this problem description:
        ---
        {text}
        ---
        
        Return ONLY a valid JSON object with EXACTLY these keys:
        - catchyTitle
        - categoryName
        - specificTechnique
        - solutionEssence
        """
        
        full_prompt = f"{system_instruction}\n\n{user_input}"
        
        # Execute the AI generation asynchronously using the new SDK syntax
        # Using gemini-1.5-flash for speed and reliability in classification tasks
        response = await client.aio.models.generate_content(
            model='gemini-1.5-flash',
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
            solutionEssence=ai_data["solutionEssence"],
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
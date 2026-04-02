import json
from datetime import datetime, timezone
import google.generativeai as genai
from tenacity import retry, stop_after_attempt, wait_exponential

from app.core.config import settings
from app.models.question import QuestionDocument
from app.services.user_service import user_service

# Configure Gemini API with the key from our environment
genai.configure(api_key=settings.GEMINI_API_KEY)
# The chosen LLM model
model = genai.GenerativeModel('gemini-pro')

class ClassifierService:
    """
    Expert-level service for algorithmic problem classification.
    Uses LLM to extract deep technical insights and persists results to MongoDB.
    """
    # Try 3 times to call Gemini, if failed wait 2^i seconds before retrying
    @retry(
        stop=stop_after_attempt(3), 
        wait=wait_exponential(multiplier=1, min=2, max=10)
    )
    async def _call_gemini(self, text: str) -> dict:
        """
        Calls Gemini API with a high-precision prompt for algorithmic analysis.
        Implements exponential backoff for high resilience.
        """
        # This instruction sets the 'Standard of Excellence' for the AI
        system_instruction = """
        You are a Senior Algorithms Professor and Competitive Programming Coach. 
        Your task is to analyze problem descriptions and identify their 'Algorithmic Core'.

        ANALYSIS GUIDELINES:
        1. CATEGORY: Identify the general formal domain (e.g., 'Flow Networks', 'Dynamic Programming', 'Graph Theory').
        2. SPECIFIC_TECHNIQUE: Be precise. Identify the specific transformation, reduction, or 'trick' required.
           EXAMPLES of desired granularity:
           - 'Reduction to Max-Flow with Edge Capacities'
           - 'Dummy Node for Multi-Source Reachability'
           - 'Weight Function Transformation (Log-Scaling)'
        3. CATCHY_TITLE: Create a professional 3-5 word title for the problem.
        4. SOLUTION_ESSENCE: Explain the 'Eureka' moment in 1-2 sentences.
        """

        user_input = f"""
        Analyze this problem:
        ---
        {text}
        ---
        
        Return ONLY a valid JSON object with these keys:
        - catchyTitle
        - categoryName
        - specificTechnique
        - solutionEssence
        """
        
        full_prompt = f"{system_instruction}\n\n{user_input}"
        
        # Execute the AI generation
        response = model.generate_content(full_prompt)
        
        # Cleaning: Ensure no Markdown code blocks interfere with parsing
        clean_json_str = response.text.replace("```json", "").replace("```", "").strip()
        
        try:
            return json.loads(clean_json_str)
        except json.JSONDecodeError as e:
            # This is critical for debugging AI inconsistencies
            raise RuntimeError(f"AI returned invalid JSON: {clean_json_str}") from e

    async def classify_and_save(self, text: str, user_id: str) -> QuestionDocument:
        """
        The main workflow: Classify via AI -> Map to Document Model -> Save to DB (ACID).
        Ensures strict data types, ownership (userId), and bi-directional linking.
        """
        # 1. Get the granular technical analysis from Gemini
        ai_data = await self._call_gemini(text)
        
        # 2. Map to our Pydantic model (The 'Source of Truth')
        # Note: isPublic is False by default to ensure privacy
        question_doc = QuestionDocument(
            userId=user_id,
            isPublic=False,
            originalText=text,
            catchyTitle=ai_data["catchyTitle"],
            categoryName=ai_data["categoryName"],
            specificTechnique=ai_data["specificTechnique"],
            solutionEssence=ai_data["solutionEssence"],
            confidenceScore=ai_data.get("confidenceScore", 1.0), # Added default confidence score
            createdAt=datetime.now(timezone.utc) # Using timezone aware datetime
        )
        
        # 3. Save to MongoDB via ACID Transaction
        # We delegate the save operation to the user_service to ensure the
        # question is both created AND linked to the user's history atomically.
        question_doc_dict = question_doc.model_dump(by_alias=True, exclude_none=True)
        await user_service.save_question_with_transaction(
            question_doc_dict=question_doc_dict,
            user_id=user_id
        )
            
        return question_doc

# Global singleton for the application
classifier_service = ClassifierService()
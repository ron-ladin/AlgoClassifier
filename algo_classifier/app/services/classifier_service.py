import json
from datetime import datetime
import google.generativeai as genai
from tenacity import retry, stop_after_attempt, wait_exponential

from app.core.config import settings
from app.models.question import QuestionDocument
from app.database.mongodb import mongo_database

# Configure Gemini API with the key from our environment
genai.configure(api_key=settings.GEMINI_API_KEY)
#the choosen LLM model
model = genai.GenerativeModel('gemini-pro')

class ClassifierService:
    """
    Expert-level service for algorithmic problem classification.
    Uses LLM to extract deep technical insights and persists results to MongoDB.
    """
    # try 3 time to call geminy , if faild wait 2^i seconds before retrying (i is the number of attempts)
    @retry(
        stop=stop_after_attempt(3), 
        wait=wait_exponential(multiplier=1, min=2, max=10)
    )
    async def _call_gemini(self, text: str) -> dict:
        
        #Calls Gemini API with a high-precision prompt for algorithmic analysis.
        #Implements exponential backoff for high resilience.
        
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
           - 'Binary Search on the Answer Space'
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
        
        # Cleaning: Ensure no Markdown code blocks (```json) interfere with parsing
        clean_json_str = response.text.replace("```json", "").replace("```", "").strip()
        
        try:
            return json.loads(clean_json_str)
        except json.JSONDecodeError as e:
            # This is critical for debugging AI inconsistencies
            raise RuntimeError(f"AI returned invalid JSON: {clean_json_str}") from e

    async def classify_and_save(self, text: str, user_id: str) -> QuestionDocument:
        """
        The main workflow: Classify via AI -> Map to Document Model -> Save to DB.
        Ensures strict data types and ownership (userId).
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
            specificTechnique=ai_data["specificTechnique"], # Our new specific field
            solutionEssence=ai_data["solutionEssence"],
            confidenceScore=ai_data["confidenceScore"],
            createdAt=datetime.utcnow()
        )
        
        # 3. Save to MongoDB (Optimized with the indexes we built)
        if mongo_database is not None:
            collection = mongo_database.get_collection("questions")
            # insert_one expects a dictionary, model_dump() provides it
            await collection.insert_one(question_doc.model_dump())
            
        return question_doc

# Global singleton for the application
classifier_service = ClassifierService()
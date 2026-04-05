import json
import base64
from datetime import datetime, timezone
from google import genai
from google.genai import errors
from google.genai.types import GenerateContentConfig, Part
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
    async def _call_gemini(self, text: str, image_base64: str = None) -> dict:
        system_instruction = """
        You are a rigorous algorithm-classification assistant.
        Your task is to infer algorithmic structure, optimization properties, and justification patterns from a problem description or an image of a problem.

        MANDATORY OUTPUT FORMAT:
        - Return JSON only.
        - Return EXACTLY the requested keys.
        - Every textual field must be concise, formal, and course-level.

        FEW-SHOT ABSTRACT REASONING TEMPLATES (DO NOT OUTPUT THESE TEMPLATES VERBATIM):
        Template A — Dynamic Optimization Pattern:
        1) Identify a decomposable objective and define subproblems.
        2) Verify optimal substructure and overlapping subproblems.
        3) Derive a recurrence and state boundary conditions.
        4) Explain why the transition preserves correctness.

        Template B — Greedy Correctness Pattern:
        1) Identify a local decision rule.
        2) State the safe-choice condition.
        3) Argue exchange/monotonicity/cut-style correctness.
        4) Explain why local optimality leads to global optimality.

        Template C — Graph/Flow/Cut Pattern:
        1) Map entities to vertices/edges or state-space transitions.
        2) Identify invariant/feasibility constraints.
        3) Select the governing property (reachability, shortest path, cut separation, residual progress).
        4) Justify efficiency via structural bounds.

        STRICT LANGUAGE POLICY:
        1) Hebrew-first output.
        2) CRITICAL: In free-text Hebrew fields (catchyTitle, categoryName, specificTechnique, chronologicalLogic, thePunchline), it is strictly forbidden to include English or Latin letters.
        3) Use short Hebrew statements with clear logic.
        4) No Markdown code fences and no extra keys.
        5) runtimeComplexity may contain asymptotic notation if needed.
        """

        # Handle cases where user provided an image but no text
        problem_text = text if text.strip() else "ראה תמונה מצורפת של הבעיה האלגוריתמית."

        user_input = f"""
        Analyze this problem description:
        ---
        {problem_text}
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
        
        # Start constructing the multi-modal payload array
        contents_payload = [full_prompt]

        # Inject the image into the payload if it exists
        if image_base64:
            try:
                # The frontend sends a Data URL format: "data:image/png;base64,iVBORw0KGgo..."
                # We split by comma to isolate the metadata from the actual base64 string
                header, encoded_string = image_base64.split(",", 1)
                
                # Extract the MIME type (e.g., "image/png") from the header
                mime_type = header.split(":")[1].split(";")[0]
                
                # Decode the base64 string back to raw bytes
                image_bytes = base64.b64decode(encoded_string)
                
                # Create the Part object required by the Gemini Python SDK
                image_part = Part.from_bytes(data=image_bytes, mime_type=mime_type)
                
                # Append the image to the prompt
                contents_payload.append(image_part)
            except Exception as e:
                raise ValueError(f"Failed to process image attachment: {str(e)}")

        response = await client.aio.models.generate_content(
            model='gemini-2.5-flash',
            contents=contents_payload, # We now pass the array containing text and (optionally) the image
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

    async def classify_and_save(self, text: str, user_id: str, image_base64: str = None) -> QuestionDocument:
        # Pass the image_base64 to the internal gemini caller
        ai_data = await self._call_gemini(text, image_base64)
        
        # If no text was provided, explicitly note that in the originalText field for history reference
        final_text = text if text.strip() else "[Image Analysis Only]"

        question_doc = QuestionDocument(
            userId=user_id,
            isPublic=False,
            originalText=final_text,
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
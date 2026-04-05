import json
import base64
from datetime import datetime, timezone
from google import genai
from google.genai import errors
from google.genai.types import GenerateContentConfig, Part, Content
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_not_exception_type

# --- NEW: Import Cloudinary ---
import cloudinary
import cloudinary.uploader

from app.core.config import settings
from app.models.question import QuestionDocument
from app.services.user_service import user_service

# Initialize the modern Gemini Client
client = genai.Client(api_key=settings.GEMINI_API_KEY)

# --- NEW: Initialize Cloudinary Configuration ---
# This connects our backend to your Cloudinary account using the keys from .env
cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET
)

class ClassifierService:
    @retry(
        stop=stop_after_attempt(3), 
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_not_exception_type(errors.ClientError)
    )
    async def _call_gemini(self, text: str, image_base64: str = None) -> dict:
        system_instruction = """
        You are a senior algorithmic teaching assistant at a university. 
        Your task is to accurately explain the solution to complex algorithmic problems to a computer science student.

        ASSUMED KNOWLEDGE (BLACK BOXES):
        You MUST treat the following algorithms and techniques as black boxes. DO NOT explain how they work from scratch. You can use them directly or apply variations to them to solve the specific problem:
        - Regular Matrix Multiplication
        - Fast Boolean Matrix Multiplication (using \omega)
        - Fast Fourier Transform (FFT)
        - Bellman-Ford
        - Dijkstra
        - Prim
        - Kruskal
        - Floyd-Warshall
        - Johnson
        - Heavy-Light Decomposition
        - Seidel
        - Triangle Verification
        - Strongly Connected Components (SCC / GSCC / Kosaraju / Tarjan)
        - Topological Sort
        - Depth-First Search (DFS)
        - Breadth-First Search (BFS)

        STRICT ALGORITHMIC RULES TO ENFORCE:
        - When referring to Kruskal's algorithm, you must always explicitly remember and mention that the edges need to be sorted first.

        MANDATORY OUTPUT FORMAT:
        - Return ONLY valid JSON.
        - The language for all value fields MUST be Hebrew (except for standard math/algorithmic notation like O(V+E)).
        - DO NOT wrap the output in Markdown code blocks (no ```json).

        JSON STRUCTURE & CHAIN OF THOUGHT:
        You must return exactly these keys, mapping the academic content to these specific field names:
        - "_internalScratchpad": (string) Use this strictly for your own Chain of Thought. Briefly analyze the problem constraints, pick the right black-box, and plan the solution before writing the actual output. This will not be shown to the user.
        - "catchyTitle": (string) A short, precise Hebrew title for the problem.
        - "categoryName": (string) The general algorithm family (e.g., Graphs, Dynamic Programming, Greedy).
        - "specificTechnique": (string) THIS IS THE INTUITIVE ANSWER. Provide a high-level, clear explanation of the approach. Why did we choose this variation? What is the core trick?
        - "chronologicalLogic": (string) THIS IS THE FORMAL ANSWER. Provide a rigorous, exam-style step-by-step formal proof or algorithm breakdown.
        - "thePunchline": (string) THIS IS THE GUIDING THEOREM. Name a famous guiding theorem if applicable (e.g., "לפי משפט Min-Cut Max-Flow..."). If none is highly relevant, return "אין משפט מנחה ספציפי".
        - "runtimeComplexity": (string) The final time and space complexity with a brief justification.
        """

        # Handle cases where user provided an image but no text
        problem_text = text if text.strip() else "ראה תמונה מצורפת של הבעיה האלגוריתמית."

        user_input = f"""
        Solve this problem:
        ---
        {problem_text}
        ---
        """
        
        full_prompt = f"{system_instruction}\n\n{user_input}"
        
        # Start constructing the multi-modal payload array
        contents_payload = [full_prompt]

        # Inject the image into the payload if it exists
        if image_base64:
            try:
                # The frontend sends a Data URL format: "data:image/png;base64,iVBORw0KGgo..."
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
            contents=contents_payload, 
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

    async def _generate_embedding(self, text: str) -> list[float]:
        """
        Generates a semantic vector representation of the text using Gemini's embedding model.
        This vector captures the 'meaning' of the algorithm, allowing for similarity searches later.
        """
        try:
            # text-embedding-004 is Google's latest embedding model
            response = await client.aio.models.embed_content(
                model='text-embedding-004',
                contents=text
            )
            # The SDK returns an object containing the array of floats
            return response.embeddings[0].values
        except Exception as e:
            print(f"Warning: Failed to generate embedding: {str(e)}")
            # We return None so the app doesn't crash completely. 
            # The question will just be saved without a vector for now.
            return None

    async def classify_and_save(self, text: str, user_id: str, image_base64: str = None) -> QuestionDocument:
        # Pass the image_base64 to the internal gemini caller
        ai_data = await self._call_gemini(text, image_base64)
        
        # If no text was provided, explicitly note that in the originalText field for history reference
        final_text = text if text.strip() else "[Image Analysis Only]"

        # --- NEW SPRINT 3: Semantic Vector Generation ---
        # We combine the most critical parts of the solution into one string.
        # This guarantees that if two problems use "Edge Transposition" (שחלוף קשתות), 
        # the embedding model will see those exact words and map the vectors very close to each other,
        # regardless of what the user's original text looked like.
        semantic_context = f"Category: {ai_data.get('categoryName', '')}\nTechnique: {ai_data.get('specificTechnique', '')}\nProblem: {final_text}"
        
        # Generate the vector
        embedding_vector = await self._generate_embedding(semantic_context)
        # ------------------------------------------------

        # Upload the image to Cloudinary and get the secure URL
        secure_image_url = None
        if image_base64:
            try:
                upload_result = cloudinary.uploader.upload(
                    image_base64,
                    folder="algoclassifier/questions"
                )
                secure_image_url = upload_result.get("secure_url")
            except Exception as e:
                print(f"Failed to upload image to Cloudinary: {str(e)}")

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
            imageUrl=secure_image_url, 
            embedding=embedding_vector,
            createdAt=datetime.now(timezone.utc)
        )
        
        await user_service.save_question_with_transaction(
            question_doc_dict=question_doc.model_dump(by_alias=True, exclude_none=True), 
            user_id=user_id
        )
        
        return question_doc
    

    async def ask_tutor(self, question_id: str, user_id: str, user_message: str) -> dict:
        """
        Handles the logic for a user asking a follow-up question to the AI tutor.
        
        Args:
            question_id (str): The unique ID of the question in MongoDB.
            user_id (str): The ID of the current logged-in user.
            user_message (str): The new question the user is asking.
            
        Returns:
            dict: The new message generated by the AI tutor.
        """
        # 1. Fetch the original question from the database to get context
        # We need this to understand what the user is asking about
        question_doc = await user_service.get_question_by_id(question_id)
        
        if not question_doc or str(question_doc.get("userId")) != str(user_id):
            raise ValueError("Question not found or you do not have permission to access it.")

        # 2. Build the System Prompt (Context)
        # We tell the AI exactly what problem it is tutoring the user on
        tutor_system_instruction = f"""
        You are a private AI tutor for an algorithms student. 
        The student is currently looking at the following algorithm problem:
        
        Problem Title: {question_doc.get('catchyTitle')}
        Category: {question_doc.get('categoryName')}
        Original Text: {question_doc.get('originalText')}
        Your previous explanation (Punchline): {question_doc.get('thePunchline')}
        
        Answer the student's follow-up question clearly, in Hebrew. 
        Be encouraging, explain the core concepts simply, and use examples if needed.
        """

        # 3. Convert our database history into Gemini's specific Content history format
        gemini_history = []
        db_history = question_doc.get("tutorHistory", [])
        
        for msg in db_history:
            # Gemini SDK expects role to be either 'user' or 'model'
            gemini_role = "model" if msg["role"] == "ai" else "user"
            gemini_history.append(
                Content(role=gemini_role, parts=[Part.from_text(text=msg["content"])])
            )

       # 4. Initialize the Gemini chat session using the ASYNC client
        # In the new SDK, we must use `client.aio` to create an asynchronous chat session.
        # This ensures our FastAPI server is not blocked while waiting for the AI response.
        chat_session = client.aio.chats.create(
            model='gemini-2.5-flash',
            config=GenerateContentConfig(
                system_instruction=tutor_system_instruction
            ),
            history=gemini_history
        )

        # 5. Send the new message to Gemini
        # Because we created the chat using `client.aio`, the standard `send_message` 
        # function is now automatically an asynchronous coroutine. 
        # We just need to `await` it. There is no need for a `_async` suffix anymore.
        response = await chat_session.send_message(user_message)
        ai_reply = response.text

        # 6. Save BOTH the user's message and the AI's reply to the database array
        # Note: You will need to implement add_tutor_messages in user_service.py
        new_messages = [
            {"role": "user", "content": user_message, "timestamp": datetime.now(timezone.utc)},
            {"role": "ai", "content": ai_reply, "timestamp": datetime.now(timezone.utc)}
        ]
        
        await user_service.add_tutor_messages(question_id, new_messages)

        # 7. Return the AI's response to the controller
        return new_messages[1]

classifier_service = ClassifierService()
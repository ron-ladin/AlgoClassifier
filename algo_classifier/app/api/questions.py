from fastapi import APIRouter, HTTPException, Depends
from typing import Dict
from app.schemas.question_api import ClassifyRequest, QuestionResponse
from app.services.classifier_service import classifier_service
from app.security.auth import get_current_user

# Questions router definition
router = APIRouter(prefix="/questions", tags=["Questions"])

@router.post("/classify", response_model=QuestionResponse)
async def classify_problem(
    request: ClassifyRequest, 
    current_user: Dict = Depends(get_current_user)
):
    """
    Classifies a given problem text and saves the result.

    - **text**: The problem description to be classified.
    - **Authorization**: Bearer token for user authentication.
    """
    try:
        # Send to service for analysis and DB storage
        result = await classifier_service.classify_and_save(
            text=request.text, 
            user_id=current_user["user_id"]
        ) 
        
        return result

    except Exception as e:
        # Return a generic error message to avoid exposing internal details
        raise HTTPException(status_code=500, detail="An unexpected error occurred during classification.")
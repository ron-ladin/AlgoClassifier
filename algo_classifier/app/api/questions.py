from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict
import traceback

from app.schemas.question_api import (
    ClassifyRequest, 
    QuestionResponse, 
    QuestionSummary, 
    QuestionDetailResponse
)
from app.services.classifier_service import classifier_service
from app.services.user_service import user_service
from app.security.auth import get_current_user

router = APIRouter(prefix="/questions", tags=["Questions"])

# 1. נתיב ההיסטוריה המפורש - חייב להיות לפני הנתיב הדינמי!
@router.get("/history", response_model=List[QuestionSummary])
async def list_history(current_user: dict = Depends(get_current_user)):
    return await user_service.get_user_questions(current_user["user_id"])

# 2. נתיב השליפה לפי מזהה דינמי
@router.get("/{question_id}", response_model=QuestionDetailResponse)
async def get_question(question_id: str, current_user: dict = Depends(get_current_user)):
    question = await user_service.get_question_by_id(question_id)
    if not question or question["userId"] != current_user["user_id"]:
        raise HTTPException(status_code=404, detail="Question not found")
    return question

@router.delete("/{question_id}", status_code=204)
async def delete_question(question_id: str, current_user: dict = Depends(get_current_user)):
    await user_service.delete_question_with_transaction(question_id, current_user["user_id"])
    return None

@router.post("/classify", response_model=QuestionResponse)
async def classify_problem(request: ClassifyRequest, current_user: Dict = Depends(get_current_user)):
    try:
        return await classifier_service.classify_and_save(
            text=request.text, 
            user_id=current_user["user_id"],
            image_base64=request.image_base64
        ) 
    except Exception as e:
        import traceback
        traceback.print_exc() 
        error_msg = str(e)
        
        if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg:
            raise HTTPException(status_code=429, detail="AI quota exceeded for today.")
            
        raise HTTPException(status_code=500, detail="Internal server error during classification.")
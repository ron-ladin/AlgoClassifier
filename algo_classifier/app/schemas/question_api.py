from pydantic import BaseModel, Field, model_validator
from datetime import datetime
from typing import Optional

class ClassifyRequest(BaseModel):
    # Default is empty string. Removed ConfigDict(strict=True) to allow web-safe coercion.
    text: str = Field(default="", description="The raw algorithmic problem text")
    image_base64: Optional[str] = Field(default=None, description="Base64 encoded image string")

    @model_validator(mode='after')
    def validate_content_presence(self):
        # Safe string handling in case the frontend sends null/None
        safe_text = self.text if self.text else ""
        has_text = len(safe_text.strip()) >= 10
        
        has_image = bool(self.image_base64)
        
        if not has_text and not has_image:
            raise ValueError("You must provide either problem text (min 10 chars) or an image attachment.")
        
        return self

class QuestionResponse(BaseModel):
    catchyTitle: str
    categoryName: str
    specificTechnique: str
    chronologicalLogic: str
    thePunchline: str
    runtimeComplexity: str
    isPublic: bool
    createdAt: datetime

class QuestionSummary(BaseModel):
    id: str
    catchyTitle: str
    categoryName: str
    createdAt: datetime

class QuestionDetailResponse(BaseModel):
    id: str
    originalText: str
    catchyTitle: str
    categoryName: str
    specificTechnique: str
    chronologicalLogic: str
    thePunchline: str
    runtimeComplexity: str
    createdAt: datetime
    imageUrl: Optional[str] = None

class TutorRequest(BaseModel):
    """
    Data expected from the frontend when a user asks a follow-up question.
    """
    message: str = Field(..., min_length=1, description="The follow-up question asked by the user")

class TutorResponse(BaseModel):
    """
    Data returned to the frontend after the AI responds.
    """
    role: str = Field(description="Who is speaking. Usually 'ai' or 'model'")
    content: str = Field(description="The response text from the AI Tutor")
    timestamp: datetime = Field(description="When the response was generated")
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime

class ClassifyRequest(BaseModel):
    text: str = Field(..., min_length=10, description="The raw algorithmic problem text")
    model_config = ConfigDict(strict=True)

class QuestionResponse(BaseModel):
    """
    Schema for the response sent back to the user.
    Represents a categorized question in the user's personal dashboard.
    """
    catchyTitle: str
    categoryName: str
    specificTechnique: str
    chronologicalLogic: str
    thePunchline: str
    runtimeComplexity: str
    
    isPublic: bool
    createdAt: datetime

    model_config = ConfigDict(from_attributes=True)
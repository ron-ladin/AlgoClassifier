from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List

class TutorMessage(BaseModel):
    """
    Represents a single message in the AI Tutor chat.
    This is an embedded document inside the main QuestionDocument.
    """
    role: str 
    content: str 
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class QuestionDocument(BaseModel):
    """
    Pydantic model for storage in MongoDB.
    Represents the 'Source of Truth' for a question.
    """
    model_config = ConfigDict(strict=True, extra="forbid")

    # Ownership and Privacy management
    userId: str                   
    isPublic: bool = False        

    # Question Content (AI Generated)
    originalText: str
    catchyTitle: str
    categoryName: str
    specificTechnique: str
    chronologicalLogic: str
    thePunchline: str
    runtimeComplexity: str
    confidenceScore: float
    createdAt: datetime
    imageUrl: Optional[str] = None
    tutorHistory: List[TutorMessage] = Field(default_factory=list)
    embedding: Optional[List[float]] = None
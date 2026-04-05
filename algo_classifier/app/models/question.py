from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import Optional
class QuestionDocument(BaseModel):
    """
    Pydantic model for storage in MongoDB.
    Represents the 'Source of Truth' for a question.
    """
    model_config = ConfigDict(strict=True, extra="forbid")

    # Ownership and Privacy management
    userId: str                   # Extracted from JWT token
    isPublic: bool = False        # Always private by default upon creation

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
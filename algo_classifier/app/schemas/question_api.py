from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime

class ClassifyRequest(BaseModel):
    """
    Schema for incoming classification requests.
    Identity (userId) and sharing status are handled separately for security and clean UX.
    """
    text: str = Field(..., min_length=10, description="The raw algorithmic problem text")

    model_config = ConfigDict(strict=True)

class QuestionResponse(BaseModel):
    """
    Schema for the response sent back to the user.
    Represents a categorized question in the user's personal dashboard.
    """
    catchyTitle: str
    categoryName: str
    solutionEssence: str
    isPublic: bool  # Will return False by default for new classifications
    createdAt: datetime

    model_config = ConfigDict(from_attributes=True)
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
# defines the data that the user send for us to classify 
# and the data we send back to the user after classification. 
class ClassifyRequest(BaseModel):
    """Schema for incoming classification requests."""
    text: str = Field(..., min_length=10, description="The raw algorithmic problem text")

    model_config = ConfigDict(strict=True)

# defines the structure of the data stored in MongoDB and sent back to the user after classification. 
class QuestionResponse(BaseModel):
    """Schema for the response sent back to the user."""
    catchyTitle: str
    categoryName: str
    solutionEssence: str
    createdAt: datetime

    model_config = ConfigDict(from_attributes=True)
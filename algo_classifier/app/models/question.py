from datetime import datetime
from pydantic import BaseModel, ConfigDict

class QuestionDocument(BaseModel):
    """
    Pydantic model for an algorithmic question.
    Focuses on educational value and long-term memory aids.
    """
    # Strict validation: no extra fields allowed, no automatic type casting
    model_config = ConfigDict(strict=True, extra="forbid")

    # The raw problem description provided by the user
    originalText: str
    
    # A short, memorable name for the problem (e.g., "The Greedy Camel")
    catchyTitle: str
    
    # Formal algorithmic category (e.g., "Dynamic Programming")
    categoryName: str
    
    # A concise summary of the core logic/algorithm needed for the solution
    solutionEssence: str
    
    # AI's confidence score for the classification (0.0 to 1.0)
    confidenceScore: float
    
    # Auto-generated UTC timestamp of record creation
    createdAt: datetime
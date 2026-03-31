from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict


class QuestionDocument(BaseModel):
    model_config = ConfigDict(strict=True, extra="forbid")

    originalText: str
    categoryName: str
    shortDescription: str
    confidenceScore: float
    difficulty: Literal["easy", "medium", "hard"]
    createdAt: datetime

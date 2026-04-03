from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import List, Optional

class ClassifyRequest(BaseModel):
    text: str = Field(..., min_length=10, description="The raw algorithmic problem text")
    model_config = ConfigDict(strict=True)

class QuestionResponse(BaseModel):
    catchyTitle: str
    categoryName: str
    specificTechnique: str
    chronologicalLogic: str
    thePunchline: str
    runtimeComplexity: str
    isPublic: bool
    createdAt: datetime
    model_config = ConfigDict(from_attributes=True)

class QuestionSummary(BaseModel):
    # Removed the alias mechanism for strict DTO pattern
    id: str
    catchyTitle: str
    categoryName: str
    createdAt: datetime
    model_config = ConfigDict(from_attributes=True)

class QuestionDetailResponse(BaseModel):
    # Removed the alias mechanism for strict DTO pattern
    id: str
    originalText: str
    catchyTitle: str
    categoryName: str
    specificTechnique: str
    chronologicalLogic: str
    thePunchline: str
    runtimeComplexity: str
    createdAt: datetime
    model_config = ConfigDict(from_attributes=True)
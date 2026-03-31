from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field

# --- Base Model (Shared Fields) ---
class UserBase(BaseModel):
    username: str = Field(..., min_length=3, description="Unique identifier for the user (unique=True in DB)")
    email: EmailStr = Field(..., description="Validated email address (unique=True, index=True in DB)")

# --- DTOs (Data Transfer Objects) ---

# 1. UserCreate: For the registration phase (includes plain-text password from frontend)
class UserCreate(UserBase):
    password: str = Field(..., min_length=8, description="Plain-text password provided by the user")

# 2. UserResponse: The data returned to the client (excludes sensitive data like the password)
class UserResponse(UserBase):
    id: str = Field(alias="_id", description="MongoDB Document ID")
    question_ids: List[str] = Field(default_factory=list, description="Array of question identifiers")
    createdAt: datetime = Field(description="Account creation timestamp")

    model_config = {
        "populate_by_name": True,
    }

# 3. UserInDB / UserDocument: Represents the document as stored in MongoDB (includes Hash and array)
class UserInDB(UserBase):
    id: Optional[str] = Field(None, alias="_id")
    hashed_password: str = Field(..., description="Encrypted password (Bcrypt)")
    question_ids: List[str] = Field(default_factory=list, description="Array of question identifiers (List of ObjectIDs)")
    createdAt: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc), 
        description="Account creation timestamp"
    )

    model_config = {
        "populate_by_name": True,
    }

from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from typing import Dict

from app.models.user import UserCreate, UserResponse
from app.services.user_service import user_service
from app.services.auth_service import auth_service

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post(
    "/register", 
    response_model=UserResponse, 
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user"
)
async def register(user_in: UserCreate) -> UserResponse:
    """
    Receives validation-checked JSON data (UserCreate),
    and sends it to the UserService for processing and DB storage.
    Returns the created user stripped of sensitive password data.
    """
    # Thin Controller: The service automatically throws HTTPExceptions if the user exists.
    created_user = await user_service.register_user(user_in)
    
    # We return the Pydantic object directly. 
    # FastAPI and Pydantic will automatically map '_id' to 'id' based on the response_model.
    return created_user

@router.post(
    "/login",
    summary="Authenticate user and receive a JWT token"
)
async def login(form_data: OAuth2PasswordRequestForm = Depends()) -> Dict[str, str]:
    """
    Receives standard OAuth2 Form Data, authenticates against the database, 
    and returns a JWT token for subsequent protected requests.
    """
    # Thin Controller: Error handling and specific HTTP logic is offloaded to auth_service.
    token_data = await auth_service.login(form_data)
    
    return token_data

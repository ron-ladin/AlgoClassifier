from fastapi import HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
import jwt
from typing import Optional

from app.core.config import settings
from app.core.security import verify_password, create_access_token
from app.services.user_service import user_service
from app.models.user import UserInDB

class AuthService:
    """
    Facade Service for Authentication.
    Coordinates between User data retrieval and Security primitives.
    """

    def __init__(self):
        self.secret_key = settings.SECRET_KEY
        self.algorithm = settings.ALGORITHM

    async def login(self, form_data: OAuth2PasswordRequestForm) -> dict:
        """
        Authenticates credentials and issues an Absolute Expiry JWT.
        """
        # Lookup strategy: Check username first, then fallback to email
        user = await user_service.get_user_by_username(form_data.username)
        if not user:
            user = await user_service.get_user_by_email(form_data.username)

        # Safety check: No cutting corners on password verification
        if not user or not verify_password(form_data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        # Issue Token with 'sub' (subject) claim as per standards
        access_token = create_access_token(data={"sub": str(user.id)})
        
        return {
            "access_token": access_token, 
            "token_type": "bearer",
            "user_id": str(user.id)
        }

    async def verify_token(self, token: str) -> UserInDB:
        """
        Stateless token verification (Option A).
        """
        error = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
        try:
            # Decode using the shared Secret Key
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            user_id: str = payload.get("sub")
            if not user_id:
                raise error
        except (jwt.PyJWTError, jwt.ExpiredSignatureError):
            raise error
            
        # Ensure the user still exists in our O(\log n) storage
        user = await user_service.get_user_by_id(user_id)
        if not user:
            raise error
            
        return user

# Singleton instance
auth_service = AuthService()
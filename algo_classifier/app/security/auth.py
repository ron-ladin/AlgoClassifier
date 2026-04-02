from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.services.auth_service import auth_service
from app.models.user import UserInDB

# Tells FastAPI where the client can get a token (used for Swagger UI)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    """
    Dependency that validates the JWT token and returns the current user.
    Uses the AuthService for stateless verification and DB lookup.
    """
    try:
        # Verify the token and retrieve the UserInDB object
        user: UserInDB = await auth_service.verify_token(token)
        
        # Return a dictionary with the user_id to maintain compatibility with existing routers
        # We explicitly cast to string because MongoDB _id is an ObjectId
        return {"user_id": str(user.id)}
        
    except HTTPException as e:
        # Re-raise HTTPExceptions from the auth_service (e.g., token expired, user not found)
        raise e
    except Exception as e:
         # Catch-all for unexpected errors during token validation
         raise HTTPException(
             status_code=status.HTTP_401_UNAUTHORIZED,
             detail="Could not validate credentials",
             headers={"WWW-Authenticate": "Bearer"},
         )
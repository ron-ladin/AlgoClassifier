from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, SecurityScopes
# meanns that we wait to bearer token from the user and then we will use it to get the user information
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_current_user(security_scopes: SecurityScopes, token: str = Depends(oauth2_scheme)):
    if security_scopes.scopes:
        authenticate_value = f'Bearer scope="{security_scopes.scope_str}"'
    else:
        authenticate_value = "Bearer"
    
    # This is a placeholder for a real authentication system.
    # In a real application, you would decode the token, validate it,
    # and fetch the user from the database.
    if token == "test-token":
        return {"user_id": "user_from_token"}
        
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authentication credentials",
        headers={"WWW-Authenticate": authenticate_value},
    )

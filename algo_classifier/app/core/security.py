import jwt
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from app.core.config import settings



# This is our 'Secret Key'. Think of it as the master password for the whole system.
# It's used to lock and unlock our security tokens.
SECRET_KEY = getattr(settings, "SECRET_KEY", "your-super-secret-key-change-in-production")

# This is the mathematical 'recipe' we use to sign our tokens.
ALGORITHM = getattr(settings, "ALGORITHM", "HS256")

# We decide how long a user stays logged in. Here, it's 24 hours.
ACCESS_TOKEN_EXPIRE_MINUTES = 24 * 60 

# This tool helps us turn readable passwords into a scrambled mess that no one can read.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# --- The Tools (Functions) ---

def get_password_hash(password: str) -> str:
    """
    This takes a normal password (like '12345') and turns it into a 
    long string of random characters. We save ONLY this string in our database.
    """
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    When a user tries to log in, we take the password they typed and compare 
    it with the scrambled string in our database to see if they match.
    """
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    """
    This creates the 'Digital Key' (Token) that the user carries around.
    It includes their ID and a 'Best Before' date so it expires after 24 hours.
    """
    # Create a copy of the user's data (like their ID)
    to_encode = data.copy()
    
    # Calculate the exact moment this key will stop working (24 hours from now)
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Add that expiration time into the key's information
    to_encode.update({"exp": expire})
    
    # Pack everything together, sign it with our Secret Key, and create the final token
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    # This returns the long string the user will send us in every request
    return encoded_jwt

from urllib.parse import urlparse
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    """
    Application settings and environment variable validation.
    This class reads from the .env file and makes sure all required variables exist.
    """
    # Database and AI Keys
    MONGODB_URI: str = Field(min_length=1)
    GEMINI_API_KEY: str
    GEMINI_MODEL_NAME: str = "gemini-3-flash-preview"

    # JWT Security Settings
    # This is the master key used to sign our security tokens. It must be at least 32 characters long.
    SECRET_KEY: str = Field(min_length=32) 
    
    # The mathematical algorithm used for signing the tokens (Default is HS256)
    ALGORITHM: str = "HS256"
    
    # How long a user stays logged in before needing to log in again (Default is 24 hours)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    # Cloudinary Settings for Image Uploads
    # These are now required fields without hardcoded values. 
    # Pydantic will automatically look for these names in your .env file.
    CLOUDINARY_CLOUD_NAME: str
    CLOUDINARY_API_KEY: str
    CLOUDINARY_API_SECRET: str

    @field_validator("MONGODB_URI")
    @classmethod
    def validate_mongodb_uri(cls, value: str) -> str:
        """
        Checks if the provided MongoDB connection string is valid.
        """
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("MONGODB_URI must not be empty.")
        parsed = urlparse(cleaned)
        if parsed.scheme not in {"mongodb", "mongodb+srv"}:
            raise ValueError("MONGODB_URI must start with 'mongodb://' or 'mongodb+srv://'.")
        if not parsed.path or parsed.path == "/":
            raise ValueError("MONGODB_URI must include a database name.")
        return cleaned

    @field_validator("GEMINI_API_KEY", "SECRET_KEY", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET")
    @classmethod
    def validate_keys(cls, value: str) -> str:
        """
        Ensures that critical security keys are provided and not just empty spaces.
        We added Cloudinary keys here to ensure they are properly validated.
        """
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Security keys must not be empty.")
        return cleaned

    # Configuration for how Pydantic should read the environment variables
    model_config = SettingsConfigDict(
        env_file=".env",              # Tells Pydantic to read from a file named .env
        env_file_encoding="utf-8",    # The text encoding of the file
        extra="forbid",               # Prevents adding unknown variables to the settings
        strict=True,                  # Enforces strict type checking
        case_sensitive=True,          # Variable names must match case exactly
    )

# Create the single instance to be imported across the application
settings = Settings()
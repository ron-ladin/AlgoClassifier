from urllib.parse import urlparse
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    """
    Application settings and environment variable validation.
    """
    # Database and AI Keys
    MONGODB_URI: str = Field(min_length=1)
    GEMINI_API_KEY: str
    GEMINI_MODEL_NAME: str = "gemini-3-flash-preview"

    # JWT Security Settings
    # This is the master key used to sign our security tokens
    SECRET_KEY: str = Field(min_length=32) 
    
    # The mathematical algorithm used for signing (Default: HS256)
    ALGORITHM: str = "HS256"
    
    # How long a user stays logged in (Default: 24 hours)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    # Cloudinary Settings for Image Uploads
    CLOUDINARY_CLOUD_NAME: str = "dsxo7cuxr"
    CLOUDINARY_API_KEY: str = "742548134815235"
    CLOUDINARY_API_SECRET: str = "obZbgajKqFyOgtbWxx_i5YcvdJM"

    @field_validator("MONGODB_URI")
    @classmethod
    def validate_mongodb_uri(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("MONGODB_URI must not be empty.")
        parsed = urlparse(cleaned)
        if parsed.scheme not in {"mongodb", "mongodb+srv"}:
            raise ValueError("MONGODB_URI must start with 'mongodb://' or 'mongodb+srv://'.")
        if not parsed.path or parsed.path == "/":
            raise ValueError("MONGODB_URI must include a database name.")
        return cleaned

    @field_validator("GEMINI_API_KEY", "SECRET_KEY")
    @classmethod
    def validate_keys(cls, value: str) -> str:
        """
        Ensures that critical keys are provided and not empty.
        """
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Security keys must not be empty.")
        return cleaned

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="forbid",
        strict=True,
        case_sensitive=True,
    )

settings = Settings()
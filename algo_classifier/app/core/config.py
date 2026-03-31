from urllib.parse import urlparse
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    """
    Application settings and environment variable validation.
    Inherits from BaseSettings to automatically load variables from .env or environment.
    """
    # MONGODB_URI must be a string with at least one character
    MONGODB_URI: str = Field(min_length=1)
    # GEMINI_API_KEY is required for AI classification logic
    GEMINI_API_KEY: str

    @field_validator("MONGODB_URI")
    @classmethod
    def validate_mongodb_uri(cls, value: str) -> str:
        """
        Custom validator for the MongoDB connection string.
        Ensures the URI uses the correct protocol and includes a database name.
        """
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("MONGODB_URI must not be empty.")
            
        parsed = urlparse(cleaned)

        # Validate that the protocol is either standard or SRV (Atlas)
        if parsed.scheme not in {"mongodb", "mongodb+srv"}:
            raise ValueError(
                "MONGODB_URI must start with 'mongodb://' or 'mongodb+srv://'."
            )
            
        # MongoDB drivers require a database name in the path to connect correctly
        if not parsed.path or parsed.path == "/":
            raise ValueError("MONGODB_URI must include a database name.")

        return cleaned

    @field_validator("GEMINI_API_KEY")
    @classmethod
    def validate_gemini_api_key(cls, value: str) -> str:
        """
        Ensures the Gemini API Key is provided and not just whitespace.
        """
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("GEMINI_API_KEY must not be empty.")
        return cleaned

    # Configuration for the Settings model
    model_config = SettingsConfigDict(
        env_file=".env",              # Load variables from this file
        env_file_encoding="utf-8",    # Character encoding for the .env file
        extra="forbid",               # Fail if unexpected variables are found
        strict=True,                  # Enforce exact type matching
        case_sensitive=True,          # Variable names must match exactly (uppercase)
    )

# Global settings instance to be used across the application
settings = Settings()
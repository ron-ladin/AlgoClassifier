from urllib.parse import urlparse

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    MONGODB_URI: str = Field(min_length=1)
    GEMINI_API_KEY: str

    @field_validator("MONGODB_URI")
    @classmethod
    def validate_mongodb_uri(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("MONGODB_URI must not be empty.")
        parsed = urlparse(cleaned)

        if parsed.scheme not in {"mongodb", "mongodb+srv"}:
            raise ValueError(
                "MONGODB_URI must start with 'mongodb://' or 'mongodb+srv://'."
            )
        if not parsed.path or parsed.path == "/":
            raise ValueError("MONGODB_URI must include a database name.")

        return cleaned

    @field_validator("GEMINI_API_KEY")
    @classmethod
    def validate_gemini_api_key(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("GEMINI_API_KEY must not be empty.")
        return cleaned

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="forbid",
        strict=True,
        case_sensitive=True,
    )


settings = Settings()

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "AEGIS Backend"
    database_url: str = "sqlite:///./aegis.db"
    
    ai_api_key: str | None = None
    ai_model: str = "gemini-2.5-flash"

    model_config = SettingsConfigDict(env_prefix="AEGIS_", env_file=".env")


settings = Settings()

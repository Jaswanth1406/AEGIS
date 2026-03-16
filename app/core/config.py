from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "AEGIS Backend"
    jwt_secret: str = "change-me"
    jwt_algorithm: str = "HS256"
    jwt_exp_minutes: int = 60
    internal_api_key: str = "internal-dev-key"
    database_url: str = "sqlite:///./aegis.db"

    model_config = SettingsConfigDict(env_prefix="AEGIS_", env_file=".env")


settings = Settings()

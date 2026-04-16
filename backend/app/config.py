from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str = "postgresql://hr_user:hr_pass@localhost/hr_db"
    secret_key: str = "change-me"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    upload_dir: str = "./uploads"

    class Config:
        env_file = ".env"

settings = Settings()
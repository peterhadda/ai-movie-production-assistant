import os

from dotenv import load_dotenv

load_dotenv()


class Settings:
    DATABASE_URL: str        = os.getenv("DATABASE_URL", "")
    AWS_BUCKET_NAME: str     = os.getenv("AWS_BUCKET_NAME", "")
    AWS_REGION: str          = os.getenv("AWS_REGION", "us-east-1")
    AWS_ACCESS_KEY_ID: str   = os.getenv("AWS_ACCESS_KEY_ID", "")
    AWS_SECRET_ACCESS_KEY: str = os.getenv("AWS_SECRET_ACCESS_KEY", "")
    ANTHROPIC_API_KEY: str   = os.getenv("ANTHROPIC_API_KEY", "")
    MLFLOW_TRACKING_URI: str = os.getenv("MLFLOW_TRACKING_URI", "http://localhost:5001")
    PROMPT_VERSION: str      = os.getenv("PROMPT_VERSION", "v1")
    MODEL_NAME: str          = os.getenv("MODEL_NAME", "claude-sonnet-4-5")


settings = Settings()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import check_db_connection, init_db
from app.routers import scripts
from app.services import mlflow_service
import app.models  # noqa: F401 — registers all models with Base.metadata

app = FastAPI(title="AI Movie Production Assistant", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(scripts.router, prefix="/api/scripts", tags=["scripts"])


@app.on_event("startup")
def on_startup():
    init_db()
    mlflow_service.setup_experiment()


@app.get("/health")
def health_check():
    db_ok = check_db_connection()
    return {
        "status": "ok",
        "db": "connected" if db_ok else "unavailable",
    }

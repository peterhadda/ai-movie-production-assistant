# CineScript AI — Screenplay Intelligence Platform

An AI-powered screenplay analysis tool that detects genre, identifies characters, evaluates scene pacing and emotion, and generates actionable improvement suggestions. Built with FastAPI, Next.js, PostgreSQL, and Claude.

---

## What It Does

Upload a screenplay in plain text. The platform parses it into scenes, runs a multi-stage AI analysis pipeline in the background, and returns a full production report:

- **Genre detection** — primary and secondary genre with confidence score
- **Character identification** — name, role type, and description for every recurring character
- **Scene-level analysis** — summary, dominant emotion, and pacing label for every scene
- **Pacing flags** — slow scenes (rule-based + AI consensus) and dialogue-heavy scenes
- **Improvement suggestions** — 5 specific, actionable suggestions with severity and scene reference
- **Polling UI** — results page updates automatically as the background job completes

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, Tailwind CSS v4, TypeScript |
| Backend | FastAPI, Python 3.11, SQLAlchemy, Alembic |
| Database | PostgreSQL 15 |
| AI | Anthropic Claude (claude-sonnet-4-5) |
| Storage | AWS S3 (optional — script text is always stored in DB) |
| Experiment tracking | MLflow |
| Containerization | Docker Compose |
| CI | GitHub Actions |

---

## Project Structure

```
ai-movie-production-assistant/
├── backend/
│   ├── app/
│   │   ├── core/          # DB engine, config, settings
│   │   ├── models/        # SQLAlchemy models (Script, Analysis, Scene, Character)
│   │   ├── routers/       # FastAPI route handlers
│   │   ├── schemas/       # Pydantic request/response models
│   │   └── services/
│   │       ├── ai_service.py        # Raw Anthropic API wrapper
│   │       ├── analysis_service.py  # Full analysis orchestrator
│   │       ├── prompt_loader.py     # Versioned prompt loader
│   │       ├── response_parser.py   # Robust JSON parser
scene_parser.py     # Rule-based scene splitter
│   │       └── s3_service.py        # S3 upload helper
│   ├── prompts/
│   │   └── v1/            # Versioned prompt templates
│   │       ├── genre_detection.txt
│   │       ├── character_identification.txt
│   │       ├── scene_summary.txt
│   │       ├── emotion_analysis.txt
│   │       ├── pacing_analysis.txt
│   │       └── improvement_suggestions.txt
│   ├── migrations/        # Alembic migration files
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   └── src/app/
│       ├── page.tsx           # Landing page
│       ├── upload/page.tsx    # Script upload form
│       └── results/[id]/
│           ├── page.tsx       # Analysis results (polling client component)
│           └── loading.tsx    # Route-level skeleton
├── docker-compose.yml
└── .github/workflows/         # Backend + frontend CI
```

---

## Getting Started

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- Node.js 18+ (for the frontend)
- An [Anthropic API key](https://console.anthropic.com/)

### 1. Clone the repo

```bash
git clone https://github.com/peterhadda/ai-movie-production-assistant.git
cd ai-movie-production-assistant
```

### 2. Configure environment variables

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and fill in your values:

```env
DATABASE_URL=postgresql://movieadmin:yourpassword@db:5432/postgres
ANTHROPIC_API_KEY=sk-ant-...
AWS_BUCKET_NAME=your-bucket-name
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key-id
AWS_SECRET_ACCESS_KEY=your-secret
MLFLOW_TRACKING_URI=http://mlflow:5000
```

> S3 is optional. If the bucket is not configured, scripts are stored in the database only and the app continues to work normally.

### 3. Start the backend

```bash
docker compose up --build
```

This starts PostgreSQL, the FastAPI backend, and MLflow.

### 4. Start the frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

### 5. Open the app

| URL | Description |
|---|---|
| http://localhost:3000 | App UI |
| http://localhost:8000/health | Backend health check |
| http://localhost:8000/docs | FastAPI interactive docs |
| http://localhost:5001 | MLflow dashboard |

---

## How to Use

1. Go to **http://localhost:3000/upload**
2. Paste a screenplay or upload a `.txt` file
3. Scene headers must follow standard format: `INT. LOCATION - TIME` or `EXT. LOCATION - TIME`
4. Click **Analyze Script** — this uploads the script and parses scenes immediately
5. On the results page, click **Run AI Analysis**
6. Wait 30–90 seconds while the background job runs — the page polls automatically
7. The full report appears: genre, characters, per-scene emotion and pacing, and 5 improvement suggestions

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/scripts/upload` | Upload screenplay text or file |
| `POST` | `/api/scripts/{id}/analyze` | Trigger background AI analysis |
| `GET` | `/api/scripts/{id}` | Get script with full analysis results |
| `GET` | `/api/scripts/{id}/status` | Poll analysis status |
| `GET` | `/api/scripts/` | List all uploaded scripts |

---

## Prompt Versioning

All AI prompts live in `backend/prompts/v1/` as plain text files with `{{PLACEHOLDER}}` variables. To update a prompt without touching code:

1. Create a `backend/prompts/v2/` folder
2. Copy and edit the prompt files you want to change
3. Update `_PROMPT_VERSION = "v1"` in `analysis_service.py` to `"v2"`

The version string is stored in the `Analysis` database record alongside model name and latency, making every run traceable.

---

## Development Notes

**Never run `pip freeze > requirements.txt` on Windows** if the file is inside a Docker volume-mounted folder. The redirect writes PowerShell output (including Docker error messages) into the file and `pywin32` — a Windows-only package — will be included, breaking the Linux container build.

**The `backend/.env` file is gitignored.** Never commit it. Use `.env.example` as the reference for required variables.

**Background task session management:** `POST /analyze` uses FastAPI `BackgroundTasks`. The background function creates its own `SessionLocal()` session rather than reusing the request session, which is closed before the background task runs.

---

## CI

GitHub Actions runs on every push to `main`:

- **Backend CI** — installs Python 3.11 dependencies, runs `pytest`
- **Frontend CI** — installs Node dependencies, runs the Next.js build

---


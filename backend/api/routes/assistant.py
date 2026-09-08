from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from models import Alert, Project
from llm.assistant import generate_ai_response, get_ai_status, configure_api_key

router = APIRouter(prefix="/api/assistant", tags=["AI Assistant"])

class ChatRequest(BaseModel):
    message: str
    history: list = []

class ConfigureRequest(BaseModel):
    provider: str
    api_key: str

@router.get("/status")
def get_assistant_telemetry():
    return get_ai_status()

@router.post("/configure")
def configure_assistant_provider(req: ConfigureRequest):
    try:
        res = configure_api_key(req.provider, req.api_key)
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/chat")
def chat_assistant(req: ChatRequest, db: Session = Depends(get_db)):
    reply, matching_count, provider_used = generate_ai_response(req.message, req.history, db)
    return {
        "reply": reply,
        "matching_projects_count": matching_count,
        "provider": provider_used
    }

@router.get("/briefing")
def get_daily_briefing(db: Session = Depends(get_db)):
    total = db.query(Project).count()
    crit_alerts = db.query(Alert).filter(Alert.severity == "CRITICAL", Alert.is_resolved == False).count()
    high_risk_projects = db.query(Project).filter(Project.risk_score >= 65.0).count()
    
    return {
        "briefing_items": [
            f"{crit_alerts} CRITICAL alerts active across central infrastructure monitoring war room.",
            f"{high_risk_projects} projects flagged with compounded risk scores above 65/100.",
            "Linear infrastructure (Railways & Highways) accounts for 71% of total schedule slippage.",
            "Land acquisition bottlenecks identified as leading risk factor in 24 major highway corridors."
        ],
        "suggested_questions": [
            "Which projects are most likely to exceed budget?",
            "Show me high-risk road projects in Bihar",
            "What are the top drivers of cost overrun?",
            "Compare sector performance",
            "Which states need immediate intervention?"
        ]
    }

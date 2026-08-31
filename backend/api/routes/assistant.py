from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from models import Alert, Project
from llm.assistant import generate_ai_response

router = APIRouter(prefix="/api/assistant", tags=["AI Assistant"])

class ChatRequest(BaseModel):
    message: str
    history: list = []

@router.post("/chat")
def chat_assistant(req: ChatRequest, db: Session = Depends(get_db)):
    reply, matching_count = generate_ai_response(req.message, req.history, db)
    return {
        "reply": reply,
        "matching_projects_count": matching_count
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

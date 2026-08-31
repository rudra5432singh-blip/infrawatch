import os
import json
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from database import get_db
from models import Project
from ml.predict import predict_project
from ml.shap_explain import get_shap_explanation

router = APIRouter(prefix="/api", tags=["Projects & Stats"])

@router.get("/projects")
def get_projects(
    page: int = Query(1, ge=1),
    page_size: int = Query(15, ge=1, le=2000),
    sector: str = Query(None),
    state: str = Query(None),
    risk_category: str = Query(None),
    search: str = Query(None),
    sort_by: str = Query("risk_score"),
    order: str = Query("desc"),
    db: Session = Depends(get_db)
):
    query = db.query(Project)
    
    if sector and sector != "All":
        query = query.filter(Project.sector == sector)
    if state and state != "All":
        query = query.filter(Project.state == state)
    if risk_category and risk_category != "All":
        query = query.filter(Project.risk_category == risk_category)
    if search:
        s = f"%{search}%"
        query = query.filter(
            or_(
                Project.project_name.ilike(s),
                Project.project_id.ilike(s),
                Project.implementing_agency.ilike(s),
                Project.district.ilike(s)
            )
        )
        
    total_count = query.count()
    
    sort_col = getattr(Project, sort_by, Project.risk_score)
    if order == "asc":
        query = query.order_by(sort_col.asc())
    else:
        query = query.order_by(sort_col.desc())
        
    projects = query.offset((page - 1) * page_size).limit(page_size).all()
    
    return {
        "total": total_count,
        "page": page,
        "page_size": page_size,
        "total_pages": (total_count + page_size - 1) // page_size,
        "projects": projects
    }

@router.get("/projects/{project_id}")
def get_project_detail(project_id: str, db: Session = Depends(get_db)):
    p = db.query(Project).filter(Project.project_id == project_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    return p

@router.get("/projects/{project_id}/predict")
def predict_single_project(project_id: str, db: Session = Depends(get_db)):
    p = db.query(Project).filter(Project.project_id == project_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
        
    p_dict = {c.name: getattr(p, c.name) for c in Project.__table__.columns}
    preds = predict_project(p_dict)
    return {
        "project_id": project_id,
        "project_name": p.project_name,
        "predictions": preds
    }

@router.get("/projects/{project_id}/explain")
def explain_single_project(project_id: str, db: Session = Depends(get_db)):
    p = db.query(Project).filter(Project.project_id == project_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
        
    p_dict = {c.name: getattr(p, c.name) for c in Project.__table__.columns}
    explanation = get_shap_explanation(p_dict)
    return {
        "project_id": project_id,
        "project_name": p.project_name,
        "explanation": explanation
    }

@router.get("/stats/summary")
def get_stats_summary(db: Session = Depends(get_db)):
    total = db.query(Project).count()
    if total == 0:
        return {
            "total_projects": 0, "high_risk_projects": 0,
            "avg_cost_overrun_rate": 0.0, "on_track_percentage": 100.0,
            "total_sanctioned_cost": 0.0, "total_expenditure": 0.0
        }
        
    high_risk = db.query(Project).filter(Project.risk_category == "High").count()
    med_risk = db.query(Project).filter(Project.risk_category == "Medium").count()
    low_risk = db.query(Project).filter(Project.risk_category == "Low").count()
    
    avg_cost_overrun = db.query(func.avg(Project.cost_overrun_pct)).scalar() or 0.0
    avg_time_overrun = db.query(func.avg(Project.time_overrun_pct)).scalar() or 0.0
    
    on_track_pct = (low_risk / total) * 100.0 if total > 0 else 100.0
    
    tot_sanc = db.query(func.sum(Project.sanctioned_cost)).scalar() or 0.0
    tot_rev = db.query(func.sum(Project.revised_cost)).scalar() or 0.0
    tot_exp = db.query(func.sum(Project.actual_expenditure)).scalar() or 0.0
    
    return {
        "total_projects": total,
        "high_risk_projects": high_risk,
        "medium_risk_projects": med_risk,
        "low_risk_projects": low_risk,
        "avg_cost_overrun_rate": round(float(avg_cost_overrun), 1),
        "avg_time_overrun_rate": round(float(avg_time_overrun), 1),
        "on_track_percentage": round(float(on_track_pct), 1),
        "total_sanctioned_cost": round(float(tot_sanc), 1),
        "total_revised_cost": round(float(tot_rev), 1),
        "total_expenditure": round(float(tot_exp), 1)
    }

@router.get("/stats/sector")
def get_sector_breakdown(db: Session = Depends(get_db)):
    sectors = db.query(
        Project.sector,
        func.count(Project.id).label("count"),
        func.avg(Project.cost_overrun_pct).label("avg_cost_overrun"),
        func.avg(Project.time_overrun_pct).label("avg_time_overrun"),
        func.avg(Project.risk_score).label("avg_risk_score"),
        func.sum(Project.sanctioned_cost).label("total_sanctioned"),
        func.sum(Project.actual_expenditure).label("total_expenditure")
    ).group_by(Project.sector).order_by(func.count(Project.id).desc()).all()
    
    result = []
    for s in sectors:
        high_c = db.query(Project).filter(Project.sector == s.sector, Project.risk_category == "High").count()
        med_c = db.query(Project).filter(Project.sector == s.sector, Project.risk_category == "Medium").count()
        low_c = db.query(Project).filter(Project.sector == s.sector, Project.risk_category == "Low").count()
        
        result.append({
            "sector": s.sector,
            "project_count": s.count,
            "avg_cost_overrun": round(float(s.avg_cost_overrun or 0), 1),
            "avg_time_overrun": round(float(s.avg_time_overrun or 0), 1),
            "avg_risk_score": round(float(s.avg_risk_score or 0), 1),
            "total_sanctioned": round(float(s.total_sanctioned or 0), 1),
            "total_expenditure": round(float(s.total_expenditure or 0), 1),
            "high_risk_count": high_c,
            "medium_risk_count": med_c,
            "low_risk_count": low_c
        })
    return result

@router.get("/stats/state")
def get_state_breakdown(db: Session = Depends(get_db)):
    states = db.query(
        Project.state,
        func.count(Project.id).label("count"),
        func.avg(Project.risk_score).label("avg_risk_score"),
        func.avg(Project.cost_overrun_pct).label("avg_cost_overrun"),
        func.avg(Project.time_overrun_pct).label("avg_time_overrun")
    ).group_by(Project.state).having(func.count(Project.id) >= 3).order_by(func.avg(Project.risk_score).desc()).all()
    
    formatted = [
        {
            "state": s.state,
            "project_count": s.count,
            "avg_risk_score": round(float(s.avg_risk_score or 0), 1),
            "avg_cost_overrun": round(float(s.avg_cost_overrun or 0), 1),
            "avg_time_overrun": round(float(s.avg_time_overrun or 0), 1)
        }
        for s in states
    ]
    
    worst_states = formatted[:5]
    best_states = sorted(formatted, key=lambda x: x["avg_risk_score"])[:5]
    
    return {
        "all_states": formatted,
        "worst_performing": worst_states,
        "best_performing": best_states
    }

@router.get("/stats/benchmarks")
def get_benchmarks():
    comp_file = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "ml", "model_comparison.json")
    if os.path.exists(comp_file):
        with open(comp_file, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data
    return {"status": "Model comparison file pending training."}

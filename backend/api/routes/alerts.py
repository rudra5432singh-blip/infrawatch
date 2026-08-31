import os
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from models import Alert
from api.services.alert_service import generate_all_alerts

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])

@router.get("")
def get_alerts(
    severity: str = Query(None),
    sector: str = Query(None),
    state: str = Query(None),
    is_resolved: bool = Query(None),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    query = db.query(Alert)
    
    if severity and severity != "All":
        query = query.filter(Alert.severity == severity)
    if sector and sector != "All":
        query = query.filter(Alert.sector == sector)
    if state and state != "All":
        query = query.filter(Alert.state == state)
    if is_resolved is not None:
        query = query.filter(Alert.is_resolved == is_resolved)
    else:
        query = query.filter(Alert.is_resolved == False)
        
    alerts = query.order_by(Alert.created_at.desc()).limit(limit).all()
    
    critical_c = db.query(Alert).filter(Alert.severity == "CRITICAL", Alert.is_resolved == False).count()
    high_c = db.query(Alert).filter(Alert.severity == "HIGH", Alert.is_resolved == False).count()
    med_c = db.query(Alert).filter(Alert.severity == "MEDIUM", Alert.is_resolved == False).count()
    resolved_c = db.query(Alert).filter(Alert.is_resolved == True).count()
    
    return {
        "total_active": critical_c + high_c + med_c,
        "critical_count": critical_c,
        "high_count": high_c,
        "medium_count": med_c,
        "resolved_count": resolved_c,
        "alerts": alerts
    }

@router.post("/{alert_id}/resolve")
def resolve_alert(alert_id: str, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.alert_id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
        
    alert.is_resolved = True
    db.commit()
    return {"status": "success", "message": f"Alert {alert_id} resolved"}

@router.post("/resolve-all")
def resolve_all_alerts(db: Session = Depends(get_db)):
    updated = db.query(Alert).filter(Alert.is_resolved == False).update({"is_resolved": True})
    db.commit()
    return {"status": "success", "resolved_count": updated}

@router.get("/generate")
def trigger_alert_generation(db: Session = Depends(get_db)):
    new_count = generate_all_alerts(db)
    return {"status": "success", "new_alerts_created": new_count}

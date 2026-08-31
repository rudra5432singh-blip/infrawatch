import datetime
from sqlalchemy.orm import Session
from models import Project, Alert
from ml.predict import predict_project

def generate_all_alerts(db: Session) -> int:
    projects = db.query(Project).all()
    now = datetime.datetime.utcnow()
    
    new_alerts = []
    alert_count = db.query(Alert).count() + 1
    
    existing_alert_keys = set(
        (a.project_id, a.alert_type) for a in db.query(Alert.project_id, Alert.alert_type).all()
    )
    
    for p in projects:
        p_dict = {
            "sanctioned_cost": p.sanctioned_cost,
            "actual_expenditure": p.actual_expenditure,
            "sanctioned_duration": p.sanctioned_duration,
            "physical_progress": p.physical_progress,
            "financial_progress": p.financial_progress,
            "revision_count": p.revision_count,
            "no_of_extensions": p.no_of_extensions,
            "inspection_score": p.inspection_score,
            "disputes_count": p.disputes_count,
            "land_acquisition_status": p.land_acquisition_status,
            "environment_clearance": p.environment_clearance,
            "forest_clearance": p.forest_clearance,
            "utility_shifting_status": p.utility_shifting_status,
            "tender_type": p.tender_type,
            "funding_source": p.funding_source,
            "sector": p.sector,
            "state": p.state
        }
        
        try:
            preds = predict_project(p_dict)
            cost_prob = preds["cost_overrun_probability"]
            time_prob = preds["time_overrun_probability"]
        except Exception:
            cost_prob = 0.5 if p.cost_overrun_flag == 1 else 0.1
            time_prob = 0.6 if p.time_overrun_flag == 1 else 0.2
            
        if cost_prob > 0.70 and (p.project_id, "COST_OVERRUN_PROB") not in existing_alert_keys:
            new_alerts.append(Alert(
                alert_id=f"ALT-{alert_count:04d}",
                project_id=p.project_id,
                project_name=p.project_name,
                sector=p.sector,
                state=p.state,
                alert_type="COST_OVERRUN_PROB",
                severity="CRITICAL",
                message=f"High probability ({cost_prob*100:.1f}%) of severe cost escalation detected by AI model.",
                created_at=now,
                is_resolved=False
            ))
            alert_count += 1
            existing_alert_keys.add((p.project_id, "COST_OVERRUN_PROB"))
            
        if time_prob > 0.65 and (p.project_id, "SCHEDULE_DELAY_PROB") not in existing_alert_keys:
            new_alerts.append(Alert(
                alert_id=f"ALT-{alert_count:04d}",
                project_id=p.project_id,
                project_name=p.project_name,
                sector=p.sector,
                state=p.state,
                alert_type="SCHEDULE_DELAY_PROB",
                severity="HIGH",
                message=f"Significant schedule delay risk ({time_prob*100:.1f}% probability) predicted.",
                created_at=now,
                is_resolved=False
            ))
            alert_count += 1
            existing_alert_keys.add((p.project_id, "SCHEDULE_DELAY_PROB"))
            
        if p.risk_score > 80 and (p.project_id, "EXTREME_RISK") not in existing_alert_keys:
            new_alerts.append(Alert(
                alert_id=f"ALT-{alert_count:04d}",
                project_id=p.project_id,
                project_name=p.project_name,
                sector=p.sector,
                state=p.state,
                alert_type="EXTREME_RISK",
                severity="CRITICAL",
                message=f"Project flagged as extreme risk (Score: {p.risk_score:.1f}/100) requiring immediate secretary review.",
                created_at=now,
                is_resolved=False
            ))
            alert_count += 1
            existing_alert_keys.add((p.project_id, "EXTREME_RISK"))
            
        if p.revision_count >= 4 and (p.project_id, "EXCESSIVE_REVISIONS") not in existing_alert_keys:
            new_alerts.append(Alert(
                alert_id=f"ALT-{alert_count:04d}",
                project_id=p.project_id,
                project_name=p.project_name,
                sector=p.sector,
                state=p.state,
                alert_type="EXCESSIVE_REVISIONS",
                severity="HIGH",
                message=f"Multiple scope revisions ({p.revision_count} rounds) indicate fundamental project restructuring.",
                created_at=now,
                is_resolved=False
            ))
            alert_count += 1
            existing_alert_keys.add((p.project_id, "EXCESSIVE_REVISIONS"))
            
        if p.land_acquisition_status == "Not Started" and (p.project_id, "LAND_BOTTLENECK") not in existing_alert_keys:
            new_alerts.append(Alert(
                alert_id=f"ALT-{alert_count:04d}",
                project_id=p.project_id,
                project_name=p.project_name,
                sector=p.sector,
                state=p.state,
                alert_type="LAND_BOTTLENECK",
                severity="HIGH",
                message="Critical land acquisition not started despite active mobilization.",
                created_at=now,
                is_resolved=False
            ))
            alert_count += 1
            existing_alert_keys.add((p.project_id, "LAND_BOTTLENECK"))

    if new_alerts:
        db.bulk_save_objects(new_alerts)
        db.commit()
        
    return len(new_alerts)

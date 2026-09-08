import datetime
from sqlalchemy.orm import Session
from models import Project, Alert
from ml.predict import predict_project
from ml.historical_forecast import predict_project_overruns

def generate_all_alerts(db: Session, force_refresh: bool = False) -> int:
    if force_refresh:
        db.query(Alert).delete()
        db.commit()

    projects = db.query(Project).all()
    now = datetime.datetime.utcnow()
    
    new_alerts = []
    alert_count = db.query(Alert).count() + 1
    
    existing_alert_keys = set(
        (a.project_id, a.alert_type) for a in db.query(Alert.project_id, Alert.alert_type).all()
    )
    
    for p in projects:
        cost_prob = float(p.cost_overrun_probability) if p.cost_overrun_probability is not None and p.cost_overrun_probability > 0 else (0.78 if p.risk_score > 70 else 0.25)
        time_prob = float(p.time_overrun_probability) if p.time_overrun_probability is not None and p.time_overrun_probability > 0 else (0.72 if p.time_overrun_flag == 1 else 0.30)

        s_cost = float(p.sanctioned_cost or 100.0)
        r_cost = float(p.revised_cost or s_cost)
        s_dur = int(p.sanctioned_duration or 24)
        a_dur = int(p.actual_duration or s_dur)
        
        pred_cost_ovr = round(max(0.0, r_cost - s_cost), 1)
        pred_cost_pct = round(float(p.cost_overrun_pct or 0.0), 1)
        if pred_cost_pct == 0.0 and pred_cost_ovr > 0:
            pred_cost_pct = round((pred_cost_ovr / max(1.0, s_cost)) * 100.0, 1)
            
        pred_delay = max(0, a_dur - s_dur)
        if pred_delay == 0 and p.time_overrun_pct and p.time_overrun_pct > 0:
            pred_delay = int(round((p.time_overrun_pct / 100.0) * s_dur))
            
        # =========================================================================
        # TIER 1: LEVEL 1 - CRITICAL (Statutory Escalation: Cabinet / PMG)
        # =========================================================================
        # Trigger 1A: Severe Cost Inflation Risk
        if (cost_prob > 0.70 or pred_cost_pct > 35.0) and (p.project_id, "STATUTORY_COST_ESCALATION") not in existing_alert_keys:
            new_alerts.append(Alert(
                alert_id=f"ALT-{alert_count:04d}",
                project_id=p.project_id,
                project_name=p.project_name,
                sector=p.sector,
                state=p.state,
                alert_type="STATUTORY_COST_ESCALATION",
                severity="CRITICAL",
                statutory_level="Level 1 - Critical",
                action_required="Mandatory Cabinet Committee on Infrastructure (CCI) / PMG Referral",
                message=f"Statutory fiscal breach detected: Cost overrun projected at +{pred_cost_pct:.1f}% (Rs. {pred_cost_ovr:,.1f} Cr) with {cost_prob*100:.0f}% AI confidence.",
                created_at=now,
                is_resolved=False
            ))
            alert_count += 1
            existing_alert_keys.add((p.project_id, "STATUTORY_COST_ESCALATION"))

        # Trigger 1B: Extreme Compound Risk
        if (p.risk_score > 75 or (pred_delay > 30 and pred_cost_pct > 25.0)) and (p.project_id, "EXTREME_PROJECT_CRISIS") not in existing_alert_keys:
            new_alerts.append(Alert(
                alert_id=f"ALT-{alert_count:04d}",
                project_id=p.project_id,
                project_name=p.project_name,
                sector=p.sector,
                state=p.state,
                alert_type="EXTREME_PROJECT_CRISIS",
                severity="CRITICAL",
                statutory_level="Level 1 - Critical",
                action_required="Urgent PMG Intervention & Inter-Ministerial Task Force Summon",
                message=f"Critical crisis threshold: Risk index {p.risk_score:.1f}/100 with projected schedule slippage of {pred_delay} months beyond sanction.",
                created_at=now,
                is_resolved=False
            ))
            alert_count += 1
            existing_alert_keys.add((p.project_id, "EXTREME_PROJECT_CRISIS"))

        # =========================================================================
        # TIER 2: LEVEL 2 - HIGH (Administrative Intervention: Inter-Ministerial Review)
        # =========================================================================
        # Trigger 2A: Land Acquisition Paralysis
        if p.land_acquisition_status in ["Not Started", "Partial"] and (p.project_id, "LAND_ROW_BOTTLENECK") not in existing_alert_keys:
            new_alerts.append(Alert(
                alert_id=f"ALT-{alert_count:04d}",
                project_id=p.project_id,
                project_name=p.project_name,
                sector=p.sector,
                state=p.state,
                alert_type="LAND_ROW_BOTTLENECK",
                severity="HIGH",
                statutory_level="Level 2 - High",
                action_required="Secretary-Level Inter-Ministerial Review & MoSPI Show-Cause",
                message=f"Right-of-Way (RoW) deadlock: Land acquisition status is '{p.land_acquisition_status}', risking cascading civil execution halts.",
                created_at=now,
                is_resolved=False
            ))
            alert_count += 1
            existing_alert_keys.add((p.project_id, "LAND_ROW_BOTTLENECK"))

        # Trigger 2B: Multiple Scope Revisions
        if p.revision_count >= 3 and (p.project_id, "RECURRENT_SCOPE_REVISIONS") not in existing_alert_keys:
            new_alerts.append(Alert(
                alert_id=f"ALT-{alert_count:04d}",
                project_id=p.project_id,
                project_name=p.project_name,
                sector=p.sector,
                state=p.state,
                alert_type="RECURRENT_SCOPE_REVISIONS",
                severity="HIGH",
                statutory_level="Level 2 - High",
                action_required="Technical Board Scrutiny & Design Freeze Directive",
                message=f"Structural scope drift: Project has undergone {p.revision_count} sanctioned cost/design revisions; contractual re-baselining required.",
                created_at=now,
                is_resolved=False
            ))
            alert_count += 1
            existing_alert_keys.add((p.project_id, "RECURRENT_SCOPE_REVISIONS"))

        # =========================================================================
        # TIER 3: LEVEL 3 - MODERATE (Milestone Monitoring: Implementing Agency Head)
        # =========================================================================
        # Trigger 3A: Clearance Impediment (Forest / Environmental)
        if (p.environment_clearance == "Pending" or p.forest_clearance == "Pending") and (p.project_id, "STATUTORY_CLEARANCE_PENDING") not in existing_alert_keys:
            pending_items = []
            if p.environment_clearance == "Pending": pending_items.append("Environmental")
            if p.forest_clearance == "Pending": pending_items.append("Forest")
            
            new_alerts.append(Alert(
                alert_id=f"ALT-{alert_count:04d}",
                project_id=p.project_id,
                project_name=p.project_name,
                sector=p.sector,
                state=p.state,
                alert_type="STATUTORY_CLEARANCE_PENDING",
                severity="MEDIUM",
                statutory_level="Level 3 - Moderate",
                action_required="Expedited State Wildlife / MoEFCC Clearance Liaison",
                message=f"Regulatory bottleneck: Pending {' & '.join(pending_items)} clearance impeding full site mobilization.",
                created_at=now,
                is_resolved=False
            ))
            alert_count += 1
            existing_alert_keys.add((p.project_id, "STATUTORY_CLEARANCE_PENDING"))

        # Trigger 3B: Velocity Lag
        if p.financial_progress > (p.physical_progress + 18.0) and (p.project_id, "EXPENDITURE_PROGRESS_DECOUPLING") not in existing_alert_keys:
            new_alerts.append(Alert(
                alert_id=f"ALT-{alert_count:04d}",
                project_id=p.project_id,
                project_name=p.project_name,
                sector=p.sector,
                state=p.state,
                alert_type="EXPENDITURE_PROGRESS_DECOUPLING",
                severity="MEDIUM",
                statutory_level="Level 3 - Moderate",
                action_required="Empowered Committee Physical Site Verification",
                message=f"Fiscal-physical dissonance: Financial expenditure ({p.financial_progress:.1f}%) significantly outpaces on-ground physical delivery ({p.physical_progress:.1f}%).",
                created_at=now,
                is_resolved=False
            ))
            alert_count += 1
            existing_alert_keys.add((p.project_id, "EXPENDITURE_PROGRESS_DECOUPLING"))

        # =========================================================================
        # TIER 4: LEVEL 4 - ADVISORY (Early Indicator: Project Director)
        # =========================================================================
        # Trigger 4A: Contractor Legal Disputes
        if p.disputes_count > 0 and (p.project_id, "CONTRACTOR_DISPUTE_ADVISORY") not in existing_alert_keys:
            new_alerts.append(Alert(
                alert_id=f"ALT-{alert_count:04d}",
                project_id=p.project_id,
                project_name=p.project_name,
                sector=p.sector,
                state=p.state,
                alert_type="CONTRACTOR_DISPUTE_ADVISORY",
                severity="LOW",
                statutory_level="Level 4 - Advisory",
                action_required="Project Director Arbitral Conciliation Meeting",
                message=f"Contractual friction: {p.disputes_count} active arbitration/dispute notices logged with contractor {p.contractor_name}.",
                created_at=now,
                is_resolved=False
            ))
            alert_count += 1
            existing_alert_keys.add((p.project_id, "CONTRACTOR_DISPUTE_ADVISORY"))

    if new_alerts:
        db.bulk_save_objects(new_alerts)
        db.commit()
        
    return len(new_alerts)

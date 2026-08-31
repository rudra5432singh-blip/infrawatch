import os
import sys
import joblib
import shap
import numpy as np
import pandas as pd

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from ml.features import transform_with_encoders, ALL_FEATURE_COLS

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(CURRENT_DIR, "models")

_model_cost = None
_model_risk = None
_encoders = None
_explainer_cost = None
_explainer_risk = None

def get_loaded_resources():
    global _model_cost, _model_risk, _encoders, _explainer_cost, _explainer_risk
    if _model_cost is None:
        _model_cost = joblib.load(os.path.join(MODELS_DIR, "xgb_cost.joblib"))
        _model_risk = joblib.load(os.path.join(MODELS_DIR, "xgb_risk.joblib"))
        _encoders = joblib.load(os.path.join(MODELS_DIR, "encoders.joblib"))
        try:
            _explainer_cost = shap.TreeExplainer(_model_cost)
            _explainer_risk = shap.TreeExplainer(_model_risk)
        except Exception:
            bg = joblib.load(os.path.join(MODELS_DIR, "shap_background.joblib"))
            _explainer_cost = shap.Explainer(_model_cost, bg)
            _explainer_risk = shap.Explainer(_model_risk, bg)
    return _model_cost, _model_risk, _encoders, _explainer_cost, _explainer_risk

FEATURE_LABELS = {
    "sanctioned_cost": "Sanctioned Budget Scale",
    "actual_expenditure": "Actual Funds Expended",
    "sanctioned_duration": "Original Planned Timeline",
    "physical_progress": "Physical Work Completed",
    "financial_progress": "Financial Utilization Rate",
    "revision_count": "Total Scope Revisions",
    "no_of_extensions": "Schedule Extensions",
    "inspection_score": "Site Quality Score",
    "disputes_count": "Contractor Disputes",
    "budget_utilization_rate": "Budget Depletion Ratio",
    "physical_financial_gap": "Physical vs Financial Gap",
    "revision_pressure": "Revision Velocity (Per Yr)",
    "inspection_recency_days": "Days Since Last Audit",
    "extension_rate": "Extension Frequency",
    "land_acquisition_status_encoded": "Land Acquisition Status",
    "environment_clearance_encoded": "Environmental Clearance",
    "forest_clearance_encoded": "Forest Department Clearance",
    "utility_shifting_status_encoded": "Utility Relocation Status",
    "tender_type_encoded": "Tender Procurement Route",
    "funding_source_encoded": "Funding Source Allocation",
    "sector_encoded": "Sector Risk Profile",
    "state_encoded": "State Administrative Factors"
}

def get_shap_explanation(project_data: dict) -> dict:
    model_cost, model_risk, encoders, explainer_cost, explainer_risk = get_loaded_resources()
    df_single = pd.DataFrame([project_data])
    X_single = transform_with_encoders(df_single, encoders)
    
    shap_vals = explainer_cost.shap_values(X_single)
    if isinstance(shap_vals, list):
        vals = shap_vals[1][0] if len(shap_vals) > 1 else shap_vals[0][0]
    elif len(shap_vals.shape) == 2:
        vals = shap_vals[0]
    else:
        vals = np.array(shap_vals).flatten()
        
    abs_vals = np.abs(vals)
    total_impact = np.sum(abs_vals) if np.sum(abs_vals) > 0 else 1.0
    top_indices = np.argsort(abs_vals)[::-1][:5]
    
    drivers = []
    for idx in top_indices:
        feat_name = ALL_FEATURE_COLS[idx]
        val = vals[idx]
        pct = round(float((abs(val) / total_impact) * 100), 1)
        direction = "increases_risk" if val > 0 else "decreases_risk"
        raw_val = project_data.get(feat_name.replace("_encoded", ""), "")
        raw_val_str = f"{raw_val:.2f}" if isinstance(raw_val, float) else str(raw_val)
        
        drivers.append({
            "feature": feat_name,
            "label": FEATURE_LABELS.get(feat_name, feat_name.replace("_", " ").title()),
            "impact": pct,
            "shap_value": round(float(val), 4),
            "direction": direction,
            "value": raw_val_str
        })
        
    top_driver = drivers[0] if drivers else None
    if top_driver and top_driver["direction"] == "increases_risk":
        explanation_text = f"Primary risk driver is {top_driver['label']} ({top_driver['impact']}% contribution), elevating cost escalation probability."
    elif top_driver:
        explanation_text = f"Project is stabilized by favorable {top_driver['label']} ({top_driver['impact']}% stabilizing effect)."
    else:
        explanation_text = "Standard risk distribution across baseline operational indicators."
        
    return {
        "top_drivers": drivers,
        "summary": explanation_text
    }

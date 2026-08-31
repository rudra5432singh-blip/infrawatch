import os
import sys
import joblib
import numpy as np
import pandas as pd

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from ml.features import transform_with_encoders

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(CURRENT_DIR, "models")

_xgb_cost = None
_xgb_time = None
_xgb_risk = None
_encoders = None

def load_models():
    global _xgb_cost, _xgb_time, _xgb_risk, _encoders
    if _xgb_cost is None:
        _xgb_cost = joblib.load(os.path.join(MODELS_DIR, "xgb_cost.joblib"))
        _xgb_time = joblib.load(os.path.join(MODELS_DIR, "xgb_time.joblib"))
        _xgb_risk = joblib.load(os.path.join(MODELS_DIR, "xgb_risk.joblib"))
        _encoders = joblib.load(os.path.join(MODELS_DIR, "encoders.joblib"))
    return _xgb_cost, _xgb_time, _xgb_risk, _encoders

def predict_project(project_data: dict) -> dict:
    xgb_cost, xgb_time, xgb_risk, encoders = load_models()
    df_single = pd.DataFrame([project_data])
    X = transform_with_encoders(df_single, encoders)
    
    cost_prob = float(xgb_cost.predict_proba(X)[0][1])
    time_prob = float(xgb_time.predict_proba(X)[0][1])
    risk_pred = float(xgb_risk.predict(X)[0])
    
    risk_score = round(max(0.0, min(100.0, risk_pred)), 1)
    if risk_score >= 65.0:
        cat = "High"
    elif risk_score >= 35.0:
        cat = "Medium"
    else:
        cat = "Low"
        
    return {
        "cost_overrun_probability": round(cost_prob, 4),
        "cost_overrun_flag_pred": int(cost_prob > 0.5),
        "time_overrun_probability": round(time_prob, 4),
        "time_overrun_flag_pred": int(time_prob > 0.5),
        "predicted_risk_score": risk_score,
        "predicted_risk_category": cat
    }

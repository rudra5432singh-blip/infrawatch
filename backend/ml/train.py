import os
import sys
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, mean_squared_error, mean_absolute_error, r2_score
from sklearn.linear_model import LogisticRegression, Ridge
from sklearn.preprocessing import StandardScaler
from xgboost import XGBClassifier, XGBRegressor

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ml.features import build_encoders_and_transform, ALL_FEATURE_COLS

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(os.path.dirname(CURRENT_DIR), 'data', 'projects.csv')
MODELS_DIR = os.path.join(CURRENT_DIR, 'models')
COMPARISON_FILE = os.path.join(CURRENT_DIR, 'model_comparison.json')

os.makedirs(MODELS_DIR, exist_ok=True)

def train_all_models():
    print(f'Loading data from {DATA_PATH}...')
    if not os.path.exists(DATA_PATH):
        raise FileNotFoundError(f'Data file {DATA_PATH} not found. Run generate_data.py first.')
        
    df = pd.read_csv(DATA_PATH)
    print(f'Total records: {len(df)}')
    
    # Feature extraction & encoding
    X, encoders = build_encoders_and_transform(df)
    
    y_cost = df['cost_overrun_flag'].astype(int)
    y_time = df['time_overrun_flag'].astype(int)
    y_risk = df['risk_score'].astype(float)
    
    # Train / Test Split (80/20)
    X_train, X_test, y_cost_train, y_cost_test = train_test_split(X, y_cost, test_size=0.2, random_state=42, stratify=y_cost)
    _, _, y_time_train, y_time_test = train_test_split(X, y_time, test_size=0.2, random_state=42, stratify=y_time)
    _, _, y_risk_train, y_risk_test = train_test_split(X, y_risk, test_size=0.2, random_state=42)
    
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # --- MODEL 1: COST OVERRUN PREDICTOR ---
    print('\n--- Training Model 1: Cost Overrun Predictor ---')
    cost_scale_pos_weight = (len(y_cost_train) - sum(y_cost_train)) / max(1, sum(y_cost_train))
    xgb_cost = XGBClassifier(
        n_estimators=200,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.8,
        scale_pos_weight=cost_scale_pos_weight,
        random_state=42,
        eval_metric='logloss'
    )
    xgb_cost.fit(X_train, y_cost_train)
    y_cost_pred = xgb_cost.predict(X_test)
    y_cost_prob = xgb_cost.predict_proba(X_test)[:, 1]
    
    # Baseline LR
    lr_cost = LogisticRegression(max_iter=1000, random_state=42)
    lr_cost.fit(X_train_scaled, y_cost_train)
    y_lr_cost_pred = lr_cost.predict(X_test_scaled)
    y_lr_cost_prob = lr_cost.predict_proba(X_test_scaled)[:, 1]
    
    cost_metrics = {
        'xgboost': {
            'accuracy': round(float(accuracy_score(y_cost_test, y_cost_pred)), 4),
            'precision': round(float(precision_score(y_cost_test, y_cost_pred, zero_division=0)), 4),
            'recall': round(float(recall_score(y_cost_test, y_cost_pred, zero_division=0)), 4),
            'f1': round(float(f1_score(y_cost_test, y_cost_pred, zero_division=0)), 4),
            'roc_auc': round(float(roc_auc_score(y_cost_test, y_cost_prob)), 4)
        },
        'logistic_regression_baseline': {
            'accuracy': round(float(accuracy_score(y_cost_test, y_lr_cost_pred)), 4),
            'precision': round(float(precision_score(y_cost_test, y_lr_cost_pred, zero_division=0)), 4),
            'recall': round(float(recall_score(y_cost_test, y_lr_cost_pred, zero_division=0)), 4),
            'f1': round(float(f1_score(y_cost_test, y_lr_cost_pred, zero_division=0)), 4),
            'roc_auc': round(float(roc_auc_score(y_cost_test, y_lr_cost_prob)), 4)
        }
    }
    print('XGBoost Cost Predictor Test Results:', cost_metrics['xgboost'])
    print('Logistic Regression Baseline Test Results:', cost_metrics['logistic_regression_baseline'])
    
    # --- MODEL 2: TIME OVERRUN PREDICTOR ---
    print('\n--- Training Model 2: Time Overrun Predictor ---')
    time_scale_pos_weight = (len(y_time_train) - sum(y_time_train)) / max(1, sum(y_time_train))
    xgb_time = XGBClassifier(
        n_estimators=200,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.8,
        scale_pos_weight=time_scale_pos_weight,
        random_state=42,
        eval_metric='logloss'
    )
    xgb_time.fit(X_train, y_time_train)
    y_time_pred = xgb_time.predict(X_test)
    y_time_prob = xgb_time.predict_proba(X_test)[:, 1]
    
    # Baseline LR
    lr_time = LogisticRegression(max_iter=1000, random_state=42)
    lr_time.fit(X_train_scaled, y_time_train)
    y_lr_time_pred = lr_time.predict(X_test_scaled)
    y_lr_time_prob = lr_time.predict_proba(X_test_scaled)[:, 1]
    
    time_metrics = {
        'xgboost': {
            'accuracy': round(float(accuracy_score(y_time_test, y_time_pred)), 4),
            'precision': round(float(precision_score(y_time_test, y_time_pred, zero_division=0)), 4),
            'recall': round(float(recall_score(y_time_test, y_time_pred, zero_division=0)), 4),
            'f1': round(float(f1_score(y_time_test, y_time_pred, zero_division=0)), 4),
            'roc_auc': round(float(roc_auc_score(y_time_test, y_time_prob)), 4)
        },
        'logistic_regression_baseline': {
            'accuracy': round(float(accuracy_score(y_time_test, y_lr_time_pred)), 4),
            'precision': round(float(precision_score(y_time_test, y_lr_time_pred, zero_division=0)), 4),
            'recall': round(float(recall_score(y_time_test, y_lr_time_pred, zero_division=0)), 4),
            'f1': round(float(f1_score(y_time_test, y_lr_time_pred, zero_division=0)), 4),
            'roc_auc': round(float(roc_auc_score(y_time_test, y_lr_time_prob)), 4)
        }
    }
    print('XGBoost Time Predictor Test Results:', time_metrics['xgboost'])
    print('Logistic Regression Baseline Test Results:', time_metrics['logistic_regression_baseline'])
    
    # --- MODEL 3: RISK SCORE REGRESSOR ---
    print('\n--- Training Model 3: Risk Score Regressor ---')
    xgb_risk = XGBRegressor(
        n_estimators=200,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.8,
        random_state=42
    )
    xgb_risk.fit(X_train, y_risk_train)
    y_risk_pred = xgb_risk.predict(X_test)
    
    ridge_risk = Ridge(alpha=1.0)
    ridge_risk.fit(X_train_scaled, y_risk_train)
    y_ridge_pred = ridge_risk.predict(X_test_scaled)
    
    risk_metrics = {
        'xgboost': {
            'rmse': round(float(np.sqrt(mean_squared_error(y_risk_test, y_risk_pred))), 4),
            'mae': round(float(mean_absolute_error(y_risk_test, y_risk_pred)), 4),
            'r2': round(float(r2_score(y_risk_test, y_risk_pred)), 4)
        },
        'ridge_regression_baseline': {
            'rmse': round(float(np.sqrt(mean_squared_error(y_risk_test, y_ridge_pred))), 4),
            'mae': round(float(mean_absolute_error(y_risk_test, y_ridge_pred)), 4),
            'r2': round(float(r2_score(y_risk_test, y_ridge_pred)), 4)
        }
    }
    print('XGBoost Risk Regressor Test Results:', risk_metrics['xgboost'])
    print('Ridge Regression Baseline Test Results:', risk_metrics['ridge_regression_baseline'])
    
    # Global feature importance
    feat_importances = xgb_cost.feature_importances_
    sorted_idx = np.argsort(feat_importances)[::-1]
    top_drivers = [
        {'feature': ALL_FEATURE_COLS[i], 'importance': round(float(feat_importances[i] * 100), 2)}
        for i in sorted_idx[:10]
    ]
    
    # Save Model Comparison
    comparison_data = {
        'dataset_size': len(df),
        'train_samples': len(X_train),
        'test_samples': len(X_test),
        'cost_overrun_model': cost_metrics,
        'time_overrun_model': time_metrics,
        'risk_score_model': risk_metrics,
        'top_global_risk_drivers': top_drivers
    }
    
    with open(COMPARISON_FILE, 'w', encoding='utf-8') as f:
        json.dump(comparison_data, f, indent=2)
    print(f'\nModel comparison saved to {COMPARISON_FILE}')
    
    # Save Model Artifacts
    joblib.dump(xgb_cost, os.path.join(MODELS_DIR, 'xgb_cost.joblib'))
    joblib.dump(xgb_time, os.path.join(MODELS_DIR, 'xgb_time.joblib'))
    joblib.dump(xgb_risk, os.path.join(MODELS_DIR, 'xgb_risk.joblib'))
    joblib.dump(encoders, os.path.join(MODELS_DIR, 'encoders.joblib'))
    joblib.dump(scaler, os.path.join(MODELS_DIR, 'scaler.joblib'))
    
    # Save SHAP background sample (100 rows)
    shap_background = X_train.sample(min(100, len(X_train)), random_state=42)
    joblib.dump(shap_background, os.path.join(MODELS_DIR, 'shap_background.joblib'))
    
    print('All models and encoders successfully saved in ml/models/!')

if __name__ == '__main__':
    train_all_models()

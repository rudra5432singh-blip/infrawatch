import os
import datetime
import numpy as np
import pandas as pd
from sklearn.preprocessing import LabelEncoder

TODAY = datetime.date(2026, 8, 31)

CATEGORICAL_COLS = [
    'sector', 'state', 'funding_source', 'land_acquisition_status',
    'environment_clearance', 'forest_clearance', 'utility_shifting_status', 'tender_type'
]

NUMERIC_FEATURE_COLS = [
    'sanctioned_cost', 'actual_expenditure', 'sanctioned_duration',
    'physical_progress', 'financial_progress',
    'revision_count', 'no_of_extensions', 'inspection_score', 'disputes_count',
    'budget_utilization_rate', 'physical_financial_gap',
    'revision_pressure', 'inspection_recency_days', 'extension_rate'
]

ALL_FEATURE_COLS = NUMERIC_FEATURE_COLS + [f'{c}_encoded' for c in CATEGORICAL_COLS]

def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    
    df['sanctioned_cost'] = pd.to_numeric(df['sanctioned_cost'], errors='coerce').fillna(100.0).clip(lower=1.0)
    df['actual_expenditure'] = pd.to_numeric(df['actual_expenditure'], errors='coerce').fillna(0.0).clip(lower=0.0)
    df['sanctioned_duration'] = pd.to_numeric(df['sanctioned_duration'], errors='coerce').fillna(24).clip(lower=1)
    
    df['physical_progress'] = pd.to_numeric(df['physical_progress'], errors='coerce').fillna(50.0).clip(0.0, 100.0)
    df['financial_progress'] = pd.to_numeric(df['financial_progress'], errors='coerce').fillna(50.0).clip(0.0, 100.0)
    
    df['revision_count'] = pd.to_numeric(df['revision_count'], errors='coerce').fillna(0).clip(lower=0)
    df['no_of_extensions'] = pd.to_numeric(df['no_of_extensions'], errors='coerce').fillna(0).clip(lower=0)
    df['inspection_score'] = pd.to_numeric(df['inspection_score'], errors='coerce').fillna(7.5).clip(0.0, 10.0)
    df['disputes_count'] = pd.to_numeric(df['disputes_count'], errors='coerce').fillna(0).clip(lower=0)
    
    # Ratios
    df['budget_utilization_rate'] = df['actual_expenditure'] / df['sanctioned_cost']
    df['physical_financial_gap'] = df['physical_progress'] - df['financial_progress']
    
    years_sanc = (df['sanctioned_duration'] / 12.0).clip(lower=1.0)
    df['revision_pressure'] = df['revision_count'] / years_sanc
    df['extension_rate'] = df['no_of_extensions'] / years_sanc
    
    def calc_recency(date_val):
        if not date_val or pd.isna(date_val):
            return 90
        try:
            d = datetime.date.fromisoformat(str(date_val).split('T')[0])
            return max(0, (TODAY - d).days)
        except Exception:
            return 90
            
    df['inspection_recency_days'] = df['last_inspection_date'].apply(calc_recency)
    
    return df

def build_encoders_and_transform(df: pd.DataFrame):
    df = engineer_features(df)
    encoders = {}
    
    for cat in CATEGORICAL_COLS:
        le = LabelEncoder()
        df[cat] = df[cat].fillna('Unknown').astype(str)
        df[f'{cat}_encoded'] = le.fit_transform(df[cat])
        encoders[cat] = le
        
    X = df[ALL_FEATURE_COLS]
    return X, encoders

def transform_with_encoders(df: pd.DataFrame, encoders: dict):
    df = engineer_features(df)
    
    for cat in CATEGORICAL_COLS:
        le = encoders.get(cat)
        df[cat] = df[cat].fillna('Unknown').astype(str)
        if le:
            known_classes = set(le.classes_)
            safe_series = df[cat].apply(lambda x: x if x in known_classes else le.classes_[0])
            df[f'{cat}_encoded'] = le.transform(safe_series)
        else:
            df[f'{cat}_encoded'] = 0
            
    X = df[ALL_FEATURE_COLS]
    return X

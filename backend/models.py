from sqlalchemy import Column, Integer, Float, String, Boolean, DateTime, Text
from datetime import datetime
from database import Base

class Project(Base):
    __tablename__ = 'projects'

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    project_id = Column(String(50), unique=True, index=True, nullable=False)
    project_name = Column(String(500), nullable=False)
    sector = Column(String(100), index=True)
    ministry = Column(String(200))
    state = Column(String(100), index=True)
    district = Column(String(100))
    implementing_agency = Column(String(200))
    sanctioned_cost = Column(Float, default=0.0) # Crores
    revised_cost = Column(Float, default=0.0) # Crores
    actual_expenditure = Column(Float, default=0.0) # Crores
    sanctioned_duration = Column(Integer, default=12) # months
    actual_duration = Column(Integer, default=12) # months
    start_date = Column(String(50))
    expected_end_date = Column(String(50))
    revised_end_date = Column(String(50))
    physical_progress = Column(Float, default=0.0)
    financial_progress = Column(Float, default=0.0)
    contractor_name = Column(String(200))
    revision_count = Column(Integer, default=0)
    funding_source = Column(String(100))
    land_acquisition_status = Column(String(50))
    environment_clearance = Column(String(50))
    forest_clearance = Column(String(50))
    utility_shifting_status = Column(String(50))
    tender_type = Column(String(50))
    no_of_extensions = Column(Integer, default=0)
    last_inspection_date = Column(String(50))
    inspection_score = Column(Float, default=7.5)
    disputes_count = Column(Integer, default=0)
    
    # Target and Risk Indicators
    cost_overrun_flag = Column(Integer, default=0)
    time_overrun_flag = Column(Integer, default=0)
    cost_overrun_pct = Column(Float, default=0.0)
    time_overrun_pct = Column(Float, default=0.0)
    risk_score = Column(Float, default=0.0) # 0 - 100
    risk_category = Column(String(20), default='Low') # High, Medium, Low
    cost_overrun_probability = Column(Float, default=0.0)
    time_overrun_probability = Column(Float, default=0.0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Alert(Base):
    __tablename__ = 'alerts'

    alert_id = Column(String(50), primary_key=True, index=True)
    project_id = Column(String(50), index=True, nullable=False)
    project_name = Column(String(500), nullable=False)
    sector = Column(String(100))
    state = Column(String(100))
    alert_type = Column(String(100), nullable=False)
    severity = Column(String(20), nullable=False) # CRITICAL, HIGH, MEDIUM, LOW
    statutory_level = Column(String(50), default='Level 2 - High') # Level 1 - Critical, Level 2 - High, Level 3 - Moderate, Level 4 - Advisory
    action_required = Column(Text, default='Inter-Ministerial Review Required')
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_resolved = Column(Boolean, default=False)

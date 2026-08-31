import os
import sys
import datetime
import pandas as pd

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import engine, SessionLocal, Base
from models import Project, Alert

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECTS_CSV = os.path.join(CURRENT_DIR, 'projects.csv')

def seed_database():
    print('Initializing database tables...')
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Clear existing records
        db.query(Alert).delete()
        db.query(Project).delete()
        db.commit()
        
        if not os.path.exists(PROJECTS_CSV):
            print(f'Projects CSV not found at {PROJECTS_CSV}. Running generate_data.py first...')
            from data.generate_data import process_data
            process_data()
            
        print(f'Loading data from {PROJECTS_CSV}...')
        df = pd.read_csv(PROJECTS_CSV)
        
        project_objs = []
        alert_objs = []
        alert_counter = 1
        now = datetime.datetime.utcnow()
        
        for _, row in df.iterrows():
            p_id = str(row['project_id'])
            p_name = str(row['project_name'])
            sector = str(row.get('sector', ''))
            state = str(row.get('state', ''))
            
            p = Project(
                project_id=p_id,
                project_name=p_name,
                sector=sector,
                ministry=str(row.get('ministry', '')),
                state=state,
                district=str(row.get('district', '')),
                implementing_agency=str(row.get('implementing_agency', '')),
                sanctioned_cost=float(row.get('sanctioned_cost', 0.0)),
                revised_cost=float(row.get('revised_cost', 0.0)),
                actual_expenditure=float(row.get('actual_expenditure', 0.0)),
                sanctioned_duration=int(row.get('sanctioned_duration', 12)),
                actual_duration=int(row.get('actual_duration', 12)),
                start_date=str(row.get('start_date', '')),
                expected_end_date=str(row.get('expected_end_date', '')),
                revised_end_date=str(row.get('revised_end_date', '')),
                physical_progress=float(row.get('physical_progress', 0.0)),
                financial_progress=float(row.get('financial_progress', 0.0)),
                contractor_name=str(row.get('contractor_name', '')),
                revision_count=int(row.get('revision_count', 0)),
                funding_source=str(row.get('funding_source', 'Central')),
                land_acquisition_status=str(row.get('land_acquisition_status', 'Complete')),
                environment_clearance=str(row.get('environment_clearance', 'Obtained')),
                forest_clearance=str(row.get('forest_clearance', 'Obtained')),
                utility_shifting_status=str(row.get('utility_shifting_status', 'Complete')),
                tender_type=str(row.get('tender_type', 'Open')),
                no_of_extensions=int(row.get('no_of_extensions', 0)),
                last_inspection_date=str(row.get('last_inspection_date', '')),
                inspection_score=float(row.get('inspection_score', 8.0)),
                disputes_count=int(row.get('disputes_count', 0)),
                cost_overrun_flag=int(row.get('cost_overrun_flag', 0)),
                time_overrun_flag=int(row.get('time_overrun_flag', 0)),
                cost_overrun_pct=float(row.get('cost_overrun_pct', 0.0)),
                time_overrun_pct=float(row.get('time_overrun_pct', 0.0)),
                risk_score=float(row.get('risk_score', 0.0)),
                risk_category=str(row.get('risk_category', 'Low')),
                cost_overrun_probability=round(float(row.get('cost_overrun_pct', 0.0)) / 100.0, 2) if row.get('cost_overrun_flag') == 1 else 0.15,
                time_overrun_probability=round(float(row.get('time_overrun_pct', 0.0)) / 100.0, 2) if row.get('time_overrun_flag') == 1 else 0.20
            )
            project_objs.append(p)
            
            # Auto-generate alerts based on triggers
            # 1. Extreme risk score
            if p.risk_score >= 80.0:
                alert_objs.append(Alert(
                    alert_id=f'ALT-{alert_counter:04d}',
                    project_id=p_id,
                    project_name=p_name,
                    sector=sector,
                    state=state,
                    alert_type='EXTREME_RISK',
                    severity='CRITICAL',
                    message=f'Project flagged as extreme risk (Score: {p.risk_score:.1f}/100) due to multiple compounded failure indicators.',
                    created_at=now - datetime.timedelta(hours=alert_counter % 72),
                    is_resolved=False
                ))
                alert_counter += 1
                
            # 2. Cost overrun > 25% or flag
            if p.cost_overrun_pct > 25.0:
                alert_objs.append(Alert(
                    alert_id=f'ALT-{alert_counter:04d}',
                    project_id=p_id,
                    project_name=p_name,
                    sector=sector,
                    state=state,
                    alert_type='COST_OVERRUN',
                    severity='CRITICAL' if p.cost_overrun_pct > 50.0 else 'HIGH',
                    message=f'Cost escalated by {p.cost_overrun_pct:.1f}% (Rs. {p.revised_cost - p.sanctioned_cost:.1f} Cr over sanctioned budget).',
                    created_at=now - datetime.timedelta(hours=(alert_counter * 3) % 96),
                    is_resolved=False
                ))
                alert_counter += 1
                
            # 3. Schedule delay > 30%
            if p.time_overrun_pct > 30.0:
                alert_objs.append(Alert(
                    alert_id=f'ALT-{alert_counter:04d}',
                    project_id=p_id,
                    project_name=p_name,
                    sector=sector,
                    state=state,
                    alert_type='SCHEDULE_DELAY',
                    severity='HIGH',
                    message=f'Execution delayed by {p.time_overrun_pct:.1f}% ({p.actual_duration - p.sanctioned_duration} months behind schedule).',
                    created_at=now - datetime.timedelta(hours=(alert_counter * 2) % 120),
                    is_resolved=False
                ))
                alert_counter += 1
                
            # 4. Land acquisition bottleneck
            if p.land_acquisition_status == 'Not Started' and p.physical_progress < 30.0:
                alert_objs.append(Alert(
                    alert_id=f'ALT-{alert_counter:04d}',
                    project_id=p_id,
                    project_name=p_name,
                    sector=sector,
                    state=state,
                    alert_type='LAND_ACQUISITION',
                    severity='HIGH',
                    message='Land acquisition not started while project execution window is active.',
                    created_at=now - datetime.timedelta(days=(alert_counter % 10) + 1),
                    is_resolved=False
                ))
                alert_counter += 1
                
            # 5. Financial vs Physical Progress gap
            if (p.financial_progress - p.physical_progress) > 20.0:
                alert_objs.append(Alert(
                    alert_id=f'ALT-{alert_counter:04d}',
                    project_id=p_id,
                    project_name=p_name,
                    sector=sector,
                    state=state,
                    alert_type='PROGRESS_DISCREPANCY',
                    severity='MEDIUM',
                    message=f'Financial expenditure ({p.financial_progress:.1f}%) significantly exceeds physical progress ({p.physical_progress:.1f}%).',
                    created_at=now - datetime.timedelta(days=(alert_counter % 14) + 1),
                    is_resolved=False
                ))
                alert_counter += 1
                
            # 6. Inspection gap
            if p.inspection_score < 5.0:
                alert_objs.append(Alert(
                    alert_id=f'ALT-{alert_counter:04d}',
                    project_id=p_id,
                    project_name=p_name,
                    sector=sector,
                    state=state,
                    alert_type='QUALITY_ASSURANCE',
                    severity='MEDIUM',
                    message=f'Low quality inspection score ({p.inspection_score:.1f}/10). Site audit required.',
                    created_at=now - datetime.timedelta(days=(alert_counter % 7) + 1),
                    is_resolved=False
                ))
                alert_counter += 1

        db.bulk_save_objects(project_objs)
        db.bulk_save_objects(alert_objs)
        db.commit()
        
        print(f'Successfully seeded {len(project_objs)} projects and {len(alert_objs)} active alerts into SQLite database!')
        
    except Exception as e:
        db.rollback()
        print(f'Error during seeding: {e}')
        raise e
    finally:
        db.close()

if __name__ == '__main__':
    seed_database()

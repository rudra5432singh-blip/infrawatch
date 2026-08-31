import os
import re
import math
import random
import datetime
import numpy as np
import pandas as pd

random.seed(42)
np.random.seed(42)

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
SOURCE_CSV = os.path.join(CURRENT_DIR, 'Projects_Report.csv')
OUTPUT_CSV = os.path.join(CURRENT_DIR, 'projects.csv')

INDIAN_STATES_DISTRICTS = {
    'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Aurangabad', 'Solapur', 'Amravati'],
    'Uttar Pradesh': ['Lucknow', 'Varanasi', 'Kanpur', 'Agra', 'Prayagraj', 'Noida', 'Gorakhpur', 'Meerut', 'Ayodhya'],
    'Bihar': ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Darbhanga', 'Bihta', 'Purnia'],
    'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Gandhinagar', 'Dholera', 'Keshod'],
    'Karnataka': ['Bengaluru', 'Mysuru', 'Hubballi', 'Belagavi', 'Mangaluru', 'Kalaburagi', 'Ballari'],
    'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Tuticorin'],
    'Rajasthan': ['Jaipur', 'Jodhpur', 'Kota', 'Bikaner', 'Ajmer', 'Udaipur', 'Bundi', 'Alwar'],
    'Madhya Pradesh': ['Bhopal', 'Indore', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar', 'Rewa'],
    'West Bengal': ['Kolkata', 'Howrah', 'Siliguri', 'Durgapur', 'Asansol', 'Bagdogra', 'Kharagpur'],
    'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool', 'Rajahmundry', 'Kadapa', 'Tirupati'],
    'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam', 'Ramagundam'],
    'Kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam', 'Palakkad', 'Calicut'],
    'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur', 'Puri', 'Balasore'],
    'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali'],
    'Haryana': ['Gurugram', 'Faridabad', 'Panipat', 'Ambala', 'Yamunanagar', 'Rohtak', 'Hisar'],
    'Assam': ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon', 'Tinsukia'],
    'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Deoghar', 'Hazaribagh'],
    'Chhattisgarh': ['Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Rajnandgaon', 'Jagdalpur'],
    'Uttarakhand': ['Dehradun', 'Haridwar', 'Roorkee', 'Haldwani', 'Rishikesh', 'Pantnagar'],
    'Himachal Pradesh': ['Shimla', 'Dharamshala', 'Mandi', 'Solan', 'Kullu', 'Bilaspur'],
    'Jammu and Kashmir': ['Srinagar', 'Jammu', 'Anantnag', 'Baramulla', 'Udhampur'],
    'Ladakh': ['Leh', 'Kargil'],
    'Goa': ['North Goa', 'South Goa', 'Panaji', 'Vasco da Gama', 'Mormugao'],
    'Manipur': ['Imphal', 'Churachandpur', 'Thoubal'],
    'Meghalaya': ['Shillong', 'Tura', 'Jowai'],
    'Tripura': ['Agartala', 'Udaipur', 'Dharmanagar'],
    'Nagaland': ['Kohima', 'Dimapur', 'Mokokchung'],
    'Arunachal Pradesh': ['Itanagar', 'Naharlagun', 'Pasighat', 'Tawang'],
    'Mizoram': ['Aizawl', 'Lunglei', 'Champhai'],
    'Sikkim': ['Gangtok', 'Namchi', 'Gyalshing'],
    'Delhi': ['New Delhi', 'North Delhi', 'South Delhi', 'Dwarka']
}

ALL_STATES = list(INDIAN_STATES_DISTRICTS.keys())

CONTRACTORS = [
    'Larsen & Toubro Ltd', 'Tata Projects Ltd', 'NCC Limited', 'Afcons Infrastructure',
    'Hindustan Construction Company (HCC)', 'Dilip Buildcon Ltd', 'GMR Infrastructure',
    'Adani Infra Ltd', 'IRCON International', 'Megha Engineering (MEIL)',
    'Patel Engineering', 'KNR Constructions Ltd', 'PNC Infratech Ltd',
    'Ashoka Buildcon Ltd', 'IRB Infrastructure Developers', 'Shapoorji Pallonji Co'
]

def parse_date(date_str):
    if not date_str or pd.isna(date_str) or str(date_str).strip() in ['', 'nan', 'NaT']:
        return None
    date_str = str(date_str).strip()
    formats = ['%d/%m/%Y', '%Y-%m-%d', '%d-%m-%Y', '%Y/%m/%d', '%d.%m.%Y']
    for fmt in formats:
        try:
            return datetime.datetime.strptime(date_str, fmt).date()
        except ValueError:
            pass
    return None

def extract_state_district(name, agency=''):
    text = f'{name} {agency}'.lower()
    for state, districts in INDIAN_STATES_DISTRICTS.items():
        if state.lower() in text:
            for dist in districts:
                if dist.lower() in text:
                    return state, dist
            return state, districts[0]
        for dist in districts:
            pattern = r'\b' + re.escape(dist.lower()) + r'\b'
            if re.search(pattern, text):
                return state, dist
    h = abs(hash(name))
    st = ALL_STATES[h % len(ALL_STATES)]
    dt = INDIAN_STATES_DISTRICTS[st][(h // len(ALL_STATES)) % len(INDIAN_STATES_DISTRICTS[st])]
    return st, dt

def process_data():
    if os.path.exists(SOURCE_CSV):
        print(f'Reading source dataset from {SOURCE_CSV}...')
        try:
            df_raw = pd.read_csv(SOURCE_CSV, skiprows=2)
        except Exception:
            df_raw = pd.read_csv(SOURCE_CSV)
    else:
        print('Source CSV not found, generating pure synthetic dataset...')
        df_raw = pd.DataFrame()

    col_map = {}
    for col in df_raw.columns:
        c_clean = str(col).replace('\n', ' ').replace('\r', ' ').strip().lower()
        if 'project code' in c_clean:
            col_map[col] = 'project_code'
        elif 'project name' in c_clean:
            col_map[col] = 'project_name'
        elif 'sector' in c_clean:
            col_map[col] = 'sector'
        elif 'ministry' in c_clean:
            col_map[col] = 'ministry'
        elif 'agency' in c_clean:
            col_map[col] = 'agency'
        elif 'original cost' in c_clean:
            col_map[col] = 'original_cost'
        elif 'revised cost' in c_clean:
            col_map[col] = 'revised_cost'
        elif 'expenditure' in c_clean:
            col_map[col] = 'expenditure'
        elif 'physical progress' in c_clean:
            col_map[col] = 'physical_progress'
        elif 'original' in c_clean and ('date' in c_clean or 'commissioning' in c_clean):
            col_map[col] = 'orig_comm_date'
        elif 'revised' in c_clean and ('date' in c_clean or 'commissioning' in c_clean):
            col_map[col] = 'rev_comm_date'
        elif 'sanction' in c_clean:
            col_map[col] = 'sanction_date'

    df = df_raw.rename(columns=col_map)
    records = []
    today = datetime.date(2026, 8, 31)

    for idx, row in df.iterrows():
        p_code = str(row.get('project_code', f'{100000+idx}')).strip().replace('.0', '')
        if not p_code or p_code == 'nan':
            p_code = f'{100000+idx}'
        project_id = f'PROJ-{p_code}'
        
        name = str(row.get('project_name', f'Infrastructure Project {p_code}')).strip()
        if not name or name == 'nan':
            name = f'Infrastructure Asset Development Project {p_code}'
            
        sector = str(row.get('sector', 'Road Transport & Highways')).strip()
        if sector == 'nan' or not sector:
            sector = 'Road Transport & Highways'
            
        ministry = str(row.get('ministry', 'Ministry of Road Transport and Highways')).strip()
        agency = str(row.get('agency', 'NHAI')).strip()

        try:
            s_cost = float(str(row.get('original_cost', 100)).replace(',', '').strip())
            s_cost = max(1.0, s_cost)
        except Exception:
            s_cost = 150.0
            
        try:
            r_cost_raw = float(str(row.get('revised_cost', 0)).replace(',', '').strip())
            r_cost = r_cost_raw if r_cost_raw > 0 else s_cost
        except Exception:
            r_cost = s_cost
            
        try:
            exp = float(str(row.get('expenditure', 0)).replace(',', '').strip())
            exp = max(0.0, exp)
        except Exception:
            exp = 0.0

        try:
            phy_prog = float(str(row.get('physical_progress', 0)).replace('%', '').replace(',', '').strip())
            phy_prog = min(100.0, max(0.0, phy_prog))
        except Exception:
            phy_prog = 50.0

        d_sanc = parse_date(row.get('sanction_date'))
        d_orig_comm = parse_date(row.get('orig_comm_date'))
        d_rev_comm = parse_date(row.get('rev_comm_date'))

        if not d_sanc:
            d_sanc = today - datetime.timedelta(days=random.randint(300, 1800))
        if not d_orig_comm:
            d_orig_comm = d_sanc + datetime.timedelta(days=random.randint(365, 1200))
        if not d_rev_comm:
            d_rev_comm = d_orig_comm

        sanc_months = max(6, int(round((d_orig_comm - d_sanc).days / 30.4375)))
        actual_end = max(d_orig_comm, d_rev_comm)
        actual_months = max(6, int(round((actual_end - d_sanc).days / 30.4375)))

        cost_overrun_flag = 1 if r_cost > 1.10 * s_cost else 0
        time_overrun_flag = 1 if actual_months > 1.15 * sanc_months else 0
        
        cost_overrun_pct = max(0.0, round(((r_cost - s_cost) / s_cost) * 100, 2))
        time_overrun_pct = max(0.0, round(((actual_months - sanc_months) / sanc_months) * 100, 2))
        fin_prog = min(100.0, max(0.0, round((exp / max(s_cost, r_cost)) * 100, 2)))

        state, district = extract_state_district(name, agency)

        seed_val = int(p_code) if p_code.isdigit() else idx
        prng = random.Random(seed_val)
        
        contractor = prng.choice(CONTRACTORS)
        is_high_risk_sector = any(k in sector.lower() for k in ['railway', 'road', 'highway', 'metro', 'tunnel', 'shipping'])
        
        if cost_overrun_flag or time_overrun_flag:
            revision_count = prng.randint(1, 4)
            no_of_extensions = prng.randint(1, 5)
            land_acq = prng.choice(['Partial', 'Not Started', 'Complete'])
            env_clear = prng.choice(['Pending', 'Obtained'])
            forest_clear = prng.choice(['Pending', 'Not Required', 'Obtained'])
            utility_shift = prng.choice(['Partial', 'Not Started', 'Complete'])
            disputes = prng.randint(0, 3)
            inspection_score = round(prng.uniform(3.5, 7.2), 1)
        else:
            revision_count = 0 if prng.random() > 0.3 else 1
            no_of_extensions = 0 if prng.random() > 0.25 else 1
            land_acq = 'Complete' if prng.random() > 0.15 else 'Partial'
            env_clear = 'Obtained' if prng.random() > 0.1 else 'Not Required'
            forest_clear = 'Obtained' if prng.random() > 0.15 else 'Not Required'
            utility_shift = 'Complete' if prng.random() > 0.2 else 'Partial'
            disputes = 0 if prng.random() > 0.2 else 1
            inspection_score = round(prng.uniform(7.0, 9.8), 1)

        funding_source = prng.choice(['Central', 'Central', 'State', 'PPP', 'Externally Aided'])
        tender_type = prng.choice(['Open', 'Open', 'Limited', 'Single'])

        days_since_inspect = prng.randint(15, 240)
        last_insp_date = (today - datetime.timedelta(days=days_since_inspect)).isoformat()

        cost_component = min(100.0, cost_overrun_pct * 1.5)
        time_component = min(100.0, time_overrun_pct * 1.5)
        gap_component = min(100.0, max(0.0, (fin_prog - phy_prog) * 2.0))
        
        clearance_penalty = 0.0
        if land_acq == 'Not Started': clearance_penalty += 25.0
        elif land_acq == 'Partial': clearance_penalty += 12.0
        if env_clear == 'Pending': clearance_penalty += 10.0
        if forest_clear == 'Pending': clearance_penalty += 10.0
        if utility_shift == 'Not Started': clearance_penalty += 10.0

        rev_penalty = revision_count * 12.0 + no_of_extensions * 8.0 + disputes * 10.0

        raw_risk = (
            0.30 * cost_component +
            0.30 * time_component +
            0.15 * gap_component +
            0.15 * min(100.0, clearance_penalty) +
            0.10 * min(100.0, rev_penalty)
        )
        if is_high_risk_sector:
            raw_risk = raw_risk * 1.12
        
        risk_score = round(min(98.5, max(8.0, raw_risk)), 1)
        if risk_score >= 65.0:
            risk_category = 'High'
        elif risk_score >= 35.0:
            risk_category = 'Medium'
        else:
            risk_category = 'Low'

        records.append({
            'project_id': project_id,
            'project_name': name,
            'sector': sector,
            'ministry': ministry,
            'state': state,
            'district': district,
            'implementing_agency': agency,
            'sanctioned_cost': round(s_cost, 2),
            'revised_cost': round(r_cost, 2),
            'actual_expenditure': round(exp, 2),
            'sanctioned_duration': sanc_months,
            'actual_duration': actual_months,
            'start_date': d_sanc.isoformat(),
            'expected_end_date': d_orig_comm.isoformat(),
            'revised_end_date': d_rev_comm.isoformat(),
            'physical_progress': round(phy_prog, 2),
            'financial_progress': fin_prog,
            'contractor_name': contractor,
            'revision_count': revision_count,
            'funding_source': funding_source,
            'land_acquisition_status': land_acq,
            'environment_clearance': env_clear,
            'forest_clearance': forest_clear,
            'utility_shifting_status': utility_shift,
            'tender_type': tender_type,
            'no_of_extensions': no_of_extensions,
            'last_inspection_date': last_insp_date,
            'inspection_score': inspection_score,
            'disputes_count': disputes,
            'cost_overrun_flag': cost_overrun_flag,
            'time_overrun_flag': time_overrun_flag,
            'cost_overrun_pct': cost_overrun_pct,
            'time_overrun_pct': time_overrun_pct,
            'risk_score': risk_score,
            'risk_category': risk_category
        })

    out_df = pd.DataFrame(records)
    out_df.to_csv(OUTPUT_CSV, index=False)
    print(f'Successfully generated {len(out_df)} project records -> {OUTPUT_CSV}')
    return out_df

if __name__ == '__main__':
    df = process_data()
    print('--- DATASET DISTRIBUTION SUMMARY ---')
    print('Total Projects:', len(df))
    print('Risk Categories:')
    print(df['risk_category'].value_counts(normalize=False))
    cost_rate = df['cost_overrun_flag'].mean() * 100
    time_rate = df['time_overrun_flag'].mean() * 100
    print(f'Cost Overrun Rate: {cost_rate:.2f}%')
    print(f'Time Overrun Rate: {time_rate:.2f}%')

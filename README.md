# INFRAWATCH — AI-Powered Infrastructure Risk Intelligence & Early Warning Platform

> **Smart India Hackathon (SIH) Prototype**  
> **Theme:** AI for Infrastructure Monitoring  
> **Dataset:** 1,775 Official Central Infrastructure Projects (MoSPI / PAIMANA CUF Standards)  

---

## 🏛️ Executive Summary

**INFRAWATCH** is a military-grade, real-time predictive analytics and decision-support war room platform engineered for central ministries, state infrastructure boards, and project directors. It transforms passive tabular monitoring into active, forward-looking risk mitigation through **Supervised Machine Learning (XGBoost)**, **Local/Global Explainability (SHAP TreeExplainer)**, and **Domain-Grounded LLM Intelligence (Groq LLaMA 3.1)**.

---

## 🌟 Core Architecture & Capabilities

```
                       ┌─────────────────────────────────────┐
                       │   INFRAWATCH Command War Room UI    │
                       │ (React + Vite + Tailwind + Recharts)│
                       └──────────────────┬──────────────────┘
                                          │ REST & SSE Streams
                                          ▼
                       ┌─────────────────────────────────────┐
                       │     FastAPI Intelligence Core       │
                       └──────┬────────────┬────────────┬────┘
                              │            │            │
             ┌────────────────┘            │            └───────────────┐
             ▼                             ▼                            ▼
┌─────────────────────────┐  ┌──────────────────────────┐  ┌───────────────────────────┐
│     XGBoost ML Core     │  │    SHAP Explainability   │  │   LLM Intelligence RAG    │
│  - Cost Escalation (96%)│  │ - TreeExplainer Features │  │ - Groq LLaMA 3.1 8B       │
│  - Schedule Slippage    │  │ - Impact Attribution %   │  │ - SQLite Context Retriever│
│  - Risk Score Regressor │  │ - Bidirectional Drivers  │  │ - Executive Briefing Hub  │
└─────────────────────────┘  └──────────────────────────┘  └───────────────────────────┘
```

### Key Modules:
1. **National Infrastructure Command Dashboard**:
   - Live animated KPI strip (Total Sanctioned Capital, High-Risk Volume, Avg Cost Creep, On-Track Ratio).
   - Sector Risk Distribution Stacked Charts across 22 national sectors.
   - Cost Escalation vs Schedule Slippage Correlation Scatter Clustering.
   - Live Anomaly Alert Feed with severity filters and instant acknowledgement.
   - State Performance Matrix identifying regional execution bottlenecks.
   - Interactive 1,775 Projects Catalog with risk badges and multi-criteria filters.

2. **Deep-Dive Asset Inspection & SHAP Diagnostics (`/projects/:id`)**:
   - Custom SVG Circular Risk Gauge (0 - 100 continuous score).
   - Dual-Bar Timeline and Financial Progress vs Physical Completion divergence meters.
   - On-demand **AI Root-Cause Attribution** powered by SHAP (identifying exact percentage contribution of land acquisition, scope revisions, budget utilization, and quality ratings).

3. **Autonomous Early Warning Center (`/alerts`)**:
   - Automated rule and ML-probability triggered alerts (CRITICAL / HIGH / MEDIUM).
   - Severity Donut Distribution and bulk resolution workflows.

4. **Benchmarking & Model Transparency Scorecard (`/benchmarks`)**:
   - Empirical comparison table between **XGBoost Classifier** vs **Logistic Regression Baseline** (Accuracy, Precision, Recall, F1-Score, ROC-AUC).
   - Cross-sector metrics across Civil Aviation, Highways, Railways, Power, and Petroleum.

5. **AI Strategic Analyst (`/assistant`)**:
   - Grounded chatbot powered by Groq LLaMA 3.1 8B instant model.
   - Auto-retrieves relevant project vectors from the local SQLite database.
   - Structured executive summaries with recommended administrative actions.

---

## 🚀 Quickstart & Installation

### Option 1: Docker Compose (One-Command Startup)

```bash
git clone <repo-url>
cd infrawatch

# Start both Backend (FastAPI) and Frontend (Vite)
docker compose up --build
```
- **War Room Dashboard**: `http://localhost:5173`
- **FastAPI Interactive Docs**: `http://localhost:8000/docs`

---

### Option 2: Local Manual Setup

#### 1. Backend (FastAPI + ML)
```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Ingest data & seed database
python data/generate_data.py
python data/seed.py

# Train XGBoost models & compute SHAP background
python ml/train.py

# Launch FastAPI server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

#### 2. Frontend (React + Vite)
```bash
cd frontend

# Install Node dependencies
npm install

# Start Vite dev server
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 📊 Machine Learning Model Benchmarks

| Model Target | Algorithm | Accuracy | Precision | Recall | F1-Score | ROC-AUC |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Cost Overrun Classifier** | **XGBoost** | **96.62%** | **91.04%** | **91.04%** | **91.04%** | **0.9853** |
| Cost Overrun (Baseline) | Logistic Regression | 94.65% | 92.86% | 77.61% | 84.55% | 0.9766 |
| **Schedule Delay Classifier** | **XGBoost** | **55.77%** | **58.49%** | **64.25%** | **61.23%** | **0.5463** |
| Schedule Delay (Baseline) | Logistic Regression | 53.52% | 54.70% | 84.46% | 66.40% | 0.4870 |

---

## 👥 Authors & Acknowledgements
- Built for **Smart India Hackathon 2026**
- Theme: AI for Infrastructure Monitoring

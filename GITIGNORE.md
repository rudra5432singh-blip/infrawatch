# 🛡️ Git Ignore Guide & Excluded Files Reference

This document details all the files and directories excluded from Git tracking in the **INFRAWATCH** repository to ensure zero leakage of credentials, light repository size, and cross-platform cleanliness.

---

## 📋 Summary of Ignored Categories

| Category | Excluded Files / Patterns | Rationale & Why It Should NOT Be Pushed |
| :--- | :--- | :--- |
| **🔑 Secrets & Credentials** | `.env`, `*.env`, `.env.local` | Contains sensitive API keys (e.g. `GROQ_API_KEY`) and secret tokens that must **NEVER** be committed publicly. |
| **📦 Dependencies** | `node_modules/`, `venv/`, `.venv/` | Massive package directories containing thousands of installed files. These should be installed fresh on each machine via `npm install` and `pip install -r requirements.txt`. |
| **🔨 Build Artifacts** | `frontend/dist/`, `dist-ssr/`, `build/` | Production bundles generated dynamically during deployment (`npm run build`). |
| **🐍 Python Bytecode** | `__pycache__/`, `*.pyc`, `*.pyo` | Compiled Python bytecode specific to local machines and Python versions. |
| **🗄️ Local Runtime DB** | `backend/infrawatch.db`, `*.db-journal` | SQLite runtime database and lockfiles. The database is seeded fresh via `python data/seed.py` from `Projects_Report.csv`. |
| **🧪 Testing & Caches** | `.pytest_cache/`, `.coverage`, `.eslintcache` | Local test logs and linter cache folders. |
| **💻 OS & IDE Metadata** | `.DS_Store`, `Thumbs.db`, `.idea/`, `.vscode/` | OS-specific thumbnails, icon caches, and local editor preferences. |

---

## 🚫 Files You Should NEVER Push to GitHub

1. **`.env`**
   * Contains your `GROQ_API_KEY` or production database URLs.
   * *Best Practice:* Use `.env.example` to document expected environment variable names with dummy placeholders.

2. **`node_modules/` & `venv/`**
   * Pushing dependencies inflates repository size to hundreds of megabytes and causes cross-platform binary conflicts between Windows and Linux.

3. **`frontend/dist/`**
   * Hosting platforms like Vercel and Netlify build this folder automatically during CI/CD.

---

## ✅ Files That MUST Be Pushed to GitHub

* `backend/`
  * `data/generate_data.py`, `data/seed.py`, `data/Projects_Report.csv`
  * `ml/features.py`, `ml/train.py`, `ml/predict.py`, `ml/shap_explain.py`, `ml/model_comparison.json`
  * `api/routes/`, `api/services/`, `llm/assistant.py`
  * `main.py`, `database.py`, `models.py`, `requirements.txt`, `Dockerfile`
* `frontend/`
  * `src/` (Components, Pages, Hooks, Utils, App.jsx, main.jsx, index.css)
  * `package.json`, `package-lock.json`
  * `vite.config.js`, `index.html`, `vercel.json`, `Dockerfile`
* Root
  * `docker-compose.yml`, `run_backend.py`, `README.md`, `start_*.bat`
  * `.gitignore`, `GITIGNORE.md`

---

## 🛠️ How to Clear Cached Files (If already committed accidentally)

If you have previously committed `node_modules`, `__pycache__`, or `.env`, run these commands to remove them from Git tracking without deleting your local files:

```bash
# 1. Untrack all files
git rm -r --cached .

# 2. Re-stage according to .gitignore
git add .

# 3. Commit the cleaned state
git commit -m "chore: apply clean .gitignore"
```

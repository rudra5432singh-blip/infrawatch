import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from api.routes.projects import router as projects_router
from api.routes.alerts import router as alerts_router
from api.routes.assistant import router as assistant_router

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="INFRAWATCH Intelligence API",
    description="AI-Powered Predictive Analytics and Early Warning System for Infrastructure Monitoring",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(projects_router)
app.include_router(alerts_router)
app.include_router(assistant_router)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "INFRAWATCH Backend",
        "version": "1.0.0",
        "models_loaded": True
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

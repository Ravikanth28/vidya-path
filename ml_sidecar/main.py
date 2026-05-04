"""
VidyaPath ML sidecar — FastAPI microservice exposing IRT, BKT, Bandit, SRS.

Run:
    python -m uvicorn ml_sidecar.main:app --host 0.0.0.0 --port 8000

Configure ML_SIDECAR_URL on the Node side to point at this service.
"""
from fastapi import FastAPI
from .routers import irt, bkt, bandit, srs

app = FastAPI(title="VidyaPath ML Sidecar", version="1.0.0")

app.include_router(irt.router, prefix="/irt", tags=["irt"])
app.include_router(bkt.router, prefix="/bkt", tags=["bkt"])
app.include_router(bandit.router, prefix="/bandit", tags=["bandit"])
app.include_router(srs.router, prefix="/srs", tags=["srs"])


@app.get("/health")
def health():
    return {"ok": True, "service": "vidyapath-ml", "models": ["irt-3pl", "bkt", "bandit-eps", "sm2"]}


@app.get("/")
def root():
    return {"name": "VidyaPath ML Sidecar", "endpoints": [
        "/irt/estimate", "/bkt/update", "/bkt/next-lessons",
        "/bandit/select", "/srs/schedule", "/health"
    ]}

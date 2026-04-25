from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.tickets import router as tickets_router
from app.routers.manager import router as manager_router

app = FastAPI(title="Client Portal API", version="1.0")

# DEV CORS (so it works with 5173 or 5174)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tickets_router, prefix="/api")
app.include_router(manager_router, prefix="/api")

@app.get("/health")
def health():
    return {"ok": True}

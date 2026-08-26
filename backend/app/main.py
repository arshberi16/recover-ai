import os
from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base, SessionLocal
from app.data_generator import seed_database_if_empty

# Create all database tables in Supabase PostgreSQL
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="RecoverAI Platform API",
    description="Enterprise AI-Powered Revenue Recovery Intelligence Platform Engine",
    version="2.0.0"
)

# Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    print("RecoverAI API Server started successfully.")

# Register API Routers
from app.routers import predict, transactions, analytics, insights, actions, reports, health, ingest, settings_router

app.include_router(predict.router)
app.include_router(transactions.router)
app.include_router(analytics.router)
app.include_router(insights.router)
app.include_router(actions.router)
app.include_router(reports.router)
app.include_router(health.router)
app.include_router(ingest.router)
app.include_router(settings_router.router)

@app.get("/", response_class=HTMLResponse)
def read_root():
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>RecoverAI Platform API</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
            .card { background: #1e293b; padding: 2.5rem; border-radius: 1rem; border: 1px solid #334155; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); text-align: center; max-width: 500px; }
            h1 { color: #38bdf8; margin-bottom: 0.5rem; }
            p { color: #94a3b8; font-size: 1.1rem; line-height: 1.6; }
            .btn { display: inline-block; margin-top: 1.5rem; padding: 0.75rem 1.5rem; background: #2563eb; color: #fff; text-decoration: none; border-radius: 0.5rem; font-weight: 600; transition: background 0.2s; }
            .btn:hover { background: #1d4ed8; }
            .badge { display: inline-block; padding: 0.25rem 0.75rem; background: #065f46; color: #34d399; border-radius: 9999px; font-size: 0.875rem; font-weight: 600; margin-bottom: 1rem; }
        </style>
    </head>
    <body>
        <div class="card">
            <span class="badge">● Live & Connected</span>
            <h1>RecoverAI Intelligence Engine</h1>
            <p>The FastAPI Backend & Supabase PostgreSQL database are running smoothly.</p>
            <a href="http://localhost:5173" class="btn">Launch RecoverAI React Web App →</a>
            <p style="margin-top: 1.5rem; font-size: 0.875rem;"><a href="/docs" style="color: #94a3b8;">View Interactive Swagger API Docs</a></p>
        </div>
    </body>
    </html>
    """

@app.get("/health")
def health_check():
    return {"status": "healthy"}

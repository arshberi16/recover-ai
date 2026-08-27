import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Load environment variables from .env file if available
load_dotenv()

# Allow environment override for Supabase / PostgreSQL
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./recoverai.db")

# Standardize postgresql:// schema for SQLAlchemy
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Automatically switch Supabase Session Pooler (port 5432) to Transaction Pooler (port 6543)
# to prevent (EMAXCONNSESSION) max clients limit on Render!
if "pooler.supabase.com:5432" in SQLALCHEMY_DATABASE_URL:
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("pooler.supabase.com:5432", "pooler.supabase.com:6543")

engine_kwargs = {}
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    # PostgreSQL / Supabase connection pool tuning for high concurrency
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_size"] = 5
    engine_kwargs["max_overflow"] = 10
    engine_kwargs["pool_timeout"] = 30
    engine_kwargs["pool_recycle"] = 1800

engine = create_engine(SQLALCHEMY_DATABASE_URL, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .utils.db import engine, get_db
from .models import Base
from .routes import items, spaces

app = FastAPI()

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend origin
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)


@app.on_event("startup")
async def startup():
    # If tables already exist in the DB, this will not overwrite them.
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

# Include the route files that define endpoints for items and spaces
app.include_router(items.router, prefix="/items", tags=["items"])
app.include_router(spaces.router, prefix="/spaces", tags=["spaces"])

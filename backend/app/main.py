from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .utils.db import engine
from .models import Base
from .routes.items import router as items_router
from .routes.spaces import router as spaces_router
from .routes.voice import router as voice_router


app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Welcome to the QRganizer API"}

app.include_router(voice_router, prefix="/voice", tags=["voice"])
    

# Middleware for CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://cb29-75-190-231-251.ngrok-free.app",
        "*",  # TEMPORARILY ALLOW ALL ORIGINS
    ],
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all HTTP headers
)


@app.on_event("startup")
async def startup():
    # If tables already exist in the DB, this will not overwrite them.
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

# Include the route files that define endpoints for items and spaces
app.include_router(items_router, prefix="/items", tags=["items"])
app.include_router(spaces_router, prefix="/spaces", tags=["spaces"])

for route in app.routes:
    print(f"Path: {route.path}, Name: {route.name}")

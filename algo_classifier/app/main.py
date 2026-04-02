from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Database connection lifecycle functions
from app.database.mongodb import connect_to_mongo, close_mongo_connection

# Application routers
from app.api.auth import router as auth_router
from app.api.questions import router as questions_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manages the application lifecycle (Resource Manager).
    Code before the 'yield' statement runs on server startup.
    Code after the 'yield' statement runs on server shutdown.
    """
    # Startup phase: Establish MongoDB connection and ensure indexes are created
    await connect_to_mongo()
    
    yield # The server is running and accepting HTTP requests here
    
    # Shutdown phase: Graceful disconnection to prevent memory leaks and dangling connections
    await close_mongo_connection()


# Application initialization with formal OpenAPI metadata
app = FastAPI(
    title="AlgoClassifier API",
    description="A formal AI-driven system for classifying and analyzing algorithmic problems.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration - Restricting access to explicitly trusted origins 
# to mitigate Cross-Origin Resource Sharing vulnerabilities (e.g., CSRF).
origins = [
    "http://localhost:3000",  # React / Next.js local frontend
    "http://localhost:8000",  # Local backend interactions / Swagger UI
    # Note: Production domains should be appended here in the future
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], # Permits all HTTP methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"], # Permits all headers, critical for passing Bearer Authorization tokens
)

# Registering routers to the main application instance
app.include_router(auth_router)
app.include_router(questions_router)

@app.get("/", tags=["Health"])
async def root():
    """
    A simple health-check endpoint (Sanity Check) 
    to verify that the server is active and responding.
    """
    return {"message": "AlgoClassifier API is running securely."}
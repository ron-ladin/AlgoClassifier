from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo import IndexModel, DESCENDING, TEXT
from pymongo.errors import ConfigurationError

from app.core.config import settings

# Global connection variables
mongo_client: AsyncIOMotorClient | None = None
mongo_database: AsyncIOMotorDatabase | None = None

async def create_indexes() -> None:
    """
    Ensures that required indexes exist in the questions collection.
    Optimizes queries for user-specific retrieval, sorting, and full-text search.
    """
    if mongo_database is None:
        return

    collection = mongo_database.get_collection("questions")

    # Define indexes based on planned access patterns
    indexes = [
        # Optimized for: "Show my latest questions" (O(log n) retrieval + sorted)
        IndexModel([("userId", 1), ("createdAt", DESCENDING)], name="user_recent_questions"),
        
        # Optimized for: "Filter my questions by category"
        IndexModel([("userId", 1), ("categoryName", 1)], name="user_category_filter"),
        
        # Optimized for: "Public social feed" (Future-proofing)
        IndexModel([("isPublic", 1)], name="public_questions_filter"),
        
        # Optimized for: Full-text search with title weights
        IndexModel(
            [("catchyTitle", TEXT), ("originalText", TEXT)],
            weights={"catchyTitle": 10, "originalText": 1},
            name="question_text_search"
        )
    ]

    try:
        await collection.create_indexes(indexes)
    except Exception as exc:
        # In professional systems, failing to create indexes is a critical startup error
        raise RuntimeError("Failed to create database indexes.") from exc

async def connect_to_mongo() -> None:
    """
    Initializes the MongoDB connection and ensures infrastructure (indexes) is ready.
    """
    global mongo_client 
    global mongo_database

    if mongo_client is not None: 
        return
    
    mongo_client = AsyncIOMotorClient(settings.MONGODB_URI) 
   
    try:
        # Verify connection
        await mongo_client.admin.command("ping")
        mongo_database = mongo_client.get_default_database()
        
        # Initialize indexes immediately after connection
        await create_indexes()
        
    except ConfigurationError as exc:
        await close_mongo_connection()
        raise RuntimeError("MONGODB_URI must include a database name.") from exc
    except Exception as exc:
        await close_mongo_connection()
        raise RuntimeError("Failed to initialize MongoDB connection.") from exc

async def close_mongo_connection() -> None:
    """
    Safely closes the MongoDB client connection.
    """
    global mongo_client
    global mongo_database

    if mongo_client is not None:
        mongo_client.close()

    mongo_client = None
    mongo_database = None
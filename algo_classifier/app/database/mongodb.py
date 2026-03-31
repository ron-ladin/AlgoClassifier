from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo.errors import ConfigurationError

from app.core.config import settings
# manage the physical connection to MongoDB and provide access to the database instance
mongo_client: AsyncIOMotorClient | None = None
# represents the specific MongoDB database that the application will interact with, derived from the connection URI provided in settings. It is initialized after a successful connection to MongoDB and is used for performing database operations throughout the application.
mongo_database: AsyncIOMotorDatabase | None = None

# This module provides functions to connect to and disconnect from MongoDB, ensuring that the connection is properly managed and that any issues with the connection URI are handled gracefully. The use of async functions allows for non-blocking database operations, which is essential for the performance of the application.
async def connect_to_mongo() -> None:
    global mongo_client 
    global mongo_database
    #check if the connection is already established to avoid redundant connections
    if mongo_client is not None: 
        return
    
    #initialize the MongoDB client using the connection URI from settings.
    #This client will manage the connection to the MongoDB server and allow for database operations.
    mongo_client = AsyncIOMotorClient(settings.MONGODB_URI) 
   
    try:
        await mongo_client.admin.command("ping")
        mongo_database = mongo_client.get_default_database()
    except ConfigurationError as exc:
        mongo_client.close()
        mongo_client = None
        mongo_database = None
        raise RuntimeError("MONGODB_URI must include a database name.") from exc
    except Exception as exc:
        mongo_client.close()
        mongo_client = None
        mongo_database = None
        raise RuntimeError("Failed to initialize MongoDB connection.") from exc


async def close_mongo_connection() -> None:
    global mongo_client
    global mongo_database

    if mongo_client is not None:
        mongo_client.close()

    mongo_client = None
    mongo_database = None

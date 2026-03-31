from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.core.config import settings

mongo_client: AsyncIOMotorClient | None = None
mongo_database: AsyncIOMotorDatabase | None = None


async def connect_to_mongo() -> None:
    global mongo_client
    global mongo_database

    if mongo_client is not None:
        return

    mongo_client = AsyncIOMotorClient(settings.MONGODB_URI)
    try:
        await mongo_client.admin.command("ping")
        mongo_database = mongo_client.get_default_database()
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

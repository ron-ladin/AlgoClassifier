
import logging
from typing import Optional
from bson import ObjectId
from fastapi import HTTPException, status
from app.models.question import QuestionDocument
from app.models.user import UserCreate, UserInDB
from app.core.security import get_password_hash
from app.database import mongodb
from bson import ObjectId

# Logger for diagnostic tracking
logger = logging.getLogger(__name__)

class UserService:
    """
    Service layer for User entities. 
    Implements specific retrieval, Pre-check validation, and ACID transactions.
    """
    async def get_user_questions(self, user_id: str):
        collection = self._get_collection("questions")
        cursor = collection.find({"userId": user_id})
        questions = await cursor.to_list(length=100)
        for q in questions:
            # Explicit Data Mapping: Extract '_id', cast to string, and assign to RESTful 'id'
            q["id"] = str(q.pop("_id"))
        return questions

    async def get_question_by_id(self, question_id: str):
        if not ObjectId.is_valid(question_id):
            return None
        collection = self._get_collection("questions")
        question = await collection.find_one({"_id": ObjectId(question_id)})
        if question:
            # Explicit Data Mapping
            question["id"] = str(question.pop("_id"))
        return question

    async def delete_question_with_transaction(self, question_id: str, user_id: str) -> None:
        """
        Deletes a question and removes its reference from the owning user atomically.
        """
        if mongodb.mongo_client is None:
            raise RuntimeError("Database client not initialized")

        if not ObjectId.is_valid(question_id):
            raise HTTPException(status_code=404, detail="Question not found")

        q_oid = ObjectId(question_id)
        u_oid = ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id

        async with await mongodb.mongo_client.start_session() as session:
            async with session.start_transaction():
                try:
                    delete_res = await self._get_collection("questions").delete_one(
                        {"_id": q_oid, "userId": user_id},
                        session=session,
                    )
                    if delete_res.deleted_count == 0:
                        raise HTTPException(status_code=404, detail="Question not found")

                    update_res = await self._get_collection("users").update_one(
                        {"_id": u_oid},
                        {"$pull": {"question_ids": question_id}},
                        session=session,
                    )
                    if update_res.matched_count == 0:
                        raise HTTPException(status_code=404, detail="User not found")
                except Exception as e:
                    await session.abort_transaction()
                    logger.error(f"Delete transaction failed: {str(e)}")
                    raise e

    def _get_collection(self, name: str):
        if mongodb.mongo_database is None:
            raise RuntimeError("Database not initialized")
        return mongodb.mongo_database.get_collection(name)

    # --- Specific Retrieval Functions (Option A) ---

    async def get_user_by_email(self, email: str) -> Optional[UserInDB]:
        db = mongodb.mongo_database 
        user_data = await db.users.find_one({"email": email})
        if user_data:
            user_data["_id"] = str(user_data["_id"])
            return UserInDB(**user_data)
        return None

    async def get_user_by_username(self, username: str) -> Optional[UserInDB]:
        """O(\log n) lookup via unique username index."""
        db = mongodb.mongo_database 
        user_data = await self._get_collection("users").find_one({"username": username})
        if user_data:
            user_data["_id"] = str(user_data["_id"])
            return UserInDB(**user_data)
        return None

    async def get_user_by_id(self, user_id: str) -> Optional[UserInDB]:
        """Retrieval by internal MongoDB ObjectID."""
        try:
            # We must convert the string ID to a real BSON ObjectId
            oid = ObjectId(user_id) if isinstance(user_id, str) else user_id
            user_data = await self._get_collection("users").find_one({"_id": oid})
            if user_data:
                user_data["_id"] = str(user_data["_id"])
                return UserInDB(**user_data)
            return None
        except Exception:
            return None

    # --- Registration with Pre-check (Option A) ---

    async def register_user(self, user_in: UserCreate) -> UserInDB:
        """
        Registers a new user after verifying uniqueness.
        """
        # Step 1: Pre-check for UX (O(\log n))
        if await self.get_user_by_email(user_in.email):
            raise HTTPException(status_code=400, detail="Email already registered")
        if await self.get_user_by_username(user_in.username):
            raise HTTPException(status_code=400, detail="Username already registered")

        # Step 2: Formal Hashing
        hashed_password = get_password_hash(user_in.password)
        
        user_db = UserInDB(
            username=user_in.username,
            email=user_in.email,
            hashed_password=hashed_password,
            question_ids=[]
        )
        
        # Step 3: Persistence
        result = await self._get_collection("users").insert_one(
            user_db.model_dump(by_alias=True, exclude={"id"})
        )
        
        user_db.id = str(result.inserted_id)
        return user_db

    # --- ACID Transaction for Bi-directional Link (Option B) ---

    async def save_question_with_transaction(self, question_doc_dict: dict, user_id: str) -> str:
        """
        Ensures atomicity between Question creation and User history update.
        """
        if mongodb.mongo_client is None:
            raise RuntimeError("Database client not initialized")
            
        async with await mongodb.mongo_client.start_session() as session:
            async with session.start_transaction():
                try:
                    # 1. Insert question
                    q_res = await self._get_collection("questions").insert_one(
                        question_doc_dict, session=session
                    )
                    q_id = str(q_res.inserted_id)

                    # 2. Update user with new question ID
                    u_oid = ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id
                    update_res = await self._get_collection("users").update_one(
                        {"_id": u_oid},
                        {"$push": {"question_ids": q_id}},
                        session=session
                    )
                    
                    if update_res.modified_count == 0:
                        raise HTTPException(status_code=404, detail="User mapping failed")
                        
                    return q_id
                except Exception as e:
                    await session.abort_transaction()
                    logger.error(f"Transaction failed: {str(e)}")
                    raise e

# Singleton instance
user_service = UserService()

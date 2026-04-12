import logging
import asyncio
from app.services.classifier_service import ClassifierService

logging.basicConfig(level=logging.DEBUG)

async def test():
    try:
        service = ClassifierService()
        res = await service._generate_embedding('test question')
        print("EMBEDDING RESULT:")
        print(len(res) if res else None)
    except Exception as e:
        print("ERROR:")
        print(e)
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test())

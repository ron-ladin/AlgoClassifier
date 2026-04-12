import logging
import asyncio
from app.services.classifier_service import ClassifierService

logging.basicConfig(level=logging.DEBUG)

async def test():
    try:
        service = ClassifierService()
        res = await service._call_gemini('test question')
        print("RESULT:")
        print(res)
    except Exception as e:
        print("ERROR:")
        print(e)
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test())

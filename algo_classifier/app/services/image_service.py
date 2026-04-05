import cloudinary
import cloudinary.uploader
from fastapi import UploadFile
from app.core.config import settings

# Initialize Cloudinary configuration using our environment variables
# We do this once when the application starts
cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET
)

class ImageService:
    """
    This class handles everything related to images in our system.
    Using a class allows us to easily replace Cloudinary with another service (like AWS S3) 
    in the future without changing the rest of our application code.
    """

    @staticmethod
    async def upload_image(file: UploadFile) -> str:
        """
        Uploads an image file to Cloudinary and returns the public URL.
        
        Args:
            file (UploadFile): The image file received from the frontend.
            
        Returns:
            str: The secure (HTTPS) public URL of the uploaded image.
        """
        try:
            # Read the file content into memory
            file_content = await file.read()
            
            # Upload the file to Cloudinary
            # 'folder' organizes our images inside the Cloudinary dashboard
            response = cloudinary.uploader.upload(
                file_content,
                folder="algoclassifier/questions" 
            )
            
            # Extract and return the secure URL from Cloudinary's response
            secure_url = response.get("secure_url")
            return secure_url
            
        except Exception as e:
            # If something goes wrong, we print the error and return None
            print(f"Error uploading image to Cloudinary: {str(e)}")
            return None
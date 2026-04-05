import React from "react";
// Import the Zoom component and its default CSS styles
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";

// Define the expected properties (props) for this component
interface ZoomableImageProps {
  imageUrl: string;
  altText?: string;
}

/**
 * A reusable component that displays an image and allows the user to click it
 * to see a full-screen zoomed version.
 */
const ZoomableImage: React.FC<ZoomableImageProps> = ({
  imageUrl,
  altText = "Question attachment",
}) => {
  // If no image URL is provided, do not render anything
  if (!imageUrl) {
    return null;
  }

  return (
    // The Zoom component wraps our standard image tag
    <Zoom>
      <img
        src={imageUrl}
        alt={altText}
        // Tailwind classes for a nice UI: rounded corners, slight shadow, and a max height
        className="rounded-lg shadow-md max-h-96 object-contain w-full cursor-pointer hover:opacity-90 transition-opacity"
      />
    </Zoom>
  );
};

export default ZoomableImage;

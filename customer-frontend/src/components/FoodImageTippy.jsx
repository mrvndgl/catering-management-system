import React, { useEffect, useState } from "react";
import Tippy from "@tippyjs/react";
import { ImageOff } from "lucide-react";

// Define FallbackContent component first
const FallbackContent = ({ message }) => (
  <div className="w-[300px] h-[200px] bg-gray-100 flex flex-col items-center justify-center text-gray-500 rounded-lg">
    <ImageOff className="w-8 h-8 mb-2" />
    <span className="text-sm">{message}</span>
  </div>
);

const FoodImageTippy = ({ product }) => {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (product?.images?.length > 0) {
      const displayImage =
        product.images.find((img) => img.is_primary) || product.images[0];
      console.log("Image path from database:", displayImage.url);
      console.log(
        "Full image URL:",
        `http://localhost:4000${displayImage.url}`
      );
    }
  }, [product]);

  if (!product?.images?.length) {
    return (
      <Tippy
        theme="translucent"
        content={<FallbackContent message="No images available" />}
        placement="right"
      >
        <span className="px-5 py-2.5 text-base cursor-pointer hover:bg-gray-50 rounded">
          {product?.product_name || "Unknown Product"}
        </span>
      </Tippy>
    );
  }

  const displayImage =
    product.images.find((img) => img.is_primary) || product.images[0];

  const ImageContent = () => {
    const imageUrl = `http://localhost:4000${displayImage.url}`;

    return (
      <div className="relative w-[300px] rounded-lg overflow-hidden bg-gray-50">
        {!imageError ? (
          <img
            src={imageUrl}
            alt={product.product_name}
            className="w-full h-auto object-cover min-h-[200px]"
            onError={(e) => {
              console.error("Image failed to load:", imageUrl);
              setImageError(true);
            }}
            onLoad={() => {
              console.log("Image loaded successfully:", imageUrl);
              setImageError(false);
            }}
          />
        ) : (
          <FallbackContent message="Error loading image" />
        )}
      </div>
    );
  };

  return (
    <Tippy
      theme="translucent"
      content={<ImageContent />}
      allowHTML={true}
      placement="right"
      delay={[100, 0]}
      animation="fade"
    >
      <span className="px-5 py-2.5 text-base cursor-pointer hover:bg-gray-50 rounded">
        {product.product_name}
      </span>
    </Tippy>
  );
};

export default FoodImageTippy;

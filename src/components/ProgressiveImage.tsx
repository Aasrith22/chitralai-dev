import React, { useState, useEffect } from 'react';

interface ProgressiveImageProps {
  src: string;
  thumbnailSrc?: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
}

const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  src,
  thumbnailSrc,
  alt,
  className = '',
  style = {}
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [currentSrc, setCurrentSrc] = useState(thumbnailSrc || src);
  const [isThumbnailLoaded, setIsThumbnailLoaded] = useState(false);
  const [triedFull, setTriedFull] = useState(false);

  useEffect(() => {
    // Reset state when src changes
    setIsLoading(true);
    setCurrentSrc(thumbnailSrc || src);
    setIsThumbnailLoaded(false);
    setTriedFull(false);
  }, [src, thumbnailSrc]);

  const handleLoad = () => {
    if (currentSrc === thumbnailSrc && thumbnailSrc && !isThumbnailLoaded) {
      setIsThumbnailLoaded(true);
      // Try to load the full image next
      setCurrentSrc(src);
    } else {
      setIsLoading(false);
    }
  };

  const handleError = () => {
    // If thumbnail fails, fallback to full image
    if (currentSrc === thumbnailSrc && !triedFull) {
      setCurrentSrc(src);
      setTriedFull(true);
    } else {
      setIsLoading(false);
    }
  };

  return (
    <div className={`relative ${className}`} style={style}>
      {/* Loading placeholder */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      
      {/* Image */}
      <img
        src={currentSrc}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
      />
    </div>
  );
};

export default ProgressiveImage; 
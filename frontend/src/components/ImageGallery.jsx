import React, { useState, useCallback, useRef, useEffect } from 'react';
import LazyImage from './LazyImage.jsx';

function ImageGallery({ galleryData, mediaMetadata, title, onImageClick }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const thumbnailsRef = useRef(null);
  const thumbnailRefs = useRef([]);

  // Decode HTML entities in URLs
  const decodeHtmlEntities = useCallback((str) => {
    if (!str) return str;
    return str
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  }, []);

  // Get the best quality image URL for a media item
  const getBestImageUrl = useCallback((mediaId) => {
    const metadata = mediaMetadata[mediaId];
    if (!metadata) return null;

    // Prefer the source image (highest quality)
    if (metadata.s?.u) {
      return decodeHtmlEntities(metadata.s.u);
    }

    // Fallback to the largest preview image
    if (metadata.p && metadata.p.length > 0) {
      const largestPreview = metadata.p[metadata.p.length - 1];
      return decodeHtmlEntities(largestPreview.u);
    }

    return null;
  }, [mediaMetadata, decodeHtmlEntities]);

  // Get a medium-sized preview URL for thumbnails
  const getPreviewImageUrl = useCallback((mediaId) => {
    const metadata = mediaMetadata[mediaId];
    if (!metadata) return null;

    // Find a medium-sized preview (around 320-640px width)
    if (metadata.p && metadata.p.length > 0) {
      const mediumPreview = metadata.p.find(p => p.x >= 320 && p.x <= 640) || 
                           metadata.p[Math.floor(metadata.p.length / 2)] ||
                           metadata.p[0];
      return decodeHtmlEntities(mediumPreview.u);
    }

    // Fallback to source if no previews
    if (metadata.s?.u) {
      return decodeHtmlEntities(metadata.s.u);
    }

    return null;
  }, [mediaMetadata, decodeHtmlEntities]);

  // Check if media is a GIF
  const isGif = useCallback((mediaId) => {
    const metadata = mediaMetadata[mediaId];
    return metadata?.m === 'image/gif' || metadata?.e === 'AnimatedImage';
  }, [mediaMetadata]);

  // Auto-scroll thumbnail strip to keep current thumbnail visible
  useEffect(() => {
    if (thumbnailsRef.current && thumbnailRefs.current[currentIndex]) {
      const thumbnailsContainer = thumbnailsRef.current;
      const currentThumbnail = thumbnailRefs.current[currentIndex];
      
      if (currentThumbnail) {
        const containerRect = thumbnailsContainer.getBoundingClientRect();
        const thumbnailRect = currentThumbnail.getBoundingClientRect();
        
        // Calculate the relative position of the thumbnail within the container
        const thumbnailLeft = currentThumbnail.offsetLeft;
        const thumbnailWidth = currentThumbnail.offsetWidth;
        const containerWidth = thumbnailsContainer.clientWidth;
        const currentScrollLeft = thumbnailsContainer.scrollLeft;
        
        // Calculate if thumbnail is outside the visible area
        const thumbnailStart = thumbnailLeft;
        const thumbnailEnd = thumbnailLeft + thumbnailWidth;
        const visibleStart = currentScrollLeft;
        const visibleEnd = currentScrollLeft + containerWidth;
        
        let newScrollLeft = currentScrollLeft;
        
        // If thumbnail is to the right of visible area, scroll right
        if (thumbnailEnd > visibleEnd) {
          newScrollLeft = thumbnailEnd - containerWidth + 10; // 10px padding
        }
        // If thumbnail is to the left of visible area, scroll left
        else if (thumbnailStart < visibleStart) {
          newScrollLeft = thumbnailStart - 10; // 10px padding
        }
        
        // Smooth scroll to the new position
        if (newScrollLeft !== currentScrollLeft) {
          thumbnailsContainer.scrollTo({
            left: newScrollLeft,
            behavior: 'smooth'
          });
        }
      }
    }
  }, [currentIndex]);

  if (!galleryData?.items || galleryData.items.length === 0) {
    return null;
  }

  const items = galleryData.items;
  const currentItem = items[currentIndex];
  const currentImageUrl = getBestImageUrl(currentItem.media_id);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
  };

  const handleThumbnailClick = (index) => {
    setCurrentIndex(index);
  };

  const handleMainImageClick = (e) => {
    if (onImageClick && currentImageUrl) {
      onImageClick(e, currentImageUrl);
    }
  };

  return (
    <div className="image-gallery">
      {/* Main image display */}
      <div className="gallery-main">
        <div className="gallery-image-container">
          {currentImageUrl && (
            <LazyImage
              src={currentImageUrl}
              alt={currentItem.caption || title || `Gallery image ${currentIndex + 1}`}
              onClick={handleMainImageClick}
              isGif={isGif(currentItem.media_id)}
              className="gallery-main-image"
              disableAnimation={true}
            />
          )}
          
          {/* Navigation arrows */}
          {items.length > 1 && (
            <>
              <button
                className="gallery-nav gallery-nav-prev"
                onClick={handlePrevious}
                aria-label="Previous image"
                type="button"
              >
                ‹
              </button>
              <button
                className="gallery-nav gallery-nav-next"
                onClick={handleNext}
                aria-label="Next image"
                type="button"
              >
                ›
              </button>
            </>
          )}
        </div>

        {/* Image counter */}
        {items.length > 1 && (
          <div className="gallery-counter">
            {currentIndex + 1} / {items.length}
          </div>
        )}

        {/* Caption if available */}
        {currentItem.caption && (
          <div className="gallery-caption">
            {currentItem.caption}
          </div>
        )}
      </div>

      {/* Thumbnail strip for multiple images */}
      {items.length > 1 && (
        <div className="gallery-thumbnails" ref={thumbnailsRef}>
          {items.map((item, index) => {
            const thumbnailUrl = getPreviewImageUrl(item.media_id);
            if (!thumbnailUrl) return null;

            return (
              <button
                key={item.id || item.media_id}
                ref={(el) => (thumbnailRefs.current[index] = el)}
                className={`gallery-thumbnail ${index === currentIndex ? 'active' : ''}`}
                onClick={() => handleThumbnailClick(index)}
                type="button"
                aria-label={`View image ${index + 1}`}
              >
                <LazyImage
                  src={thumbnailUrl}
                  alt={item.caption || `Thumbnail ${index + 1}`}
                  isGif={isGif(item.media_id)}
                  className="gallery-thumbnail-image"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ImageGallery;

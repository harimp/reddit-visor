import React from 'react';
import { useLazyImage } from '../hooks/useLazyLoad.js';

function LazyImage({ 
  src, 
  alt, 
  className = '', 
  onClick, 
  isGif = false,
  placeholder = null,
  style = {}
}) {
  const {
    elementRef,
    imageSrc,
    imageLoaded,
    imageError,
    isVisible,
    handleLoad,
    handleError,
    retry
  } = useLazyImage(src);

  const handleImageClick = (e) => {
    if (onClick && imageLoaded && !imageError) {
      onClick(e);
    }
  };

  const renderPlaceholder = () => {
    if (placeholder) {
      return placeholder;
    }

    return (
      <div className="lazy-image-placeholder">
        <div className="skeleton-loader">
          <div className="skeleton-shimmer"></div>
        </div>
        {isGif && (
          <div className="gif-placeholder-indicator">
            <span>GIF</span>
          </div>
        )}
      </div>
    );
  };

  const renderError = () => (
    <div className="lazy-image-error">
      <div className="error-content">
        <div className="error-icon">⚠️</div>
        <div className="error-text">Failed to load image</div>
        <button 
          className="error-retry-btn"
          onClick={(e) => {
            e.stopPropagation();
            retry();
          }}
          type="button"
        >
          Retry
        </button>
      </div>
    </div>
  );

  const renderImage = () => (
    <img
      src={imageSrc}
      alt={alt}
      className={`lazy-image ${imageLoaded ? 'loaded' : 'loading'} ${className}`}
      onLoad={handleLoad}
      onError={handleError}
      onClick={handleImageClick}
      style={{
        ...style,
        opacity: imageLoaded ? 1 : 0,
        transition: 'opacity 0.3s ease-in-out'
      }}
    />
  );

  return (
    <div 
      ref={elementRef}
      className={`lazy-image-container ${isGif ? 'gif-container' : ''}`}
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      {/* Always render placeholder first */}
      {!imageLoaded && !imageError && renderPlaceholder()}
      
      {/* Show error state */}
      {imageError && renderError()}
      
      {/* Render image when src is available */}
      {imageSrc && !imageError && renderImage()}
      
      {/* GIF indicator overlay */}
      {isGif && imageLoaded && !imageError && (
        <div className="gif-indicator">GIF</div>
      )}
    </div>
  );
}

export default LazyImage;

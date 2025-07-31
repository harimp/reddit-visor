import React, { useState, useEffect } from 'react';
import { useLazyLoad } from '../hooks/useLazyLoad.js';
import VideoPlayer from './VideoPlayer.jsx';

function LazyVideoPlayer({ 
  post, 
  autoplay = false, 
  muted = true,
  className = '',
  onClick
}) {
  const [videoInitialized, setVideoInitialized] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  
  const { elementRef, isVisible } = useLazyLoad({
    rootMargin: '100px',
    threshold: 0.1
  });

  const handleThumbnailClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onClick) {
      onClick(e);
    } else {
      // Initialize and show video player
      setVideoInitialized(true);
      setShowVideo(true);
    }
  };

  const renderVideoPlaceholder = () => (
    <div className="lazy-video-placeholder">
      <div className="skeleton-loader video-skeleton">
        <div className="skeleton-shimmer"></div>
      </div>
      <div className="video-placeholder-overlay">
        <div className="play-button-placeholder">▶</div>
        <div className="video-info-placeholder">
          {post.videoData?.duration && (
            <div className="duration-placeholder">
              {Math.floor(post.videoData.duration / 60)}:{(post.videoData.duration % 60).toString().padStart(2, '0')}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderThumbnailWithOverlay = () => {
    const videoThumbnail = post.thumbnailUrl || post.mediaUrl;
    
    if (!videoThumbnail || videoThumbnail === 'self' || videoThumbnail === 'default' || videoThumbnail === 'nsfw') {
      return (
        <div className="video-thumbnail-fallback" onClick={handleThumbnailClick}>
          <div className="video-fallback-content">
            <div className="video-icon">🎥</div>
            <div className="video-text">Video Content</div>
            {post.videoData?.duration && (
              <div className="video-duration-text">
                {Math.floor(post.videoData.duration / 60)}:{(post.videoData.duration % 60).toString().padStart(2, '0')}
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="video-thumbnail-container" onClick={handleThumbnailClick}>
        <img
          src={videoThumbnail}
          alt={post.title}
          className="video-thumbnail"
          loading="lazy"
          onError={(e) => {
            // Hide the broken image and show fallback
            e.target.style.display = 'none';
            const fallback = e.target.parentElement.querySelector('.video-thumbnail-error-fallback');
            if (fallback) {
              fallback.style.display = 'flex';
            }
          }}
          onLoad={(e) => {
            // Ensure the image is visible when it loads successfully
            e.target.style.display = 'block';
            const fallback = e.target.parentElement.querySelector('.video-thumbnail-error-fallback');
            if (fallback) {
              fallback.style.display = 'none';
            }
          }}
        />
        {/* Fallback for when image fails to load - matches image dimensions */}
        <div className="video-thumbnail-error-fallback" style={{ display: 'none' }}>
          <div className="video-fallback-content">
            <div className="video-icon">🎥</div>
            <div className="video-text">Video Content</div>
            {post.videoData?.duration && (
              <div className="video-duration-text">
                {Math.floor(post.videoData.duration / 60)}:{(post.videoData.duration % 60).toString().padStart(2, '0')}
              </div>
            )}
          </div>
        </div>
        <div className="video-overlay">
          <div className="play-button">▶</div>
          {post.videoData?.duration && (
            <div className="video-duration">
              {Math.floor(post.videoData.duration / 60)}:{(post.videoData.duration % 60).toString().padStart(2, '0')}
            </div>
          )}
          {post.videoData?.hasAudio === false && (
            <div className="no-audio-indicator">🔇</div>
          )}
        </div>
      </div>
    );
  };

  const renderVideoPlayer = () => (
    <VideoPlayer 
      post={post}
      autoplay={autoplay}
      muted={muted}
      preload="metadata"
      lazy={false}
    />
  );

  return (
    <div 
      ref={elementRef}
      className={`lazy-video-container ${className}`}
    >
      {!isVisible && renderVideoPlaceholder()}
      
      {isVisible && !showVideo && renderThumbnailWithOverlay()}
      
      {showVideo && renderVideoPlayer()}
    </div>
  );
}

export default LazyVideoPlayer;

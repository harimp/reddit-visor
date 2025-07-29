import React, { useState } from 'react';

function VideoPlayer({ post, autoplay = false, muted = true }) {
  const [hasError, setHasError] = useState(false);
  const videoData = post.videoData;
  const hasAudio = videoData?.hasAudio !== false;

  // Determine the best video source
  const getVideoSource = () => {
    if (videoData?.fallbackUrl || videoData?.dashUrl || videoData?.hlsUrl) {
      // Prefer fallback MP4 for better browser compatibility
      return videoData.fallbackUrl || post.mediaUrl;
    }
    return post.mediaUrl;
  };

  const videoSource = getVideoSource();

  const handleError = () => {
    setHasError(true);
  };

  const handleRetry = () => {
    setHasError(false);
    // Force video to reload by updating the key
    const video = document.querySelector(`video[src="${videoSource}"]`);
    if (video) {
      video.load();
    }
  };

  if (hasError) {
    return (
      <div className="video-player-error">
        <div className="error-content">
          <div className="error-icon">⚠️</div>
          <div className="error-text">Video failed to load</div>
          <button 
            className="error-retry-btn"
            onClick={handleRetry}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="video-player-container">
      <video
        className="video-player"
        src={videoSource}
        poster={post.thumbnailUrl}
        controls
        muted={muted}
        autoPlay={autoplay}
        playsInline
        preload="metadata"
        onError={handleError}
        style={{ width: '100%', height: 'auto' }}
      />
      
      {/* Audio indicator badge */}
      {!hasAudio && (
        <div className="no-audio-badge">🔇</div>
      )}
      
      {/* Duration badge */}
      {videoData?.duration && (
        <div className="video-duration-badge">
          {Math.floor(videoData.duration / 60)}:{(videoData.duration % 60).toString().padStart(2, '0')}
        </div>
      )}
    </div>
  );
}

export default VideoPlayer;

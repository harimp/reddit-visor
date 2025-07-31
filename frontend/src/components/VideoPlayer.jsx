import React, { useState, useCallback } from 'react';
import ReactPlayer from 'react-player';

function VideoPlayer({ post, autoplay = false, muted = true, preload = "metadata", lazy = false }) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  
  const videoData = post.videoData;
  const hasAudio = videoData?.hasAudio !== false;

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

  // Get the best video URL for react-player
  const getVideoUrl = () => {
    // For all video types, use the mediaUrl which already contains the best URL
    // (The redditClient has already processed fallback_url into mediaUrl)
    return decodeHtmlEntities(post.mediaUrl);
  };

  const videoUrl = getVideoUrl();

  const handleError = (error) => {
    console.warn('ReactPlayer error:', error);
    setHasError(true);
    setIsLoading(false);
  };

  const handleReady = () => {
    setIsReady(true);
    setIsLoading(false);
  };

  const handlePlay = () => {
    setIsLoading(false);
  };

  const handleBuffer = () => {
    setIsLoading(true);
  };

  const handleBufferEnd = () => {
    setIsLoading(false);
  };

  const handleRetry = () => {
    setHasError(false);
    setIsLoading(true);
    setIsReady(false);
  };

  // Calculate aspect ratio from video data and set as CSS custom property
  const containerStyle = React.useMemo(() => {
    const style = { width: '100%' };
    
    if (videoData?.width && videoData?.height) {
      const aspectRatio = videoData.width / videoData.height;
      style['--video-aspect-ratio'] = aspectRatio;
      style.aspectRatio = `${aspectRatio}`;
    } else {
      style.minHeight = '200px';
    }
    
    return style;
  }, [videoData?.width, videoData?.height]);

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

  if (!videoUrl) {
    return (
      <div className="video-player-error">
        <div className="error-content">
          <div className="error-icon">📹</div>
          <div className="error-text">No video URL available</div>
        </div>
      </div>
    );
  }

  return (
    <div className="video-player-container" style={containerStyle}>
      {isLoading && (
        <div className="media-loading">
          <div className="loading-spinner"></div>
        </div>
      )}
      
      <ReactPlayer
        src={videoUrl}
        className="react-player"
        width="100%"
        height="100%"
        playing={autoplay}
        muted={muted}
        controls={true}
        playsinline={true}
        onPlay={handlePlay}
        onError={handleError}
        config={{
          file: {
            attributes: {
              poster: decodeHtmlEntities(post.thumbnailUrl),
              preload: lazy ? "none" : preload,
              playsInline: true,
              'webkit-playsinline': true,
              'x-webkit-airplay': 'allow'
            }
          },
          youtube: {
            playerVars: {
              showinfo: 0,
              rel: 0,
              modestbranding: 1,
              iv_load_policy: 3,
              fs: 1,
              cc_load_policy: 0,
              disablekb: 0,
              autohide: 1
            }
          }
        }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0
        }}
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

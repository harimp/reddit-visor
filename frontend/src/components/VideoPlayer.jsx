import React, { useState, useRef, useEffect } from 'react';

function VideoPlayer({ post, autoplay = false, muted = true, preload = "metadata", lazy = false }) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [canPlay, setCanPlay] = useState(false);
  const videoRef = useRef(null);
  const videoData = post.videoData;
  const hasAudio = videoData?.hasAudio !== false;

  // Check if this is a YouTube video
  const isYouTubeVideo = post.mediaUrl && (post.mediaUrl.includes('youtube.com') || post.mediaUrl.includes('youtu.be'));

  // Extract YouTube video ID for embedding
  const getYouTubeVideoId = (url) => {
    if (url.includes('youtube.com/watch?v=')) {
      return url.split('v=')[1]?.split('&')[0];
    } else if (url.includes('youtu.be/')) {
      return url.split('youtu.be/')[1]?.split('?')[0];
    } else if (url.includes('youtube.com/embed/')) {
      return url.split('/embed/')[1]?.split('?')[0];
    }
    return null;
  };

  // Determine the best video source with fallbacks
  const getVideoSources = () => {
    const sources = [];
    
    // Primary source - fallback MP4 (best compatibility)
    if (videoData?.fallbackUrl) {
      sources.push({ src: videoData.fallbackUrl, type: 'video/mp4' });
    } else if (post.mediaUrl && !isYouTubeVideo) {
      // Detect video type from URL
      const url = post.mediaUrl.toLowerCase();
      if (url.includes('.mp4') || url.includes('v.redd.it')) {
        sources.push({ src: post.mediaUrl, type: 'video/mp4' });
      } else if (url.includes('.webm')) {
        sources.push({ src: post.mediaUrl, type: 'video/webm' });
      } else if (url.includes('.ogg')) {
        sources.push({ src: post.mediaUrl, type: 'video/ogg' });
      } else {
        // Default to MP4
        sources.push({ src: post.mediaUrl, type: 'video/mp4' });
      }
    }
    
    return sources;
  };

  const videoSources = getVideoSources();

  const handleError = (event) => {
    console.warn('Video playback error:', event);
    setHasError(true);
    setIsLoading(false);
  };

  const handleLoadStart = () => {
    setIsLoading(true);
    setCanPlay(false);
  };

  const handleCanPlay = () => {
    setIsLoading(false);
    setCanPlay(true);
  };

  const handleLoadedData = () => {
    setIsLoading(false);
  };

  const handleRetry = () => {
    setHasError(false);
    setIsLoading(true);
    setCanPlay(false);
    
    if (videoRef.current) {
      videoRef.current.load();
    }
  };

  // Handle browser-specific video issues
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // iOS Safari specific handling
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS) {
      video.setAttribute('playsinline', 'true');
      video.setAttribute('webkit-playsinline', 'true');
    }

    // Handle autoplay policies
    if (autoplay && canPlay) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.warn('Autoplay prevented:', error);
          // Autoplay was prevented, but that's okay
        });
      }
    }
  }, [autoplay, canPlay]);

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

  // Handle YouTube videos with iframe embed
  if (isYouTubeVideo) {
    const videoId = getYouTubeVideoId(post.mediaUrl);
    if (videoId) {
      const embedUrl = `https://www.youtube.com/embed/${videoId}?${autoplay ? 'autoplay=1&' : ''}${muted ? 'mute=1&' : ''}rel=0&modestbranding=1`;
      
      return (
        <div className="video-player-container youtube-container">
          <div className="youtube-embed-wrapper">
            <iframe
              className="youtube-embed"
              src={embedUrl}
              title={post.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ 
                width: '100%', 
                height: '315px',
                aspectRatio: '16/9'
              }}
            />
          </div>
        </div>
      );
    }
  }

  return (
    <div className="video-player-container">
      {isLoading && (
        <div className="media-loading">
          <div className="loading-spinner"></div>
        </div>
      )}
      
      <video
        ref={videoRef}
        className="video-player"
        poster={post.thumbnailUrl}
        controls
        muted={muted}
        autoPlay={autoplay}
        playsInline
        webkit-playsinline="true"
        preload={lazy ? "none" : preload}
        onError={handleError}
        onLoadStart={handleLoadStart}
        onCanPlay={handleCanPlay}
        onLoadedData={handleLoadedData}
        style={{ width: '100%', height: 'auto' }}
      >
        {videoSources.map((source, index) => (
          <source key={index} src={source.src} type={source.type} />
        ))}
        Your browser does not support the video tag.
      </video>
      
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

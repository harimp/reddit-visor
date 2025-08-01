import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { useVideoPlayback } from '../hooks/useVideoPlayback.js';

function VideoPlayer({ post, autoplay = false, muted = true, preload = "metadata", lazy = false, isVisible = true, elementRef }) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const playerRef = useRef(null);
  
  // Use the video playback hook to manage play/pause based on visibility and focus
  const {
    shouldPlay
  } = useVideoPlayback({
    elementRef,
    isVisible,
    autoplay,
    pauseOnBlur: true
  });
  
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

  // Handle oembed content
  if (post.hasOembed && post.oembedHtml) {
    // Calculate aspect ratio from oembed data and set as CSS custom property
    const oembedContainerStyle = React.useMemo(() => {
      const style = { width: '100%' };
      
      if (post.oembedData?.width && post.oembedData?.height) {
        const aspectRatio = post.oembedData.width / post.oembedData.height;
        style['--video-aspect-ratio'] = aspectRatio;
        style.aspectRatio = `${aspectRatio}`;
      } else {
        style.minHeight = '200px';
      }
      
      return style;
    }, [post.oembedData?.width, post.oembedData?.height]);

    // Effect to manage oembed video playback based on visibility and focus
    useEffect(() => {
      if (!isVisible || !shouldPlay) {
        // Try to pause embedded videos when not visible or should not play
        const iframes = elementRef?.current?.querySelectorAll('iframe');
        if (iframes) {
          iframes.forEach(iframe => {
            try {
              // For YouTube embeds, try to pause via postMessage
              if (iframe.src.includes('youtube.com') || iframe.src.includes('youtu.be')) {
                iframe.contentWindow?.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
              }
              // For other video embeds, we can't control them directly
              // but the visibility management helps with performance
            } catch (e) {
              // Cross-origin restrictions may prevent this, which is expected
            }
          });
        }
      }
    }, [isVisible, shouldPlay, elementRef]);

    return (
      <div className="video-player-container oembed-container" style={oembedContainerStyle}>
        <div 
          className="oembed-content"
          dangerouslySetInnerHTML={{ __html: post.oembedHtml }}
          style={{
            width: '100%',
            height: '100%',
            position: 'relative'
          }}
        />
        
        {/* Provider badge for oembed content */}
        {post.oembedData?.provider_name && (
          <div className="oembed-provider-badge">
            {post.oembedData.provider_name}
          </div>
        )}
      </div>
    );
  }

  // Get the best video URL for react-player (single URL, not array)
  const getVideoUrl = () => {
    // The redditClient has already prioritized HLS > DASH > fallback in mediaUrl
    // So we can just use the processed mediaUrl directly
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

  const handlePause = () => {
    // Video was paused by user interaction
  };

  const handleBuffer = () => {
    setIsLoading(true);
  };

  const handleBufferEnd = () => {
    setIsLoading(false);
  };

  // ReactPlayer handles the playing state automatically via the playing prop
  // No need for manual sync as ReactPlayer will play/pause based on the playing prop

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
        ref={playerRef}
        src={videoUrl}
        className="react-player"
        width="100%"
        height="100%"
        playing={shouldPlay}
        muted={muted}
        controls={true}
        playsinline={true}
        onPlay={handlePlay}
        onPause={handlePause}
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

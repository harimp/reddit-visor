import React, { useState } from 'react';
import { getRelativeTime } from '../utils/timeUtils';
import { getSubredditBadgeStyle } from '../utils/subredditColors.js';
import VideoPlayer from './VideoPlayer.jsx';

function PostCard({ post }) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleLinkClick = (e) => {
    e.preventDefault();
    window.open(`https://reddit.com${post.permalink}`, '_blank');
  };

  const handleAuthorClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(`https://reddit.com/user/${post.author}`, '_blank');
  };

  const handleSubredditClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(`https://reddit.com/r/${post.subreddit}`, '_blank');
  };

  const handleMediaClick = (e) => {
    e.preventDefault();
    if (post.mediaUrl) {
      window.open(post.mediaUrl, '_blank');
    }
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(true);
  };

  const renderMedia = () => {
    if (post.mediaType === 'image' && post.mediaUrl && !imageError) {
      return (
        <div className="media-container" onClick={handleMediaClick}>
          {!imageLoaded && (
            <div className="media-loading">
              <div className="loading-spinner"></div>
            </div>
          )}
          <img
            src={post.mediaUrl}
            alt={post.title}
            onLoad={handleImageLoad}
            onError={handleImageError}
            style={{ display: imageLoaded ? 'block' : 'none' }}
          />
        </div>
      );
    }

    if (post.mediaType === 'gif' && post.mediaUrl && !imageError) {
      return (
        <div className="media-container" onClick={handleMediaClick}>
          {!imageLoaded && (
            <div className="media-loading">
              <div className="loading-spinner"></div>
            </div>
          )}
          <img
            src={post.mediaUrl}
            alt={post.title}
            onLoad={handleImageLoad}
            onError={handleImageError}
            style={{ display: imageLoaded ? 'block' : 'none' }}
          />
          <div className="gif-indicator">GIF</div>
        </div>
      );
    }

    if (post.mediaType === 'video') {
      // Check if this is a Reddit hosted video with video data
      const isRedditVideo = post.videoData && (
        post.mediaUrl?.includes('v.redd.it') || 
        post.videoData.fallback_url?.includes('v.redd.it')
      );

      if (isRedditVideo) {
        // Use VideoPlayer component for Reddit hosted videos
        return (
          <div className="media-container">
            <VideoPlayer 
              post={post} 
              autoplay={false} 
              muted={true} 
            />
          </div>
        );
      } else {
        // For non-Reddit videos (YouTube, etc.), show thumbnail with play button
        const videoThumbnail = post.thumbnailUrl || post.mediaUrl;
        
        if (videoThumbnail && !imageError) {
          return (
            <div className="media-container video-container" onClick={handleMediaClick}>
              {!imageLoaded && (
                <div className="media-loading">
                  <div className="loading-spinner"></div>
                </div>
              )}
              <img
                src={videoThumbnail}
                alt={post.title}
                onLoad={handleImageLoad}
                onError={handleImageError}
                style={{ display: imageLoaded ? 'block' : 'none' }}
              />
              <div className="video-indicator">
                <div className="play-button">▶</div>
                {post.videoData?.duration && (
                  <div className="video-duration">
                    {Math.floor(post.videoData.duration / 60)}:{(post.videoData.duration % 60).toString().padStart(2, '0')}
                  </div>
                )}
              </div>
              {post.videoData?.hasAudio === false && (
                <div className="no-audio-indicator">🔇</div>
              )}
            </div>
          );
        } else {
          // Fallback for videos without thumbnails
          return (
            <div className="media-container video-container-fallback" onClick={handleMediaClick}>
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
      }
    }

    // Fallback for text posts or failed media
    return (
      <div className="media-container text-container">
        <div className="text-content">
          <div className="emoji-large">{post.emojiTag}</div>
          <div className="text-preview">
            {post.hasContent ? post.content : 'Text post'}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="post-card">
      {renderMedia()}
      
      <div className="post-info">
        <div className="post-header">
          <span className="emoji-tag">{post.emojiTag}</span>
          <span 
            className="subreddit-badge"
            style={getSubredditBadgeStyle(post.subreddit)}
            onClick={handleSubredditClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleSubredditClick(e);
              }
            }}
          >
            r/{post.subreddit}
          </span>
        </div>
        
        <h3 className="post-title" onClick={handleLinkClick}>
          {post.title}
        </h3>
        
        <div className="post-meta">
          <span 
            className="post-author"
            onClick={handleAuthorClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleAuthorClick(e);
              }
            }}
          >
            u/{post.author}
          </span>
          <span className="post-separator">•</span>
          <span className="post-time">{getRelativeTime(post.createdUtc)}</span>
          <span className="post-separator">•</span>
          <span className="post-upvotes">↑ {post.ups}</span>
        </div>
      </div>
    </div>
  );
}

export default PostCard;

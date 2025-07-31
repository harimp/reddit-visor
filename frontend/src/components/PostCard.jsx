import React from 'react';
import { getRelativeTime } from '../utils/timeUtils';
import { getSubredditBadgeStyle } from '../utils/subredditColors.js';
import LazyImage from './LazyImage.jsx';
import LazyVideoPlayer from './LazyVideoPlayer.jsx';
import ImageGallery from './ImageGallery.jsx';

function PostCard({ post }) {

  // Function to get media type tag info
  const getMediaTypeTag = () => {
    if (post.mediaType === 'gallery') {
      return { label: 'GALLERY', icon: '🖼️', className: 'media-tag-gallery' };
    }
    
    if (post.mediaType === 'image') {
      return { label: 'IMAGE', icon: '🖼️', className: 'media-tag-image' };
    }
    
    if (post.mediaType === 'gif') {
      return { label: 'GIF', icon: '🎞️', className: 'media-tag-gif' };
    }
    
    if (post.mediaType === 'video') {
      // Determine video type
      if (post.mediaUrl?.includes('youtube.com') || post.mediaUrl?.includes('youtu.be')) {
        return { label: 'YOUTUBE', icon: '📺', className: 'media-tag-youtube' };
      } else if (post.mediaUrl?.includes('v.redd.it') || post.videoData?.fallback_url?.includes('v.redd.it')) {
        return { label: 'REDDIT VIDEO', icon: '🎥', className: 'media-tag-reddit-video' };
      } else {
        return { label: 'VIDEO', icon: '🎬', className: 'media-tag-video' };
      }
    }
    
    // Default for text posts
    return { label: 'TEXT', icon: '📝', className: 'media-tag-text' };
  };

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


  const renderMedia = () => {
    if (post.mediaType === 'gallery' && post.galleryData && post.mediaMetadata) {
      return (
        <div className="media-container">
          <ImageGallery
            galleryData={post.galleryData}
            mediaMetadata={post.mediaMetadata}
            title={post.title}
            onImageClick={(e, imageUrl) => {
              e.preventDefault();
              window.open(imageUrl, '_blank');
            }}
          />
        </div>
      );
    }

    if (post.mediaType === 'image' && post.mediaUrl) {
      return (
        <div className="media-container">
          <LazyImage
            src={post.mediaUrl}
            alt={post.title}
            onClick={handleMediaClick}
            isGif={false}
          />
        </div>
      );
    }

    if (post.mediaType === 'gif' && post.mediaUrl) {
      return (
        <div className="media-container">
          <LazyImage
            src={post.mediaUrl}
            alt={post.title}
            onClick={handleMediaClick}
            isGif={true}
          />
        </div>
      );
    }

    if (post.mediaType === 'video') {
      // Use LazyVideoPlayer for ALL video types (Reddit, YouTube, etc.)
      // ReactPlayer handles all video sources automatically
      return (
        <div className="media-container">
          <LazyVideoPlayer 
            post={post} 
            autoplay={true} 
            muted={true} 
          />
        </div>
      );
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

  const mediaTag = getMediaTypeTag();

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
          <span className={`media-type-tag ${mediaTag.className}`}>
            <span className="media-tag-icon">{mediaTag.icon}</span>
            <span className="media-tag-label">{mediaTag.label}</span>
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

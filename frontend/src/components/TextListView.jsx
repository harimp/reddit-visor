import React from 'react';
import { getRelativeTime } from '../utils/timeUtils';
import { getSubredditBadgeStyle } from '../utils/subredditColors.js';

function TextListView({ posts }) {
  const handleLinkClick = (post, e) => {
    e.preventDefault();
    window.open(`https://reddit.com${post.permalink}`, '_blank');
  };

  const handleAuthorClick = (post, e) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(`https://reddit.com/user/${post.author}`, '_blank');
  };

  const handleSubredditClick = (post, e) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(`https://reddit.com/r/${post.subreddit}`, '_blank');
  };

  const handleMediaClick = (post, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (post.mediaUrl) {
      window.open(post.mediaUrl, '_blank');
    }
  };

  const getMediaTypeInfo = (post) => {
    if (post.mediaType === 'gallery') {
      return { label: 'Gallery', icon: '🖼️', className: 'media-type-gallery' };
    }
    if (post.mediaType === 'image') {
      return { label: 'Image', icon: '🖼️', className: 'media-type-image' };
    }
    if (post.mediaType === 'gif') {
      return { label: 'GIF', icon: '🎞️', className: 'media-type-gif' };
    }
    if (post.mediaType === 'video') {
      if (post.mediaUrl?.includes('youtube.com') || post.mediaUrl?.includes('youtu.be')) {
        return { label: 'YouTube', icon: '📺', className: 'media-type-youtube' };
      } else if (post.mediaUrl?.includes('v.redd.it') || post.videoData?.fallback_url?.includes('v.redd.it')) {
        return { label: 'Reddit Video', icon: '🎥', className: 'media-type-reddit-video' };
      } else {
        return { label: 'Video', icon: '🎬', className: 'media-type-video' };
      }
    }
    return { label: 'Text', icon: '📝', className: 'media-type-text' };
  };

  const renderMediaThumbnail = (post) => {
    const mediaInfo = getMediaTypeInfo(post);
    
    if (post.mediaType === 'text' || !post.mediaUrl) {
      return (
        <div className="list-media-placeholder">
          <div className="media-icon">{post.emojiTag}</div>
          <div className="media-type-indicator">
            <span className="media-icon-small">{mediaInfo.icon}</span>
            <span className="media-label">{mediaInfo.label}</span>
          </div>
        </div>
      );
    }

    if (post.mediaType === 'image' || post.mediaType === 'gif') {
      return (
        <div className="list-media-thumbnail" onClick={(e) => handleMediaClick(post, e)}>
          <img 
            src={post.mediaUrl} 
            alt={post.title}
            loading="lazy"
          />
          <div className="media-type-overlay">
            <span className="media-icon-small">{mediaInfo.icon}</span>
          </div>
        </div>
      );
    }

    if (post.mediaType === 'video') {
      return (
        <div className="list-media-thumbnail video" onClick={(e) => handleMediaClick(post, e)}>
          {post.thumbnail && post.thumbnail !== 'self' && post.thumbnail !== 'default' ? (
            <img 
              src={post.thumbnail} 
              alt={post.title}
              loading="lazy"
            />
          ) : (
            <div className="video-placeholder">
              <span className="video-icon">🎬</span>
            </div>
          )}
          <div className="media-type-overlay">
            <span className="media-icon-small">{mediaInfo.icon}</span>
            <span className="play-indicator">▶</span>
          </div>
        </div>
      );
    }

    if (post.mediaType === 'gallery') {
      return (
        <div className="list-media-thumbnail gallery" onClick={(e) => handleMediaClick(post, e)}>
          {post.galleryData && post.galleryData.length > 0 && post.mediaMetadata ? (
            <img 
              src={post.mediaMetadata[post.galleryData[0].media_id]?.s?.u?.replace(/&amp;/g, '&')} 
              alt={post.title}
              loading="lazy"
            />
          ) : (
            <div className="gallery-placeholder">
              <span className="gallery-icon">🖼️</span>
            </div>
          )}
          <div className="media-type-overlay">
            <span className="media-icon-small">{mediaInfo.icon}</span>
            <span className="gallery-count">+{post.galleryData?.length || 1}</span>
          </div>
        </div>
      );
    }

    return null;
  };

  if (posts.length === 0) {
    return (
      <div className="text-list-empty">
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <h3>No posts found</h3>
          <p>Try adjusting your filters or check back later for new content.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="text-list-view">
      {posts.map(post => (
        <div key={post.id} className="text-list-item">
          <div className="list-item-content">
            <div className="list-item-main">
              <div className="list-item-header">
                <div className="list-item-meta">
                  <span 
                    className="subreddit-badge"
                    style={getSubredditBadgeStyle(post.subreddit)}
                    onClick={(e) => handleSubredditClick(post, e)}
                    role="button"
                    tabIndex={0}
                  >
                    r/{post.subreddit}
                  </span>
                  <span className="meta-separator">•</span>
                  <span 
                    className="post-author"
                    onClick={(e) => handleAuthorClick(post, e)}
                    role="button"
                    tabIndex={0}
                  >
                    u/{post.author}
                  </span>
                  <span className="meta-separator">•</span>
                  <span className="post-time">{getRelativeTime(post.createdUtc)}</span>
                </div>
              </div>
              
              <h2 className="list-item-title" onClick={(e) => handleLinkClick(post, e)}>
                {post.title}
              </h2>
              
              {post.hasContent && post.content && (
                <div className="list-item-content-text">
                  <p>{post.content.length > 300 ? `${post.content.substring(0, 300)}...` : post.content}</p>
                </div>
              )}
              
              <div className="list-item-footer">
                <div className="list-item-stats">
                  <span className="upvotes">↑ {post.ups}</span>
                  <span className="meta-separator">•</span>
                  <span className="comments">💬 {post.num_comments || 0}</span>
                </div>
                <div className="list-item-actions">
                  <button 
                    className="action-link"
                    onClick={(e) => handleLinkClick(post, e)}
                  >
                    View on Reddit
                  </button>
                </div>
              </div>
            </div>
            
            <div className="list-item-media">
              {renderMediaThumbnail(post)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default TextListView;

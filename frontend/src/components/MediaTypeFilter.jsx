import React from 'react';

function MediaTypeFilter({ posts, activeMediaTypes, onMediaTypeChange }) {
  // Get counts for each media type
  const getMediaTypeCounts = () => {
    const counts = {
      all: posts.length,
      image: 0,
      gif: 0,
      video: 0,
      gallery: 0,
      text: 0
    };

    posts.forEach(post => {
      if (post.mediaType === 'image') {
        counts.image++;
      } else if (post.mediaType === 'gif') {
        counts.gif++;
      } else if (post.mediaType === 'video') {
        counts.video++;
      } else if (post.mediaType === 'gallery') {
        counts.gallery++;
      } else {
        counts.text++;
      }
    });

    return counts;
  };

  const counts = getMediaTypeCounts();

  // Media type configurations
  const mediaTypes = [
    { key: 'all', label: 'All', emoji: '📋', count: counts.all },
    { key: 'image', label: 'Images', emoji: '🖼️', count: counts.image },
    { key: 'gif', label: 'GIFs', emoji: '🎞️', count: counts.gif },
    { key: 'video', label: 'Videos', emoji: '🎬', count: counts.video },
    { key: 'gallery', label: 'Galleries', emoji: '🖼️', count: counts.gallery },
    { key: 'text', label: 'Text', emoji: '📝', count: counts.text }
  ];

  const handleMediaTypeToggle = (mediaType) => {
    if (mediaType === 'all') {
      // If "All" is clicked, clear all filters
      onMediaTypeChange([]);
    } else {
      // Toggle the specific media type
      const newActiveTypes = activeMediaTypes.includes(mediaType)
        ? activeMediaTypes.filter(type => type !== mediaType)
        : [...activeMediaTypes, mediaType];
      
      onMediaTypeChange(newActiveTypes);
    }
  };

  const isActive = (mediaType) => {
    if (mediaType === 'all') {
      return activeMediaTypes.length === 0;
    }
    return activeMediaTypes.includes(mediaType);
  };

  return (
    <div className="media-type-filter">
      <div className="media-type-filter-header">
        <h3 className="media-type-filter-title">Filter by Media Type</h3>
        {activeMediaTypes.length > 0 && (
          <div className="media-type-filter-actions">
            <button
              className="media-type-action-button"
              onClick={() => onMediaTypeChange([])}
              title="Clear all media type filters"
            >
              Clear All
            </button>
          </div>
        )}
      </div>
      
      <div className="media-type-buttons">
        {mediaTypes.map(({ key, label, emoji, count }) => (
          <button
            key={key}
            className={`media-type-button ${isActive(key) ? 'active' : ''}`}
            onClick={() => handleMediaTypeToggle(key)}
            disabled={count === 0 && key !== 'all'}
            title={`${label}: ${count} posts`}
          >
            <span className="media-type-emoji">{emoji}</span>
            <span className="media-type-name">{label}</span>
            <span className="media-type-count">({count})</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default MediaTypeFilter;

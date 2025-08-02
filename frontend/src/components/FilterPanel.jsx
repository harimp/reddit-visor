import React, { useState } from 'react';
import { getSubredditButtonStyle } from '../utils/subredditColors.js';
import { getRedditClient } from '../services/redditClient.js';

function FilterPanel({ 
  posts, 
  activeSubreddits, 
  onSubredditChange,
  activeMediaTypes, 
  onMediaTypeChange,
  sortBy, 
  onSortChange,
  onNsfwChange 
}) {
  const [expandedSection, setExpandedSection] = useState(null);
  const redditClient = getRedditClient();
  const nsfwSetting = redditClient.getNsfwSetting();

  // Get media type counts
  const getMediaTypeCounts = () => {
    const counts = { image: 0, gif: 0, video: 0, gallery: 0, text: 0 };
    posts.forEach(post => {
      if (counts.hasOwnProperty(post.mediaType)) {
        counts[post.mediaType]++;
      } else {
        counts.text++;
      }
    });
    return counts;
  };

  // Get subreddit counts
  const getSubredditCounts = () => {
    const counts = posts.reduce((acc, post) => {
      acc[post.subreddit] = (acc[post.subreddit] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts)
      .sort(([,a], [,b]) => b - a)
      .map(([subreddit, count]) => ({ subreddit, count }));
  };

  const mediaCounts = getMediaTypeCounts();
  const subredditData = getSubredditCounts();

  const mediaTypes = [
    { key: 'image', emoji: '🖼️', count: mediaCounts.image },
    { key: 'gif', emoji: '🎞️', count: mediaCounts.gif },
    { key: 'video', emoji: '🎬', count: mediaCounts.video },
    { key: 'gallery', emoji: '🖼️', count: mediaCounts.gallery },
    { key: 'text', emoji: '📝', count: mediaCounts.text }
  ];

  const sortOptions = [
    { key: 'createTime', icon: '🕒' },
    { key: 'upvotes', icon: '⬆️' },
    { key: 'username', icon: '👤' }
  ];

  const handleMediaTypeToggle = (mediaType) => {
    const newActiveTypes = activeMediaTypes.includes(mediaType)
      ? activeMediaTypes.filter(type => type !== mediaType)
      : [...activeMediaTypes, mediaType];
    onMediaTypeChange(newActiveTypes);
  };

  const handleSubredditToggle = (subreddit) => {
    const newActiveSubreddits = activeSubreddits.includes(subreddit)
      ? activeSubreddits.filter(s => s !== subreddit)
      : [...activeSubreddits, subreddit];
    onSubredditChange(newActiveSubreddits);
  };

  const handleNsfwToggle = () => {
    const newSetting = nsfwSetting === 'sfw' ? 'nsfw' : 'sfw';
    redditClient.setNsfwSetting(newSetting);
    onNsfwChange(newSetting);
  };

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const getActiveFiltersCount = () => {
    return activeSubreddits.length + activeMediaTypes.length + (nsfwSetting === 'nsfw' ? 1 : 0);
  };

  const clearAllFilters = () => {
    onSubredditChange([]);
    onMediaTypeChange([]);
    if (nsfwSetting === 'nsfw') {
      redditClient.setNsfwSetting('sfw');
      onNsfwChange('sfw');
    }
  };

  return (
    <div className="filter-panel">
      {/* Compact Filter Bar */}
      <div className="filter-bar">
        {/* Left Side - Sort Control */}
        <div className="filter-left">
          <div className="filter-section">
            <span className="filter-label">Sort:</span>
            <div className="filter-buttons">
              {sortOptions.map(({ key, icon }) => (
                <button
                  key={key}
                  className={`filter-btn ${sortBy === key ? 'active' : ''}`}
                  onClick={() => onSortChange(key)}
                  title={key}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center - Media Type Quick Filters */}
        <div className="filter-center">
          <div className="filter-section">
            <div className="filter-buttons">
              <button
                className={`filter-btn ${activeMediaTypes.length === 0 ? 'active' : ''}`}
                onClick={() => onMediaTypeChange([])}
                title="Show all media types"
              >
                All
              </button>
              {mediaTypes.map(({ key, emoji, count }) => (
                <button
                  key={key}
                  className={`filter-btn ${activeMediaTypes.includes(key) ? 'active' : ''}`}
                  onClick={() => handleMediaTypeToggle(key)}
                  disabled={count === 0}
                  title={`${key}: ${count} posts`}
                >
                  {emoji} {count}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side - NSFW, Subreddit, Clear */}
        <div className="filter-right">
          {/* NSFW Toggle */}
          <div className="filter-section">
            <button
              className={`filter-btn nsfw-btn ${nsfwSetting === 'nsfw' ? 'active' : ''}`}
              onClick={handleNsfwToggle}
              title={nsfwSetting === 'sfw' ? 'Show NSFW content' : 'Hide NSFW content'}
            >
              {nsfwSetting === 'sfw' ? '🔒 SFW' : '🔓 NSFW'}
            </button>
          </div>

          {/* Subreddit Filter Toggle */}
          <div className="filter-section">
            <button
              className={`filter-btn expand-btn ${expandedSection === 'subreddits' ? 'active' : ''}`}
              onClick={() => toggleSection('subreddits')}
              title="Toggle subreddit filters"
            >
              📋 Subreddits {activeSubreddits.length > 0 && `(${subredditData.length - activeSubreddits.length}/${subredditData.length})`}
            </button>
          </div>

          {/* Clear All Filters */}
          {getActiveFiltersCount() > 0 && (
            <div className="filter-section">
              <button
                className="filter-btn clear-btn"
                onClick={clearAllFilters}
                title="Clear all filters"
              >
                ✕ Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Expandable Subreddit Section */}
      {expandedSection === 'subreddits' && (
        <div className="filter-expanded">
          <div className="subreddit-filter-expanded">
            <div className="subreddit-actions">
              <button 
                className="action-btn"
                onClick={() => onSubredditChange([])}
                disabled={activeSubreddits.length === 0}
              >
                Show All
              </button>
              <button 
                className="action-btn"
                onClick={() => onSubredditChange(subredditData.map(({ subreddit }) => subreddit))}
                disabled={activeSubreddits.length === subredditData.length}
              >
                Hide All
              </button>
            </div>
            <div className="subreddit-buttons">
              {subredditData.map(({ subreddit, count }) => {
                const isVisible = !activeSubreddits.includes(subreddit);
                return (
                  <button
                    key={subreddit}
                    className={`subreddit-btn ${isVisible ? 'visible' : 'hidden'}`}
                    onClick={() => handleSubredditToggle(subreddit)}
                    style={getSubredditButtonStyle(subreddit, isVisible)}
                  >
                    r/{subreddit} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FilterPanel;

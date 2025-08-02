import React from 'react';
import { getRedditClient } from '../services/redditClient.js';

const NSFWFilter = ({ onNsfwChange }) => {
  const redditClient = getRedditClient();
  const currentSetting = redditClient.getNsfwSetting();

  const handleToggle = () => {
    const newSetting = currentSetting === 'sfw' ? 'nsfw' : 'sfw';
    redditClient.setNsfwSetting(newSetting);
    onNsfwChange(newSetting);
  };

  return (
    <div className="nsfw-filter">
      <div className="filter-header">
        <h3>Content Filter</h3>
      </div>
      <div className="nsfw-toggle-container">
        <button
          className={`nsfw-toggle ${currentSetting}`}
          onClick={handleToggle}
          title={currentSetting === 'sfw' ? 'Currently showing Safe for Work content only' : 'Currently including NSFW content'}
        >
          <span className="nsfw-icon">
            {currentSetting === 'sfw' ? '🔒' : '🔓'}
          </span>
          <span className="nsfw-label">
            {currentSetting === 'sfw' ? 'Safe for Work' : 'Include NSFW'}
          </span>
        </button>
        <div className="nsfw-description">
          {currentSetting === 'sfw' 
            ? 'Only showing safe for work content' 
            : 'Including NSFW content from all subreddits'
          }
        </div>
      </div>
    </div>
  );
};

export default NSFWFilter;

import React from 'react';
import { getSubredditButtonStyle } from '../utils/subredditColors.js';

function SubredditFilter({ posts, activeSubreddits, onSubredditChange }) {

  // Get unique subreddits from posts with counts
  const subredditCounts = posts.reduce((acc, post) => {
    const subreddit = post.subreddit;
    acc[subreddit] = (acc[subreddit] || 0) + 1;
    return acc;
  }, {});

  // Sort subreddits by count (descending)
  const sortedSubreddits = Object.entries(subredditCounts)
    .sort(([,a], [,b]) => b - a)
    .map(([subreddit, count]) => ({ subreddit, count }));

  const handleSubredditToggle = (subreddit) => {
    const newActiveSubreddits = activeSubreddits.includes(subreddit)
      ? activeSubreddits.filter(s => s !== subreddit)
      : [...activeSubreddits, subreddit];
    
    onSubredditChange(newActiveSubreddits);
  };

  const handleSelectAll = () => {
    onSubredditChange([]);
  };

  const handleSelectNone = () => {
    onSubredditChange(sortedSubreddits.map(({ subreddit }) => subreddit));
  };

  return (
    <div className="subreddit-filter">
      <div className="subreddit-filter-header">
        <h3 className="subreddit-filter-title">Filter by Subreddit</h3>
        <div className="subreddit-filter-actions">
          <button 
            className="subreddit-action-button"
            onClick={handleSelectAll}
            disabled={activeSubreddits.length === 0}
          >
            All
          </button>
          <button 
            className="subreddit-action-button"
            onClick={handleSelectNone}
            disabled={activeSubreddits.length === sortedSubreddits.length}
          >
            None
          </button>
        </div>
      </div>
      
      <div className="subreddit-buttons">
        {sortedSubreddits.map(({ subreddit, count }) => {
          const isActive = !activeSubreddits.includes(subreddit);
          
          return (
            <button
              key={subreddit}
              className={`subreddit-button ${isActive ? 'active' : ''}`}
              onClick={() => handleSubredditToggle(subreddit)}
              style={getSubredditButtonStyle(subreddit, isActive)}
            >
              <span className="subreddit-name">r/{subreddit}</span>
              <span className="subreddit-count">({count})</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default SubredditFilter;

import React from 'react';

function SortControl({ sortBy, onSortChange }) {
  const sortOptions = [
    { key: 'createTime', label: 'Create Time', icon: '🕒' },
    { key: 'upvotes', label: 'Upvotes', icon: '⬆️' },
    { key: 'username', label: 'Username', icon: '👤' }
  ];

  return (
    <div className="sort-control">
      <div className="sort-title">Sort by:</div>
      <div className="sort-buttons">
        {sortOptions.map(option => (
          <button
            key={option.key}
            className={`sort-button ${sortBy === option.key ? 'active' : ''}`}
            onClick={() => onSortChange(option.key)}
          >
            <span className="sort-icon">{option.icon}</span>
            <span className="sort-label">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default SortControl;

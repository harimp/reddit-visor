import React from 'react';

function ViewToggle({ viewMode, onViewModeChange }) {
  return (
    <div className="view-toggle">
      <button
        className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
        onClick={() => onViewModeChange('grid')}
        title="Grid view"
      >
        <span className="toggle-icon">▦</span>
        <span className="toggle-label">Grid</span>
      </button>
      <button
        className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
        onClick={() => onViewModeChange('list')}
        title="List view"
      >
        <span className="toggle-icon">☰</span>
        <span className="toggle-label">List</span>
      </button>
    </div>
  );
}

export default ViewToggle;

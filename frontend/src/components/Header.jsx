import React from 'react';
import RefreshTimer from './RefreshTimer.jsx';

function Header({ totalPosts, filteredPosts, lastUpdated, error, hasActiveFilters, isPolling, pollingInterval, onRefresh }) {
  const formatLastUpdated = (date) => {
    if (!date) return 'Never';
    return date.toLocaleTimeString();
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <h1>Reddit Visor - Live Feed</h1>
          <div className="status-info">
            <div className="status-item">
              <span className="label">Total Posts:</span>
              <span className="value">{totalPosts}</span>
            </div>
            {hasActiveFilters && (
              <div className="status-item">
                <span className="label">Filtered Posts:</span>
                <span className="value">{filteredPosts}</span>
              </div>
            )}
            <div className="status-item">
              <span className="label">Last Updated:</span>
              <span className="value">{formatLastUpdated(lastUpdated)}</span>
            </div>
            {error && (
              <div className="status-item error-status">
                <span className="label">Status:</span>
                <span className="value">Error</span>
              </div>
            )}
            {!error && (
              <div className="status-item success-status">
                <span className="label">Status:</span>
                <span className="value">Live</span>
              </div>
            )}
          </div>
        </div>
        <div className="header-right">
          <button
            className="refresh-now-btn"
            onClick={onRefresh}
            disabled={!onRefresh}
            title="Refresh data now"
          >
            🔄 Refresh Now
          </button>
          <RefreshTimer 
            pollingInterval={pollingInterval}
            lastUpdated={lastUpdated}
            isPolling={isPolling}
          />
        </div>
      </div>
    </header>
  );
}

export default Header;

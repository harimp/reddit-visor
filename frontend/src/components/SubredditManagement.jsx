import React, { useState, useEffect } from 'react';
import { getRedditClient } from '../services/redditClient.js';

function SubredditManagement({ onConfigChange }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [subredditConfigs, setSubredditConfigs] = useState([]);
  const [newConfig, setNewConfig] = useState({
    subreddit: '',
    sortType: 'hot',
    timeframe: null
  });
  const [editingConfigId, setEditingConfigId] = useState(null);
  const [editForm, setEditForm] = useState({
    subreddit: '',
    sortType: 'hot',
    timeframe: null
  });

  // Available sort types
  const sortTypes = [
    { value: 'hot', label: 'Hot' },
    { value: 'new', label: 'New' },
    { value: 'rising', label: 'Rising' },
    { value: 'top', label: 'Top' }
  ];

  // Available timeframes for 'top' sort
  const timeframes = [
    { value: 'hour', label: 'Hour' },
    { value: 'day', label: 'Day' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
    { value: 'year', label: 'Year' },
    { value: 'all', label: 'All Time' }
  ];

  // Load current configurations on mount
  useEffect(() => {
    loadConfigurations();
  }, []);

  const loadConfigurations = () => {
    try {
      const redditClient = getRedditClient();
      const configs = redditClient.getSubredditConfigs();
      setSubredditConfigs(configs);
    } catch (error) {
      console.error('Error loading subreddit configurations:', error);
    }
  };

  const handleRemoveConfig = (configId) => {
    try {
      const redditClient = getRedditClient();
      redditClient.removeSubredditConfig(configId);
      loadConfigurations();
      onConfigChange?.();
    } catch (error) {
      console.error('Error removing configuration:', error);
    }
  };

  const handleAddConfig = () => {
    if (!newConfig.subreddit.trim()) {
      alert('Please enter a subreddit name.');
      return;
    }

    try {
      const redditClient = getRedditClient();
      
      redditClient.addSubredditConfig(
        newConfig.subreddit.trim(),
        newConfig.sortType,
        newConfig.timeframe
      );
      
      // Reset form
      setNewConfig({
        subreddit: '',
        sortType: 'hot',
        timeframe: null
      });
      
      loadConfigurations();
      onConfigChange?.();
    } catch (error) {
      console.error('Error adding configuration:', error);
      alert('Error adding configuration. Please try again.');
    }
  };

  const handleStartEdit = (config) => {
    setEditingConfigId(config.id);
    setEditForm({
      subreddit: config.subreddit,
      sortType: config.sortType,
      timeframe: config.timeframe
    });
  };

  const handleCancelEdit = () => {
    setEditingConfigId(null);
    setEditForm({
      subreddit: '',
      sortType: 'hot',
      timeframe: null
    });
  };

  const handleSaveEdit = () => {
    if (!editForm.subreddit.trim()) {
      alert('Please enter a subreddit name.');
      return;
    }

    try {
      const redditClient = getRedditClient();
      
      redditClient.updateSubredditConfig(
        editingConfigId,
        editForm.subreddit.trim(),
        editForm.sortType,
        editForm.timeframe
      );
      
      setEditingConfigId(null);
      setEditForm({
        subreddit: '',
        sortType: 'hot',
        timeframe: null
      });
      
      loadConfigurations();
      onConfigChange?.();
    } catch (error) {
      console.error('Error updating configuration:', error);
      alert('Error updating configuration. Please try again.');
    }
  };

  const handleResetToDefaults = () => {
    const confirmReset = window.confirm(
      'Are you sure you want to reset all subreddit configurations to defaults? This will remove all custom configurations and restore the original picture-based subreddits.'
    );
    
    if (confirmReset) {
      try {
        const redditClient = getRedditClient();
        redditClient.resetToDefaultConfigs();
        loadConfigurations();
        onConfigChange?.();
        alert('Subreddit configurations have been reset to defaults.');
      } catch (error) {
        console.error('Error resetting to defaults:', error);
        alert('Error resetting configurations. Please try again.');
      }
    }
  };

  const getSortTypeLabel = (sortType) => {
    return sortTypes.find(s => s.value === sortType)?.label || sortType;
  };

  const getTimeframeLabel = (timeframe) => {
    return timeframes.find(t => t.value === timeframe)?.label || timeframe;
  };

  return (
    <div className="subreddit-management">
      <div className="subreddit-management-header">
        <div className="header-main" onClick={() => setIsExpanded(!isExpanded)}>
          <h2 className="subreddit-management-title">
            Subreddit Management
            <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
          </h2>
          <div className="subreddit-management-summary">
            {subredditConfigs.length} configurations
          </div>
        </div>
        <div className="header-actions">
          <button
            className="reset-defaults-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleResetToDefaults();
            }}
            title="Reset to default subreddit configurations"
          >
            🔄 Reset to Defaults
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="subreddit-management-content">
          {/* Current Configurations Section */}
          <div className="management-section">
            <h3 className="section-title">Current Configurations</h3>
            <div className="config-list">
              {subredditConfigs.map((config) => (
                <div key={config.id} className="config-item">
                  {editingConfigId === config.id ? (
                    // Edit form
                    <div className="edit-config-form">
                      <div className="edit-form-header">
                        <h4>Edit Configuration</h4>
                        <div className="edit-form-actions">
                          <button
                            className="save-edit-btn"
                            onClick={handleSaveEdit}
                          >
                            Save
                          </button>
                          <button
                            className="cancel-edit-btn"
                            onClick={handleCancelEdit}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                      
                      <div className="edit-form-content">
                        <div className="form-group">
                          <label htmlFor="edit-subreddit">Subreddit:</label>
                          <input
                            id="edit-subreddit"
                            type="text"
                            value={editForm.subreddit}
                            onChange={(e) => setEditForm(prev => ({ ...prev, subreddit: e.target.value }))}
                            className="subreddit-name-input"
                            placeholder="e.g., cats, funny, aww"
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="edit-sort-type">Sort Type:</label>
                          <select
                            id="edit-sort-type"
                            value={editForm.sortType}
                            onChange={(e) => setEditForm(prev => ({ 
                              ...prev, 
                              sortType: e.target.value,
                              timeframe: e.target.value === 'top' ? 'day' : null
                            }))}
                            className="sort-type-select"
                          >
                            {sortTypes.map(sort => (
                              <option key={sort.value} value={sort.value}>
                                {sort.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {editForm.sortType === 'top' && (
                          <div className="form-group">
                            <label htmlFor="edit-timeframe">Timeframe:</label>
                            <select
                              id="edit-timeframe"
                              value={editForm.timeframe || 'day'}
                              onChange={(e) => setEditForm(prev => ({ ...prev, timeframe: e.target.value }))}
                              className="timeframe-select"
                            >
                              {timeframes.map(time => (
                                <option key={time.value} value={time.value}>
                                  {time.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    // Normal display
                    <>
                      <div className="config-header">
                        <div className="config-info">
                          <span className="config-subreddit">r/{config.subreddit}</span>
                          <span className="config-sort">
                            {getSortTypeLabel(config.sortType)}
                            {config.timeframe && ` (${getTimeframeLabel(config.timeframe)})`}
                          </span>
                        </div>
                        <div className="config-actions">
                          <button
                            className="edit-config-btn"
                            onClick={() => handleStartEdit(config)}
                            title="Edit configuration"
                          >
                            ✏️
                          </button>
                          <button
                            className="remove-config-btn"
                            onClick={() => handleRemoveConfig(config.id)}
                            title="Remove configuration"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
              {subredditConfigs.length === 0 && (
                <div className="no-configs">No configurations found</div>
              )}
            </div>
          </div>

          {/* Add New Configuration Section */}
          <div className="management-section">
            <h3 className="section-title">Add New Configuration</h3>
            <div className="add-config-form">
              <div className="form-group">
                <label htmlFor="new-subreddit">Subreddit Name:</label>
                <input
                  id="new-subreddit"
                  type="text"
                  placeholder="e.g., cats, funny, aww"
                  value={newConfig.subreddit}
                  onChange={(e) => setNewConfig(prev => ({ ...prev, subreddit: e.target.value }))}
                  className="subreddit-name-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="new-sort-type">Sort Type:</label>
                <select
                  id="new-sort-type"
                  value={newConfig.sortType}
                  onChange={(e) => setNewConfig(prev => ({ 
                    ...prev, 
                    sortType: e.target.value,
                    timeframe: e.target.value === 'top' ? 'day' : null
                  }))}
                  className="sort-type-select"
                >
                  {sortTypes.map(sort => (
                    <option key={sort.value} value={sort.value}>
                      {sort.label}
                    </option>
                  ))}
                </select>
              </div>

              {newConfig.sortType === 'top' && (
                <div className="form-group">
                  <label htmlFor="new-timeframe">Timeframe:</label>
                  <select
                    id="new-timeframe"
                    value={newConfig.timeframe || 'day'}
                    onChange={(e) => setNewConfig(prev => ({ ...prev, timeframe: e.target.value }))}
                    className="timeframe-select"
                  >
                    {timeframes.map(time => (
                      <option key={time.value} value={time.value}>
                        {time.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <button
                className="add-config-btn"
                onClick={handleAddConfig}
                disabled={!newConfig.subreddit.trim()}
              >
                Add Configuration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SubredditManagement;

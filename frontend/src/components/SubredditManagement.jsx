import React, { useState, useEffect } from 'react';
import { getRedditClient } from '../services/redditClient.js';
import { parseKeywordQuery, validateQuery, getQueryExamples, formatQueryForDisplay } from '../utils/queryParser.js';

function SubredditManagement({ onConfigChange, redditClientReady }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [subredditConfigs, setSubredditConfigs] = useState([]);
  const [newConfig, setNewConfig] = useState({
    subreddit: '',
    sortType: 'hot',
    timeframe: null,
    keywords: '',
    configType: 'regular' // 'regular' or 'keyword'
  });
  const [showExamples, setShowExamples] = useState(false);
  const [queryValidation, setQueryValidation] = useState({ isValid: true, error: null });
  const [parsedQuery, setParsedQuery] = useState('');
  const [editQueryValidation, setEditQueryValidation] = useState({ isValid: true, error: null });
  const [editParsedQuery, setEditParsedQuery] = useState('');
  const [editingConfigId, setEditingConfigId] = useState(null);
  const [editForm, setEditForm] = useState({
    subreddit: '',
    sortType: 'hot',
    timeframe: null,
    keywords: '',
    configType: 'regular'
  });

  // Available sort types for regular feeds
  const regularSortTypes = [
    { value: 'hot', label: 'Hot' },
    { value: 'new', label: 'New' },
    { value: 'rising', label: 'Rising' },
    { value: 'top', label: 'Top' }
  ];

  // Available sort types for keyword search
  const searchSortTypes = [
    { value: 'relevance', label: 'Relevance', description: 'Best matches' },
    { value: 'hot', label: 'Hot', description: 'Trending posts' },
    { value: 'top', label: 'Top', description: 'Highest scoring' },
    { value: 'new', label: 'New', description: 'Most recent' },
    { value: 'comments', label: 'Comments', description: 'Most discussed' }
  ];

  // Get current sort types based on config type
  const getCurrentSortTypes = () => {
    return newConfig.configType === 'keyword' ? searchSortTypes : regularSortTypes;
  };

  // Available timeframes for 'top' sort
  const timeframes = [
    { value: 'hour', label: 'Hour' },
    { value: 'day', label: 'Day' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
    { value: 'year', label: 'Year' },
    { value: 'all', label: 'All Time' }
  ];

  // Load current configurations when Reddit client is ready
  useEffect(() => {
    if (redditClientReady) {
      loadConfigurations();
    }
  }, [redditClientReady]);

  // Validate and parse query when keywords change
  useEffect(() => {
    if (newConfig.keywords.trim()) {
      const validation = validateQuery(newConfig.keywords);
      setQueryValidation(validation);
      
      if (validation.isValid) {
        const parsed = parseKeywordQuery(newConfig.keywords);
        setParsedQuery(parsed);
      } else {
        setParsedQuery('');
      }
    } else {
      setQueryValidation({ isValid: true, error: null });
      setParsedQuery('');
    }
  }, [newConfig.keywords]);

  // Validate and parse query when edit form keywords change
  useEffect(() => {
    if (editForm.keywords && editForm.keywords.trim()) {
      const validation = validateQuery(editForm.keywords);
      setEditQueryValidation(validation);
      
      if (validation.isValid) {
        const parsed = parseKeywordQuery(editForm.keywords);
        setEditParsedQuery(parsed);
      } else {
        setEditParsedQuery('');
      }
    } else {
      setEditQueryValidation({ isValid: true, error: null });
      setEditParsedQuery('');
    }
  }, [editForm.keywords]);

  const loadConfigurations = () => {
    try {
      const redditClient = getRedditClient();
      const configs = redditClient.getSubredditConfigs();
      setSubredditConfigs(configs);
      console.log(`Loaded ${configs.length} subreddit configurations in SubredditManagement`);
    } catch (error) {
      console.error('Error loading subreddit configurations:', error);
      // Retry after a short delay if Reddit client isn't ready yet
      setTimeout(() => {
        try {
          const redditClient = getRedditClient();
          const configs = redditClient.getSubredditConfigs();
          setSubredditConfigs(configs);
          console.log(`Loaded ${configs.length} subreddit configurations in SubredditManagement (retry)`);
        } catch (retryError) {
          console.error('Error loading subreddit configurations on retry:', retryError);
        }
      }, 100);
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
      timeframe: config.timeframe,
      keywords: config.keywords || '',
      configType: config.keywords ? 'keyword' : 'regular'
    });
  };

  const handleCancelEdit = () => {
    setEditingConfigId(null);
    setEditForm({
      subreddit: '',
      sortType: 'hot',
      timeframe: null,
      keywords: '',
      configType: 'regular'
    });
  };

  const handleSaveEdit = () => {
    if (!editForm.subreddit.trim()) {
      alert('Please enter a subreddit name.');
      return;
    }

    if (editForm.configType === 'keyword') {
      if (!editForm.keywords.trim()) {
        alert('Please enter keywords to search for.');
        return;
      }
      
      if (!editQueryValidation.isValid) {
        alert(`Invalid query: ${editQueryValidation.error}`);
        return;
      }
    }

    try {
      const redditClient = getRedditClient();
      
      if (editForm.configType === 'keyword') {
        const finalQuery = parseKeywordQuery(editForm.keywords);
        redditClient.updateSubredditConfig(
          editingConfigId,
          editForm.subreddit.trim(),
          editForm.sortType,
          editForm.timeframe,
          finalQuery
        );
      } else {
        redditClient.updateSubredditConfig(
          editingConfigId,
          editForm.subreddit.trim(),
          editForm.sortType,
          editForm.timeframe
        );
      }
      
      setEditingConfigId(null);
      setEditForm({
        subreddit: '',
        sortType: 'hot',
        timeframe: null,
        keywords: '',
        configType: 'regular'
      });
      
      loadConfigurations();
      onConfigChange?.();
    } catch (error) {
      console.error('Error updating configuration:', error);
      alert('Error updating configuration. Please try again.');
    }
  };

  const handleUnifiedAddConfig = () => {
    if (!newConfig.subreddit.trim()) {
      alert('Please enter a subreddit name.');
      return;
    }

    if (newConfig.configType === 'keyword') {
      if (!newConfig.keywords.trim()) {
        alert('Please enter keywords to search for.');
        return;
      }
      
      if (!queryValidation.isValid) {
        alert(`Invalid query: ${queryValidation.error}`);
        return;
      }
    }

    try {
      const redditClient = getRedditClient();
      
      if (newConfig.configType === 'keyword') {
        const finalQuery = parseKeywordQuery(newConfig.keywords);
        redditClient.addSubredditConfig(
          newConfig.subreddit.trim(),
          newConfig.sortType,
          newConfig.timeframe,
          finalQuery
        );
      } else {
        redditClient.addSubredditConfig(
          newConfig.subreddit.trim(),
          newConfig.sortType,
          newConfig.timeframe
        );
      }
      
      // Reset form
      setNewConfig({
        subreddit: '',
        sortType: newConfig.configType === 'keyword' ? 'relevance' : 'hot',
        timeframe: null,
        keywords: '',
        configType: newConfig.configType // Keep the same config type
      });
      
      loadConfigurations();
      onConfigChange?.();
    } catch (error) {
      console.error('Error adding configuration:', error);
      alert('Error adding configuration. Please try again.');
    }
  };

  const handleKeywordConfigChange = (keywordConfig) => {
    try {
      const redditClient = getRedditClient();
      
      redditClient.addSubredditConfig(
        keywordConfig.subreddit,
        keywordConfig.sortType,
        keywordConfig.timeframe,
        keywordConfig.keywords
      );
      
      loadConfigurations();
      onConfigChange?.();
    } catch (error) {
      console.error('Error adding keyword configuration:', error);
      alert('Error adding keyword configuration. Please try again.');
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
    // Try to find in regular sort types first, then search sort types
    const regularSort = regularSortTypes.find(s => s.value === sortType);
    if (regularSort) return regularSort.label;
    
    const searchSort = searchSortTypes.find(s => s.value === sortType);
    if (searchSort) return searchSort.label;
    
    return sortType;
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

                        {/* Keywords Input (only for keyword configurations) */}
                        {editForm.configType === 'keyword' && (
                          <div className="form-group">
                            <label htmlFor="edit-keywords" className="form-label">
                              Keywords
                            </label>
                            <input
                              id="edit-keywords"
                              type="text"
                              className={`form-input ${!editQueryValidation.isValid ? 'form-input-error' : ''}`}
                              placeholder="e.g., cats AND dogs, funny OR memes"
                              value={editForm.keywords}
                              onChange={(e) => setEditForm(prev => ({ ...prev, keywords: e.target.value }))}
                            />
                            
                            {/* Query Validation */}
                            {!editQueryValidation.isValid && (
                              <div className="form-error">
                                {editQueryValidation.error}
                              </div>
                            )}
                            
                            {/* Parsed Query Preview */}
                            {editParsedQuery && editQueryValidation.isValid && editParsedQuery !== editForm.keywords && (
                              <div className="query-preview">
                                <span className="query-preview-label">Parsed as:</span>
                                <span className="query-preview-text">{editParsedQuery}</span>
                              </div>
                            )}
                          </div>
                        )}

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
                            {(editForm.configType === 'keyword' ? searchSortTypes : regularSortTypes).map(sort => (
                              <option key={sort.value} value={sort.value}>
                                {sort.label}{sort.description ? ` - ${sort.description}` : ''}
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
                            {config.keywords ? '🔍 ' : ''}
                            {getSortTypeLabel(config.sortType)}
                            {config.timeframe && ` (${getTimeframeLabel(config.timeframe)})`}
                          </span>
                          {config.keywords && (
                            <span className="config-keywords">
                              Keywords: "{config.keywords}"
                            </span>
                          )}
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
              {/* Segmented Control */}
              <div className="form-group">
                <div className="segmented-control">
                  <button
                    type="button"
                    className={`segment-button ${newConfig.configType === 'regular' ? 'active' : ''}`}
                    onClick={() => setNewConfig(prev => ({ 
                      ...prev, 
                      configType: 'regular',
                      sortType: 'hot',
                      keywords: '',
                      timeframe: null
                    }))}
                  >
                    Regular Feed
                  </button>
                  <button
                    type="button"
                    className={`segment-button ${newConfig.configType === 'keyword' ? 'active' : ''}`}
                    onClick={() => setNewConfig(prev => ({ 
                      ...prev, 
                      configType: 'keyword',
                      sortType: 'relevance',
                      timeframe: null
                    }))}
                  >
                    Keyword Search
                  </button>
                </div>
              </div>

              {/* Subreddit Input */}
              <div className="form-group">
                <label htmlFor="new-subreddit">Subreddit:</label>
                <input
                  id="new-subreddit"
                  type="text"
                  placeholder="e.g., cats, funny, programming"
                  value={newConfig.subreddit}
                  onChange={(e) => setNewConfig(prev => ({ ...prev, subreddit: e.target.value }))}
                  className="form-input"
                />
              </div>

              {/* Keywords Input (only for keyword search) */}
              {newConfig.configType === 'keyword' && (
                <div className="form-group">
                  <label htmlFor="new-keywords" className="form-label">
                    Keywords
                    <button
                      type="button"
                      className="help-button"
                      onClick={() => setShowExamples(!showExamples)}
                      title="Show query examples"
                    >
                      ?
                    </button>
                  </label>
                  <input
                    id="new-keywords"
                    type="text"
                    className={`form-input ${!queryValidation.isValid ? 'form-input-error' : ''}`}
                    placeholder="e.g., cats AND dogs, funny OR memes"
                    value={newConfig.keywords}
                    onChange={(e) => setNewConfig(prev => ({ ...prev, keywords: e.target.value }))}
                  />
                  
                  {/* Query Validation */}
                  {!queryValidation.isValid && (
                    <div className="form-error">
                      {queryValidation.error}
                    </div>
                  )}
                  
                  {/* Parsed Query Preview */}
                  {parsedQuery && queryValidation.isValid && parsedQuery !== newConfig.keywords && (
                    <div className="query-preview">
                      <span className="query-preview-label">Parsed as:</span>
                      <span className="query-preview-text">{parsedQuery}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Sort Type */}
              <div className="form-group">
                <label htmlFor="new-sort-type">Sort Results By:</label>
                <select
                  id="new-sort-type"
                  value={newConfig.sortType}
                  onChange={(e) => setNewConfig(prev => ({ 
                    ...prev, 
                    sortType: e.target.value,
                    timeframe: e.target.value === 'top' ? 'day' : null
                  }))}
                  className="form-select"
                >
                  {getCurrentSortTypes().map(sort => (
                    <option key={sort.value} value={sort.value}>
                      {sort.label}{sort.description ? ` - ${sort.description}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Timeframe (only for 'top' sort) */}
              {newConfig.sortType === 'top' && (
                <div className="form-group">
                  <label htmlFor="new-timeframe">Time Period:</label>
                  <select
                    id="new-timeframe"
                    value={newConfig.timeframe || 'day'}
                    onChange={(e) => setNewConfig(prev => ({ ...prev, timeframe: e.target.value }))}
                    className="form-select"
                  >
                    {timeframes.map(time => (
                      <option key={time.value} value={time.value}>
                        {time.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* Add Button */}
              <div className="form-group">
                <button
                  type="button"
                  className="add-config-button"
                  onClick={handleUnifiedAddConfig}
                  disabled={!newConfig.subreddit.trim() || 
                    (newConfig.configType === 'keyword' && (!newConfig.keywords.trim() || !queryValidation.isValid))}
                >
                  Add Configuration
                </button>
              </div>
            </div>

            {/* Query Examples (only for keyword search) */}
            {newConfig.configType === 'keyword' && showExamples && (
              <div className="query-examples">
                <h4 className="examples-title">Query Examples</h4>
                <div className="examples-list">
                  {getQueryExamples().map((example, index) => (
                    <div key={index} className="example-item">
                      <button
                        type="button"
                        className="example-button"
                        onClick={() => {
                          setNewConfig(prev => ({ ...prev, keywords: example.input }));
                          setShowExamples(false);
                        }}
                      >
                        <code className="example-input">{example.input}</code>
                        <span className="example-arrow">→</span>
                        <code className="example-output">{example.output}</code>
                      </button>
                      <p className="example-description">{example.description}</p>
                    </div>
                  ))}
                </div>
                
                <div className="query-syntax-help">
                  <h5>Query Syntax</h5>
                  <ul>
                    <li><strong>AND</strong>: Both terms must be present (default for spaces)</li>
                    <li><strong>OR</strong>: Either term can be present</li>
                    <li><strong>NOT</strong>: Exclude posts with this term</li>
                    <li><strong>"quotes"</strong>: Search for exact phrases</li>
                    <li><strong>(parentheses)</strong>: Group terms for complex queries</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SubredditManagement;

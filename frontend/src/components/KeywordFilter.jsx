import React, { useState, useEffect } from 'react';
import { parseKeywordQuery, validateQuery, getQueryExamples, formatQueryForDisplay } from '../utils/queryParser.js';

function KeywordFilter({ onKeywordConfigChange }) {
  const [keywordInput, setKeywordInput] = useState('');
  const [sortType, setSortType] = useState('relevance');
  const [timeframe, setTimeframe] = useState('');
  const [subreddit, setSubreddit] = useState('');
  const [showExamples, setShowExamples] = useState(false);
  const [queryValidation, setQueryValidation] = useState({ isValid: true, error: null });
  const [parsedQuery, setParsedQuery] = useState('');

  // Available sort types for search
  const searchSortTypes = [
    { value: 'relevance', label: 'Relevance', description: 'Best matches' },
    { value: 'hot', label: 'Hot', description: 'Trending posts' },
    { value: 'top', label: 'Top', description: 'Highest scoring' },
    { value: 'new', label: 'New', description: 'Most recent' },
    { value: 'comments', label: 'Comments', description: 'Most discussed' }
  ];

  // Available timeframes for 'top' sort
  const timeframes = [
    { value: '', label: 'All Time' },
    { value: 'hour', label: 'Past Hour' },
    { value: 'day', label: 'Past Day' },
    { value: 'week', label: 'Past Week' },
    { value: 'month', label: 'Past Month' },
    { value: 'year', label: 'Past Year' }
  ];

  // Validate and parse query when input changes
  useEffect(() => {
    if (keywordInput.trim()) {
      const validation = validateQuery(keywordInput);
      setQueryValidation(validation);
      
      if (validation.isValid) {
        const parsed = parseKeywordQuery(keywordInput);
        setParsedQuery(parsed);
      } else {
        setParsedQuery('');
      }
    } else {
      setQueryValidation({ isValid: true, error: null });
      setParsedQuery('');
    }
  }, [keywordInput]);

  const handleAddKeywordSearch = () => {
    if (!subreddit.trim()) {
      alert('Please enter a subreddit name');
      return;
    }

    if (!keywordInput.trim()) {
      alert('Please enter keywords to search for');
      return;
    }

    if (!queryValidation.isValid) {
      alert(`Invalid query: ${queryValidation.error}`);
      return;
    }

    const finalQuery = parseKeywordQuery(keywordInput);
    const config = {
      subreddit: subreddit.trim(),
      keywords: finalQuery,
      sortType,
      timeframe: sortType === 'top' ? timeframe : null
    };

    onKeywordConfigChange(config);

    // Clear form
    setKeywordInput('');
    setSubreddit('');
    setSortType('relevance');
    setTimeframe('');
  };

  const handleExampleClick = (example) => {
    setKeywordInput(example.input);
    setShowExamples(false);
  };

  const examples = getQueryExamples();
  const queryDisplay = formatQueryForDisplay(parsedQuery);

  return (
    <div className="keyword-filter">
      <div className="keyword-filter-header">
        <h3 className="keyword-filter-title">🔍 Add Keyword Search</h3>
        <p className="keyword-filter-description">
          Search specific subreddits for posts containing your keywords
        </p>
      </div>

      <div className="keyword-filter-form">
        {/* Subreddit Input */}
        <div className="form-group">
          <label htmlFor="subreddit-input" className="form-label">
            Subreddit
          </label>
          <input
            id="subreddit-input"
            type="text"
            className="form-input"
            placeholder="e.g., cats, funny, programming"
            value={subreddit}
            onChange={(e) => setSubreddit(e.target.value)}
          />
        </div>

        {/* Keywords Input */}
        <div className="form-group">
          <label htmlFor="keywords-input" className="form-label">
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
            id="keywords-input"
            type="text"
            className={`form-input ${!queryValidation.isValid ? 'form-input-error' : ''}`}
            placeholder="e.g., cats AND dogs, funny OR memes"
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
          />
          
          {/* Query Validation */}
          {!queryValidation.isValid && (
            <div className="form-error">
              {queryValidation.error}
            </div>
          )}
          
          {/* Parsed Query Preview */}
          {parsedQuery && queryValidation.isValid && parsedQuery !== keywordInput && (
            <div className="query-preview">
              <span className="query-preview-label">Parsed as:</span>
              <span className="query-preview-text">{parsedQuery}</span>
            </div>
          )}
        </div>

        {/* Sort Type */}
        <div className="form-group">
          <label htmlFor="sort-type-select" className="form-label">
            Sort Results By
          </label>
          <select
            id="sort-type-select"
            className="form-select"
            value={sortType}
            onChange={(e) => setSortType(e.target.value)}
          >
            {searchSortTypes.map(({ value, label, description }) => (
              <option key={value} value={value}>
                {label} - {description}
              </option>
            ))}
          </select>
        </div>

        {/* Timeframe (only for 'top' sort) */}
        {sortType === 'top' && (
          <div className="form-group">
            <label htmlFor="timeframe-select" className="form-label">
              Time Period
            </label>
            <select
              id="timeframe-select"
              className="form-select"
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
            >
              {timeframes.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Add Button */}
        <div className="form-group">
          <button
            type="button"
            className="add-keyword-button"
            onClick={handleAddKeywordSearch}
            disabled={!subreddit.trim() || !keywordInput.trim() || !queryValidation.isValid}
          >
            Add Keyword Search
          </button>
        </div>
      </div>

      {/* Query Examples */}
      {showExamples && (
        <div className="query-examples">
          <h4 className="examples-title">Query Examples</h4>
          <div className="examples-list">
            {examples.map((example, index) => (
              <div key={index} className="example-item">
                <button
                  type="button"
                  className="example-button"
                  onClick={() => handleExampleClick(example)}
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
  );
}

export default KeywordFilter;

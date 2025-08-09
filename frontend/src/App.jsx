import React, { useState, useEffect } from 'react';
import './App.css';
import Header from './components/Header.jsx';
import SubredditManagement from './components/SubredditManagement.jsx';
import FilterPanel from './components/FilterPanel.jsx';
import PostGrid from './components/PostGrid.jsx';
import TextListView from './components/TextListView.jsx';
import ViewToggle from './components/ViewToggle.jsx';
import ThemeToggle from './components/ThemeToggle.jsx';
import RefreshPauseToggle from './components/RefreshPauseToggle.jsx';
import { ThemeProvider } from './contexts/ThemeContext.jsx';
import { createRedditClient } from './services/redditClient.js';
import { useRedditData } from './hooks/useRedditData.js';
import { logCompatibilityInfo, getBrowserInfo } from './utils/browserCompat.js';

function App() {
  const [activeSubreddits, setActiveSubreddits] = useState([]);
  const [activeMediaTypes, setActiveMediaTypes] = useState([]);
  const [sortBy, setSortBy] = useState('createTime');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [redditClientReady, setRedditClientReady] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  // Polling interval constant
  const POLLING_INTERVAL = 30000; // 30 seconds

  // Initialize Reddit client and browser compatibility on app start
  useEffect(() => {
    // Log browser compatibility information
    logCompatibilityInfo();
    
    // Check for potential compatibility issues
    const browserInfo = getBrowserInfo();
    if (browserInfo.isSafari && browserInfo.isMobile) {
      console.warn('📱 iOS Safari detected - some video autoplay features may be limited');
    }
    
    const redditConfig = {
      clientId: import.meta.env.VITE_REDDIT_CLIENT_ID,
      clientSecret: import.meta.env.VITE_REDDIT_CLIENT_SECRET,
      userAgent: import.meta.env.VITE_REDDIT_USER_AGENT,
      username: import.meta.env.VITE_REDDIT_USERNAME,
      password: import.meta.env.VITE_REDDIT_PASSWORD
    };

    createRedditClient(redditConfig);
    setRedditClientReady(true);
    console.log('Reddit client initialized and ready');
  }, []);

  // Use the Reddit data hook
  const {
    posts,
    loading,
    error,
    lastUpdated,
    isPolling,
    refresh
  } = useRedditData(POLLING_INTERVAL, isPaused);

  // Filter posts based on subreddit and media type filters
  const filteredPosts = posts.filter(post => {
    // Subreddit filter (activeSubreddits contains subreddits to HIDE)
    if (activeSubreddits.length > 0) {
      if (activeSubreddits.includes(post.subreddit)) {
        return false;
      }
    }
    
    // Media type filter (activeMediaTypes contains media types to SHOW)
    if (activeMediaTypes.length > 0) {
      if (!activeMediaTypes.includes(post.mediaType)) {
        return false;
      }
    }
    
    return true;
  });

  // Sort posts based on selected criteria
  const sortPosts = (posts, sortBy) => {
    const sortedPosts = [...posts];
    
    switch (sortBy) {
      case 'createTime':
        return sortedPosts.sort((a, b) => b.createdUtc - a.createdUtc);
      case 'upvotes':
        return sortedPosts.sort((a, b) => b.ups - a.ups);
      case 'username':
        return sortedPosts.sort((a, b) => a.author.localeCompare(b.author));
      default:
        return sortedPosts;
    }
  };

  // Apply filtering and sorting
  const processedPosts = sortPosts(filteredPosts, sortBy);

  // Handle sort changes
  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
  };

  // Handle subreddit filter changes
  const handleSubredditChange = (newActiveSubreddits) => {
    setActiveSubreddits(newActiveSubreddits);
  };

  // Handle media type filter changes
  const handleMediaTypeChange = (newActiveMediaTypes) => {
    setActiveMediaTypes(newActiveMediaTypes);
  };

  // Handle subreddit configuration changes
  const handleConfigChange = () => {
    // Refresh data when subreddit configurations change
    refresh();
  };

  // Handle NSFW setting changes
  const handleNsfwChange = (newSetting) => {
    // Refresh data when NSFW setting changes to get new content
    refresh();
  };

  // Handle view mode changes
  const handleViewModeChange = (newViewMode) => {
    setViewMode(newViewMode);
  };

  // Handle manual pause/resume toggle
  const handlePauseToggle = (pausedState) => {
    setIsPaused(pausedState);
    console.log(`Refresh ${pausedState ? 'paused' : 'resumed'} manually`);
  };

  // Handle scroll-based pause/resume
  const handleScrollPause = (scrollPausedState) => {
    setIsPaused(scrollPausedState);
    console.log(`Refresh ${scrollPausedState ? 'paused' : 'resumed'} due to scrolling`);
  };

  // Handle profile changes
  const handleProfileChange = (profile, uiPreferences) => {
    console.log(`Profile changed to: ${profile.name}`);
    
    // Apply UI preferences if available
    if (uiPreferences) {
      if (uiPreferences.viewMode) {
        setViewMode(uiPreferences.viewMode);
      }
      if (uiPreferences.sortBy) {
        setSortBy(uiPreferences.sortBy);
      }
    }
    
    // Refresh data to load new profile's subreddit configurations
    refresh();
  };

  return (
    <ThemeProvider>
      <div className="App">
        <Header 
          totalPosts={posts.length}
          filteredPosts={filteredPosts.length}
          lastUpdated={lastUpdated}
          error={error}
          hasActiveFilters={activeSubreddits.length > 0 || activeMediaTypes.length > 0}
          isPolling={isPolling}
          pollingInterval={POLLING_INTERVAL}
          onRefresh={refresh}
          onProfileChange={handleProfileChange}
          onConfigChange={handleConfigChange}
          redditClientReady={redditClientReady}
        />
        
        <SubredditManagement 
          onConfigChange={handleConfigChange} 
          redditClientReady={redditClientReady}
        />
        
        {loading ? (
          <div className="loading">Loading posts...</div>
        ) : error ? (
          <div className="error">
            <p>Error: {error}</p>
            <button onClick={refresh}>Retry</button>
          </div>
        ) : (
          <>
            <div className="controls-container">
              <FilterPanel 
                posts={posts}
                activeSubreddits={activeSubreddits}
                onSubredditChange={handleSubredditChange}
                activeMediaTypes={activeMediaTypes}
                onMediaTypeChange={handleMediaTypeChange}
                sortBy={sortBy}
                onSortChange={handleSortChange}
                onNsfwChange={handleNsfwChange}
              />
              <div className="view-toggle-container">
                <ViewToggle 
                  viewMode={viewMode}
                  onViewModeChange={handleViewModeChange}
                />
              </div>
            </div>
            
            <div className={`content-container ${viewMode}-view`}>
              {viewMode === 'grid' ? (
                <PostGrid posts={processedPosts} />
              ) : (
                <TextListView posts={processedPosts} />
              )}
            </div>
          </>
        )}
        
        <RefreshPauseToggle 
          isPolling={isPolling}
          onPauseToggle={handlePauseToggle}
          onScrollPause={handleScrollPause}
        />
        <ThemeToggle />
      </div>
    </ThemeProvider>
  );
}

export default App;

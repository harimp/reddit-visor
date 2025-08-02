import { useState, useEffect, useCallback, useRef } from 'react';
import { getRedditClient } from '../services/redditClient.js';

/**
 * Custom React hook for managing Reddit data
 * Handles polling, caching, and state management
 */
export const useRedditData = (pollingInterval = 30000, isPaused = false) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isPolling, setIsPolling] = useState(false);
  
  const pollingIntervalRef = useRef(null);
  const timeUpdateIntervalRef = useRef(null);
  const mountedRef = useRef(true);

  // Cache management
  const CACHE_KEY = 'redditvisor_posts_cache';
  const CACHE_EXPIRY_KEY = 'redditvisor_cache_expiry';
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Load posts from localStorage cache
   */
  const loadFromCache = useCallback(() => {
    try {
      const cachedPosts = localStorage.getItem(CACHE_KEY);
      const cacheExpiry = localStorage.getItem(CACHE_EXPIRY_KEY);
      
      if (cachedPosts && cacheExpiry) {
        const expiryTime = parseInt(cacheExpiry, 10);
        if (Date.now() < expiryTime) {
          const parsedPosts = JSON.parse(cachedPosts);
          console.log(`Loaded ${parsedPosts.length} posts from cache`);
          return parsedPosts;
        } else {
          // Cache expired, clear it
          localStorage.removeItem(CACHE_KEY);
          localStorage.removeItem(CACHE_EXPIRY_KEY);
        }
      }
    } catch (error) {
      console.error('Error loading from cache:', error);
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(CACHE_EXPIRY_KEY);
    }
    return null;
  }, []);

  /**
   * Save posts to localStorage cache
   */
  const saveToCache = useCallback((posts) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(posts));
      localStorage.setItem(CACHE_EXPIRY_KEY, (Date.now() + CACHE_DURATION).toString());
      console.log(`Cached ${posts.length} posts`);
    } catch (error) {
      console.error('Error saving to cache:', error);
      // If localStorage is full, try to clear old data
      try {
        localStorage.removeItem(CACHE_KEY);
        localStorage.removeItem(CACHE_EXPIRY_KEY);
        localStorage.setItem(CACHE_KEY, JSON.stringify(posts));
        localStorage.setItem(CACHE_EXPIRY_KEY, (Date.now() + CACHE_DURATION).toString());
      } catch (retryError) {
        console.error('Failed to save to cache even after clearing:', retryError);
      }
    }
  }, []);


  /**
   * Fetch posts from Reddit
   */
  const fetchPosts = useCallback(async (showLoading = false) => {
    if (!mountedRef.current) return;
    
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);

      const redditClient = getRedditClient();
      const fetchedPosts = await redditClient.fetchAllPosts();
      
      if (!mountedRef.current) return;

      setPosts(fetchedPosts);
      setLastUpdated(new Date());
      saveToCache(fetchedPosts);
      
      console.log(`Successfully fetched ${fetchedPosts.length} posts`);
      
    } catch (err) {
      if (!mountedRef.current) return;
      
      console.error('Error fetching posts:', err);
      setError(err.message || 'Failed to fetch posts');
      
      // Try to load from cache as fallback
      const cachedPosts = loadFromCache();
      if (cachedPosts && cachedPosts.length > 0) {
        setPosts(cachedPosts);
        setLastUpdated(new Date()); // Set to current time to show cache usage
        console.log('Using cached posts as fallback');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [loadFromCache, saveToCache]);

  /**
   * Start polling for new posts
   */
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current || !pollingInterval) return;
    
    setIsPolling(true);
    console.log(`Starting Reddit polling every ${pollingInterval / 1000} seconds`);
    
    pollingIntervalRef.current = setInterval(() => {
      fetchPosts(false); // Don't show loading spinner for background updates
    }, pollingInterval);
  }, [fetchPosts, pollingInterval]);

  /**
   * Stop polling
   */
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
      setIsPolling(false);
      console.log('Stopped Reddit polling');
    }
  }, []);

  /**
   * Manual refresh
   */
  const refresh = useCallback(() => {
    fetchPosts(true);
  }, [fetchPosts]);

  /**
   * Clear cache
   */
  const clearCache = useCallback(() => {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_EXPIRY_KEY);
    console.log('Cleared posts cache');
  }, []);

  // Initialize data on mount
  useEffect(() => {
    mountedRef.current = true;
    
    // Try to load from cache first
    const cachedPosts = loadFromCache();
    if (cachedPosts && cachedPosts.length > 0) {
      setPosts(cachedPosts);
      setLastUpdated(new Date());
      setLoading(false);
      console.log('Initialized with cached posts');
    }
    
    // Fetch fresh data
    fetchPosts(cachedPosts ? false : true);
    
    return () => {
      mountedRef.current = false;
    };
  }, [fetchPosts, loadFromCache]);

  // Handle pause/resume polling based on isPaused state
  useEffect(() => {
    if (!loading && posts.length > 0) {
      if (isPaused) {
        stopPolling();
      } else {
        startPolling();
      }
    }
    
    return () => {
      stopPolling();
    };
  }, [loading, posts.length, isPaused, startPolling, stopPolling]);

  // Set up time update interval for relative timestamps
  useEffect(() => {
    timeUpdateIntervalRef.current = setInterval(() => {
      if (mountedRef.current && posts.length > 0) {
        // Force re-render to update relative times
        setPosts(prevPosts => [...prevPosts]);
      }
    }, 60000); // Update every minute
    
    return () => {
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current);
      }
    };
  }, [posts.length]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      stopPolling();
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current);
      }
    };
  }, [stopPolling]);

  return {
    posts,
    loading,
    error,
    lastUpdated,
    isPolling,
    refresh,
    clearCache,
    startPolling,
    stopPolling
  };
};

export default useRedditData;

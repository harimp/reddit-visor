/**
 * Reddit API Client for direct frontend access
 * Handles OAuth authentication, rate limiting, and data fetching
 */

class RedditClient {
  constructor(config) {
    this.config = {
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      userAgent: config.userAgent || 'RedditVisor/1.0',
      username: config.username,
      password: config.password
    };
    
    this.accessToken = null;
    this.tokenExpiry = null;
    this.isRefreshing = false;
    
    // Default query parameters for all Reddit searches
    this.defaultParams = {
      restrict_sr: 'on',
      sort: 'new',
      t: 'all',
      limit: '100'
    };

    // Initialize subreddit configurations from localStorage or defaults
    // Now an array of configuration objects, each representing a separate request
    this.subredditConfigs = [];
    this.loadSubredditConfigs();
  }

  /**
   * Load subreddit configurations from localStorage or initialize defaults
   */
  loadSubredditConfigs() {
    try {
      const saved = localStorage.getItem('redditvisor_subreddit_configs');
      if (saved) {
        const configs = JSON.parse(saved);
        
        // Check if we need to migrate from old keyword-based system
        if (configs.length > 0 && configs[0].keywords) {
          console.log('Migrating from old keyword-based system to new sort-based system...');
          this.initializeDefaultSubreddits();
          console.log('Migration complete - initialized with new picture-based defaults');
        } else {
          this.subredditConfigs = configs;
          console.log(`Loaded ${this.subredditConfigs.length} subreddit configurations from localStorage`);
        }
      } else {
        this.initializeDefaultSubreddits();
      }
    } catch (error) {
      console.error('Error loading subreddit configurations from localStorage:', error);
      this.initializeDefaultSubreddits();
    }
  }

  /**
   * Save subreddit configurations to localStorage
   */
  saveSubredditConfigs() {
    try {
      localStorage.setItem('redditvisor_subreddit_configs', JSON.stringify(this.subredditConfigs));
      console.log(`Saved ${this.subredditConfigs.length} subreddit configurations to localStorage`);
    } catch (error) {
      console.error('Error saving subreddit configurations to localStorage:', error);
    }
  }

  /**
   * Initialize default subreddit configurations
   * Each entry represents a subreddit with sort type and optional timeframe
   */
  initializeDefaultSubreddits() {
    this.subredditConfigs = [
      // Picture-based SFW subreddits
      { id: 'cats_hot', subreddit: 'cats', sortType: 'hot', timeframe: null },
      { id: 'funny_hot', subreddit: 'funny', sortType: 'hot', timeframe: null },
      { id: 'aww_hot', subreddit: 'aww', sortType: 'hot', timeframe: null },
      { id: 'earthporn_top_week', subreddit: 'EarthPorn', sortType: 'top', timeframe: 'week' },
      { id: 'mildlyinteresting_hot', subreddit: 'mildlyinteresting', sortType: 'hot', timeframe: null },
      { id: 'oddlysatisfying_hot', subreddit: 'oddlysatisfying', sortType: 'hot', timeframe: null },
      { id: 'natureisfuckinglit_hot', subreddit: 'NatureIsFuckingLit', sortType: 'hot', timeframe: null },
      { id: 'cozyplaces_hot', subreddit: 'CozyPlaces', sortType: 'hot', timeframe: null }
    ];
    
    console.log(`Initialized ${this.subredditConfigs.length} default subreddit configurations`);
    this.saveSubredditConfigs();
  }

  /**
   * Get Reddit OAuth access token
   */
  async getAccessToken() {
    try {
      // Check if we have a valid token
      if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
        return this.accessToken;
      }

      // Prevent multiple simultaneous token refresh attempts
      if (this.isRefreshing) {
        // Wait for the current refresh to complete
        while (this.isRefreshing) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        return this.accessToken;
      }

      this.isRefreshing = true;
      console.log('Getting new Reddit access token...');

      const auth = btoa(`${this.config.clientId}:${this.config.clientSecret}`);
      
      const tokenData = new URLSearchParams({
        grant_type: 'client_credentials'
      });

      // If username/password provided, use password grant
      if (this.config.username && this.config.password) {
        tokenData.set('grant_type', 'password');
        tokenData.set('username', this.config.username);
        tokenData.set('password', this.config.password);
      }

      const response = await fetch('https://www.reddit.com/api/v1/access_token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'User-Agent': this.config.userAgent,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: tokenData
      });

      if (!response.ok) {
        throw new Error(`Token request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`Reddit API error: ${data.error}`);
      }

      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // Refresh 1 minute early

      console.log('Successfully obtained Reddit access token');
      return this.accessToken;

    } catch (error) {
      console.error('Error getting Reddit access token:', error.message);
      // Fall back to no authentication
      return null;
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Fetch data from Reddit with retry logic and rate limiting
   */
  async fetchRedditData(url, maxRetries = 3) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Get access token if available
        const token = await this.getAccessToken();
        
        // Prepare headers
        const headers = {
          'User-Agent': this.config.userAgent
        };
        
        // Add OAuth token if available
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
          // Use oauth.reddit.com for authenticated requests
          url = url.replace('www.reddit.com', 'oauth.reddit.com');
        }
        
        const response = await fetch(url, {
          headers,
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });
        
        // Handle 429 rate limit errors
        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get('retry-after') || '60');
          const waitTime = Math.min(retryAfter, Math.pow(2, attempt) * 30);
          console.log(`Rate limited (429). Waiting ${waitTime}s before retry ${attempt + 1}/${maxRetries}`);
          await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
          continue;
        }
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data?.data?.children || [];
        
      } catch (error) {
        if (error.name === 'AbortError') {
          console.log(`Request timeout on attempt ${attempt + 1}`);
        } else if (error.message.includes('401')) {
          console.log('OAuth token expired or invalid, clearing token...');
          this.accessToken = null;
          this.tokenExpiry = null;
        }
        
        if (attempt === maxRetries - 1) {
          console.error(`Network error after ${maxRetries} attempts:`, error.message);
          return [];
        } else {
          console.log(`Network error on attempt ${attempt + 1}, retrying...`);
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }
    return [];
  }

  /**
   * Build Reddit sort URL for subreddit feeds
   */
  buildSortUrl(subreddit, sortType = 'hot', timeframe = null) {
    const baseUrl = `https://www.reddit.com/r/${subreddit}/${sortType}.json`;
    
    const params = {
      limit: '50' // Reasonable limit for visual content
    };
    
    // Add timeframe for 'top' sort
    if (sortType === 'top' && timeframe) {
      params.t = timeframe;
    }
    
    const urlParams = new URLSearchParams(params);
    return `${baseUrl}?${urlParams.toString()}`;
  }

  /**
   * Add a new subreddit configuration
   */
  addSubredditConfig(subreddit, sortType = 'hot', timeframe = null) {
    const id = `${subreddit}_${sortType}_${timeframe || 'none'}_${Date.now()}`;
    const newConfig = {
      id,
      subreddit,
      sortType,
      timeframe
    };
    
    this.subredditConfigs.push(newConfig);
    this.saveSubredditConfigs();
    return id;
  }

  /**
   * Update existing subreddit configuration by ID
   */
  updateSubredditConfig(configId, subreddit, sortType = 'hot', timeframe = null) {
    const configIndex = this.subredditConfigs.findIndex(config => config.id === configId);
    if (configIndex !== -1) {
      this.subredditConfigs[configIndex] = {
        id: configId,
        subreddit,
        sortType,
        timeframe
      };
      this.saveSubredditConfigs();
      return true;
    }
    return false;
  }

  /**
   * Remove subreddit configuration by ID
   */
  removeSubredditConfig(configId) {
    const initialLength = this.subredditConfigs.length;
    this.subredditConfigs = this.subredditConfigs.filter(config => config.id !== configId);
    
    if (this.subredditConfigs.length < initialLength) {
      this.saveSubredditConfigs();
      return true;
    }
    return false;
  }

  /**
   * Get current subreddit configurations
   */
  getSubredditConfigs() {
    return [...this.subredditConfigs];
  }

  /**
   * Reset subreddit configurations to defaults
   */
  resetToDefaultConfigs() {
    console.log('Resetting subreddit configurations to defaults...');
    this.subredditConfigs = [];
    this.initializeDefaultSubreddits();
    console.log(`Reset complete. ${this.subredditConfigs.length} default configurations restored`);
  }

  /**
   * Update default parameters
   */
  updateDefaultParams(newParams) {
    this.defaultParams = { ...this.defaultParams, ...newParams };
  }

  /**
   * Build custom search URL with full flexibility
   */
  buildCustomSearchUrl(subreddit, searchTerms = [], customParams = {}) {
    const baseUrl = `https://www.reddit.com/r/${subreddit}/search.json`;
    
    // Merge default params with custom params
    const params = { ...this.defaultParams, ...customParams };
    
    // Add search terms to query if provided (let URLSearchParams handle encoding)
    if (searchTerms.length > 0) {
      params.q = searchTerms.join(' AND ');
    }
    
    // Build URL search params
    const urlParams = new URLSearchParams(params);
    
    return `${baseUrl}?${urlParams.toString()}`;
  }

  /**
   * Extract media URL and type from Reddit post data
   */
  extractMediaInfo(post) {
    // Priority 1: Reddit videos (v.redd.it)
    if (post.is_video && post.media?.reddit_video) {
      const redditVideo = post.media.reddit_video;
      return {
        mediaUrl: redditVideo.fallback_url || post.url,
        mediaType: redditVideo.is_gif ? 'gif' : 'video',
        thumbnailUrl: this.getValidThumbnail(post),
        videoData: {
          width: redditVideo.width,
          height: redditVideo.height,
          duration: redditVideo.duration,
          hasAudio: redditVideo.has_audio,
          dashUrl: redditVideo.dash_url,
          hlsUrl: redditVideo.hls_url
        }
      };
    }

    // Priority 2: Check secure_media for videos (backup)
    if (post.secure_media?.reddit_video) {
      const redditVideo = post.secure_media.reddit_video;
      return {
        mediaUrl: redditVideo.fallback_url || post.url,
        mediaType: redditVideo.is_gif ? 'gif' : 'video',
        thumbnailUrl: this.getValidThumbnail(post),
        videoData: {
          width: redditVideo.width,
          height: redditVideo.height,
          duration: redditVideo.duration,
          hasAudio: redditVideo.has_audio,
          dashUrl: redditVideo.dash_url,
          hlsUrl: redditVideo.hls_url
        }
      };
    }

    // Priority 3: Direct URLs
    if (post.url) {
      const url = post.url;
      
      // Direct Reddit images
      if (url.includes('i.redd.it')) {
        return {
          mediaUrl: url,
          mediaType: 'image',
          thumbnailUrl: this.getValidThumbnail(post)
        };
      }
      
      // v.redd.it videos (fallback if not caught above)
      if (url.includes('v.redd.it')) {
        return {
          mediaUrl: url,
          mediaType: 'video',
          thumbnailUrl: this.getValidThumbnail(post)
        };
      }
      
      // Imgur handling
      if (url.includes('imgur.com')) {
        let directUrl = url;
        let mediaType = 'image';
        
        // Handle imgur galleries and albums
        if (url.includes('/gallery/') || url.includes('/a/')) {
          // For galleries, try to get the first image
          const imgurId = url.split('/').pop();
          directUrl = `https://i.imgur.com/${imgurId}.jpg`;
        } else if (!url.includes('.jpg') && !url.includes('.png') && !url.includes('.gif') && !url.includes('.mp4')) {
          // Convert imgur links to direct image links
          directUrl = url.replace('imgur.com/', 'i.imgur.com/') + '.jpg';
        }
        
        if (url.includes('.gif') || url.includes('gifv')) {
          mediaType = 'gif';
          directUrl = directUrl.replace('.gifv', '.gif');
        } else if (url.includes('.mp4')) {
          mediaType = 'video';
        }
        
        return {
          mediaUrl: directUrl,
          mediaType: mediaType,
          thumbnailUrl: this.getValidThumbnail(post)
        };
      }
      
      // Direct image/video formats
      if (url.match(/\.(jpg|jpeg|png|webp)$/i)) {
        return {
          mediaUrl: url,
          mediaType: 'image',
          thumbnailUrl: this.getValidThumbnail(post)
        };
      }
      
      if (url.match(/\.(gif)$/i)) {
        return {
          mediaUrl: url,
          mediaType: 'gif',
          thumbnailUrl: this.getValidThumbnail(post)
        };
      }
      
      if (url.match(/\.(mp4|webm|mov)$/i)) {
        return {
          mediaUrl: url,
          mediaType: 'video',
          thumbnailUrl: this.getValidThumbnail(post)
        };
      }
      
      // YouTube videos
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        return {
          mediaUrl: url,
          mediaType: 'video',
          thumbnailUrl: this.getValidThumbnail(post)
        };
      }
      
      // Other video platforms
      if (url.includes('streamable.com') || url.includes('gfycat.com') || url.includes('redgifs.com')) {
        return {
          mediaUrl: url,
          mediaType: 'video',
          thumbnailUrl: this.getValidThumbnail(post)
        };
      }
    }
    
    // Priority 4: Preview images
    if (post.preview?.images?.[0]) {
      const preview = post.preview.images[0];
      const sourceUrl = preview.source?.url?.replace(/&amp;/g, '&');
      const thumbnailUrl = preview.resolutions?.[0]?.url?.replace(/&amp;/g, '&');
      
      if (sourceUrl) {
        return {
          mediaUrl: sourceUrl,
          mediaType: 'image',
          thumbnailUrl: thumbnailUrl || this.getValidThumbnail(post)
        };
      }
    }
    
    // Priority 5: No media found - text post
    return {
      mediaUrl: null,
      mediaType: 'text',
      thumbnailUrl: this.getValidThumbnail(post)
    };
  }

  /**
   * Get a valid thumbnail URL, filtering out placeholder thumbnails
   */
  getValidThumbnail(post) {
    if (!post.thumbnail || 
        post.thumbnail === 'self' || 
        post.thumbnail === 'default' || 
        post.thumbnail === 'nsfw' ||
        post.thumbnail === 'spoiler') {
      return null;
    }
    if (post.is_video && post?.preview?.images?.[0].source?.url) {
      return post?.preview?.images?.[0].source?.url;
    }

    return post.thumbnail;
  }

  /**
   * Get emoji tag based on subreddit
   */
  getEmojiTag(subreddit) {
    const subredditEmojis = {
      'cats': '🐱',
      'funny': '😂',
      'aww': '🥰',
      'EarthPorn': '🌍',
      'mildlyinteresting': '🤔',
      'oddlysatisfying': '✨',
      'NatureIsFuckingLit': '🔥',
      'CozyPlaces': '🏠'
    };
    
    return subredditEmojis[subreddit] || '📷';
  }

  /**
   * Process raw Reddit post data into our format with media extraction
   */
  processPost(item, subreddit = null) {
    const post = item.data || {};
    
    // Get subreddit name
    const postSubreddit = subreddit || post.subreddit || 'unknown';
    const originalTitle = post.title || 'No title';
    
    // Extract media information
    const mediaInfo = this.extractMediaInfo(post);
    
    // Get post content (selftext) with reasonable character limit
    const selftext = post.selftext || '';
    const maxContentLength = 200; // Shorter for card layout
    const truncatedContent = selftext.length > maxContentLength 
      ? selftext.substring(0, maxContentLength) + '...' 
      : selftext;
    
    return {
      id: post.name || 'Unknown ID',
      title: originalTitle,
      author: post.author || 'Unknown author',
      subreddit: postSubreddit,
      content: truncatedContent,
      hasContent: selftext.length > 0,
      createdUtc: post.created_utc || 0,
      ups: post.ups || 0,
      downs: post.downs || 0,
      permalink: post.permalink || '',
      mediaUrl: mediaInfo.mediaUrl,
      mediaType: mediaInfo.mediaType,
      thumbnailUrl: mediaInfo.thumbnailUrl,
      emojiTag: this.getEmojiTag(postSubreddit),
      lastUpdated: new Date(),
      videoData: mediaInfo.videoData || null,
    };
  }

  /**
   * Fetch all posts from all configurations using sort-based URLs
   */
  async fetchAllPosts() {
    try {
      console.log(`Fetching posts from ${this.subredditConfigs.length} configurations...`);
      
      if (this.subredditConfigs.length === 0) {
        console.warn('No configurations found, returning empty results');
        return [];
      }
      
      // Create a request for each configuration
      const configPromises = this.subredditConfigs.map(async (config) => {
        const { subreddit, sortType, timeframe } = config;
        
        // Build sort URL for this specific configuration
        const url = this.buildSortUrl(subreddit, sortType, timeframe);
        console.log(`Fetching from: r/${subreddit} (${sortType}${timeframe ? `/${timeframe}` : ''})`);
        
        const posts = await this.fetchRedditData(url);
        
        // Process posts with subreddit information
        return posts.map(post => this.processPost(post, subreddit));
      });
      
      const configResults = await Promise.all(configPromises);
      
      // Combine all results
      const allResults = configResults.flat();
      
      // Remove duplicates based on post ID
      const processedPosts = [];
      const seenIds = new Set();
      
      for (const post of allResults) {
        if (!seenIds.has(post.id)) {
          seenIds.add(post.id);
          processedPosts.push(post);
        }
      }
      
      // Sort by creation time (newest first)
      processedPosts.sort((a, b) => b.createdUtc - a.createdUtc);
      
      console.log(`Fetched ${processedPosts.length} unique posts from ${this.subredditConfigs.length} configurations`);
      return processedPosts;
      
    } catch (error) {
      console.error('Error fetching posts:', error.message);
      throw error;
    }
  }
}

// Create and export a singleton instance
let redditClientInstance = null;

export const createRedditClient = (config) => {
  redditClientInstance = new RedditClient(config);
  return redditClientInstance;
};

export const getRedditClient = () => {
  if (!redditClientInstance) {
    throw new Error('Reddit client not initialized. Call createRedditClient() first.');
  }
  return redditClientInstance;
};

export default RedditClient;

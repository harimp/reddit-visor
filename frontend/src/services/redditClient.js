/**
 * Reddit API Client for direct frontend access
 * Handles OAuth authentication, rate limiting, and data fetching
 * Enhanced with Safari CORS compatibility
 */

import { redditApiFetch, getBrowserInfo, isCORSError } from '../utils/browserCompat.js';

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
    
    // Initialize NSFW setting
    this.nsfwSetting = 'sfw'; // Default to safe for work
    this.loadNsfwSetting();
    
    // Initialize configuration profiles
    this.profiles = [];
    this.currentProfileId = null;
    this.loadProfiles();
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
        // Only migrate if ALL configs have keywords (old system) and no id field (new system)
        const needsMigration = configs.length > 0 && 
          configs.every(config => config.keywords && !config.id) &&
          !configs.some(config => config.subreddit && config.sortType);
        
        if (needsMigration) {
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

      const response = await redditApiFetch('https://www.reddit.com/api/v1/access_token', {
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
        
        // Use Safari-compatible fetch with enhanced error handling
        const response = await redditApiFetch(url, {
          headers
        }, 10000); // 10 second timeout
        
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
    
    // Add NSFW parameter if set to include NSFW content
    if (this.nsfwSetting === 'nsfw') {
      params.include_over_18 = 'on';
    }
    // For SFW mode, we omit the parameter (Reddit's default excludes NSFW)
    
    const urlParams = new URLSearchParams(params);
    return `${baseUrl}?${urlParams.toString()}`;
  }

  /**
   * Build Reddit search URL for keyword searches
   */
  buildSearchUrl(subreddit, keywords, sortType = 'relevance', timeframe = null) {
    const baseUrl = `https://www.reddit.com/r/${subreddit}/search.json`;
    
    const params = {
      q: keywords,           // Boolean query string
      restrict_sr: 'on',     // Search within subreddit only
      sort: sortType,        // relevance, hot, top, new, comments
      limit: '50'            // Reasonable limit for visual content
    };
    
    // Add timeframe for 'top' sort in searches
    if (sortType === 'top' && timeframe) {
      params.t = timeframe;
    }
    
    // Add NSFW parameter if set to include NSFW content
    if (this.nsfwSetting === 'nsfw') {
      params.include_over_18 = 'on';
    }
    // For SFW mode, we omit the parameter (Reddit's default excludes NSFW)
    
    const urlParams = new URLSearchParams(params);
    return `${baseUrl}?${urlParams.toString()}`;
  }

  /**
   * Add a new subreddit configuration
   */
  addSubredditConfig(subreddit, sortType = 'hot', timeframe = null, keywords = null) {
    const id = `${subreddit}_${sortType}_${timeframe || 'none'}_${keywords ? 'search' : 'feed'}_${Date.now()}`;
    const newConfig = {
      id,
      subreddit,
      sortType,
      timeframe,
      keywords
    };
    
    this.subredditConfigs.push(newConfig);
    this.saveSubredditConfigs();
    return id;
  }

  /**
   * Update existing subreddit configuration by ID
   */
  updateSubredditConfig(configId, subreddit, sortType = 'hot', timeframe = null, keywords = null) {
    const configIndex = this.subredditConfigs.findIndex(config => config.id === configId);
    if (configIndex !== -1) {
      this.subredditConfigs[configIndex] = {
        id: configId,
        subreddit,
        sortType,
        timeframe,
        keywords
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
   * Load NSFW setting from localStorage or initialize default
   */
  loadNsfwSetting() {
    try {
      const saved = localStorage.getItem('redditvisor_nsfw_setting');
      if (saved && (saved === 'sfw' || saved === 'nsfw')) {
        this.nsfwSetting = saved;
        console.log(`Loaded NSFW setting: ${this.nsfwSetting}`);
      } else {
        this.nsfwSetting = 'sfw'; // Default to safe for work
        this.saveNsfwSetting();
        console.log('Initialized NSFW setting to default: sfw');
      }
    } catch (error) {
      console.error('Error loading NSFW setting from localStorage:', error);
      this.nsfwSetting = 'sfw';
    }
  }

  /**
   * Save NSFW setting to localStorage
   */
  saveNsfwSetting() {
    try {
      localStorage.setItem('redditvisor_nsfw_setting', this.nsfwSetting);
      console.log(`Saved NSFW setting: ${this.nsfwSetting}`);
    } catch (error) {
      console.error('Error saving NSFW setting to localStorage:', error);
    }
  }

  /**
   * Get current NSFW setting
   */
  getNsfwSetting() {
    return this.nsfwSetting;
  }

  /**
   * Set NSFW setting
   */
  setNsfwSetting(setting) {
    if (setting !== 'sfw' && setting !== 'nsfw') {
      throw new Error('NSFW setting must be either "sfw" or "nsfw"');
    }
    
    this.nsfwSetting = setting;
    this.saveNsfwSetting();
    console.log(`Updated NSFW setting to: ${this.nsfwSetting}`);
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
    // Priority 0: Check for oembed content first
    const oembedHtml = post.media?.oembed?.html || post.secure_media_embed?.html;
    if (oembedHtml) {
      // Decode HTML entities in the oembed HTML
      const decodedOembedHtml = oembedHtml
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
      
      return {
        mediaUrl: post.url, // Keep original URL as fallback
        mediaType: 'video',
        thumbnailUrl: this.getValidThumbnail(post),
        hasOembed: true,
        oembedHtml: decodedOembedHtml,
        oembedData: {
          width: post.media?.oembed?.width || post.secure_media_embed?.width,
          height: post.media?.oembed?.height || post.secure_media_embed?.height,
          provider_name: post.media?.oembed?.provider_name,
          provider_url: post.media?.oembed?.provider_url
        }
      };
    }

    // Priority 1: Check for image galleries
    if (post.is_gallery && post.gallery_data && post.media_metadata) {
      return {
        mediaUrl: null,
        mediaType: 'gallery',
        thumbnailUrl: this.getValidThumbnail(post),
        galleryData: post.gallery_data,
        mediaMetadata: post.media_metadata
      };
    }

    // Priority 2: Reddit videos (v.redd.it)
    if (post.is_video && post.media?.reddit_video) {
      const redditVideo = post.media.reddit_video;
      
      // Prioritize HLS/DASH URLs over fallback_url for better audio support
      const getBestVideoUrl = () => {
        if (redditVideo.hls_url) return redditVideo.hls_url;     // M3U8 - best option with audio
        if (redditVideo.dash_url) return redditVideo.dash_url;   // MPD - good option with audio
        return redditVideo.fallback_url || post.url;             // MP4 - fallback (often no audio)
      };
      
      return {
        mediaUrl: getBestVideoUrl(),
        mediaType: redditVideo.is_gif ? 'gif' : 'video',
        thumbnailUrl: this.getValidThumbnail(post),
        videoData: {
          width: redditVideo.width,
          height: redditVideo.height,
          duration: redditVideo.duration,
          hasAudio: redditVideo.has_audio,
          dashUrl: redditVideo.dash_url,
          hlsUrl: redditVideo.hls_url,
          fallbackUrl: redditVideo.fallback_url
        }
      };
    }

    // Priority 3: Check secure_media for videos (backup)
    if (post.secure_media?.reddit_video) {
      const redditVideo = post.secure_media.reddit_video;
      
      // Prioritize HLS/DASH URLs over fallback_url for better audio support
      const getBestVideoUrl = () => {
        if (redditVideo.hls_url) return redditVideo.hls_url;     // M3U8 - best option with audio
        if (redditVideo.dash_url) return redditVideo.dash_url;   // MPD - good option with audio
        return redditVideo.fallback_url || post.url;             // MP4 - fallback (often no audio)
      };
      
      return {
        mediaUrl: getBestVideoUrl(),
        mediaType: redditVideo.is_gif ? 'gif' : 'video',
        thumbnailUrl: this.getValidThumbnail(post),
        videoData: {
          width: redditVideo.width,
          height: redditVideo.height,
          duration: redditVideo.duration,
          hasAudio: redditVideo.has_audio,
          dashUrl: redditVideo.dash_url,
          hlsUrl: redditVideo.hls_url,
          fallbackUrl: redditVideo.fallback_url
        }
      };
    }

    // Priority 4: Direct URLs
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
    
    // Priority 5: Preview images
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
    
    // Priority 6: No media found - text post
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
    // Handle YouTube videos specially
    if (post.url && (post.url.includes('youtube.com') || post.url.includes('youtu.be'))) {
      return this.getYouTubeThumbnail(post.url);
    }
    
    if (!post.thumbnail || 
        post.thumbnail === 'self' || 
        post.thumbnail === 'default' || 
        post.thumbnail === 'nsfw' ||
        post.thumbnail === 'spoiler') {
      return null;
    }
    
    // For video posts, prefer preview images over thumbnail
    if (post.is_video && post?.preview?.images?.[0]?.source?.url) {
      const previewUrl = post.preview.images[0].source.url.replace(/&amp;/g, '&');
      return previewUrl;
    }
    
    // Use the regular thumbnail if it's valid
    if (post.thumbnail && post.thumbnail.startsWith('http')) {
      return post.thumbnail;
    }
    
    // Try to get from preview images as fallback
    if (post?.preview?.images?.[0]?.source?.url) {
      return post.preview.images[0].source.url.replace(/&amp;/g, '&');
    }
    
    // Try resolutions as last resort
    if (post?.preview?.images?.[0]?.resolutions?.length > 0) {
      const resolutions = post.preview.images[0].resolutions;
      const mediumRes = resolutions.find(res => res.width >= 320 && res.width <= 640) || 
                       resolutions[Math.floor(resolutions.length / 2)] || 
                       resolutions[0];
      
      if (mediumRes?.url) {
        return mediumRes.url.replace(/&amp;/g, '&');
      }
    }

    return null;
  }

  /**
   * Extract YouTube video ID and generate thumbnail URL
   */
  getYouTubeThumbnail(url) {
    let videoId = null;
    
    // Handle different YouTube URL formats
    if (url.includes('youtube.com/watch?v=')) {
      videoId = url.split('v=')[1]?.split('&')[0];
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0];
    } else if (url.includes('youtube.com/embed/')) {
      videoId = url.split('/embed/')[1]?.split('?')[0];
    }
    
    if (videoId) {
      // Use high quality thumbnail (hqdefault) which is 480x360
      return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    }
    
    return null;
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
      galleryData: mediaInfo.galleryData || null,
      mediaMetadata: mediaInfo.mediaMetadata || null,
      hasOembed: mediaInfo.hasOembed || false,
      oembedHtml: mediaInfo.oembedHtml || null,
      oembedData: mediaInfo.oembedData || null,
    };
  }

  /**
   * Load configuration profiles from localStorage or initialize defaults
   */
  loadProfiles() {
    try {
      const saved = localStorage.getItem('redditvisor_profiles');
      if (saved) {
        const profileData = JSON.parse(saved);
        this.profiles = profileData.profiles || [];
        this.currentProfileId = profileData.currentProfileId || null;
        console.log(`Loaded ${this.profiles.length} configuration profiles from localStorage`);
        
        // If we have a current profile, load its configuration
        if (this.currentProfileId) {
          this.loadProfile(this.currentProfileId);
        }
      } else {
        this.initializeDefaultProfiles();
      }
    } catch (error) {
      console.error('Error loading configuration profiles from localStorage:', error);
      this.initializeDefaultProfiles();
    }
  }

  /**
   * Save configuration profiles to localStorage
   */
  saveProfiles() {
    try {
      const profileData = {
        profiles: this.profiles,
        currentProfileId: this.currentProfileId
      };
      localStorage.setItem('redditvisor_profiles', JSON.stringify(profileData));
      console.log(`Saved ${this.profiles.length} configuration profiles to localStorage`);
    } catch (error) {
      console.error('Error saving configuration profiles to localStorage:', error);
    }
  }

  /**
   * Initialize default configuration profiles
   */
  initializeDefaultProfiles() {
    const defaultProfile = {
      id: 'default_profile',
      name: 'Default',
      description: 'Default picture-focused subreddits',
      createdAt: Date.now(),
      lastUsed: Date.now(),
      configuration: {
        subredditConfigs: [...this.subredditConfigs],
        nsfwSetting: this.nsfwSetting,
        uiPreferences: {
          viewMode: 'grid',
          sortBy: 'createTime'
        }
      }
    };

    this.profiles = [defaultProfile];
    this.currentProfileId = defaultProfile.id;
    this.saveProfiles();
    console.log('Initialized default configuration profile');
  }

  /**
   * Create a new configuration profile from current state
   */
  createProfile(name, description = '') {
    const profileId = `profile_${Date.now()}`;
    const newProfile = {
      id: profileId,
      name: name,
      description: description,
      createdAt: Date.now(),
      lastUsed: Date.now(),
      configuration: {
        subredditConfigs: [...this.subredditConfigs],
        nsfwSetting: this.nsfwSetting,
        uiPreferences: {
          viewMode: 'grid',
          sortBy: 'createTime'
        }
      }
    };

    this.profiles.push(newProfile);
    this.saveProfiles();
    console.log(`Created new profile: ${name}`);
    return profileId;
  }

  /**
   * Update existing profile with current configuration
   */
  updateProfile(profileId, updates = {}) {
    const profileIndex = this.profiles.findIndex(p => p.id === profileId);
    if (profileIndex !== -1) {
      const profile = this.profiles[profileIndex];
      
      // Update profile metadata
      if (updates.name) profile.name = updates.name;
      if (updates.description !== undefined) profile.description = updates.description;
      
      // Update configuration if requested
      if (updates.updateConfiguration !== false) {
        profile.configuration = {
          subredditConfigs: [...this.subredditConfigs],
          nsfwSetting: this.nsfwSetting,
          uiPreferences: updates.uiPreferences || profile.configuration.uiPreferences
        };
      }
      
      profile.lastUsed = Date.now();
      this.saveProfiles();
      console.log(`Updated profile: ${profile.name}`);
      return true;
    }
    return false;
  }

  /**
   * Delete a configuration profile
   */
  deleteProfile(profileId) {
    if (profileId === 'default_profile') {
      console.warn('Cannot delete default profile');
      return false;
    }

    const initialLength = this.profiles.length;
    this.profiles = this.profiles.filter(p => p.id !== profileId);
    
    if (this.profiles.length < initialLength) {
      // If we deleted the current profile, switch to default
      if (this.currentProfileId === profileId) {
        this.currentProfileId = 'default_profile';
        this.loadProfile(this.currentProfileId);
      }
      
      this.saveProfiles();
      console.log(`Deleted profile: ${profileId}`);
      return true;
    }
    return false;
  }

  /**
   * Load a configuration profile
   */
  loadProfile(profileId) {
    const profile = this.profiles.find(p => p.id === profileId);
    if (profile) {
      // Load subreddit configurations
      this.subredditConfigs = [...profile.configuration.subredditConfigs];
      
      // Load NSFW setting
      this.nsfwSetting = profile.configuration.nsfwSetting;
      
      // Update current profile
      this.currentProfileId = profileId;
      profile.lastUsed = Date.now();
      
      // Save configurations to their respective localStorage keys
      this.saveSubredditConfigs();
      this.saveNsfwSetting();
      this.saveProfiles();
      
      console.log(`Loaded profile: ${profile.name}`);
      return {
        profile: profile,
        uiPreferences: profile.configuration.uiPreferences
      };
    }
    return null;
  }

  /**
   * Get all configuration profiles
   */
  getProfiles() {
    return [...this.profiles].sort((a, b) => b.lastUsed - a.lastUsed);
  }

  /**
   * Get current profile
   */
  getCurrentProfile() {
    return this.profiles.find(p => p.id === this.currentProfileId) || null;
  }

  /**
   * Duplicate an existing profile
   */
  duplicateProfile(profileId, newName) {
    const sourceProfile = this.profiles.find(p => p.id === profileId);
    if (sourceProfile) {
      const duplicateId = `profile_${Date.now()}`;
      const duplicateProfile = {
        id: duplicateId,
        name: newName,
        description: `Copy of ${sourceProfile.name}`,
        createdAt: Date.now(),
        lastUsed: Date.now(),
        configuration: {
          subredditConfigs: [...sourceProfile.configuration.subredditConfigs],
          nsfwSetting: sourceProfile.configuration.nsfwSetting,
          uiPreferences: { ...sourceProfile.configuration.uiPreferences }
        }
      };

      this.profiles.push(duplicateProfile);
      this.saveProfiles();
      console.log(`Duplicated profile: ${sourceProfile.name} -> ${newName}`);
      return duplicateId;
    }
    return null;
  }

  /**
   * Export profile configuration as JSON
   */
  exportProfile(profileId) {
    const profile = this.profiles.find(p => p.id === profileId);
    if (profile) {
      return {
        name: profile.name,
        description: profile.description,
        configuration: profile.configuration,
        exportedAt: Date.now(),
        version: '1.0'
      };
    }
    return null;
  }

  /**
   * Import profile configuration from JSON
   */
  importProfile(profileData, customName = null) {
    try {
      const profileId = `profile_${Date.now()}`;
      const importedProfile = {
        id: profileId,
        name: customName || profileData.name || 'Imported Profile',
        description: profileData.description || 'Imported configuration',
        createdAt: Date.now(),
        lastUsed: Date.now(),
        configuration: profileData.configuration
      };

      this.profiles.push(importedProfile);
      this.saveProfiles();
      console.log(`Imported profile: ${importedProfile.name}`);
      return profileId;
    } catch (error) {
      console.error('Error importing profile:', error);
      return null;
    }
  }

  /**
   * Fetch all posts from all configurations using sort-based or search URLs
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
        const { subreddit, sortType, timeframe, keywords } = config;
        
        let url;
        let logMessage;
        
        if (keywords && keywords.trim()) {
          // Use search endpoint for keyword queries
          url = this.buildSearchUrl(subreddit, keywords.trim(), sortType, timeframe);
          logMessage = `Searching r/${subreddit} for "${keywords}" (${sortType}${timeframe ? `/${timeframe}` : ''})`;
        } else {
          // Use regular sort endpoint
          url = this.buildSortUrl(subreddit, sortType, timeframe);
          logMessage = `Fetching from: r/${subreddit} (${sortType}${timeframe ? `/${timeframe}` : ''})`;
        }
        
        console.log(logMessage);
        
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

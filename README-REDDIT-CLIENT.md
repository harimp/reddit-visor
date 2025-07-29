# Reddit Client Migration & Technical Documentation

This document describes the migration from backend Reddit polling to a frontend Reddit client, along with technical details about the current implementation.

## Overview

RedditVisor has evolved from a backend-polling architecture to a modern frontend-only application that communicates directly with Reddit's API. This migration provides better performance, reduced infrastructure requirements, and improved user experience.

## Architecture Evolution

### Before (Backend Polling)
```
Frontend → Backend API → Reddit API
- Backend polls Reddit every 30 seconds
- Frontend fetches from backend API
- Requires server infrastructure
- Single point of failure
- Higher latency
```

### After (Frontend Client)
```
Frontend → Reddit API (direct OAuth)
- Frontend polls Reddit directly
- No backend dependency for data
- Client-side caching with localStorage
- Reduced latency and infrastructure costs
- Better scalability
```

## Current Implementation

### 1. Reddit Client Service (`src/services/redditClient.js`)

The core Reddit API client handles all communication with Reddit's API:

#### Features
- **OAuth Authentication**: Supports both `client_credentials` and `password` grant types
- **Rate Limiting**: Intelligent handling of Reddit's rate limits with exponential backoff
- **Token Management**: Automatic token refresh and lifecycle management
- **Error Handling**: Comprehensive error handling with retry logic
- **Media Processing**: Smart extraction and processing of images, videos, and other media
- **Concurrent Requests**: Parallel fetching from multiple subreddits

#### Key Methods
```javascript
class RedditClient {
  async authenticate()           // OAuth token acquisition
  async fetchSubreddit(name, sort, timeframe)  // Fetch posts from subreddit
  async fetchAllPosts()         // Fetch from all configured subreddits
  extractMediaInfo(post)        // Process media URLs and metadata
  handleRateLimit(response)     // Rate limit management
}
```

#### Supported Media Types
- **Reddit Native**: i.redd.it images, v.redd.it videos with native HTML5 player
- **Imgur**: Direct image links and gallery support
- **YouTube**: Thumbnail extraction with click-to-play
- **Video Platforms**: Streamable, Gfycat, RedGifs with thumbnail support
- **GIFs**: Animated GIF support with loading indicators
- **Text Posts**: Fallback display with emoji indicators

### 2. Reddit Data Hook (`src/hooks/useRedditData.js`)

Custom React hook that manages data fetching, caching, and state:

#### Features
- **Polling Management**: Configurable polling intervals with start/stop control
- **Caching Strategy**: 5-minute localStorage cache with automatic expiry
- **Loading States**: Comprehensive loading, error, and success states
- **Offline Support**: Graceful fallback to cached data when offline
- **Deduplication**: Automatic removal of duplicate posts across subreddits

#### Hook Interface
```javascript
const {
  posts,              // Array of processed Reddit posts
  loading,            // Boolean loading state
  error,              // Error object or null
  lastUpdated,        // Timestamp of last successful fetch
  isPolling,          // Boolean polling status
  refresh,            // Manual refresh function
  clearCache,         // Clear localStorage cache
  startPolling,       // Start automatic polling
  stopPolling         // Stop automatic polling
} = useRedditData(pollingInterval);
```

### 3. Enhanced Components

#### PostGrid & PostCard
- **Responsive Layout**: 3-column masonry grid (desktop), 2-column (tablet), 1-column (mobile)
- **Media Display**: Large, prominent media with hover effects and loading states
- **Video Integration**: Native HTML5 video player for Reddit videos
- **Interactive Elements**: Click handlers for Reddit links, user profiles, subreddits

#### VideoPlayer (`src/components/VideoPlayer.jsx`)
- **Native Controls**: Uses browser's built-in video controls
- **Poster Images**: Thumbnail display before video loads
- **Audio Indicators**: Visual badges for videos without audio (🔇)
- **Duration Display**: Video length shown in MM:SS format
- **Error Handling**: Graceful fallback for failed video loads

#### SubredditManagement
- **Grid-Based Interface**: Compact, modular configuration cards
- **Real-Time Updates**: Live configuration changes without page refresh
- **Sort Integration**: Native Reddit sorting (hot, new, rising, top) with timeframes
- **Visual Feedback**: Hover effects and smooth animations

## Configuration & Setup

### Environment Variables (`frontend/.env`)
```env
# Required: Reddit OAuth credentials
VITE_REDDIT_CLIENT_ID=your_client_id_here
VITE_REDDIT_CLIENT_SECRET=your_client_secret_here
VITE_REDDIT_USER_AGENT=RedditVisor/1.0 by YourUsername

# Optional: For script-type apps (higher rate limits)
VITE_REDDIT_USERNAME=your_reddit_username
VITE_REDDIT_PASSWORD=your_reddit_password

# Optional: Configuration overrides
VITE_POLLING_INTERVAL=30000
VITE_CACHE_DURATION=300000
```

### Reddit App Configuration
1. **Create Reddit App**: https://www.reddit.com/prefs/apps
2. **App Type**: 
   - "web app" for production deployment
   - "script" for development/personal use
3. **Redirect URI**: `http://localhost:5173` (development)

## Technical Features

### OAuth Authentication Flow
```javascript
// Client credentials flow (recommended)
const tokenResponse = await fetch('https://www.reddit.com/api/v1/access_token', {
  method: 'POST',
  headers: {
    'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
    'Content-Type': 'application/x-www-form-urlencoded',
    'User-Agent': userAgent
  },
  body: 'grant_type=client_credentials'
});
```

### Rate Limit Handling
```javascript
async handleRateLimit(response) {
  if (response.status === 429) {
    const retryAfter = response.headers.get('retry-after') || 60;
    await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
    return true; // Retry the request
  }
  return false;
}
```

### Caching Strategy
```javascript
// 5-minute cache with automatic expiry
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const cacheKey = 'redditvisor_posts_cache';
const expiryKey = 'redditvisor_cache_expiry';

// Cache implementation
const cachedData = localStorage.getItem(cacheKey);
const cacheExpiry = localStorage.getItem(expiryKey);
const isExpired = !cacheExpiry || Date.now() > parseInt(cacheExpiry);
```

### Media Processing Pipeline
```javascript
extractMediaInfo(post) {
  const { url, preview, media, is_video } = post;
  
  // Reddit native media
  if (url.includes('i.redd.it')) return { type: 'image', url };
  if (url.includes('v.redd.it')) return { type: 'reddit_video', url, hasAudio: media?.reddit_video?.has_audio };
  
  // External platforms
  if (url.includes('imgur.com')) return this.processImgur(url);
  if (url.includes('youtube.com')) return this.processYouTube(url);
  if (url.includes('streamable.com')) return this.processStreamable(url);
  
  // Fallback
  return { type: 'text', title: post.title };
}
```

## Performance Optimizations

### Concurrent API Requests
```javascript
async fetchAllPosts() {
  const subredditConfigs = this.getSubredditConfigs();
  
  // Fetch all subreddits concurrently
  const promises = subredditConfigs.map(config => 
    this.fetchSubreddit(config.name, config.sort, config.timeframe)
  );
  
  const results = await Promise.allSettled(promises);
  return this.processResults(results);
}
```

### Smart Deduplication
```javascript
removeDuplicates(posts) {
  const seen = new Set();
  return posts.filter(post => {
    const key = `${post.id}_${post.subreddit}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
```

### Lazy Loading & Virtualization
- **Image Loading**: Progressive loading with skeleton states
- **Video Loading**: Poster images with on-demand video loading
- **Infinite Scroll**: Planned feature for large datasets

## Error Handling & Resilience

### Network Error Recovery
```javascript
async fetchWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      
      if (await this.handleRateLimit(response)) continue;
      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await this.exponentialBackoff(i);
    }
  }
}
```

### Graceful Degradation
- **Offline Support**: Falls back to cached data when network unavailable
- **Media Fallbacks**: Text display when media fails to load
- **API Failures**: User-friendly error messages with retry options

## Migration Benefits

### Infrastructure
- **Reduced Server Costs**: No backend hosting required
- **Better Scalability**: Client-side processing scales with users
- **Simplified Deployment**: Single build artifact (frontend only)
- **Reduced Complexity**: Fewer moving parts and dependencies

### User Experience
- **Faster Loading**: Direct API access eliminates proxy latency
- **Offline Capability**: Cached data available when offline
- **Real-time Updates**: Immediate feedback for configuration changes
- **Better Performance**: Reduced network hops and server processing

### Development
- **Easier Debugging**: Client-side network inspection in browser
- **Simplified Testing**: Direct API interaction testing
- **Better Development Experience**: Hot reloading and instant feedback
- **Reduced Maintenance**: No server infrastructure to maintain

## API Rate Limits & Best Practices

### Rate Limits
- **Authenticated Requests**: 60 requests per minute
- **Unauthenticated Requests**: 10 requests per minute
- **Burst Limits**: Short-term higher limits for initial requests

### Best Practices
```javascript
// Respect rate limits
const rateLimiter = {
  requests: [],
  maxRequests: 60,
  timeWindow: 60000, // 1 minute
  
  async canMakeRequest() {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.timeWindow);
    return this.requests.length < this.maxRequests;
  }
};
```

### Optimization Strategies
- **Request Batching**: Combine multiple subreddit requests
- **Smart Caching**: Reduce redundant API calls
- **Conditional Requests**: Use ETags and If-Modified-Since headers
- **Background Updates**: Non-blocking polling for better UX

## Future Enhancements

### Planned Features
- **WebSocket Support**: Real-time updates for active subreddits
- **Service Worker**: Background sync and offline-first experience
- **Push Notifications**: Browser notifications for new posts
- **Advanced Caching**: IndexedDB for larger datasets

### Performance Improvements
- **Request Deduplication**: Prevent duplicate concurrent requests
- **Smart Polling**: Adaptive intervals based on subreddit activity
- **Image Optimization**: WebP conversion and responsive images
- **Bundle Splitting**: Code splitting for faster initial loads

### Enhanced Features
- **User Authentication**: Full Reddit account integration
- **Comment Support**: Display and interaction with post comments
- **Voting Integration**: Upvote/downvote functionality
- **Saved Posts**: Personal post collections

## Troubleshooting

### Common Issues

1. **Authentication Failures**
   ```javascript
   // Check credentials
   console.log('Client ID:', import.meta.env.VITE_REDDIT_CLIENT_ID);
   console.log('User Agent:', import.meta.env.VITE_REDDIT_USER_AGENT);
   ```

2. **Rate Limiting**
   ```javascript
   // Monitor rate limit status
   const rateLimitInfo = {
     remaining: response.headers.get('x-ratelimit-remaining'),
     reset: response.headers.get('x-ratelimit-reset'),
     used: response.headers.get('x-ratelimit-used')
   };
   ```

3. **CORS Issues**
   - Reddit API supports CORS for OAuth requests
   - Ensure proper credentials and user agent
   - Check browser console for detailed error messages

4. **Cache Issues**
   ```javascript
   // Clear cache manually
   localStorage.removeItem('redditvisor_posts_cache');
   localStorage.removeItem('redditvisor_cache_expiry');
   ```

### Debug Mode
```javascript
// Enable detailed logging
localStorage.setItem('redditvisor_debug', 'true');

// Monitor API calls
window.redditClient = getRedditClient();
console.log('Reddit client:', window.redditClient);
```

## Rollback Plan

If issues arise, you can temporarily revert to backend polling:

1. **Restore Backend**: Uncomment Reddit polling logic in `backend/server.js`
2. **Update Frontend**: Modify `useRedditData.js` to use `/api/posts` endpoint
3. **Environment**: Move Reddit credentials back to backend `.env`
4. **Start Both Servers**: Use `npm run dev` to start frontend and backend

## Contributing

Areas for contribution:
- **New Media Platforms**: Add support for additional video/image platforms
- **Performance**: Optimize API calls and caching strategies
- **Features**: Implement user authentication and advanced Reddit features
- **Testing**: Add comprehensive test coverage for Reddit client
- **Documentation**: Improve API documentation and examples

---

**The frontend Reddit client provides a robust, scalable foundation for RedditVisor's visual browsing experience!** 🚀

For implementation details, check the source code in:
- `frontend/src/services/redditClient.js` - Core Reddit API client
- `frontend/src/hooks/useRedditData.js` - React data management hook
- `frontend/src/components/` - UI components with Reddit integration

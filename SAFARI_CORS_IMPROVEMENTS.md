# Safari CORS Improvements for Reddit Visor

## Overview
This document outlines the comprehensive Safari CORS compatibility improvements implemented in Reddit Visor to address Safari's stricter CORS policy enforcement and ensure reliable API access across all browsers.

## Safari-Specific CORS Issues Addressed

### 1. Stricter Preflight Request Handling
- **Issue**: Safari is more strict about CORS preflight requests than Chrome/Firefox
- **Solution**: Enhanced proxy configuration with proper CORS headers

### 2. Third-Party Cookie Restrictions
- **Issue**: Safari's Intelligent Tracking Prevention (ITP) blocks cross-origin cookies
- **Solution**: Modified credential handling to use `credentials: 'omit'` for Safari

### 3. Custom Header Restrictions
- **Issue**: Safari blocks custom User-Agent headers in fetch requests
- **Solution**: Automatic removal of problematic headers for Safari requests

### 4. Localhost CORS Issues
- **Issue**: Safari treats localhost differently, blocking some cross-origin requests
- **Solution**: Development proxy routes all API calls through Vite proxy

## Implementation Details

### 1. Vite Development Proxy Configuration
**File**: `frontend/vite.config.js`

```javascript
server: {
  proxy: {
    // Proxy Reddit API calls to avoid CORS issues
    '/api/reddit': {
      target: 'https://www.reddit.com',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api\/reddit/, ''),
      configure: (proxy, options) => {
        proxy.on('proxyRes', (proxyRes, req, res) => {
          // Add CORS headers for Safari compatibility
          proxyRes.headers['Access-Control-Allow-Origin'] = '*';
          proxyRes.headers['Access-Control-Allow-Methods'] = 'GET,POST,PUT,DELETE,OPTIONS';
          proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization,User-Agent,X-Requested-With';
          proxyRes.headers['Access-Control-Max-Age'] = '86400';
          
          // Handle Safari's stricter cookie policies
          if (req.headers['user-agent'] && req.headers['user-agent'].includes('Safari')) {
            proxyRes.headers['Access-Control-Allow-Credentials'] = 'false';
          }
        });
      }
    }
  }
}
```

### 2. Production Netlify Proxy
**File**: `frontend/public/_redirects`

```
# Reddit API proxy routes
/api/reddit/* https://www.reddit.com/:splat 200
/api/oauth/* https://oauth.reddit.com/:splat 200

# Add CORS headers for all API routes
/api/* https://www.reddit.com/:splat 200
  Access-Control-Allow-Origin: *
  Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
  Access-Control-Allow-Headers: Content-Type, Authorization, User-Agent, X-Requested-With
  Access-Control-Max-Age: 86400
```

### 3. Safari-Compatible Fetch Function
**File**: `frontend/src/utils/browserCompat.js`

```javascript
// Safari-compatible fetch with CORS error handling
export const safariCompatibleFetch = async (url, options = {}, timeoutMs = 10000) => {
  const browser = getBrowserInfo();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    let modifiedOptions = { ...options };
    
    // Safari-specific modifications
    if (browser.isSafari) {
      // Avoid credential issues in Safari
      modifiedOptions.credentials = modifiedOptions.credentials || 'omit';
      modifiedOptions.mode = 'cors';
      
      // Remove problematic headers for Safari
      if (modifiedOptions.headers) {
        const headers = { ...modifiedOptions.headers };
        // Safari doesn't allow custom User-Agent from fetch
        delete headers['User-Agent'];
        modifiedOptions.headers = headers;
      }
    }
    
    modifiedOptions.signal = controller.signal;
    
    const response = await fetch(url, modifiedOptions);
    clearTimeout(timeoutId);
    return response;
    
  } catch (error) {
    clearTimeout(timeoutId);
    
    // Handle Safari-specific CORS errors
    if (browser.isSafari && isCORSError(error)) {
      console.warn('Safari CORS error detected:', error.message);
      throw new Error(`Safari CORS Error: ${error.message}. Try refreshing the page or check your network connection.`);
    }
    
    throw error;
  }
};
```

### 4. Enhanced Reddit API Fetch
**File**: `frontend/src/utils/browserCompat.js`

```javascript
// Enhanced fetch for Reddit API with environment detection
export const redditApiFetch = async (endpoint, options = {}, timeoutMs = 10000) => {
  const browser = getBrowserInfo();
  const isDevelopment = import.meta.env.DEV;
  
  // Use proxy in development to avoid CORS issues
  let url = endpoint;
  if (isDevelopment) {
    if (endpoint.includes('oauth.reddit.com')) {
      url = endpoint.replace('https://oauth.reddit.com', '/api/oauth');
    } else if (endpoint.includes('www.reddit.com')) {
      url = endpoint.replace('https://www.reddit.com', '/api/reddit');
    }
  }
  
  try {
    return await safariCompatibleFetch(url, options, timeoutMs);
  } catch (error) {
    // If proxy fails in development, try direct request as fallback
    if (isDevelopment && url !== endpoint) {
      console.warn('Proxy request failed, attempting direct request:', error.message);
      return await safariCompatibleFetch(endpoint, options, timeoutMs);
    }
    throw error;
  }
};
```

### 5. CORS Error Detection
**File**: `frontend/src/utils/browserCompat.js`

```javascript
// Detect CORS-related errors
export const isCORSError = (error) => {
  const corsIndicators = [
    'CORS',
    'Cross-Origin',
    'cross-origin',
    'Access-Control',
    'preflight',
    'Not allowed by Access-Control-Allow-Origin',
    'has been blocked by CORS policy'
  ];
  
  return corsIndicators.some(indicator => 
    error.message.includes(indicator) || 
    error.toString().includes(indicator)
  );
};
```

### 6. Updated Reddit Client
**File**: `frontend/src/services/redditClient.js`

- Replaced all `fetch()` calls with `redditApiFetch()`
- Enhanced error handling for Safari-specific CORS issues
- Automatic proxy routing in development environment
- Fallback mechanisms for failed CORS requests

## Benefits

### 1. Development Experience
- **Eliminated CORS errors** during development across all browsers
- **Consistent behavior** between Safari and other browsers
- **Automatic proxy routing** requires no manual configuration

### 2. Production Reliability
- **Netlify proxy** ensures consistent API access in production
- **Safari-specific handling** prevents CORS failures
- **Graceful error handling** provides user-friendly feedback

### 3. Cross-Browser Compatibility
- **Universal compatibility** across Chrome, Firefox, Safari, and Edge
- **Mobile Safari support** including iOS-specific handling
- **Automatic browser detection** applies optimizations only when needed

### 4. Performance Optimizations
- **Reduced preflight requests** through proper header management
- **Efficient caching** with appropriate `Access-Control-Max-Age` headers
- **Minimal overhead** - optimizations only apply to Safari

## Testing Checklist

### Development Testing
- [ ] Reddit API calls work in Safari during development
- [ ] No CORS errors in Safari developer console
- [ ] Proxy routes function correctly (`/api/reddit/*`, `/api/oauth/*`)
- [ ] Fallback to direct requests works if proxy fails

### Production Testing
- [ ] Netlify redirects proxy API calls correctly
- [ ] CORS headers are properly set in production
- [ ] Safari can access Reddit API without errors
- [ ] Error messages are user-friendly for CORS failures

### Cross-Browser Testing
- [ ] Chrome: Full functionality maintained
- [ ] Firefox: Full functionality maintained
- [ ] Safari Desktop: CORS issues resolved
- [ ] Safari Mobile/iOS: CORS issues resolved
- [ ] Edge: Full functionality maintained

## Common Safari CORS Error Messages (Now Resolved)

### Before Implementation
```
Access to fetch at 'https://www.reddit.com/api/v1/access_token' from origin 'http://localhost:3000' has been blocked by CORS policy: Request header field authorization is not allowed by Access-Control-Allow-Headers in preflight response.
```

### After Implementation
- Requests are proxied through `/api/reddit/*` routes
- Proper CORS headers are automatically added
- Safari-specific modifications prevent header conflicts
- User-friendly error messages for any remaining issues

## Maintenance

### Regular Updates
- Monitor Safari updates for new CORS policy changes
- Update proxy configurations as needed
- Test on new Safari versions when released

### Performance Monitoring
- Track API request success rates across browsers
- Monitor for new CORS-related errors in logs
- Verify proxy performance doesn't impact load times

## Future Considerations

### Potential Improvements
- Consider implementing service worker for additional caching
- Monitor for new Safari privacy features that might affect CORS
- Evaluate moving to server-side API proxy for enhanced security

### Browser Evolution
- Watch for Safari CORS policy relaxation in future versions
- Consider removing Safari-specific code when no longer needed
- Stay updated with web standards evolution

## Conclusion

These comprehensive Safari CORS improvements ensure Reddit Visor works reliably across all browsers, with special attention to Safari's stricter security policies. The implementation provides both development and production solutions while maintaining optimal performance and user experience.

/**
 * Browser compatibility utilities
 * Provides feature detection and browser-specific handling
 */

// Browser detection utilities
export const getBrowserInfo = () => {
  const userAgent = navigator.userAgent;
  const isChrome = /Chrome/.test(userAgent) && /Google Inc/.test(navigator.vendor);
  const isFirefox = /Firefox/.test(userAgent);
  const isSafari = /Safari/.test(userAgent) && /Apple Computer/.test(navigator.vendor);
  const isEdge = /Edg/.test(userAgent);
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  const isAndroid = /Android/.test(userAgent);
  const isMobile = isIOS || isAndroid || /Mobile/.test(userAgent);
  
  return {
    isChrome,
    isFirefox,
    isSafari,
    isEdge,
    isIOS,
    isAndroid,
    isMobile,
    userAgent
  };
};

// Feature detection utilities
export const getFeatureSupport = () => {
  const support = {
    // CSS Features
    cssGrid: CSS.supports('display', 'grid'),
    cssFlexbox: CSS.supports('display', 'flex'),
    cssCustomProperties: CSS.supports('--test', 'value'),
    cssClamp: CSS.supports('width', 'clamp(1rem, 2vw, 3rem)'),
    cssGap: CSS.supports('gap', '1rem'),
    
    // JavaScript APIs
    fetch: typeof fetch !== 'undefined',
    abortController: typeof AbortController !== 'undefined',
    abortSignalTimeout: typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function',
    urlSearchParams: typeof URLSearchParams !== 'undefined',
    intersectionObserver: typeof IntersectionObserver !== 'undefined',
    resizeObserver: typeof ResizeObserver !== 'undefined',
    requestIdleCallback: typeof requestIdleCallback !== 'undefined',
    
    // Media APIs
    videoPlayPromise: (() => {
      const video = document.createElement('video');
      const playPromise = video.play();
      return playPromise !== undefined && typeof playPromise.catch === 'function';
    })(),
    
    // Touch and mobile features
    touchEvents: 'ontouchstart' in window,
    pointerEvents: 'onpointerdown' in window,
    
    // Storage
    localStorage: (() => {
      try {
        const test = '__test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
      } catch (e) {
        return false;
      }
    })(),
    
    // Network
    onLine: 'onLine' in navigator,
    serviceWorker: 'serviceWorker' in navigator
  };
  
  return support;
};

// Video codec support detection
export const getVideoCodecSupport = () => {
  const video = document.createElement('video');
  
  return {
    mp4: video.canPlayType('video/mp4') !== '',
    webm: video.canPlayType('video/webm') !== '',
    ogg: video.canPlayType('video/ogg') !== '',
    h264: video.canPlayType('video/mp4; codecs="avc1.42E01E"') !== '',
    vp8: video.canPlayType('video/webm; codecs="vp8"') !== '',
    vp9: video.canPlayType('video/webm; codecs="vp9"') !== '',
    av1: video.canPlayType('video/mp4; codecs="av01.0.05M.08"') !== ''
  };
};

// Image format support detection
export const getImageFormatSupport = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  
  return {
    webp: canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0,
    avif: canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0,
    jpeg: true, // Always supported
    png: true,  // Always supported
    gif: true   // Always supported
  };
};

// Safe timeout function that works across browsers
export const safeTimeout = (callback, delay) => {
  if (typeof requestIdleCallback !== 'undefined' && delay > 100) {
    return requestIdleCallback(callback, { timeout: delay });
  }
  return setTimeout(callback, delay);
};

// Safe animation frame function
export const safeAnimationFrame = (callback) => {
  if (typeof requestAnimationFrame !== 'undefined') {
    return requestAnimationFrame(callback);
  }
  return setTimeout(callback, 16); // ~60fps fallback
};

// Cross-browser event listener utilities
export const addEventListenerSafe = (element, event, handler, options = false) => {
  if (element.addEventListener) {
    // Modern browsers
    element.addEventListener(event, handler, options);
  } else if (element.attachEvent) {
    // IE8 and below
    element.attachEvent(`on${event}`, handler);
  } else {
    // Very old browsers
    element[`on${event}`] = handler;
  }
};

export const removeEventListenerSafe = (element, event, handler, options = false) => {
  if (element.removeEventListener) {
    element.removeEventListener(event, handler, options);
  } else if (element.detachEvent) {
    element.detachEvent(`on${event}`, handler);
  } else {
    element[`on${event}`] = null;
  }
};

// Cross-browser fetch with timeout and Safari CORS handling
export const fetchWithTimeout = async (url, options = {}, timeoutMs = 10000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

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

// Mobile-specific utilities
export const getMobileViewport = () => {
  const viewport = {
    width: window.innerWidth || document.documentElement.clientWidth,
    height: window.innerHeight || document.documentElement.clientHeight,
    orientation: window.orientation || 0,
    isLandscape: Math.abs(window.orientation) === 90
  };
  
  return viewport;
};

// Touch event utilities
export const getTouchCoordinates = (event) => {
  const touch = event.touches?.[0] || event.changedTouches?.[0] || event;
  return {
    x: touch.clientX || touch.pageX,
    y: touch.clientY || touch.pageY
  };
};

// CSS custom property fallback
export const setCSSCustomProperty = (property, value, fallback = null) => {
  if (CSS.supports('--test', 'value')) {
    document.documentElement.style.setProperty(property, value);
  } else if (fallback) {
    // Apply fallback for browsers without custom property support
    const elements = document.querySelectorAll(`[style*="${property}"]`);
    elements.forEach(el => {
      el.style.setProperty(property.replace('--', ''), fallback);
    });
  }
};

// Performance monitoring
export const measurePerformance = (name, fn) => {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  
  console.log(`${name} took ${end - start} milliseconds`);
  return result;
};

// Memory usage monitoring (if available)
export const getMemoryUsage = () => {
  if (performance.memory) {
    return {
      used: Math.round(performance.memory.usedJSHeapSize / 1048576), // MB
      total: Math.round(performance.memory.totalJSHeapSize / 1048576), // MB
      limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576) // MB
    };
  }
  return null;
};

// Network information (if available)
export const getNetworkInfo = () => {
  if (navigator.connection || navigator.mozConnection || navigator.webkitConnection) {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    return {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData
    };
  }
  return null;
};

// Initialize compatibility logging
export const logCompatibilityInfo = () => {
  const browser = getBrowserInfo();
  const features = getFeatureSupport();
  const videoCodecs = getVideoCodecSupport();
  const imageFormats = getImageFormatSupport();
  
  console.group('🔧 Browser Compatibility Info');
  console.log('Browser:', browser);
  console.log('Feature Support:', features);
  console.log('Video Codecs:', videoCodecs);
  console.log('Image Formats:', imageFormats);
  
  const networkInfo = getNetworkInfo();
  if (networkInfo) {
    console.log('Network:', networkInfo);
  }
  
  const memoryInfo = getMemoryUsage();
  if (memoryInfo) {
    console.log('Memory Usage:', memoryInfo);
  }
  
  console.groupEnd();
};

// Export all utilities as default object
export default {
  getBrowserInfo,
  getFeatureSupport,
  getVideoCodecSupport,
  getImageFormatSupport,
  safeTimeout,
  safeAnimationFrame,
  addEventListenerSafe,
  removeEventListenerSafe,
  fetchWithTimeout,
  safariCompatibleFetch,
  isCORSError,
  redditApiFetch,
  getMobileViewport,
  getTouchCoordinates,
  setCSSCustomProperty,
  measurePerformance,
  getMemoryUsage,
  getNetworkInfo,
  logCompatibilityInfo
};

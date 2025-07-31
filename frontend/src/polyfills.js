/**
 * Polyfills for cross-browser compatibility
 * Import this file at the top of your main entry point
 */

// Core-js polyfills for modern JavaScript features
import 'core-js/stable';

// Fetch polyfill for older browsers
import 'whatwg-fetch';

// AbortController polyfill for older browsers
if (!window.AbortController) {
  window.AbortController = class AbortController {
    constructor() {
      this.signal = {
        aborted: false,
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => {}
      };
    }
    
    abort() {
      this.signal.aborted = true;
    }
  };
}

// AbortSignal.timeout polyfill (not supported in Safari < 15.4)
if (!AbortSignal.timeout) {
  AbortSignal.timeout = function(milliseconds) {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), milliseconds);
    return controller.signal;
  };
}

// URLSearchParams polyfill for older browsers
if (!window.URLSearchParams) {
  window.URLSearchParams = class URLSearchParams {
    constructor(init) {
      this.params = new Map();
      if (typeof init === 'string') {
        this._parseString(init);
      } else if (init instanceof URLSearchParams) {
        init.forEach((value, key) => this.params.set(key, value));
      }
    }
    
    _parseString(str) {
      const pairs = str.replace(/^\?/, '').split('&');
      pairs.forEach(pair => {
        const [key, value] = pair.split('=');
        if (key) {
          this.params.set(decodeURIComponent(key), decodeURIComponent(value || ''));
        }
      });
    }
    
    append(name, value) {
      this.params.set(name, value);
    }
    
    set(name, value) {
      this.params.set(name, value);
    }
    
    get(name) {
      return this.params.get(name);
    }
    
    has(name) {
      return this.params.has(name);
    }
    
    delete(name) {
      this.params.delete(name);
    }
    
    toString() {
      const pairs = [];
      this.params.forEach((value, key) => {
        pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
      });
      return pairs.join('&');
    }
    
    forEach(callback) {
      this.params.forEach(callback);
    }
  };
}

// IntersectionObserver polyfill for older browsers
if (!window.IntersectionObserver) {
  window.IntersectionObserver = class IntersectionObserver {
    constructor(callback, options = {}) {
      this.callback = callback;
      this.options = options;
      this.elements = new Set();
    }
    
    observe(element) {
      this.elements.add(element);
      // Simple fallback - assume all elements are intersecting
      setTimeout(() => {
        this.callback([{
          target: element,
          isIntersecting: true,
          intersectionRatio: 1
        }]);
      }, 0);
    }
    
    unobserve(element) {
      this.elements.delete(element);
    }
    
    disconnect() {
      this.elements.clear();
    }
  };
}

// ResizeObserver polyfill for older browsers
if (!window.ResizeObserver) {
  window.ResizeObserver = class ResizeObserver {
    constructor(callback) {
      this.callback = callback;
      this.elements = new Set();
    }
    
    observe(element) {
      this.elements.add(element);
      // Simple fallback using window resize
      const handler = () => {
        this.callback([{
          target: element,
          contentRect: element.getBoundingClientRect()
        }]);
      };
      window.addEventListener('resize', handler);
      element._resizeHandler = handler;
    }
    
    unobserve(element) {
      this.elements.delete(element);
      if (element._resizeHandler) {
        window.removeEventListener('resize', element._resizeHandler);
        delete element._resizeHandler;
      }
    }
    
    disconnect() {
      this.elements.forEach(element => this.unobserve(element));
    }
  };
}

// requestIdleCallback polyfill for Safari
if (!window.requestIdleCallback) {
  window.requestIdleCallback = function(callback, options = {}) {
    const timeout = options.timeout || 0;
    const startTime = performance.now();
    
    return setTimeout(() => {
      callback({
        didTimeout: false,
        timeRemaining() {
          return Math.max(0, 50 - (performance.now() - startTime));
        }
      });
    }, timeout);
  };
  
  window.cancelIdleCallback = function(id) {
    clearTimeout(id);
  };
}

// CSS.supports polyfill for older browsers
if (!window.CSS || !window.CSS.supports) {
  if (!window.CSS) window.CSS = {};
  
  window.CSS.supports = function(property, value) {
    // Simple fallback - create a test element
    const element = document.createElement('div');
    try {
      element.style[property] = value;
      return element.style[property] === value;
    } catch (e) {
      return false;
    }
  };
}

// Performance.now polyfill for older browsers
if (!window.performance || !window.performance.now) {
  if (!window.performance) window.performance = {};
  
  const startTime = Date.now();
  window.performance.now = function() {
    return Date.now() - startTime;
  };
}

console.log('Cross-browser polyfills loaded successfully');

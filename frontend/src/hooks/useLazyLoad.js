import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for lazy loading with Intersection Observer
 * Optimized for mobile performance with configurable thresholds
 */
export function useLazyLoad({
  rootMargin = '50px',
  threshold = 0.1,
  triggerOnce = true,
  fallbackDelay = 100
} = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const elementRef = useRef(null);
  const observerRef = useRef(null);

  // Detect mobile for optimized settings
  const isMobile = useCallback(() => {
    return window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }, []);

  // Adjust settings for mobile
  const getMobileOptimizedSettings = useCallback(() => {
    if (isMobile()) {
      return {
        rootMargin: rootMargin === '50px' ? '25px' : rootMargin,
        threshold: Math.max(threshold, 0.05) // Ensure minimum threshold on mobile
      };
    }
    return { rootMargin, threshold };
  }, [rootMargin, threshold, isMobile]);

  // Fallback for browsers without Intersection Observer
  const fallbackObserver = useCallback(() => {
    if (!elementRef.current) return;

    const checkVisibility = () => {
      const element = elementRef.current;
      if (!element) return;

      const rect = element.getBoundingClientRect();
      const windowHeight = window.innerHeight || document.documentElement.clientHeight;
      const windowWidth = window.innerWidth || document.documentElement.clientWidth;

      const isVisible = (
        rect.top < windowHeight &&
        rect.bottom > 0 &&
        rect.left < windowWidth &&
        rect.right > 0
      );

      if (isVisible && !hasIntersected) {
        setIsIntersecting(true);
        setHasIntersected(true);
        
        if (triggerOnce) {
          window.removeEventListener('scroll', checkVisibility);
          window.removeEventListener('resize', checkVisibility);
        }
      }
    };

    // Debounced scroll handler for performance
    let scrollTimeout;
    const debouncedCheck = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(checkVisibility, 16); // ~60fps
    };

    window.addEventListener('scroll', debouncedCheck, { passive: true });
    window.addEventListener('resize', debouncedCheck, { passive: true });
    
    // Initial check
    setTimeout(checkVisibility, fallbackDelay);

    return () => {
      clearTimeout(scrollTimeout);
      window.removeEventListener('scroll', debouncedCheck);
      window.removeEventListener('resize', debouncedCheck);
    };
  }, [hasIntersected, triggerOnce, fallbackDelay]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Check for Intersection Observer support
    if (!window.IntersectionObserver) {
      console.warn('IntersectionObserver not supported, using fallback');
      return fallbackObserver();
    }

    const settings = getMobileOptimizedSettings();
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const isCurrentlyIntersecting = entry.isIntersecting;
          
          setIsIntersecting(isCurrentlyIntersecting);
          
          if (isCurrentlyIntersecting && !hasIntersected) {
            setHasIntersected(true);
            
            if (triggerOnce) {
              observer.unobserve(element);
            }
          }
        });
      },
      {
        rootMargin: settings.rootMargin,
        threshold: settings.threshold
      }
    );

    observer.observe(element);
    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [getMobileOptimizedSettings, hasIntersected, triggerOnce, fallbackObserver]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return {
    elementRef,
    isIntersecting,
    hasIntersected,
    isVisible: isIntersecting || hasIntersected
  };
}

/**
 * Specialized hook for image lazy loading
 */
export function useLazyImage(src) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  
  const { elementRef, isVisible } = useLazyLoad({
    rootMargin: '50px',
    threshold: 0.1
  });

  useEffect(() => {
    if (isVisible && src) {
      // If the src has changed, reset the loading states and update the image source
      if (imageSrc !== src) {
        setImageLoaded(false);
        setImageError(false);
        setImageSrc(src);
      }
    }
  }, [isVisible, src, imageSrc]);

  const handleLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  const handleError = useCallback(() => {
    setImageError(true);
    setImageLoaded(true);
  }, []);

  const retry = useCallback(() => {
    setImageError(false);
    setImageLoaded(false);
    setImageSrc(null);
    // Trigger reload
    setTimeout(() => {
      if (isVisible && src) {
        setImageSrc(src);
      }
    }, 100);
  }, [isVisible, src]);

  return {
    elementRef,
    imageSrc,
    imageLoaded,
    imageError,
    isVisible,
    handleLoad,
    handleError,
    retry
  };
}

/**
 * Specialized hook for video lazy loading with progressive loading
 */
export function useLazyVideo() {
  const [shouldLoadThumbnail, setShouldLoadThumbnail] = useState(false);
  const [shouldLoadMetadata, setShouldLoadMetadata] = useState(false);
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);

  // Different thresholds for progressive loading
  const { elementRef: thumbnailRef, isVisible: thumbnailVisible } = useLazyLoad({
    rootMargin: '100px',
    threshold: 0.1
  });

  const { elementRef: metadataRef, isVisible: metadataVisible } = useLazyLoad({
    rootMargin: '75px',
    threshold: 0.1
  });

  const { elementRef: videoRef, isVisible: videoVisible } = useLazyLoad({
    rootMargin: '25px',
    threshold: 0.1
  });

  useEffect(() => {
    if (thumbnailVisible) setShouldLoadThumbnail(true);
  }, [thumbnailVisible]);

  useEffect(() => {
    if (metadataVisible) setShouldLoadMetadata(true);
  }, [metadataVisible]);

  useEffect(() => {
    if (videoVisible) setShouldLoadVideo(true);
  }, [videoVisible]);

  // Use the most restrictive ref (video) as the main ref
  return {
    elementRef: videoRef,
    shouldLoadThumbnail,
    shouldLoadMetadata,
    shouldLoadVideo,
    isVisible: thumbnailVisible || metadataVisible || videoVisible
  };
}

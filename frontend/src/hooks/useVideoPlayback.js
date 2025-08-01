import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook to manage video playback based on visibility and window focus
 * Only pauses videos when they go out of focus, maintains play/pause state when scrolling
 */
export function useVideoPlayback({
  elementRef,
  isVisible,
  autoplay = false,
  pauseOnInvisible = false, // Changed default to false - only pause on focus loss
  pauseOnBlur = true
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [wasPlayingBeforeBlur, setWasPlayingBeforeBlur] = useState(false);
  const playerRef = useRef(null);
  const isWindowFocused = useRef(true);

  // Handle window focus/blur events
  useEffect(() => {
    const handleFocus = () => {
      isWindowFocused.current = true;
      
      if (pauseOnBlur && wasPlayingBeforeBlur && isVisible) {
        // Resume playing if it was playing before blur and element is still visible
        setIsPlaying(true);
        setWasPlayingBeforeBlur(false);
      }
    };

    const handleBlur = () => {
      isWindowFocused.current = false;
      
      if (pauseOnBlur && isPlaying) {
        // Remember that it was playing and pause it
        setWasPlayingBeforeBlur(true);
        setIsPlaying(false);
      }
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        handleBlur();
      } else {
        handleFocus();
      }
    });

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('visibilitychange', handleFocus);
    };
  }, [isPlaying, pauseOnBlur, isVisible, wasPlayingBeforeBlur]);

  // Handle autoplay when element becomes visible (only if autoplay is enabled)
  useEffect(() => {
    if (autoplay && isVisible && isWindowFocused.current && !isPlaying) {
      setIsPlaying(true);
    }
  }, [autoplay, isVisible, isPlaying]);

  // Provide methods to control playback
  const play = useCallback(() => {
    if (isVisible && isWindowFocused.current) {
      setIsPlaying(true);
      setWasPlayingBeforeBlur(false);
    }
  }, [isVisible]);

  const pause = useCallback(() => {
    setIsPlaying(false);
    setWasPlayingBeforeBlur(false);
  }, []);

  const toggle = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  // Method to set player ref for direct control if needed
  const setPlayerRef = useCallback((ref) => {
    playerRef.current = ref;
  }, []);

  return {
    isPlaying,
    play,
    pause,
    toggle,
    setPlayerRef,
    playerRef,
    shouldPlay: isPlaying && isVisible && isWindowFocused.current
  };
}

/**
 * Hook to detect if the current tab/window has focus
 */
export function useWindowFocus() {
  const [isWindowFocused, setIsWindowFocused] = useState(!document.hidden);

  useEffect(() => {
    const handleFocus = () => setIsWindowFocused(true);
    const handleBlur = () => setIsWindowFocused(false);
    const handleVisibilityChange = () => setIsWindowFocused(!document.hidden);

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return isWindowFocused;
}

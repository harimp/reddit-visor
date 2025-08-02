import React, { useState, useEffect, useCallback } from 'react';

function RefreshPauseToggle({ isPolling, onPauseToggle, onScrollPause }) {
  const [isManuallyPaused, setIsManuallyPaused] = useState(false);
  const [isScrollPausing, setIsScrollPausing] = useState(false);
  const [scrollTimeout, setScrollTimeout] = useState(null);

  // Scroll detection with debounce
  const handleScroll = useCallback(() => {
    // Clear existing timeout
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }

    // Set scroll pausing state
    if (!isScrollPausing) {
      setIsScrollPausing(true);
      onScrollPause(true);
    }

    // Set new timeout to resume after scroll stops
    const newTimeout = setTimeout(() => {
      setIsScrollPausing(false);
      if (!isManuallyPaused) {
        onScrollPause(false);
      }
    }, 3000); // Resume 3 seconds after scroll stops

    setScrollTimeout(newTimeout);
  }, [scrollTimeout, isScrollPausing, isManuallyPaused, onScrollPause]);

  // Set up scroll listener
  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
    };
  }, [handleScroll, scrollTimeout]);

  // Handle manual pause/resume toggle
  const handleManualToggle = () => {
    const newPausedState = !isManuallyPaused;
    setIsManuallyPaused(newPausedState);
    
    // If manually resuming, also clear scroll pause
    if (!newPausedState) {
      setIsScrollPausing(false);
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
        setScrollTimeout(null);
      }
    }
    
    onPauseToggle(newPausedState);
  };

  // Determine current state for display
  const isPaused = isManuallyPaused || isScrollPausing;
  const getStatusText = () => {
    if (isManuallyPaused) return 'Manually Paused';
    if (isScrollPausing) return 'Paused (Scrolling)';
    return 'Auto Refresh ON';
  };

  const getIcon = () => {
    return '🔄'; // Reload arrow icon
  };

  const getButtonClass = () => {
    let baseClass = 'refresh-pause-toggle-btn';
    if (isPaused) baseClass += ' paused';
    if (isScrollPausing) baseClass += ' scroll-paused';
    return baseClass;
  };

  return (
    <button
      className={getButtonClass()}
      onClick={handleManualToggle}
      title={`${isPaused ? 'Resume' : 'Pause'} auto refresh - ${getStatusText()}`}
      aria-label={`${isPaused ? 'Resume' : 'Pause'} auto refresh`}
    >
      {getIcon()}
    </button>
  );
}

export default RefreshPauseToggle;

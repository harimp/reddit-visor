import React, { useState, useEffect } from 'react';

function RefreshTimer({ pollingInterval = 30000, lastUpdated, isPolling }) {
  const [timeRemaining, setTimeRemaining] = useState(pollingInterval / 1000);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!isPolling || !lastUpdated) {
      setTimeRemaining(pollingInterval / 1000);
      setProgress(100);
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const lastUpdateTime = lastUpdated.getTime();
      const elapsed = now - lastUpdateTime;
      const remaining = Math.max(0, pollingInterval - elapsed);
      
      const secondsRemaining = Math.ceil(remaining / 1000);
      const progressPercent = (remaining / pollingInterval) * 100;
      
      setTimeRemaining(secondsRemaining);
      setProgress(progressPercent);
      
      // If we've passed the interval, reset to full
      if (remaining <= 0) {
        setTimeRemaining(pollingInterval / 1000);
        setProgress(100);
      }
    };

    // Update immediately
    updateTimer();
    
    // Update every second
    const interval = setInterval(updateTimer, 1000);
    
    return () => clearInterval(interval);
  }, [pollingInterval, lastUpdated, isPolling]);

  const formatTime = (seconds) => {
    if (seconds <= 0) return '0s';
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getStatusColor = () => {
    if (!isPolling) return '#95a5a6'; // Gray when not polling
    if (timeRemaining <= 5) return '#e74c3c'; // Red when close to refresh
    if (timeRemaining <= 10) return '#f39c12'; // Orange when getting close
    return '#27ae60'; // Green when plenty of time
  };

  return (
    <div className="refresh-timer">
      <div className="refresh-timer-info">
        <span className="refresh-timer-label">Next refresh:</span>
        <span 
          className="refresh-timer-value"
          style={{ color: getStatusColor() }}
        >
          {isPolling ? formatTime(timeRemaining) : 'Paused'}
        </span>
      </div>
      <div className="refresh-timer-bar">
        <div 
          className="refresh-timer-progress"
          style={{ 
            width: `${progress}%`,
            backgroundColor: getStatusColor(),
            transition: 'width 1s linear, background-color 0.3s ease'
          }}
        />
      </div>
    </div>
  );
}

export default RefreshTimer;

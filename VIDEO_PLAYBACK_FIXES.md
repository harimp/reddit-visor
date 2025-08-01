# Video Playback Management Fixes

## Issue Description
Videos were continuing to play after being scrolled out of view or when the browser tab lost focus, causing performance issues and unexpected behavior.

## Solution Overview
Implemented a video playback management system that pauses videos when the browser tab loses focus, while preserving the user's intended play/pause state when scrolling. Videos maintain their play/pause state when scrolling in and out of view.

## Files Modified

### 1. New Hook: `frontend/src/hooks/useVideoPlayback.js`
- **Purpose**: Manages video playback state based on element visibility and window focus
- **Key Features**:
  - Preserves user's play/pause state when videos scroll in and out of view
  - Pauses videos when browser tab loses focus or window is minimized
  - Resumes videos when window regains focus (if they were playing before)
  - Provides manual play/pause/toggle controls
  - Handles autoplay behavior based on visibility and focus

### 2. Updated: `frontend/src/components/VideoPlayer.jsx`
- **Changes**:
  - Integrated `useVideoPlayback` hook for automatic playback management
  - Added `isVisible` and `elementRef` props to receive visibility state from parent
  - Enhanced oembed video handling with visibility-based pause attempts
  - Replaced hardcoded `playing={autoplay}` with dynamic `playing={shouldPlay}`
  - Added click handler for manual play/pause toggle

### 3. Updated: `frontend/src/components/LazyVideoPlayer.jsx`
- **Changes**:
  - Passes `isVisible` state and `elementRef` to VideoPlayer component
  - Ensures visibility information flows through the component hierarchy

## How It Works

### Visibility Detection
1. Uses the existing `useLazyLoad` hook's intersection observer to detect when videos are in/out of view
2. Automatically pauses videos when they scroll out of the viewport
3. Remembers playback state and resumes when videos come back into view

### Focus Management
1. Listens for window `focus`/`blur` events and `visibilitychange` events
2. Pauses all playing videos when:
   - User switches to another tab
   - User minimizes the browser window
   - User switches to another application
3. Resumes videos that were playing when focus returns

### State Management
The hook maintains several state variables:
- `isPlaying`: Current intended playback state
- `wasPlayingBeforeBlur`: Remembers if video was playing before window lost focus
- `wasPlayingBeforeInvisible`: Remembers if video was playing before going out of view
- `shouldPlay`: Computed state that determines if video should actually be playing

### Autoplay Behavior
- Videos only autoplay when they are visible AND the window has focus
- Autoplay is prevented when the tab is in the background
- Autoplay resumes when conditions are met

## Benefits

### Performance Improvements
- Reduces CPU and memory usage by pausing off-screen videos
- Prevents multiple videos from playing simultaneously
- Reduces network bandwidth usage for streaming videos

### User Experience
- Prevents unexpected audio from background tabs
- Provides consistent behavior across different video types
- Maintains user's intended playback state when switching tabs or scrolling

### Battery Life
- Reduces power consumption on mobile devices
- Prevents unnecessary video processing when not visible

## Browser Compatibility
- Works with all modern browsers that support Intersection Observer
- Falls back gracefully for older browsers using the existing fallback in `useLazyLoad`
- Handles cross-origin restrictions for embedded content appropriately

## Video Types Supported
- **Reddit Videos**: Full playback control via ReactPlayer
- **YouTube Videos**: Full playback control via ReactPlayer
- **Direct Video Files**: Full playback control via ReactPlayer
- **Oembed Content**: Limited control (attempts to pause YouTube embeds via postMessage)
- **GIF Videos**: Full playback control via ReactPlayer

## Testing Scenarios
To verify the fixes work correctly, test these scenarios:

1. **Scroll Test**: 
   - Start playing a video
   - Scroll it out of view → should continue playing (maintains state)
   - Scroll back to view → should still be playing
   - Pause the video, scroll out and back → should remain paused

2. **Tab Switch Test**:
   - Start playing a video
   - Switch to another tab → should pause
   - Switch back → should resume

3. **Window Minimize Test**:
   - Start playing a video
   - Minimize browser window → should pause
   - Restore window → should resume

4. **Multiple Videos Test**:
   - Have multiple videos on screen
   - Only videos in view should be able to play
   - Scrolling should manage playback of each video independently

## Configuration Options
The `useVideoPlayback` hook accepts configuration options:
- `pauseOnInvisible`: Enable/disable pausing when out of view (default: false - preserves user state)
- `pauseOnBlur`: Enable/disable pausing when window loses focus (default: true)
- `autoplay`: Enable/disable autoplay when conditions are met (default: false)

## Future Enhancements
Potential improvements that could be added:
- Configurable intersection thresholds for different pause/resume behavior
- Support for picture-in-picture mode
- Integration with media session API for better mobile control
- Bandwidth-aware autoplay (pause on slow connections)

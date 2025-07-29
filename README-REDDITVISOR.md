# RedditVisor - Visual Reddit Browser

A modern, visual Reddit content browser designed for enjoying pictures, videos, and media from your favorite subreddits. RedditVisor transforms Reddit into a beautiful, Pinterest-style grid layout perfect for visual content consumption.

## 🌟 Current Features

### Visual-First Design
- **3-Column Grid Layout**: Responsive masonry-style grid (3 columns on desktop, 2 on tablet, 1 on mobile)
- **Media-Focused Cards**: Large, prominent display of images, videos, and GIFs with hover effects
- **Smart Media Detection**: Automatic handling of Reddit images, videos, Imgur, YouTube, and more
- **Loading States**: Smooth skeleton loading with spinners and error handling for media

### Enhanced Video Support
- **Native Video Player**: Built-in HTML5 video player for Reddit hosted videos (v.redd.it)
- **Browser Controls**: Uses native browser video controls for familiar user experience
- **Video Duration Display**: Shows video length in top-right corner with MM:SS format
- **Audio Indicators**: Visual badges for videos without audio (🔇)
- **Multiple Video Platforms**: YouTube, Streamable, Gfycat, RedGifs support with clickable thumbnails
- **Smart Fallback**: Graceful degradation for videos without thumbnails showing video icons

### Advanced Subreddit Management
- **Grid-Based Configuration**: Compact, modular subreddit configuration interface with hover effects
- **Native Reddit Sorting**: Uses Reddit's built-in sorting algorithms (hot, new, rising, top)
- **Timeframe Support**: For "top" sorting, choose from hour, day, week, month, year, or all time
- **Real-Time Configuration**: Easy management of subreddit feeds with live updates
- **Visual Management**: Responsive grid layout with edit/delete buttons for better organization
- **Styled Dropdowns**: Consistent styling for sort type and timeframe selectors

### Default Picture-Based Subreddits
- **cats** (hot) - Adorable cat pictures and videos
- **funny** (hot) - Funny images, memes, and visual humor
- **aww** (hot) - Cute animals and heartwarming content
- **EarthPorn** (top/week) - Stunning landscape photography
- **mildlyinteresting** (hot) - Fascinating everyday discoveries
- **oddlysatisfying** (hot) - Visually satisfying content
- **NatureIsFuckingLit** (hot) - Amazing nature photography and videos
- **CozyPlaces** (hot) - Warm, inviting interior spaces

### Smart Filtering & Controls
- **Subreddit Filtering**: Hide/show specific subreddits from your feed with toggle interface
- **Sort Controls**: Multiple sorting options (newest, oldest, most upvotes, least upvotes)
- **Auto-Refresh**: Configurable polling (30-second default) with visual countdown timer and manual refresh

### Modern User Experience
- **Responsive Design**: Perfect on desktop, tablet, and mobile devices with adaptive layouts
- **Dark/Light Themes**: Toggle between themes with floating action button (bottom-right)
- **Hover Effects**: Smooth animations, card lifting, and interactive elements
- **Click-to-View**: Direct links to full Reddit posts and media in new tabs
- **Author/Subreddit Links**: Quick access to user profiles and subreddit pages
- **Keyboard Navigation**: Full keyboard accessibility support with proper focus states

### Performance & Reliability
- **Direct Reddit API**: Frontend-only architecture with OAuth authentication
- **Smart Caching**: 5-minute localStorage cache with automatic expiry and fallback
- **Rate Limit Handling**: Intelligent exponential backoff and retry mechanisms
- **Error Recovery**: Graceful fallbacks for failed requests or media with retry buttons
- **Offline Support**: Works with cached data when offline
- **Deduplication**: Automatic removal of duplicate posts across subreddits

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- Reddit API credentials (client ID, client secret)
- Modern web browser with ES6+ support

### Reddit App Setup
1. **Create Reddit App**
   - Go to https://www.reddit.com/prefs/apps
   - Click "Create App" or "Create Another App"
   - Choose "web app" for production or "script" for development
   - Set redirect URI to `http://localhost:5173` (for development)

2. **Get Credentials**
   - Copy the Client ID (under the app name)
   - Copy the Client Secret
   - Note your Reddit username (if using script type)

### Installation

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd redditvisor
   npm run install:all
   ```

2. **Configure Environment**
   
   Create `frontend/.env`:
   ```env
   VITE_REDDIT_CLIENT_ID=your_client_id_here
   VITE_REDDIT_CLIENT_SECRET=your_client_secret_here
   VITE_REDDIT_USER_AGENT=RedditVisor/1.0
   VITE_REDDIT_USERNAME=your_username (optional)
   VITE_REDDIT_PASSWORD=your_password (optional)
   ```

3. **Start Development**
   ```bash
   npm run dev
   ```

4. **Access Application**
   - Frontend: http://localhost:5173
   - Backend (optional): http://localhost:3001

## 🎨 Usage Guide

### Basic Navigation
- **Browse Content**: Scroll through the visual grid of posts
- **Watch Videos**: Reddit videos play directly in the grid with native browser controls
- **View Full Media**: Click on images/videos to open original source in new tab
- **Visit Reddit Post**: Click on post titles to view full Reddit thread
- **User/Subreddit Links**: Click on usernames (u/...) or subreddit badges (r/...)

### Subreddit Management
1. **Open Management Panel**: Click "Subreddit Management" header to expand
2. **View Current Configs**: See all subreddits in a compact grid with sort info
3. **Add New Subreddit**: 
   - Enter subreddit name (without r/)
   - Choose sort type: hot, new, rising, or top
   - Select timeframe (only for "top" sorting)
   - Click "Add Configuration"
4. **Edit Existing**: Click the edit button (✏️) on any configuration card
5. **Remove Subreddits**: Click the remove button (✕) to delete configurations
6. **Reset to Defaults**: Click "🔄 Reset to Defaults" to restore picture-based subreddits

### Filtering & Controls
- **Subreddit Filter**: Use toggle buttons to hide/show specific subreddits
- **Sort Control**: Choose how to sort your combined feed (newest first, most upvotes, etc.)
- **Auto-Refresh**: Content updates automatically with visual countdown timer

### Customization
- **Theme Toggle**: Click the floating button (bottom-right) to switch light/dark themes
- **Responsive Layout**: Automatically adapts to screen size (3/2/1 columns)
- **Persistent Settings**: All preferences saved to localStorage

## 🔧 Technical Details

### Architecture
- **Frontend**: React 18 + Vite for fast development and building
- **Styling**: Pure CSS with CSS Grid and Flexbox for responsive layouts
- **State Management**: React hooks with localStorage persistence
- **API Client**: Custom Reddit OAuth client with rate limiting
- **Video Player**: Native HTML5 video elements with custom styling

### Project Structure
```
redditvisor/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── PostGrid.jsx     # 3-column grid layout
│   │   │   ├── PostCard.jsx     # Individual post cards
│   │   │   ├── VideoPlayer.jsx  # Native video player
│   │   │   ├── SubredditManagement.jsx  # Config interface
│   │   │   ├── SortControl.jsx  # Sorting options
│   │   │   ├── SubredditFilter.jsx # Subreddit filtering
│   │   │   ├── RefreshTimer.jsx # Auto-refresh timer
│   │   │   ├── ThemeToggle.jsx  # Dark/light theme
│   │   │   └── Header.jsx       # App header with status
│   │   ├── services/        # Reddit API client
│   │   │   └── redditClient.js  # OAuth + API handling
│   │   ├── hooks/           # Custom React hooks
│   │   │   └── useRedditData.js # Data fetching hook
│   │   ├── utils/           # Utility functions
│   │   │   ├── timeUtils.js     # Time formatting
│   │   │   └── subredditColors.js # Color schemes
│   │   ├── contexts/        # React contexts
│   │   │   └── ThemeContext.jsx # Theme management
│   │   └── App.jsx          # Main application
│   ├── public/              # Static assets
│   └── package.json         # Dependencies
├── backend/                 # Optional Node.js backend
│   ├── server.js           # Express server (health checks)
│   └── package.json        # Backend dependencies
└── package.json            # Root package with scripts
```

### Key Components

#### PostGrid & PostCard
- Responsive 3-column masonry layout
- Individual cards with media display
- Hover effects and smooth animations
- Click handlers for Reddit links

#### VideoPlayer
- Native HTML5 video player for v.redd.it videos
- Browser controls with poster images
- Error handling and retry functionality
- Audio/duration indicators

#### SubredditManagement
- Grid-based configuration interface
- Add/edit/remove subreddit configurations
- Sort type and timeframe selection
- Reset to defaults functionality

#### Reddit Client
- OAuth authentication with token management
- Rate limiting with exponential backoff
- Concurrent API requests for multiple subreddits
- Smart caching with localStorage

### Supported Media Types
- **Images**: JPG, PNG, WebP, GIF from Reddit, Imgur
- **Reddit Media**: i.redd.it images, v.redd.it videos with native player
- **Video Platforms**: YouTube, Streamable, Gfycat, RedGifs (thumbnail + link)
- **Fallback**: Text posts with emoji indicators and preview text

### API Rate Limits
- **Authenticated**: 60 requests per minute
- **Unauthenticated**: 10 requests per minute
- **Auto-retry**: Built-in exponential backoff for rate limits
- **Caching**: 5-minute cache reduces API calls

## 🛠️ Development

### Available Scripts
```bash
# Install all dependencies (root, frontend, backend)
npm run install:all

# Start both frontend and backend with hot reloading
npm run dev

# Start only frontend (recommended for development)
npm run dev:frontend

# Start only backend (optional)
npm run dev:backend

# Build for production
npm run build

# Preview production build
npm run preview
```

### Development Features
- **Hot Module Replacement**: Instant updates during development
- **React Fast Refresh**: Preserves component state during edits
- **Source Maps**: Accurate debugging with line numbers
- **ESLint Integration**: Code quality and consistency
- **Vite Dev Server**: Lightning-fast development server

### Adding New Features

#### New Media Types
Extend `extractMediaInfo()` in `redditClient.js`:
```javascript
if (url.includes('newplatform.com')) {
  return {
    type: 'video',
    url: extractVideoUrl(url),
    thumbnailUrl: extractThumbnail(url)
  };
}
```

#### Custom Sorting
Add options to `SortControl` component:
```javascript
const sortOptions = [
  { value: 'newest', label: 'Newest First', icon: '🕐' },
  { value: 'custom', label: 'Custom Sort', icon: '⚡' }
];
```

#### New Filters
Extend filtering logic in `App.jsx`:
```javascript
const filteredPosts = posts.filter(post => {
  // Add custom filter logic
  return customFilterCondition(post);
});
```

## 📱 Mobile Support

RedditVisor is fully responsive and optimized for mobile devices:
- **Single Column Layout**: Stacks cards vertically on mobile screens
- **Touch-Friendly**: Large tap targets and smooth touch scrolling
- **Optimized Media**: Efficient loading and display on smaller screens
- **Mobile Navigation**: Simplified interface for touch interaction
- **Native Video Controls**: Mobile-optimized video playback

## 🔒 Privacy & Security

- **No Data Collection**: RedditVisor doesn't collect or store personal data
- **Local Storage Only**: Preferences and cache stored locally in browser
- **Direct API Access**: Communicates directly with Reddit's API
- **Optional Authentication**: Works with or without Reddit account
- **HTTPS Only**: Secure connections for all API requests

## 🤝 Contributing

We welcome contributions! Areas for improvement:
- New media platform support
- Performance optimizations
- UI/UX enhancements
- Mobile experience improvements
- Accessibility features

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Reddit API**: For providing access to Reddit's content
- **React Community**: For the excellent ecosystem and tools
- **Vite**: For the lightning-fast development experience
- **Contributors**: Everyone who has helped improve RedditVisor

---

**Enjoy browsing Reddit in a whole new way with RedditVisor!** 🎉

For support, feature requests, or bug reports, please open an issue on our GitHub repository.

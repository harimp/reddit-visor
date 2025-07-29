# RedditVisor - Setup Guide

This guide will help you set up RedditVisor, a modern visual Reddit browser with a Pinterest-style grid layout for enjoying pictures, videos, and media from your favorite subreddits.

## Prerequisites

Before running this project, you need to have installed:
- **Node.js** (version 16 or higher) - Download from https://nodejs.org/
- **npm** (comes with Node.js)
- **Reddit App Registration** - For OAuth authentication (recommended for higher rate limits)

## Project Structure

```
redditvisor/
├── frontend/          # React + Vite web application (main app)
│   ├── src/
│   │   ├── components/    # React components (PostGrid, VideoPlayer, etc.)
│   │   ├── services/      # Reddit API client with OAuth
│   │   ├── hooks/         # Custom React hooks (useRedditData)
│   │   ├── utils/         # Utility functions (time, colors, sound)
│   │   └── contexts/      # React contexts (ThemeContext)
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
├── backend/           # Optional Node.js Express server (health checks only)
│   ├── package.json
│   └── server.js
└── json_poller.py     # Legacy Python script (deprecated)
```

## Reddit OAuth Setup (Recommended)

To avoid rate limiting and get higher API limits, set up Reddit OAuth:

### 1. Create a Reddit App
1. Go to https://www.reddit.com/prefs/apps
2. Click "Create App" or "Create Another App"
3. Fill out the form:
   - **Name**: RedditVisor (or any name you prefer)
   - **App type**: 
     - Select "web app" for production deployment
     - Select "script" for personal/development use
   - **Description**: Visual Reddit browser for pictures and videos
   - **About URL**: Leave blank or add your GitHub repo
   - **Redirect URI**: 
     - For development: `http://localhost:5173`
     - For production: your domain URL
4. Click "Create app"

### 2. Configure Environment Variables
1. Copy the **Client ID** (under the app name) and **Client Secret**
2. Create `frontend/.env` file:
```env
# Required: Reddit OAuth credentials
VITE_REDDIT_CLIENT_ID=your_client_id_here
VITE_REDDIT_CLIENT_SECRET=your_client_secret_here
VITE_REDDIT_USER_AGENT=RedditVisor/1.0 by YourRedditUsername

# Optional: For script-type apps (higher rate limits)
VITE_REDDIT_USERNAME=your_reddit_username
VITE_REDDIT_PASSWORD=your_reddit_password
```

**Note**: Environment variables in Vite must be prefixed with `VITE_` to be accessible in the frontend.

## Setup Instructions

### Quick Start (Recommended)
```bash
# Clone the repository
git clone <repository-url>
cd redditvisor

# Install all dependencies (root, frontend, backend)
npm run install:all

# Start development server (frontend only)
npm run dev:frontend
```

### Full Development Setup
```bash
# Install all dependencies
npm run install:all

# Start both frontend and backend with hot reloading
npm run dev
```

### Manual Setup

#### 1. Install Dependencies
```bash
# Root dependencies (development scripts)
npm install

# Frontend dependencies (React, Vite, etc.)
cd frontend && npm install

# Backend dependencies (Express, optional)
cd ../backend && npm install
```

#### 2. Start Development Servers

**Option A: Frontend Only (Recommended)**
```bash
npm run dev:frontend
```
This starts only the React frontend with Vite dev server.

**Option B: Both Frontend and Backend**
```bash
npm run dev
```
This starts both servers with hot reloading enabled.

**Option C: Start Servers Separately**
```bash
# Terminal 1: Frontend
npm run dev:frontend

# Terminal 2: Backend (optional, in a new terminal)
npm run dev:backend
```

### 3. Access the Application
- **Frontend**: http://localhost:5173 (Vite dev server)
- **Backend API** (optional): http://localhost:3001

## Current Features

### Visual-First Design
- **3-Column Grid Layout**: Responsive masonry-style grid (3 columns on desktop, 2 on tablet, 1 on mobile)
- **Media-Focused Cards**: Large, prominent display of images, videos, and GIFs with hover effects
- **Smart Media Detection**: Automatic handling of Reddit images, videos, Imgur, YouTube, and more
- **Loading States**: Smooth skeleton loading with spinners and error handling

### Enhanced Video Support
- **Native Video Player**: Built-in HTML5 video player for Reddit hosted videos (v.redd.it)
- **Browser Controls**: Uses native browser video controls for familiar user experience
- **Video Duration Display**: Shows video length and audio indicators
- **Multiple Video Platforms**: YouTube, Streamable, Gfycat, RedGifs support with thumbnails
- **Smart Fallback**: Graceful degradation for videos without thumbnails

### Advanced Subreddit Management
- **Grid-Based Configuration**: Compact, modular subreddit configuration interface
- **Native Reddit Sorting**: Uses Reddit's built-in sorting algorithms (hot, new, rising, top)
- **Timeframe Support**: For "top" sorting, choose from hour, day, week, month, year, or all time
- **Real-Time Configuration**: Easy management of subreddit feeds with live updates
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
- **Auto-Refresh**: Configurable polling (30-second default) with visual countdown timer

### Modern User Experience
- **Responsive Design**: Perfect on desktop, tablet, and mobile devices
- **Dark/Light Themes**: Toggle between themes with floating action button
- **Hover Effects**: Smooth animations and interactive elements
- **Click-to-View**: Direct links to full Reddit posts and media
- **Author/Subreddit Links**: Quick access to user profiles and subreddit pages

## Hot Reloading Features

### Frontend Development Server (Vite)
- **Lightning Fast**: Vite's dev server starts instantly and updates are near-instantaneous
- **Hot Module Replacement (HMR)**: Changes reflect immediately without losing component state
- **React Fast Refresh**: Preserves React component state during development
- **Source Maps**: Enhanced debugging with accurate line numbers
- **Optimized Dependencies**: Pre-bundled dependencies for faster cold starts
- **ES Modules**: Native ES module support for better performance

### Backend Hot Reloading (Nodemon) - Optional
- Automatically restarts server when files change
- Watches: `server.js`, `.env`, and other JavaScript files
- 1-second delay to prevent rapid restarts

### Development Workflow
- **Single Command**: `npm run dev` starts both servers (or use `npm run dev:frontend` for frontend only)
- **Colored Output**: Easy-to-read console logs with colors
- **Process Management**: Ctrl+C stops servers cleanly
- **Port Management**: Backend (3001), Frontend (5173)

## API Architecture

### Current Architecture (Frontend-Only)
```
Frontend (React) → Reddit API (direct OAuth)
- Frontend polls Reddit directly every 30 seconds
- OAuth authentication with rate limiting
- Client-side caching with localStorage
- No backend dependency for data
```

### API Endpoints (Backend - Optional)
- `GET /api/health` - Health check endpoint
- Backend is now optional and only provides health monitoring

## Development Scripts

```bash
# Install all dependencies
npm run install:all

# Development
npm run dev              # Start both frontend and backend
npm run dev:frontend     # Start only frontend (recommended)
npm run dev:backend      # Start only backend

# Production
npm run build           # Build frontend for production
npm run preview         # Preview production build
npm start              # Start production servers

# Maintenance
npm run clean          # Clean node_modules and package-lock files
```

## Environment Configuration

### Frontend Environment Variables (`frontend/.env`)
```env
# Reddit OAuth (Required)
VITE_REDDIT_CLIENT_ID=your_client_id
VITE_REDDIT_CLIENT_SECRET=your_client_secret
VITE_REDDIT_USER_AGENT=RedditVisor/1.0

# Optional: For script-type apps
VITE_REDDIT_USERNAME=your_username
VITE_REDDIT_PASSWORD=your_password

# Optional: API Configuration
VITE_API_BASE_URL=http://localhost:3001
VITE_POLLING_INTERVAL=30000
```

### Backend Environment Variables (`backend/.env`) - Optional
```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Optional: If backend needs Reddit access
REDDIT_CLIENT_ID=your_client_id
REDDIT_CLIENT_SECRET=your_client_secret
```

## Deployment Options

### Option 1: Frontend-Only Deployment (Recommended)
```bash
cd frontend
npm run build
# Deploy the 'dist' folder to your hosting provider
```

### Option 2: Full-Stack Deployment
```bash
# Build frontend
cd frontend && npm run build

# Start backend
cd ../backend && npm start
```

### Hosting Providers
- **Frontend**: Vercel, Netlify, GitHub Pages, Surge.sh
- **Full-Stack**: Heroku, Railway, DigitalOcean, AWS

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Kill process on port 5173 (frontend)
   npx kill-port 5173
   
   # Kill process on port 3001 (backend)
   npx kill-port 3001
   ```

2. **Reddit API Rate Limiting**
   - Ensure you have valid OAuth credentials
   - Check console for rate limit messages
   - Authenticated requests have higher limits (60/min vs 10/min)

3. **CORS Errors**
   - Reddit API supports CORS for OAuth requests
   - Ensure proper client credentials in `.env`

4. **Environment Variables Not Loading**
   - Ensure variables are prefixed with `VITE_` in frontend
   - Restart development server after changing `.env`
   - Check that `.env` file is in the correct directory

5. **Video Playback Issues**
   - Reddit videos use native HTML5 player
   - Some videos may not have audio (indicated by 🔇 badge)
   - Check browser console for video loading errors

### Debug Mode
Enable detailed logging in browser console:
```javascript
// Check Reddit client status
localStorage.setItem('debug', 'true');

// Clear cache if needed
localStorage.removeItem('redditvisor_posts_cache');
localStorage.removeItem('redditvisor_cache_expiry');
```

## Performance Tips

### Development
- Use `npm run dev:frontend` for faster startup (frontend only)
- Enable React DevTools browser extension
- Use browser's Network tab to monitor API calls

### Production
- Build with `npm run build` for optimized bundle
- Enable gzip compression on your server
- Use CDN for static assets

## Migration from Legacy Version

If upgrading from the old Python/backend-polling version:

1. **Update Dependencies**: Run `npm run install:all`
2. **Configure Frontend Environment**: Create `frontend/.env` with Reddit credentials
3. **Use New Scripts**: Use `npm run dev:frontend` instead of `npm run dev`
4. **Remove Old Config**: Delete old `backend/.env` Reddit credentials (now in frontend)

## Original Python Script

The original Python script (`json_poller.py`) is still available but deprecated. The React version provides the same functionality with a modern web interface and better performance.

---

**Ready to start browsing Reddit visually!** 🎉

For additional help, check the other README files:
- `README.md` - Main project overview
- `README-REDDITVISOR.md` - Detailed feature documentation
- `README-REDDIT-CLIENT.md` - Technical API migration details

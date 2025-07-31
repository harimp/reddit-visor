# RedditVisor

A modern, visual Reddit content browser designed for enjoying pictures, videos, and media from your favorite subreddits. RedditVisor transforms Reddit into a beautiful, Pinterest-style grid layout perfect for visual content consumption.

## 🌟 Features

### Visual-First Design
- **3-Column Grid Layout**: Responsive masonry-style grid (3 columns on desktop, 2 on tablet, 1 on mobile)
- **Media-Focused Cards**: Large, prominent display of images, videos, and GIFs
- **Smart Media Detection**: Automatic handling of Reddit images, videos, Imgur, YouTube, and more
- **Loading States**: Smooth skeleton loading and error handling for media

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
- **Visual Management**: Hover effects and responsive grid layout for better organization

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
- **Subreddit Filtering**: Hide specific subreddits from your feed with toggle interface
- **Sort Controls**: Multiple sorting options for your combined feed
- **Auto-Refresh**: Configurable polling with visual countdown timer

### Modern User Experience
- **Responsive Design**: Perfect on desktop, tablet, and mobile devices
- **Dark/Light Themes**: Toggle between themes with floating action button
- **Hover Effects**: Smooth animations and interactive elements
- **Click-to-View**: Direct links to full Reddit posts and media
- **Author/Subreddit Links**: Quick access to user profiles and subreddit pages
- **Keyboard Navigation**: Full keyboard accessibility support

### Performance & Reliability
- **Direct Reddit API**: Frontend-only architecture with OAuth authentication
- **Smart Caching**: 5-minute localStorage cache with automatic expiry
- **Rate Limit Handling**: Intelligent backoff and retry mechanisms
- **Error Recovery**: Graceful fallbacks for failed requests or media
- **Offline Support**: Works with cached data when offline
- **Deduplication**: Automatic removal of duplicate posts across subreddits

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- Reddit API credentials (client ID, client secret)
- Modern web browser with ES6+ support

### Quick Setup

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd redditvisor
   npm run install:all
   ```

2. **Configure Reddit API**
   
   Create a `.env` file in the frontend directory:
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

4. **Open Browser**
   Navigate to `http://localhost:5173` to start browsing!

## 🌐 Netlify Deployment

RedditVisor is designed as a frontend-only application that can be easily deployed to Netlify:

### Deploy to Netlify

1. **Build the Application**
   ```bash
   npm run build
   ```

2. **Deploy to Netlify**
   - Drag and drop the `frontend/dist` folder to Netlify
   - Or connect your GitHub repository to Netlify for automatic deployments

3. **Configure Environment Variables**
   In your Netlify dashboard, add these environment variables:
   - `VITE_REDDIT_CLIENT_ID`
   - `VITE_REDDIT_CLIENT_SECRET`
   - `VITE_REDDIT_USER_AGENT`
   - `VITE_REDDIT_USERNAME` (optional)
   - `VITE_REDDIT_PASSWORD` (optional)

4. **Build Settings** (if using Git integration)
   - Build command: `npm run build`
   - Publish directory: `frontend/dist`
   - Base directory: `frontend`

### Netlify Configuration

Create a `netlify.toml` file in the root directory for optimal configuration:

```toml
[build]
  base = "frontend"
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## 🎨 Usage

### Basic Navigation
- **Browse Content**: Scroll through the visual grid of posts
- **Watch Videos**: Reddit videos play directly in the grid with native controls
- **View Full Media**: Click on images/videos to open in new tab
- **Visit Reddit Post**: Click on post titles to view on Reddit
- **User/Subreddit Links**: Click on usernames or subreddit badges

### Managing Subreddits
1. **Open Management Panel**: Click the expandable "Subreddit Management" section
2. **View Current Configs**: See all subreddits in a compact grid layout
3. **Add New Subreddit**: 
   - Enter subreddit name
   - Choose sort type (hot, new, rising, top)
   - Select timeframe (for top sorting)
4. **Edit Existing**: Click the edit button (✏️) on any configuration
5. **Remove Subreddits**: Click the remove button (✕) to delete configurations
6. **Reset to Defaults**: Use the reset button to restore picture-based defaults

### Filtering & Controls
- **Subreddit Filter**: Hide/show specific subreddits temporarily
- **Sort Control**: Choose how to sort your combined feed
- **Auto-Refresh**: Content updates automatically with visual countdown timer

# RedditVisor Netlify Deployment Guide

This guide will help you deploy RedditVisor to Netlify as a frontend-only application.

## Prerequisites

1. **Reddit API Credentials**: You'll need a Reddit app with client ID and secret
2. **Netlify Account**: Sign up at [netlify.com](https://netlify.com)
3. **Built Application**: The frontend must be built before deployment

## Step 1: Build the Application

```bash
# Install dependencies
npm run install:all

# Build the frontend
npm run build
```

This creates a `frontend/dist` folder with the production build.

## Step 2: Deploy to Netlify

### Option A: Drag & Drop Deployment

1. Go to [netlify.com](https://netlify.com) and log in
2. Drag and drop the `frontend/dist` folder onto the Netlify dashboard
3. Your site will be deployed instantly with a random URL

### Option B: Git Integration (Recommended)

1. Push your code to GitHub/GitLab/Bitbucket
2. In Netlify dashboard, click "New site from Git"
3. Connect your repository
4. Configure build settings:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`

## Step 3: Configure Environment Variables

In your Netlify site dashboard, go to **Site settings > Environment variables** and add:

### Required Variables
- `VITE_REDDIT_CLIENT_ID`: Your Reddit app client ID
- `VITE_REDDIT_CLIENT_SECRET`: Your Reddit app client secret
- `VITE_REDDIT_USER_AGENT`: Your app's user agent (e.g., "RedditVisor/1.0")

### Optional Variables (for authenticated requests)
- `VITE_REDDIT_USERNAME`: Your Reddit username
- `VITE_REDDIT_PASSWORD`: Your Reddit password

## Step 4: Configure Redirects (Automatic)

The included `netlify.toml` file automatically configures:
- Single Page Application (SPA) redirects
- Build settings for Git integration
- Node.js version specification

## Step 5: Test Your Deployment

1. Visit your Netlify site URL
2. Verify that Reddit content loads properly
3. Test subreddit management features
4. Check that videos and images display correctly

## Troubleshooting

### Build Fails
- Ensure Node.js version 18+ is specified in `netlify.toml`
- Check that all dependencies are properly installed
- Verify environment variables are set correctly

### Reddit API Issues
- Confirm your Reddit app credentials are correct
- Ensure your Reddit app is configured for web use
- Check that CORS is properly handled (Reddit API supports CORS)

### Content Not Loading
- Verify environment variables are set in Netlify dashboard
- Check browser console for API errors
- Ensure Reddit API credentials have proper permissions

## Performance Optimization

The build includes:
- Code splitting and minification
- CSS optimization
- Source maps for debugging
- Gzip compression support

## Security Notes

- Environment variables are exposed in the client bundle (this is normal for frontend apps)
- Reddit API credentials should be from a "web app" type Reddit application
- Consider using Reddit's OAuth flow for production deployments

## Custom Domain (Optional)

1. In Netlify dashboard, go to **Site settings > Domain management**
2. Add your custom domain
3. Configure DNS settings as instructed
4. SSL certificate will be automatically provisioned

Your RedditVisor app is now deployed and ready to use!

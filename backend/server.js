const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'RedditVisor Backend is running',
        note: 'Reddit polling has been moved to frontend'
    });
});

// Legacy posts endpoint for backward compatibility
// Returns empty response since polling is now handled by frontend
app.get('/api/posts', (req, res) => {
    res.json({
        success: false,
        error: 'Reddit polling has been moved to frontend. Please update your client.',
        posts: [],
        totalPosts: 0,
        lastUpdated: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`RedditVisor Backend running on http://localhost:${PORT}`);
    console.log('Note: Reddit polling has been moved to the frontend');
    console.log('This backend now only provides health check and legacy compatibility');
});

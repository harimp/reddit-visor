/**
 * Subreddit color utility
 * Provides consistent color schemes for different subreddits across the application
 */

// Define pastel color schemes for different subreddits
const SUBREDDIT_COLOR_SCHEMES = {
  'default': {
    bg: '#F0F8E5',      // Pastel green background
    border: '#D4E5B3',   // Pastel green border
    text: '#2D5016'      // Dark green text
  }
};

/**
 * Get color scheme for a specific subreddit
 * @param {string} subreddit - The subreddit name
 * @returns {Object} Color scheme object with bg, border, and text properties
 */
export const getSubredditColors = (subreddit) => {
  return SUBREDDIT_COLOR_SCHEMES[subreddit.toLocaleLowerCase()] || SUBREDDIT_COLOR_SCHEMES.default;
};

/**
 * Get all available subreddit color schemes
 * @returns {Object} All color schemes
 */
export const getAllSubredditColors = () => {
  return { ...SUBREDDIT_COLOR_SCHEMES };
};

/**
 * Check if a subreddit has a custom color scheme
 * @param {string} subreddit - The subreddit name
 * @returns {boolean} True if custom color scheme exists
 */
export const hasCustomColors = (subreddit) => {
  return subreddit in SUBREDDIT_COLOR_SCHEMES && subreddit !== 'default';
};

/**
 * Get CSS style object for subreddit badge
 * @param {string} subreddit - The subreddit name
 * @param {boolean} isActive - Whether the badge should use active styling
 * @returns {Object} CSS style object
 */
export const getSubredditBadgeStyle = (subreddit, isActive = true) => {
  const colors = getSubredditColors(subreddit);
  
  return {
    backgroundColor: isActive ? colors.bg : 'white',
    color: isActive ? colors.text : '#657786',
    border: `1px solid ${colors.border}`
  };
};

/**
 * Get CSS style object for subreddit filter button
 * @param {string} subreddit - The subreddit name
 * @param {boolean} isActive - Whether the button should use active styling
 * @returns {Object} CSS style object
 */
export const getSubredditButtonStyle = (subreddit, isActive = true) => {
  const colors = getSubredditColors(subreddit);
  
  return {
    backgroundColor: isActive ? colors.bg : 'white',
    borderColor: colors.border,
    color: isActive ? colors.text : '#657786'
  };
};

/**
 * Get list of subreddits with their color information
 * @param {Array} subreddits - Array of subreddit names
 * @returns {Array} Array of objects with subreddit name and color info
 */
export const getSubredditsWithColors = (subreddits) => {
  return subreddits.map(subreddit => ({
    name: subreddit,
    colors: getSubredditColors(subreddit),
    hasCustomColors: hasCustomColors(subreddit)
  }));
};

export default {
  getSubredditColors,
  getAllSubredditColors,
  hasCustomColors,
  getSubredditBadgeStyle,
  getSubredditButtonStyle,
  getSubredditsWithColors
};
/**
 * Query Parser Utility for Reddit Search
 * Handles boolean logic (AND, OR, NOT) and query validation
 */

/**
 * Parse user-friendly keyword input into Reddit search format
 * @param {string} userInput - Raw user input
 * @returns {string} - Formatted query for Reddit API
 */
export const parseKeywordQuery = (userInput) => {
  if (!userInput || typeof userInput !== 'string') {
    return '';
  }

  // Trim and normalize whitespace
  let query = userInput.trim().replace(/\s+/g, ' ');
  
  if (!query) {
    return '';
  }

  // Handle quoted phrases - preserve them as-is
  const quotedPhrases = [];
  const quotePlaceholders = [];
  
  // Extract quoted phrases and replace with placeholders
  query = query.replace(/"([^"]+)"/g, (match, phrase) => {
    const placeholder = `__QUOTE_${quotedPhrases.length}__`;
    quotedPhrases.push(`"${phrase}"`);
    quotePlaceholders.push(placeholder);
    return placeholder;
  });

  // Normalize boolean operators (case insensitive)
  query = query.replace(/\s+and\s+/gi, ' AND ');
  query = query.replace(/\s+or\s+/gi, ' OR ');
  query = query.replace(/\s+not\s+/gi, ' NOT ');

  // Handle implicit AND for space-separated terms
  // Split by explicit operators first
  const parts = query.split(/(\s+(?:AND|OR|NOT)\s+|\(|\))/);
  
  const processedParts = parts.map(part => {
    const trimmed = part.trim();
    
    // Skip operators, parentheses, and empty parts
    if (!trimmed || /^(AND|OR|NOT|\(|\))$/.test(trimmed)) {
      return trimmed;
    }
    
    // Handle multiple space-separated terms within a part
    const terms = trimmed.split(/\s+/);
    if (terms.length > 1) {
      // Join multiple terms with AND
      return terms.join(' AND ');
    }
    
    return trimmed;
  });

  query = processedParts.join('');

  // Clean up extra spaces around operators
  query = query.replace(/\s+/g, ' ');
  query = query.replace(/\s*\(\s*/g, '(');
  query = query.replace(/\s*\)\s*/g, ')');
  query = query.replace(/\s*(AND|OR|NOT)\s*/g, ' $1 ');

  // Restore quoted phrases
  quotePlaceholders.forEach((placeholder, index) => {
    query = query.replace(placeholder, quotedPhrases[index]);
  });

  return query.trim();
};

/**
 * Validate query syntax
 * @param {string} query - Query to validate
 * @returns {object} - { isValid: boolean, error: string }
 */
export const validateQuery = (query) => {
  if (!query || typeof query !== 'string') {
    return { isValid: false, error: 'Query cannot be empty' };
  }

  const trimmed = query.trim();
  if (!trimmed) {
    return { isValid: false, error: 'Query cannot be empty' };
  }

  // Check for balanced parentheses
  let parenCount = 0;
  for (const char of trimmed) {
    if (char === '(') parenCount++;
    if (char === ')') parenCount--;
    if (parenCount < 0) {
      return { isValid: false, error: 'Unmatched closing parenthesis' };
    }
  }
  
  if (parenCount > 0) {
    return { isValid: false, error: 'Unmatched opening parenthesis' };
  }

  // Check for invalid operator sequences
  if (/\b(AND|OR|NOT)\s+(AND|OR|NOT)\b/i.test(trimmed)) {
    return { isValid: false, error: 'Invalid operator sequence (e.g., "AND OR")' };
  }

  // Check for operators at start/end
  if (/^(AND|OR)\b/i.test(trimmed)) {
    return { isValid: false, error: 'Query cannot start with AND or OR' };
  }
  
  if (/\b(AND|OR|NOT)$/i.test(trimmed)) {
    return { isValid: false, error: 'Query cannot end with an operator' };
  }

  // Check for empty parentheses
  if (/\(\s*\)/.test(trimmed)) {
    return { isValid: false, error: 'Empty parentheses are not allowed' };
  }

  // Check for operators next to parentheses incorrectly
  if (/\(\s*(AND|OR)\b/i.test(trimmed)) {
    return { isValid: false, error: 'Parentheses cannot start with AND or OR' };
  }

  return { isValid: true, error: null };
};

/**
 * Get example queries for user reference
 * @returns {array} - Array of example objects
 */
export const getQueryExamples = () => {
  return [
    {
      input: 'cats dogs',
      output: 'cats AND dogs',
      description: 'Find posts containing both "cats" and "dogs"'
    },
    {
      input: 'cats OR dogs',
      output: 'cats OR dogs',
      description: 'Find posts containing either "cats" or "dogs"'
    },
    {
      input: 'cats NOT dogs',
      output: 'cats NOT dogs',
      description: 'Find posts containing "cats" but not "dogs"'
    },
    {
      input: '(cats OR dogs) AND funny',
      output: '(cats OR dogs) AND funny',
      description: 'Find funny posts about cats or dogs'
    },
    {
      input: '"cute cats" OR "funny dogs"',
      output: '"cute cats" OR "funny dogs"',
      description: 'Find posts with exact phrases'
    },
    {
      input: 'programming javascript react',
      output: 'programming AND javascript AND react',
      description: 'Find posts about all three topics'
    }
  ];
};

/**
 * Suggest query improvements
 * @param {string} query - User query
 * @returns {array} - Array of suggestion objects
 */
export const getQuerySuggestions = (query) => {
  const suggestions = [];
  
  if (!query || !query.trim()) {
    return suggestions;
  }

  const trimmed = query.trim();
  
  // Suggest explicit operators for space-separated terms
  if (!/\b(AND|OR|NOT)\b/i.test(trimmed) && trimmed.includes(' ')) {
    const terms = trimmed.split(/\s+/);
    if (terms.length > 1) {
      suggestions.push({
        type: 'explicit_and',
        original: trimmed,
        suggestion: terms.join(' AND '),
        reason: 'Make AND operators explicit'
      });
      
      suggestions.push({
        type: 'use_or',
        original: trimmed,
        suggestion: terms.join(' OR '),
        reason: 'Use OR to find posts with any of these terms'
      });
    }
  }

  // Suggest grouping for complex queries
  if (/\bOR\b/i.test(trimmed) && /\bAND\b/i.test(trimmed) && !/[()]/.test(trimmed)) {
    suggestions.push({
      type: 'add_grouping',
      original: trimmed,
      suggestion: `Consider using parentheses to group terms: (${trimmed})`,
      reason: 'Clarify operator precedence with parentheses'
    });
  }

  return suggestions;
};

/**
 * Format query for display (with syntax highlighting hints)
 * @param {string} query - Query to format
 * @returns {object} - Formatted query parts for UI highlighting
 */
export const formatQueryForDisplay = (query) => {
  if (!query) {
    return { parts: [], hasOperators: false };
  }

  const parts = [];
  const tokens = query.split(/(\s+(?:AND|OR|NOT)\s+|\(|\)|"[^"]*")/);
  
  let hasOperators = false;

  tokens.forEach((token, index) => {
    const trimmed = token.trim();
    if (!trimmed) return;

    if (/^(AND|OR|NOT)$/i.test(trimmed)) {
      parts.push({ type: 'operator', text: trimmed, index });
      hasOperators = true;
    } else if (trimmed === '(' || trimmed === ')') {
      parts.push({ type: 'parenthesis', text: trimmed, index });
    } else if (/^".*"$/.test(trimmed)) {
      parts.push({ type: 'phrase', text: trimmed, index });
    } else {
      parts.push({ type: 'term', text: trimmed, index });
    }
  });

  return { parts, hasOperators };
};

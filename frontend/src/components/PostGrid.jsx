import React, { useMemo } from 'react';
import PostCard from './PostCard.jsx';

function PostGrid({ posts }) {
  // Distribute posts across 3 columns for balanced layout
  const columns = useMemo(() => {
    const col1 = [];
    const col2 = [];
    const col3 = [];
    
    posts.forEach((post, index) => {
      const columnIndex = index % 3;
      if (columnIndex === 0) col1.push(post);
      else if (columnIndex === 1) col2.push(post);
      else col3.push(post);
    });
    
    return [col1, col2, col3];
  }, [posts]);

  if (posts.length === 0) {
    return (
      <div className="post-grid-empty">
        <div className="empty-state">
          <div className="empty-icon">📷</div>
          <h3>No posts found</h3>
          <p>Try adjusting your filters or check back later for new content.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="post-grid">
      <div className="grid-column">
        {columns[0].map(post => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
      <div className="grid-column">
        {columns[1].map(post => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
      <div className="grid-column">
        {columns[2].map(post => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}

export default PostGrid;

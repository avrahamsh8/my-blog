import { useState, useEffect } from 'react'

export default function PostList({ api, onOpen }) {
  const [posts, setPosts] = useState([])

  useEffect(() => {
    fetch(api + '/posts')
      .then(r => r.json())
      .then(setPosts)
  }, [])

  if (posts.length === 0) {
    return (
      <div className="page">
        <div className="posts-header"><h1>📰 הבלוג</h1></div>
        <div className="empty">
          <div className="icon">📭</div>
          <p>עדיין אין פוסטים — התחבר וכתוב את הראשון!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="posts-header">
        <h1>📰 הבלוג</h1>
        <span style={{ color: '#a0aec0', fontSize: '0.88rem' }}>{posts.length} פוסטים</span>
      </div>

      {posts.map(post => (
        <div key={post.id} className="post-card" onClick={() => onOpen(post)}>
          <h2>{post.title}</h2>
          <div className="post-preview">
            {post.content.slice(0, 180)}{post.content.length > 180 ? '...' : ''}
          </div>
          <div className="post-meta">
            <span>✍️ {post.author}</span>
            <span>📅 {post.created_at.slice(0, 10)}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

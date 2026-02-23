import { marked } from 'marked'

export default function PostView({ api, token, user, post, onBack, onEdit, onDeleted }) {

  async function handleDelete() {
    if (!confirm('בטוח שתרצה למחוק את הפוסט?')) return

    await fetch(`${api}/posts/${post.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    onDeleted()
  }

  const isAuthor = user && user === post.author

  return (
    <div className="page">
      <div className="post-full">

        <div className="post-actions">
          <button className="btn-back" onClick={onBack}>← חזרה</button>
          {isAuthor && (
            <>
              <button className="btn-edit" onClick={() => onEdit(post)}>✏️ עריכה</button>
              <button className="btn-del" onClick={handleDelete}>🗑️ מחיקה</button>
            </>
          )}
        </div>

        <h1>{post.title}</h1>
        <div className="post-meta" style={{ marginBottom: '24px' }}>
          <span>✍️ {post.author}</span>
          <span>📅 {post.created_at.slice(0, 10)}</span>
        </div>

        {/* Markdown מומר ל-HTML */}
        <div
          className="markdown-body"
          dangerouslySetInnerHTML={{ __html: marked(post.content) }}
        />

      </div>
    </div>
  )
}

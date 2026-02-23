import { useState } from 'react'

export default function PostEditor({ api, token, post, onSaved, onCancel }) {
  const [title,   setTitle]   = useState(post?.title   || '')
  const [content, setContent] = useState(post?.content || '')
  const [error,   setError]   = useState('')

  const isEdit = !!post

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!title.trim() || !content.trim()) {
      setError('כותרת ותוכן הם שדות חובה')
      return
    }

    const url    = isEdit ? `${api}/posts/${post.id}` : `${api}/posts`
    const method = isEdit ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,   // ← שולח את ה-token!
      },
      body: JSON.stringify({ title, content }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'שגיאה בשמירה')
      return
    }

    onSaved(data)
  }

  return (
    <div className="page">
      <div className="editor-card">
        <h2>{isEdit ? '✏️ עריכת פוסט' : '✍️ פוסט חדש'}</h2>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>כותרת</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="כותרת הפוסט..."
            />
          </div>

          <div className="form-group">
            <label>תוכן (תומך Markdown — **מודגש**, # כותרת, וכו')</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="כתוב את הפוסט שלך כאן..."
            />
          </div>

          <div className="editor-actions">
            <button type="submit" className="btn-full" style={{ marginTop: 0 }}>
              💾 {isEdit ? 'שמור שינויים' : 'פרסם פוסט'}
            </button>
            <button
              type="button"
              className="btn-back"
              style={{ padding: '11px 20px' }}
              onClick={onCancel}
            >
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

import { useState } from 'react'

export default function AuthPage({ api, onLogin }) {
  const [mode, setMode]         = useState('login')   // login | register
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const endpoint = mode === 'login' ? '/auth/login' : '/auth/register'
    const res = await fetch(api + endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'שגיאה')
      return
    }

    // מעביר את ה-token ושם המשתמש ל-App
    onLogin(data.username, data.token)
  }

  return (
    <div className="auth-card">
      <h2>{mode === 'login' ? '🔑 התחברות' : '📝 הרשמה'}</h2>

      {error && <div className="error-msg">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>שם משתמש</label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="הכנס שם משתמש"
          />
        </div>
        <div className="form-group">
          <label>סיסמה</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="הכנס סיסמה"
          />
        </div>
        <button type="submit" className="btn-full">
          {mode === 'login' ? 'התחבר' : 'הרשם'}
        </button>
      </form>

      <div className="auth-switch">
        {mode === 'login' ? (
          <>אין לך חשבון? <span onClick={() => setMode('register')}>הרשם כאן</span></>
        ) : (
          <>כבר רשום? <span onClick={() => setMode('login')}>התחבר כאן</span></>
        )}
      </div>
    </div>
  )
}

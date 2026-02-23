import { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import AuthPage from './components/AuthPage'
import PostList from './components/PostList'
import PostView from './components/PostView'
import PostEditor from './components/PostEditor'

// בפיתוח — localhost. בפרודקשן — אותו שרת (URL יחסי)
const API = import.meta.env.DEV ? 'http://localhost:5002/api' : '/api'

export default function App() {
  const [user, setUser]       = useState(() => localStorage.getItem('username') || null)
  const [token, setToken]     = useState(() => localStorage.getItem('token') || null)
  const [page, setPage]       = useState('home')   // home | post | editor | auth
  const [currentPost, setCurrentPost] = useState(null)
  const [editPost, setEditPost]       = useState(null)

  // שומר token ו-username ב-localStorage
  useEffect(() => {
    if (token) localStorage.setItem('token', token)
    else localStorage.removeItem('token')
    if (user) localStorage.setItem('username', user)
    else localStorage.removeItem('username')
  }, [token, user])

  function handleLogin(username, tok) {
    setUser(username)
    setToken(tok)
    setPage('home')
  }

  function handleLogout() {
    setUser(null)
    setToken(null)
    setPage('home')
  }

  function openPost(post) {
    setCurrentPost(post)
    setPage('post')
  }

  function openEditor(post = null) {
    setEditPost(post)
    setPage('editor')
  }

  return (
    <>
      <Navbar
        user={user}
        onLogout={handleLogout}
        onHome={() => setPage('home')}
        onLogin={() => setPage('auth')}
        onNewPost={() => openEditor(null)}
      />

      {page === 'auth' && (
        <AuthPage api={API} onLogin={handleLogin} />
      )}

      {page === 'home' && (
        <PostList api={API} onOpen={openPost} />
      )}

      {page === 'post' && currentPost && (
        <PostView
          api={API}
          token={token}
          user={user}
          post={currentPost}
          onBack={() => setPage('home')}
          onEdit={openEditor}
          onDeleted={() => setPage('home')}
        />
      )}

      {page === 'editor' && (
        <PostEditor
          api={API}
          token={token}
          post={editPost}
          onSaved={(saved) => { setCurrentPost(saved); setPage('post') }}
          onCancel={() => setPage(currentPost ? 'post' : 'home')}
        />
      )}
    </>
  )
}

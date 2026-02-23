export default function Navbar({ user, onLogout, onHome, onLogin, onNewPost }) {
  return (
    <nav className="navbar">
      <div className="navbar-brand" onClick={onHome}>✍️ הבלוג שלי</div>
      <div className="navbar-links">
        {user ? (
          <>
            <span className="nav-username">שלום, {user}</span>
            <button className="nav-btn primary" onClick={onNewPost}>+ פוסט חדש</button>
            <button className="nav-btn danger" onClick={onLogout}>התנתק</button>
          </>
        ) : (
          <button className="nav-btn outline" onClick={onLogin}>התחבר / הרשם</button>
        )}
      </div>
    </nav>
  )
}

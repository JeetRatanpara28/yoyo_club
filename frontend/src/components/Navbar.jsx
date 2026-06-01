import { NavLink, useNavigate } from 'react-router-dom'
import '../styles/navbar.css'

function Navbar() {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <span className="navbar-brand">🎵 Yoyo's Club</span>
      <NavLink to="/" end>Dashboard</NavLink>
      <NavLink to="/staff">Staff</NavLink>
      <NavLink to="/payroll">Payroll</NavLink>
      <NavLink to="/tickets">Tickets</NavLink>
      <button
        onClick={handleLogout}
        style={{ marginLeft: 'auto', background: 'none', border: '1px solid #ccc', color: '#ccc', padding: '0.3rem 0.8rem', cursor: 'pointer', fontSize: '0.85rem', borderRadius: '4px' }}
      >
        Logout
      </button>
    </nav>
  )
}

export default Navbar
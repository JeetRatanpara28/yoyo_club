import { NavLink, useNavigate } from 'react-router-dom'
import '../styles/navbar.css'

function Navbar() {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('name')
    localStorage.removeItem('userId')
    navigate('/login')
  }

  return (
    <div className="navbar">
      <div className="navbar-left">
        <div className="navbar-brand">🎵 Yoyo's Club</div>
        <div className="navbar-links">
          <NavLink to="/" end className={({ isActive }) => isActive ? 'navbar-link active' : 'navbar-link'}>Dashboard</NavLink>
          <NavLink to="/staff" className={({ isActive }) => isActive ? 'navbar-link active' : 'navbar-link'}>Staff</NavLink>
          <NavLink to="/payroll" className={({ isActive }) => isActive ? 'navbar-link active' : 'navbar-link'}>Payroll</NavLink>
          <NavLink to="/tickets" className={({ isActive }) => isActive ? 'navbar-link active' : 'navbar-link'}>Tickets</NavLink>
        </div>
      </div>
      <div className="navbar-right">
        <button className="navbar-logout" onClick={handleLogout}>Logout</button>
      </div>
    </div>
  )
}

export default Navbar
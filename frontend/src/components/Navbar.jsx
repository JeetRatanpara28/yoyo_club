import { NavLink } from 'react-router-dom'
import '../styles/navbar.css'

function Navbar() {
  return (
    <nav className="navbar">
      <span className="navbar-brand">🎵 Yoyo's Club</span>
      <NavLink to="/" end>Dashboard</NavLink>
      <NavLink to="/staff">Staff</NavLink>
      <NavLink to="/payroll">Payroll</NavLink>
      <NavLink to="/tickets">Tickets</NavLink>
    </nav>
  )
}

export default Navbar
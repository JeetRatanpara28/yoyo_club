import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import Staff from './pages/Staff'
import Payroll from './pages/Payroll'
import Tickets from './pages/Tickets'
import Login from './pages/Login'

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/login" />
}

function App() {
  return (
    <div>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={
          <PrivateRoute>
            <Navbar />
            <div style={{ padding: '1.2rem 1.5rem' }}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/staff" element={<Staff />} />
                <Route path="/payroll" element={<Payroll />} />
                <Route path="/tickets" element={<Tickets />} />
              </Routes>
            </div>
          </PrivateRoute>
        } />
      </Routes>
    </div>
  )
}

export default App
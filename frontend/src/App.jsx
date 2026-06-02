import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import Staff from './pages/Staff'
import Payroll from './pages/Payroll'
import Tickets from './pages/Tickets'
import Login from './pages/Login'
import EmployeeDashboard from './pages/EmployeeDashboard'

const AdminRoute = ({ children }) => {
  const token = localStorage.getItem('token')
  const role = localStorage.getItem('role')
  if (!token) return <Navigate to="/login" />
  if (role !== 'admin') return <Navigate to="/employee" />
  return children
}

const EmployeeRoute = ({ children }) => {
  const token = localStorage.getItem('token')
  const role = localStorage.getItem('role')
  if (!token) return <Navigate to="/login" />
  if (role === 'admin') return <Navigate to="/" />
  return children
}

function App() {
  return (
    <div>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/employee" element={
          <EmployeeRoute>
            <EmployeeDashboard />
          </EmployeeRoute>
        } />
        <Route path="/*" element={
          <AdminRoute>
            <Navbar />
            <div style={{ padding: '1.2rem 1.5rem' }}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/staff" element={<Staff />} />
                <Route path="/payroll" element={<Payroll />} />
                <Route path="/tickets" element={<Tickets />} />
              </Routes>
            </div>
          </AdminRoute>
        } />
      </Routes>
    </div>
  )
}

export default App
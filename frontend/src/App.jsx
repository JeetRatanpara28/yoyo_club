import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import Staff from './pages/Staff'
import Payroll from './pages/Payroll'
import Tickets from './pages/Tickets'

function App() {
  return (
    <div>
      <Navbar />
      <div style={{ padding: '2rem' }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/staff" element={<Staff />} />
          <Route path="/payroll" element={<Payroll />} />
          <Route path="/tickets" element={<Tickets />} />
        </Routes>
      </div>
    </div>
  )
}

export default App
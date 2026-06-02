import { useState, useEffect } from 'react'
import { getEmployees, getPayments, clockIn, clockOut, getClockIns, getClockSummary } from '../service/api'
import { useNavigate } from 'react-router-dom'
import '../styles/employee.css'

function EmployeeDashboard() {
  const [employee, setEmployee] = useState(null)
  const [clockins, setClockIns] = useState([])
  const [payments, setPayments] = useState([])
  const [isClockedIn, setIsClockedIn] = useState(false)
  const [loading, setLoading] = useState(true)
  const [realHours, setRealHours] = useState(0)
  const navigate = useNavigate()

  const name = localStorage.getItem('name')
  const userId = localStorage.getItem('userId')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [empRes, payRes, clockRes, summaryRes] = await Promise.all([
        getEmployees(),
        getPayments(),
        getClockIns(userId),
        getClockSummary(userId)
      ])
      const emp = empRes.data.find(e => e.name.toLowerCase() === name.toLowerCase())
      setEmployee(emp)
      const myPayments = payRes.data.filter(p => p.employee_name.toLowerCase() === name.toLowerCase())
      setPayments(myPayments)
      setClockIns(clockRes.data)
      setRealHours(summaryRes.data.total_hours)
      const today = new Date().toISOString().split('T')[0]
      const todayRecord = clockRes.data.find(c => c.date === today && !c.clock_out)
      setIsClockedIn(!!todayRecord)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleClockIn = async () => {
    try {
      await clockIn({ employee_id: parseInt(userId), employee_name: name })
      setIsClockedIn(true)
      fetchData()
    } catch (err) {
      alert(err.response?.data?.detail || 'Error clocking in')
    }
  }

  const handleClockOut = async () => {
    try {
      await clockOut({ employee_id: parseInt(userId), employee_name: name })
      setIsClockedIn(false)
      fetchData()
    } catch (err) {
      alert(err.response?.data?.detail || 'Error clocking out')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('name')
    localStorage.removeItem('userId')
    navigate('/login')
  }

  const calculateRealPay = (emp) => {
    if (!emp) return 0
    const base = realHours * emp.hourly_rate
    if (emp.contract === 'full-time') return (base * 1.10).toFixed(2)
    if (emp.contract === 'part-time') return base.toFixed(2)
    if (emp.contract === 'freelance') return (base * 0.80).toFixed(2)
    return base.toFixed(2)
  }

  const getNextMonday = () => {
    const today = new Date()
    const day = today.getDay()
    const daysUntilMonday = day === 1 ? 7 : (8 - day) % 7
    const nextMonday = new Date(today)
    nextMonday.setDate(today.getDate() + daysUntilMonday)
    return nextMonday.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  if (loading) return <p>Loading...</p>

  return (
    <div className="emp-page">
      <div className="emp-header">
        <span>👋 Hello, {name}</span>
        <button className="btn btn-grey" onClick={handleLogout}>Logout</button>
      </div>

      <div className="emp-grid">
        <div className="emp-card">
          <h3>Clock In / Out</h3>
          <p style={{ fontSize: '0.85rem', color: '#555', marginBottom: '1rem' }}>
            Status: <strong>{isClockedIn ? '🟢 Clocked In' : '🔴 Clocked Out'}</strong>
          </p>
          <button
            className={`btn ${isClockedIn ? 'btn-red' : 'btn-green'}`}
            onClick={isClockedIn ? handleClockOut : handleClockIn}
            style={{ width: '100%', padding: '0.6rem' }}
          >
            {isClockedIn ? 'Clock Out' : 'Clock In'}
          </button>
        </div>

        <div className="emp-card">
          <h3>My Details</h3>
          {employee ? (
            <>
              <p>Role: {employee.role}</p>
              <p>Contract: {employee.contract}</p>
              <p>Hourly Rate: €{employee.hourly_rate}/hr</p>
              <p>Total Hours Worked: <strong>{realHours}h</strong></p>
              <p>Est. Pay: <strong>€{calculateRealPay(employee)}</strong></p>
            </>
          ) : (
            <p style={{ color: '#888' }}>No details found</p>
          )}
        </div>

        <div className="emp-card">
          <h3>Next Payment</h3>
          {payments.length > 0 ? (
            <p style={{ color: '#2e7d32', fontWeight: 'bold' }}>
              Last paid: €{payments[0].amount.toFixed(2)} on {payments[0].paid_at}
            </p>
          ) : (
            <p style={{ color: '#888' }}>Not paid yet</p>
          )}
          <p style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
            Next payment: <strong>{getNextMonday()}</strong>
          </p>
        </div>
      </div>

      <div className="emp-card" style={{ marginTop: '1rem' }}>
        <h3>Clock In History</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Clock In</th>
              <th>Clock Out</th>
              <th>Hours</th>
            </tr>
          </thead>
          <tbody>
            {clockins.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', color: '#888' }}>No records yet.</td>
              </tr>
            ) : (
              clockins.map(c => (
                <tr key={c.id}>
                  <td>{c.date}</td>
                  <td>{c.clock_in}</td>
                  <td>{c.clock_out || '—'}</td>
                  <td>{c.hours_worked}h</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="emp-card" style={{ marginTop: '1rem' }}>
        <h3>Payment History</h3>
        <table>
          <thead>
            <tr>
              <th>Amount</th>
              <th>Contract</th>
              <th>Paid At</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan="3" style={{ textAlign: 'center', color: '#888' }}>No payments yet.</td>
              </tr>
            ) : (
              payments.map(p => (
                <tr key={p.id}>
                  <td>€{p.amount.toFixed(2)}</td>
                  <td style={{ textTransform: 'capitalize' }}>{p.contract}</td>
                  <td>{p.paid_at}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default EmployeeDashboard
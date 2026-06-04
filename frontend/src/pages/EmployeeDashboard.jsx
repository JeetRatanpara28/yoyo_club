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

  useEffect(() => { fetchData() }, [])

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
    if (!emp) return '0.00'
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

  if (loading) return <div className="emp-no-data">Loading...</div>

  return (
    <div className="emp-page">

      <div className="emp-navbar">
        <div className="emp-navbar-brand">🎵 Yoyo's Club</div>
        <div className="emp-navbar-right">
          <span className="emp-navbar-name">{name}</span>
          <button className="emp-navbar-logout" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className="emp-content">
        <div className="emp-greeting">Hello, {name}</div>

        <div className="emp-grid">

          <div className="emp-card">
            <div className="emp-card-title">Clock in / out</div>
            <div className="emp-status">
              <div className={`emp-status-dot ${isClockedIn ? 'green' : 'red'}`} />
              {isClockedIn ? 'Clocked in' : 'Clocked out'}
            </div>
            <button
              className={`emp-clock-btn ${isClockedIn ? 'out' : 'in'}`}
              onClick={isClockedIn ? handleClockOut : handleClockIn}
            >
              {isClockedIn ? 'Clock out' : 'Clock in'}
            </button>
          </div>

          <div className="emp-card">
            <div className="emp-card-title">My details</div>
            {employee ? (
              <>
                <div className="emp-card-row">
                  <span className="emp-card-label">Role</span>
                  <span className="emp-card-value">{employee.role}</span>
                </div>
                <div className="emp-card-row">
                  <span className="emp-card-label">Contract</span>
                  <span className="emp-card-value" style={{ textTransform: 'capitalize' }}>{employee.contract}</span>
                </div>
                <div className="emp-card-row">
                  <span className="emp-card-label">Hourly rate</span>
                  <span className="emp-card-value">€{employee.hourly_rate}/hr</span>
                </div>
                <div className="emp-card-row">
                  <span className="emp-card-label">Hours worked</span>
                  <span className="emp-card-value">{realHours}h</span>
                </div>
                <div className="emp-card-row">
                  <span className="emp-card-label">Est. pay</span>
                  <span className="emp-card-value green">€{calculateRealPay(employee)}</span>
                </div>
              </>
            ) : (
              <div className="emp-no-data">No details found</div>
            )}
          </div>

          <div className="emp-card">
            <div className="emp-card-title">Next payment</div>
            {payments.length > 0 ? (
              <>
                <div className="emp-card-row">
                  <span className="emp-card-label">Last paid</span>
                  <span className="emp-card-value green">€{payments[0].amount.toFixed(2)}</span>
                </div>
                <div className="emp-card-row">
                  <span className="emp-card-label">Paid on</span>
                  <span className="emp-card-value">{payments[0].paid_at}</span>
                </div>
              </>
            ) : (
              <div style={{ fontSize: 12, color: '#aaa', marginBottom: 10 }}>Not paid yet</div>
            )}
            <div className="emp-card-row" style={{ marginTop: 8 }}>
              <span className="emp-card-label">Next payment</span>
              <span className="emp-card-value">{getNextMonday()}</span>
            </div>
          </div>

        </div>

        <div className="emp-table-card">
          <div className="emp-table-header">Clock in history</div>
          <table className="emp-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Clock in</th>
                <th>Clock out</th>
                <th>Hours</th>
              </tr>
            </thead>
            <tbody>
              {clockins.length === 0 ? (
                <tr><td colSpan="4" className="emp-no-data">No records yet.</td></tr>
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

        <div className="emp-table-card">
          <div className="emp-table-header">Payment history</div>
          <table className="emp-table">
            <thead>
              <tr>
                <th>Amount</th>
                <th>Contract</th>
                <th>Paid at</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr><td colSpan="3" className="emp-no-data">No payments yet.</td></tr>
              ) : (
                payments.map(p => (
                  <tr key={p.id}>
                    <td className="emp-amount">€{p.amount.toFixed(2)}</td>
                    <td style={{ textTransform: 'capitalize' }}>{p.contract}</td>
                    <td>{p.paid_at}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default EmployeeDashboard
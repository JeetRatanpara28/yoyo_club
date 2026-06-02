import { useState, useEffect } from 'react'
import { getEmployees, getAttendance, createAttendance } from '../service/api'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import '../styles/dashboard.css'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function Dashboard() {
  const [employees, setEmployees] = useState([])
  const [attendance, setAttendance] = useState([])
  const [loading, setLoading] = useState(true)
  const [attForm, setAttForm] = useState({ day: 'Mon', count: '' })
  const [showAttForm, setShowAttForm] = useState(false)
  const [chartType, setChartType] = useState('hours')
  const [roleFilter, setRoleFilter] = useState('All')
  const [attFilter, setAttFilter] = useState('week')
  const [startDate, setStartDate] = useState(null)
  const [endDate, setEndDate] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [empRes, attRes] = await Promise.all([getEmployees(), getAttendance()])
      setEmployees(empRes.data)
      setAttendance(attRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleAttendance = async () => {
    if (!attForm.count) return
    try {
      await createAttendance({ day: attForm.day, count: parseInt(attForm.count) })
      setAttForm({ day: 'Mon', count: '' })
      setShowAttForm(false)
      fetchData()
    } catch (err) {
      console.error(err)
    }
  }

  const getFilteredAttendance = () => {
    const now = new Date()

    if (startDate && endDate) {
      const rangeData = attendance.filter(a => {
        if (!a.date) return false
        const d = new Date(a.date)
        return d >= startDate && d <= endDate
      })
      const grouped = {}
      rangeData.forEach(a => {
        const d = new Date(a.date)
        const label = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
        grouped[label] = (grouped[label] || 0) + a.count
      })
      return Object.entries(grouped).map(([day, count]) => ({ day, count }))
    }

    if (attFilter === 'day') {
      const today = now.toISOString().split('T')[0]
      const todayData = attendance.filter(a => a.date === today)
      const total = todayData.reduce((sum, a) => sum + a.count, 0)
      return total > 0 ? [{ day: 'Today', count: total }] : []
    }

    if (attFilter === 'week') {
      const weekAgo = new Date(now)
      weekAgo.setDate(now.getDate() - 7)
      const weekData = attendance.filter(a => a.date && new Date(a.date) >= weekAgo)
      const grouped = {}
      weekData.forEach(a => {
        const d = new Date(a.date)
        const label = d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' })
        grouped[label] = (grouped[label] || 0) + a.count
      })
      return Object.entries(grouped).map(([day, count]) => ({ day, count }))
    }

    if (attFilter === 'month') {
      const monthAgo = new Date(now)
      monthAgo.setMonth(now.getMonth() - 1)
      const monthData = attendance.filter(a => a.date && new Date(a.date) >= monthAgo)
      const grouped = {}
      monthData.forEach(a => {
        const d = new Date(a.date)
        const weekNum = Math.ceil(d.getDate() / 7)
        const label = `Week ${weekNum} ${d.toLocaleDateString('en-GB', { month: 'short' })}`
        grouped[label] = (grouped[label] || 0) + a.count
      })
      return Object.entries(grouped).map(([day, count]) => ({ day, count }))
    }

    if (attFilter === 'year') {
      const yearAgo = new Date(now)
      yearAgo.setFullYear(now.getFullYear() - 1)
      const yearData = attendance.filter(a => a.date && new Date(a.date) >= yearAgo)
      const grouped = {}
      yearData.forEach(a => {
        const d = new Date(a.date)
        const label = d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
        grouped[label] = (grouped[label] || 0) + a.count
      })
      return Object.entries(grouped).map(([day, count]) => ({ day, count }))
    }

    return attendance
  }

  const filteredAttendance = getFilteredAttendance()
  const filteredEmployees = roleFilter === 'All' ? employees : employees.filter(e => e.role === roleFilter)
  const filteredChartData = filteredEmployees.map(e => ({
    name: e.name.split(' ')[0],
    hours: e.hours_worked,
    pay: parseFloat((e.hourly_rate * e.hours_worked).toFixed(2))
  }))

  if (loading) return <p>Loading...</p>

  const totalStaff = employees.length
  const totalDJs = employees.filter(e => e.role === 'DJ').length
  const totalBouncers = employees.filter(e => e.role === 'Bouncer').length
  const totalPayroll = employees.reduce((sum, e) => sum + e.hourly_rate * e.hours_worked, 0)

  return (
    <div className="page">
      <div className="page-header">
        <h2>Dashboard</h2>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <p>Total Staff</p>
          <p>{totalStaff}</p>
        </div>
        <div className="stat-card">
          <p>DJs</p>
          <p>{totalDJs}</p>
        </div>
        <div className="stat-card">
          <p>Bouncers</p>
          <p>{totalBouncers}</p>
        </div>
        <div className="stat-card">
          <p>Est. Weekly Payroll</p>
          <p>€{totalPayroll.toFixed(2)}</p>
        </div>
      </div>

      <div className="chart-card">
        <div className="page-header">
          <h3>Attendance</h3>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              value={attFilter}
              onChange={e => { setAttFilter(e.target.value); setStartDate(null); setEndDate(null) }}
            >
              <option value="day">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
            <DatePicker
              selectsRange
              startDate={startDate}
              endDate={endDate}
              onChange={([start, end]) => { setStartDate(start); setEndDate(end) }}
              placeholderText="Custom range"
              dateFormat="dd MMM yyyy"
              isClearable
            />
            <button
              className={`btn ${showAttForm ? 'btn-grey' : 'btn-green'}`}
              onClick={() => setShowAttForm(!showAttForm)}
            >
              {showAttForm ? 'Cancel' : '+ Add'}
            </button>
          </div>
        </div>

        {showAttForm && (
          <div className="att-form">
            <div>
              <label>Day</label>
              <select value={attForm.day} onChange={e => setAttForm({ ...attForm, day: e.target.value })}>
                {DAYS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label>Guest Count</label>
              <input
                type="number"
                value={attForm.count}
                onChange={e => setAttForm({ ...attForm, count: e.target.value })}
                placeholder="e.g. 250"
              />
            </div>
            <div className="att-form-btn">
              <button className="btn btn-green" onClick={handleAttendance}>Save</button>
            </div>
          </div>
        )}

        {filteredAttendance.length === 0 ? (
          <p style={{ color: '#888', marginTop: '0.5rem' }}>No data for this period.</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={filteredAttendance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#222" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="chart-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
          <h3 style={{ margin: 0 }}>Staff Overview</h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <select value={chartType} onChange={e => setChartType(e.target.value)}>
              <option value="hours">Hours Worked</option>
              <option value="pay">Payroll Cost (€)</option>
            </select>
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
              <option value="All">All Roles</option>
              <option value="Bartender">Bartender</option>
              <option value="DJ">DJ</option>
              <option value="Bouncer">Bouncer</option>
              <option value="Staff">Staff</option>
            </select>
          </div>
        </div>

        {filteredChartData.length === 0 ? (
          <p style={{ color: '#888' }}>No data for this filter.</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={filteredChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey={chartType === 'hours' ? 'hours' : 'pay'} fill="#555" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="hours-table-card">
        <h3>Staff Hours This Week</h3>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Hours</th>
              <th>Est. Pay</th>
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', color: '#888' }}>No staff data.</td>
              </tr>
            ) : (
              employees.map(emp => (
                <tr key={emp.id}>
                  <td>{emp.name}</td>
                  <td>{emp.role}</td>
                  <td>{emp.hours_worked}h</td>
                  <td>€{(emp.hourly_rate * emp.hours_worked).toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Dashboard
import { useState, useEffect } from 'react'
import { getEmployees, getAttendance, createAttendance } from '../service/api'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import '../styles/dashboard.css'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function Dashboard() {
  const [employees, setEmployees] = useState([])
  const [attendance, setAttendance] = useState([])
  const [loading, setLoading] = useState(true)
  const [attForm, setAttForm] = useState({ day: 'Mon', count: '' })
  const [showAttForm, setShowAttForm] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [empRes, attRes] = await Promise.all([
        getEmployees(),
        getAttendance()
      ])
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
      await createAttendance({
        day: attForm.day,
        count: parseInt(attForm.count)
      })
      setAttForm({ day: 'Mon', count: '' })
      setShowAttForm(false)
      fetchData()
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) return <p>Loading...</p>

  const totalStaff = employees.length
  const totalDJs = employees.filter(e => e.role === 'DJ').length
  const totalBouncers = employees.filter(e => e.role === 'Bouncer').length
  const totalPayroll = employees.reduce((sum, e) => sum + e.hourly_rate * e.hours_worked, 0)

  const hoursData = employees.map(e => ({
    name: e.name.split(' ')[0],
    hours: e.hours_worked
  }))

  const payrollData = employees.map(e => ({
    name: e.name.split(' ')[0],
    pay: parseFloat((e.hourly_rate * e.hours_worked).toFixed(2))
  }))

  return (
    <div className="page">
      <div className="page-header">
        <h2>Dashboard</h2>
      </div>

      {/* Stat Cards */}
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

      {/* Weekly Attendance */}
      <div className="chart-card">
        <div className="page-header">
          <h3>Weekly Attendance</h3>
          <button
            className={`btn ${showAttForm ? 'btn-grey' : 'btn-green'}`}
            onClick={() => setShowAttForm(!showAttForm)}
          >
            {showAttForm ? 'Cancel' : '+ Add'}
          </button>
        </div>

        {showAttForm && (
          <div className="att-form">
            <div>
              <label>Day</label>
              <select
                value={attForm.day}
                onChange={e => setAttForm({ ...attForm, day: e.target.value })}
              >
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

        {attendance.length === 0 ? (
          <p style={{ color: '#888', marginTop: '0.5rem' }}>No attendance data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={attendance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#222" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Charts side by side */}
      <div className="charts-grid">
        <div className="chart-card">
          <h3>Hours Worked per Employee</h3>
          {employees.length === 0 ? (
            <p style={{ color: '#888' }}>No data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={hoursData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="hours" fill="#222" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="chart-card">
          <h3>Payroll Cost per Employee (€)</h3>
          {employees.length === 0 ? (
            <p style={{ color: '#888' }}>No data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={payrollData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="pay" fill="#635bff" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Staff Hours Table */}
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
import { useState, useEffect } from 'react'
import { getEmployees, getAttendance, createAttendance } from '../service/api'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import '../styles/dashboard.css'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const ITEMS_PER_PAGE = 7

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
  const [chartOffset, setChartOffset] = useState(0)
  const [liveTimers, setLiveTimers] = useState({})

  useEffect(() => { fetchData() }, [])
  useEffect(() => { setChartOffset(0) }, [attFilter, startDate, endDate])

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
      const grouped = {}
      attendance.filter(a => {
        if (!a.date) return false
        const d = new Date(a.date)
        return d >= startDate && d <= endDate
      }).forEach(a => {
        grouped[a.date] = (grouped[a.date] || 0) + a.count
      })
      return Object.entries(grouped)
        .sort((a, b) => new Date(a[0]) - new Date(b[0]))
        .map(([date, count]) => ({
          day: new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
          count, date
        }))
    }

    if (attFilter === 'day') {
      const today = now.toISOString().split('T')[0]
      const total = attendance.filter(a => a.date === today).reduce((sum, a) => sum + a.count, 0)
      return total > 0 ? [{ day: 'Today', count: total }] : []
    }

    if (attFilter === 'week') {
      const yearAgo = new Date(now)
      yearAgo.setFullYear(now.getFullYear() - 1)
      const grouped = {}
      attendance.filter(a => a.date && new Date(a.date) >= yearAgo).forEach(a => {
        grouped[a.date] = (grouped[a.date] || 0) + a.count
      })
      return Object.entries(grouped)
        .sort((a, b) => new Date(a[0]) - new Date(b[0]))
        .map(([date, count]) => ({
          day: new Date(date).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' }),
          count, date
        }))
    }

    if (attFilter === 'month') {
      const yearAgo = new Date(now)
      yearAgo.setFullYear(now.getFullYear() - 1)
      const grouped = {}
      attendance.filter(a => a.date && new Date(a.date) >= yearAgo).forEach(a => {
        const d = new Date(a.date)
        const weekNum = Math.ceil(d.getDate() / 7)
        const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}-${weekNum}`
        const label = `W${weekNum} ${d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })}`
        if (!grouped[key]) grouped[key] = { label, count: 0 }
        grouped[key].count += a.count
      })
      return Object.entries(grouped)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([, val]) => ({ day: val.label, count: val.count }))
    }

    if (attFilter === 'year') {
      const yearAgo = new Date(now)
      yearAgo.setFullYear(now.getFullYear() - 1)
      const grouped = {}
      attendance.filter(a => a.date && new Date(a.date) >= yearAgo).forEach(a => {
        const d = new Date(a.date)
        const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`
        const label = d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
        if (!grouped[key]) grouped[key] = { label, count: 0 }
        grouped[key].count += a.count
      })
      return Object.entries(grouped)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([, val]) => ({ day: val.label, count: val.count }))
    }

    return []
  }

  const filteredAttendance = getFilteredAttendance()
  const filteredEmployees = roleFilter === 'All' ? employees : employees.filter(e => e.role === roleFilter)
  const filteredChartData = filteredEmployees.map(e => ({
    name: e.name.split(' ')[0],
    hours: e.hours_worked,
    pay: parseFloat((e.hourly_rate * e.hours_worked).toFixed(2))
  }))

  if (loading) return <div className="no-data">Loading...</div>

  const totalStaff = employees.length
  const totalDJs = employees.filter(e => e.role === 'DJ').length
  const totalBouncers = employees.filter(e => e.role === 'Bouncer').length
  const totalPayroll = employees.reduce((sum, e) => sum + e.hourly_rate * e.hours_worked, 0)

  const total = filteredAttendance.length
  const maxOffset = Math.max(0, total - ITEMS_PER_PAGE)
  const actualOffset = Math.max(0, maxOffset - chartOffset)
  const pageData = filteredAttendance.slice(actualOffset, actualOffset + ITEMS_PER_PAGE)
  const canGoLeft = actualOffset > 0
  const canGoRight = chartOffset > 0

  return (
    <div className="dash-page">
      <div className="dash-title">Dashboard</div>

      <div className="dash-stats">
        <div className="stat-card"><div className="stat-label">Total staff</div><div className="stat-value">{totalStaff}</div></div>
        <div className="stat-card"><div className="stat-label">DJs</div><div className="stat-value">{totalDJs}</div></div>
        <div className="stat-card"><div className="stat-label">Bouncers</div><div className="stat-value">{totalBouncers}</div></div>
        <div className="stat-card"><div className="stat-label">Est. payroll</div><div className="stat-value">€{totalPayroll.toFixed(2)}</div></div>
      </div>

      {/* Attendance */}
      <div className="dash-card">
        <div className="dash-card-header">
          <div>
            <div className="dash-card-title">Attendance</div>
            <div className="dash-card-sub">
              {filteredAttendance.length} records · {startDate ? 'Custom range' : attFilter === 'day' ? 'Today' : attFilter === 'week' ? 'This week' : attFilter === 'month' ? 'This month' : 'This year'}
            </div>
          </div>
          <div className="dash-card-right">
            <div className="filter-group">
              <div className={`filter-item ${attFilter === 'day' && !startDate ? 'active' : ''}`} onClick={() => { setAttFilter('day'); setStartDate(null); setEndDate(null) }}>Today</div>
              <div className={`filter-item ${attFilter === 'week' && !startDate ? 'active' : ''}`} onClick={() => { setAttFilter('week'); setStartDate(null); setEndDate(null) }}>Week</div>
              <div className={`filter-item ${attFilter === 'month' && !startDate ? 'active' : ''}`} onClick={() => { setAttFilter('month'); setStartDate(null); setEndDate(null) }}>Month</div>
              <div className={`filter-item ${attFilter === 'year' && !startDate ? 'active' : ''}`} onClick={() => { setAttFilter('year'); setStartDate(null); setEndDate(null) }}>Year</div>
              <DatePicker
                selectsRange
                startDate={startDate}
                endDate={endDate}
                onChange={([start, end]) => { setStartDate(start); setEndDate(end) }}
                isClearable
                popperPlacement="bottom-end"
                customInput={<div className={`filter-item ${startDate ? 'active' : ''}`}>📅</div>}
              />
            </div>
            <button className={showAttForm ? 'cancel-btn' : 'add-btn'} onClick={() => setShowAttForm(!showAttForm)}>
              {showAttForm ? 'Cancel' : '+ Add'}
            </button>
          </div>
        </div>

        {showAttForm && (
          <div className="add-form">
            <div>
              <label>Day</label>
              <select value={attForm.day} onChange={e => setAttForm({ ...attForm, day: e.target.value })}>
                {DAYS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label>Guest count</label>
              <input type="number" value={attForm.count} onChange={e => setAttForm({ ...attForm, count: e.target.value })} placeholder="e.g. 250" />
            </div>
            <button className="save-btn" onClick={handleAttendance}>Save</button>
          </div>
        )}

        {filteredAttendance.length === 0 ? (
          <div className="no-data">No data for this period.</div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={pageData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#aaa' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#aaa' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 6, border: '1px solid #ebebeb', boxShadow: 'none', fontSize: 11 }} />
                <Bar dataKey="count" fill="#111" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="chart-footer">
              <span className="chart-footer-info">{actualOffset + 1}–{Math.min(actualOffset + ITEMS_PER_PAGE, total)} of {total}</span>
              <div className="nav-btns">
                <div className={`nav-btn ${!canGoLeft ? 'disabled' : ''}`} onClick={() => canGoLeft && setChartOffset(prev => prev + ITEMS_PER_PAGE)}>←</div>
                <div className={`nav-btn ${!canGoRight ? 'disabled' : ''}`} onClick={() => canGoRight && setChartOffset(prev => Math.max(0, prev - ITEMS_PER_PAGE))}>→</div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Staff Overview */}
      <div className="dash-card">
        <div className="dash-card-header">
          <div>
            <div className="dash-card-title">Staff overview</div>
            <div className="dash-card-sub">Hours and payroll per employee</div>
          </div>
          <div className="dash-card-right">
            <div className="filter-group">
              <div className={`filter-item ${chartType === 'hours' ? 'active' : ''}`} onClick={() => setChartType('hours')}>Hours</div>
              <div className={`filter-item ${chartType === 'pay' ? 'active' : ''}`} onClick={() => setChartType('pay')}>Payroll</div>
            </div>
            <div className="filter-divider" />
            <div className="filter-group">
              {['All', 'Bartender', 'DJ', 'Bouncer', 'Staff'].map(role => (
                <div key={role} className={`filter-item ${roleFilter === role ? 'active' : ''}`} onClick={() => setRoleFilter(role)}>{role}</div>
              ))}
            </div>
          </div>
        </div>

        {filteredChartData.length === 0 ? (
          <div className="no-data">No data for this filter.</div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={filteredChartData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#aaa' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#aaa' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 6, border: '1px solid #ebebeb', boxShadow: 'none', fontSize: 11 }} />
              <Bar dataKey={chartType === 'hours' ? 'hours' : 'pay'} fill="#555" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Staff Hours Table */}
      <div className="dash-table-card">
        <div className="dash-table-card-header">Staff hours this week</div>
        <table className="dash-table">
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
              <tr><td colSpan={4} className="no-data">No staff data.</td></tr>
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
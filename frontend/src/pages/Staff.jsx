import { useState, useEffect } from 'react'
import {
  getEmployees, createEmployee, deleteEmployee, updateEmployee,
  createCheckoutSession, registerUser, getAllClockSummary,
  getPayments, forceClockOut, resetTodayHours, getActiveClockins
} from '../service/api'
import '../styles/staff.css'

function Staff() {
  const [employees, setEmployees] = useState([])
  const [clockSummary, setClockSummary] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [payments, setPayments] = useState([])
  const [liveTimers, setLiveTimers] = useState({})
  const [form, setForm] = useState({
    name: '', role: 'Bartender', contract: 'full-time',
    hourly_rate: '', hours_worked: '', email: '', password: ''
  })

  useEffect(() => { fetchEmployees() }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveTimers(prev => {
        const next = { ...prev }
        const now = new Date()
        Object.keys(next).forEach(id => {
          const start = next[id].start
          const diff = Math.floor((now - start) / 1000)
          const h = String(Math.floor(diff / 3600)).padStart(2, '0')
          const m = String(Math.floor((diff % 3600) / 60)).padStart(2, '0')
          const s = String(diff % 60).padStart(2, '0')
          next[id] = { ...next[id], display: `${h}:${m}:${s}` }
        })
        return next
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const fetchEmployees = async () => {
    try {
      const [empRes, summaryRes, payRes, activeRes] = await Promise.all([
        getEmployees(), getAllClockSummary(), getPayments(), getActiveClockins()
      ])
      setEmployees(empRes.data)
      setClockSummary(summaryRes.data)
      setPayments(payRes.data)

      const timers = {}
      activeRes.data.forEach(record => {
        const clockInDate = new Date()
        const [h, m, s] = record.clock_in.split(':')
        clockInDate.setHours(parseInt(h), parseInt(m), parseInt(s), 0)
        timers[record.employee_id] = {
          start: clockInDate,
          display: '00:00:00'
        }
      })
      setLiveTimers(timers)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getRealHours = (name) => {
    const found = clockSummary.find(s => s.employee_name.toLowerCase() === name.toLowerCase())
    return found ? found.total_hours : 0
  }

  const getRealPay = (emp) => {
    const hours = getRealHours(emp.name)
    const base = hours * emp.hourly_rate
    if (emp.contract === 'full-time') return (base * 1.1).toFixed(2)
    if (emp.contract === 'part-time') return base.toFixed(2)
    if (emp.contract === 'freelance') return (base * 0.8).toFixed(2)
    return base.toFixed(2)
  }

  const handleAdd = async () => {
    if (!editingId && (!form.name || !form.hourly_rate || !form.hours_worked || !form.email || !form.password)) {
      alert('Please fill in all fields')
      return
    }
    if (editingId && (!form.name || !form.hourly_rate || !form.hours_worked)) {
      alert('Please fill in all fields')
      return
    }
    try {
      if (editingId) {
        await updateEmployee(editingId, {
          name: form.name, role: form.role, contract: form.contract,
          hourly_rate: parseFloat(form.hourly_rate),
          hours_worked: parseFloat(form.hours_worked)
        })
        setEditingId(null)
      } else {
        await createEmployee({
          name: form.name, role: form.role, contract: form.contract,
          hourly_rate: parseFloat(form.hourly_rate),
          hours_worked: parseFloat(form.hours_worked)
        })
        await registerUser({ email: form.email, password: form.password, name: form.name })
      }
      setForm({ name: '', role: 'Bartender', contract: 'full-time', hourly_rate: '', hours_worked: '', email: '', password: '' })
      setShowForm(false)
      fetchEmployees()
    } catch (err) {
      alert(err.response?.data?.detail || 'Error creating employee')
    }
  }

  const getNextMonday = () => {
    const today = new Date()
    const day = today.getDay()
    const daysUntilMonday = day === 1 ? 7 : (8 - day) % 7
    const nextMonday = new Date(today)
    nextMonday.setDate(today.getDate() + daysUntilMonday)
    return nextMonday.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const handleEdit = (emp) => {
    setEditingId(emp.id)
    setForm({ name: emp.name, role: emp.role, contract: emp.contract, hourly_rate: emp.hourly_rate, hours_worked: emp.hours_worked, email: '', password: '' })
    setShowForm(true)
  }

  const handlePay = async (emp) => {
    const realPay = parseFloat(getRealPay(emp))
    if (realPay === 0) { alert('No clock-in hours recorded yet'); return }

    const today = new Date()
    const dayOfWeek = today.getDay()
    const monday = new Date(today)
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
    monday.setHours(0, 0, 0, 0)

    const alreadyPaid = payments.find(p => {
      if (p.employee_name.toLowerCase() !== emp.name.toLowerCase()) return false
      const parts = p.paid_at.split(',')[0].split('/')
      const paidDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`)
      return paidDate >= monday
    })

    if (alreadyPaid) {
      const ok = window.confirm(`Warning: ${emp.name} was already paid €${alreadyPaid.amount.toFixed(2)} this week. Pay again?`)
      if (!ok) return
    }

    try {
      const res = await createCheckoutSession({
        amount: realPay, description: `Salary for ${emp.name}`,
        employee_name: emp.name, employee_role: emp.role,
        contract: emp.contract, employee_id: emp.id
      })
      window.location.href = res.data.url
    } catch (err) {
      alert('Payment error')
    }
  }

  const handleForceClockOut = async (emp) => {
    if (!window.confirm(`Force clock out ${emp.name}?`)) return
    try {
      await forceClockOut(emp.id)
      alert(`${emp.name} has been clocked out`)
      fetchEmployees()
    } catch (err) {
      alert(err.response?.data?.detail || 'Employee is not clocked in')
    }
  }

  const handleResetHours = async (emp) => {
    if (!window.confirm(`Remove today's clock hours for ${emp.name}?`)) return
    try {
      await resetTodayHours(emp.id)
      alert(`Today's hours for ${emp.name} have been removed`)
      fetchEmployees()
    } catch (err) {
      alert(err.response?.data?.detail || 'No clock record found for today')
    }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Fire ${name}?`)) return
    try {
      await deleteEmployee(id)
      fetchEmployees()
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) return <div className="staff-no-data">Loading...</div>

  return (
    <div className="staff-page">
      <div className="staff-header">
        <div className="staff-title">Staff</div>
        <button
          className={showForm ? 'staff-cancel-btn' : 'staff-hire-btn'}
          onClick={() => {
            setShowForm(!showForm)
            setEditingId(null)
            setForm({ name: '', role: 'Bartender', contract: 'full-time', hourly_rate: '', hours_worked: '', email: '', password: '' })
          }}
        >
          {showForm ? 'Cancel' : '+ Hire'}
        </button>
      </div>

      {showForm && (
        <div className="staff-form">
          <div className="staff-form-title">{editingId ? 'Edit employee' : 'New employee'}</div>
          <div className="staff-form-grid">
            <div className="staff-form-group">
              <label>Full name</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Marcus Dupont" />
            </div>
            {!editingId && (
              <>
                <div className="staff-form-group">
                  <label>Login email</label>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="e.g. marcus@club.com" />
                </div>
                <div className="staff-form-group">
                  <label>Login password</label>
                  <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="e.g. marcus123" />
                </div>
              </>
            )}
            <div className="staff-form-group">
              <label>Role</label>
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                <option>Bartender</option>
                <option>DJ</option>
                <option>Bouncer</option>
                <option>Staff</option>
              </select>
            </div>
            <div className="staff-form-group">
              <label>Contract</label>
              <select value={form.contract} onChange={e => setForm({ ...form, contract: e.target.value })}>
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="freelance">Freelance</option>
              </select>
            </div>
            <div className="staff-form-group">
              <label>Hourly rate (€)</label>
              <input type="number" value={form.hourly_rate} onChange={e => setForm({ ...form, hourly_rate: e.target.value })} placeholder="e.g. 15" />
            </div>
            <div className="staff-form-group">
              <label>Hours worked</label>
              <input type="number" value={form.hours_worked} onChange={e => setForm({ ...form, hours_worked: e.target.value })} placeholder="e.g. 35" />
            </div>
          </div>
          <div className="staff-form-actions">
            <button className="staff-save-btn" onClick={handleAdd}>
              {editingId ? 'Save changes' : 'Confirm hire'}
            </button>
          </div>
        </div>
      )}

      <div className="staff-table-card">
        <table className="staff-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Contract</th>
              <th>Rate</th>
              <th>Session</th>
              <th>Real hours</th>
              <th>Real pay</th>
              <th>Next payment</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 ? (
              <tr><td colSpan="9" className="staff-no-data">No employees yet.</td></tr>
            ) : (
              employees.map(emp => (
                <tr key={emp.id}>
                  <td>{emp.name}</td>
                  <td><span className="role-tag">{emp.role}</span></td>
                  <td style={{ textTransform: 'capitalize' }}>{emp.contract}</td>
                  <td>€{emp.hourly_rate}/hr</td>
                  <td>
                    {liveTimers[emp.id] ? (
                      <span style={{ fontSize: 12, color: '#2e7d32', fontWeight: 500, fontFamily: 'monospace' }}>
                         {liveTimers[emp.id].display}
                      </span>
                    ) : (
                      <span style={{ fontSize: 12, color: '#aaa' }}>—</span>
                    )}
                  </td>
                  <td>{getRealHours(emp.name)}h</td>
                  <td>€{getRealPay(emp)}</td>
                  <td>{getNextMonday()}</td>
                  <td>
                    <div className="staff-actions">
                      <button className="btn-edit" onClick={() => handleEdit(emp)}>Edit</button>
                      <button className="btn-pay" onClick={() => handlePay(emp)}>Pay</button>
                      <button className="btn-stop" onClick={() => handleForceClockOut(emp)}>Stop clock</button>
                      <button className="btn-reset" onClick={() => handleResetHours(emp)}>Reset</button>
                      <button className="btn-fire" onClick={() => handleDelete(emp.id, emp.name)}>Fire</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Staff
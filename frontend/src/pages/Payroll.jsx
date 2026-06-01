import { useState, useEffect } from 'react'
import { getEmployees, createCheckoutSession } from '../service/api'
import '../styles/payroll.css'

function Payroll() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    try {
      const res = await getEmployees()
      setEmployees(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const calculatePay = (emp) => {
    const base = emp.hourly_rate * emp.hours_worked
    if (emp.contract === 'full-time') return base * 1.10
    if (emp.contract === 'part-time') return base
    if (emp.contract === 'freelance') return base * 0.80
    return base
  }

  const totalPayroll = employees.reduce((sum, emp) => sum + calculatePay(emp), 0)
  const totalHours = employees.reduce((sum, e) => sum + e.hours_worked, 0)

  const handlePayroll = async () => {
    if (employees.length === 0) return
    try {
      const res = await createCheckoutSession({
        amount: totalPayroll,
        description: `Yoyo's Club Weekly Payroll - ${employees.length} employees`
      })
      window.location.href = res.data.url
    } catch (err) {
      console.error(err)
      alert('Payment error. Check Stripe keys.')
    }
  }

  if (loading) return <p>Loading...</p>

  return (
    <div className="page">

      <div className="page-header">
        <h2>Payroll</h2>
        <button className="btn btn-purple" onClick={handlePayroll}>
          Pay Total via Stripe
        </button>
      </div>

      <div className="payroll-stats-grid">
        <div className="stat-card">
          <p>Total Employees</p>
          <p>{employees.length}</p>
        </div>
        <div className="stat-card">
          <p>Total Hours This Week</p>
          <p>{totalHours}h</p>
        </div>
        <div className="stat-card">
          <p>Total Payroll</p>
          <p>€{totalPayroll.toFixed(2)}</p>
        </div>
      </div>

      <div className="rules-card">
        <h3>Salary Calculation Rules</h3>
        <div className="rules-grid">
          <div className="rule-item">
            <p>Full-time</p>
            <p>Hours × Rate + 10% bonus</p>
          </div>
          <div className="rule-item">
            <p>Part-time</p>
            <p>Hours × Rate (standard)</p>
          </div>
          <div className="rule-item">
            <p>Freelance</p>
            <p>Hours × Rate − 20% tax</p>
          </div>
        </div>
      </div>

      <div className="payroll-table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Contract</th>
              <th>Hours</th>
              <th>Rate</th>
              <th>Base Pay</th>
              <th>Final Pay</th>
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', color: '#888' }}>
                  No employees found.
                </td>
              </tr>
            ) : (
              employees.map(emp => {
                const base = emp.hourly_rate * emp.hours_worked
                const final = calculatePay(emp)
                return (
                  <tr key={emp.id}>
                    <td>{emp.name}</td>
                    <td>{emp.role}</td>
                    <td style={{ textTransform: 'capitalize' }}>{emp.contract}</td>
                    <td>{emp.hours_worked}h</td>
                    <td>€{emp.hourly_rate}/hr</td>
                    <td>€{base.toFixed(2)}</td>
                    <td><strong>€{final.toFixed(2)}</strong></td>
                  </tr>
                )
              })
            )}
          </tbody>
          {employees.length > 0 && (
            <tfoot>
              <tr>
                <td colSpan="6">Total</td>
                <td>€{totalPayroll.toFixed(2)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

    </div>
  )
}

export default Payroll
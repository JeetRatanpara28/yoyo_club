import { useState, useEffect } from 'react'
import { getPayments, addPayment, resetClockHours } from '../service/api'
import { useLocation } from 'react-router-dom'
import '../styles/payroll.css'

function Payroll() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const location = useLocation()

  useEffect(() => {
    checkPaymentSuccess()
    fetchPayments()
  }, [])

  const checkPaymentSuccess = async () => {
    const params = new URLSearchParams(location.search)
    if (params.get('payment') === 'success') {
      const name = params.get('name')
      const role = params.get('role')
      const contract = params.get('contract')
      const amount = parseFloat(params.get('amount'))
      const employeeId = params.get('employee_id')
      const now = new Date().toLocaleString()
      if (name) {
        await addPayment({ employee_name: name, employee_role: role, contract, amount, paid_at: now })
        if (employeeId && employeeId !== '0') {
          await resetClockHours(parseInt(employeeId))
        }
        fetchPayments()
      }
      window.history.replaceState({}, '', '/payroll')
    }
  }

  const fetchPayments = async () => {
    try {
      const res = await getPayments()
      setPayments(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
  const uniqueEmployees = [...new Set(payments.map(p => p.employee_name))].length
  const thisWeek = () => {
    const now = new Date()
    const day = now.getDay()
    const monday = new Date(now)
    monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1))
    monday.setHours(0, 0, 0, 0)
    return payments.filter(p => {
      const parts = p.paid_at.split(',')[0].split('/')
      const paidDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`)
      return paidDate >= monday
    }).reduce((sum, p) => sum + p.amount, 0)
  }

  if (loading) return <div className="payroll-no-data">Loading...</div>

  return (
    <div className="payroll-page">

      <div className="payroll-header">
        <div className="payroll-title">Payroll history</div>
      </div>

      <div className="payroll-summary">
        <div className="payroll-stat">
          <div className="payroll-stat-label">Total paid all time</div>
          <div className="payroll-stat-value">€{totalPaid.toFixed(2)}</div>
        </div>
        <div className="payroll-stat">
          <div className="payroll-stat-label">Paid this week</div>
          <div className="payroll-stat-value">€{thisWeek().toFixed(2)}</div>
        </div>
        <div className="payroll-stat">
          <div className="payroll-stat-label">Employees paid</div>
          <div className="payroll-stat-value">{uniqueEmployees}</div>
        </div>
      </div>

      <div className="payroll-table-card">
        <div className="payroll-table-header">Payment records</div>
        <table className="payroll-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Role</th>
              <th>Contract</th>
              <th>Amount</th>
              <th>Paid at</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan="5" className="payroll-no-data">No payments yet.</td>
              </tr>
            ) : (
              payments.map(p => (
                <tr key={p.id}>
                  <td>{p.employee_name}</td>
                  <td><span className="payroll-role-tag">{p.employee_role}</span></td>
                  <td style={{ textTransform: 'capitalize' }}>{p.contract}</td>
                  <td className="payroll-amount">€{p.amount.toFixed(2)}</td>
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

export default Payroll
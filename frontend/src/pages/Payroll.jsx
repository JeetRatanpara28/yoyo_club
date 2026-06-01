import { useState, useEffect } from 'react'
import { getPayments, addPayment } from '../service/api'
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
      const now = new Date().toLocaleString()
      if (name) {
        await addPayment({
          employee_name: name,
          employee_role: role,
          contract: contract,
          amount: amount,
          paid_at: now
        })
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

  if (loading) return <p>Loading...</p>

  return (
    <div className="page">
      <div className="page-header">
        <h2>Payroll History</h2>
      </div>

      <div className="payroll-table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Role</th>
              <th>Contract</th>
              <th>Amount Paid</th>
              <th>Paid At</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', color: '#888' }}>
                  No payments yet.
                </td>
              </tr>
            ) : (
              payments.map(p => (
                <tr key={p.id}>
                  <td>{p.employee_name}</td>
                  <td>{p.employee_role}</td>
                  <td style={{ textTransform: 'capitalize' }}>{p.contract}</td>
                  <td>€{p.amount.toFixed(2)}</td>
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
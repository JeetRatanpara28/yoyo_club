import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginUser } from '../service/api'
import { jwtDecode } from 'jwt-decode'
import '../styles/login.css'

function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async () => {
    setError('')
    if (!form.email || !form.password) {
      setError('Please fill in all fields')
      return
    }
    try {
      const res = await loginUser({ email: form.email, password: form.password })
      const decoded = jwtDecode(res.data.access_token)
      localStorage.setItem('token', res.data.access_token)
      localStorage.setItem('role', res.data.role)
      localStorage.setItem('name', res.data.name || '')
      localStorage.setItem('userId', decoded.id)
      navigate(res.data.role === 'admin' ? '/' : '/employee')
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password')
    }
  }

  return (
    <div className="login-page">
      <div className="login-box">
        <h2>Yoyo's Club</h2>
        <p style={{ textAlign: 'center', fontSize: '0.82rem', color: '#888', marginBottom: '1.5rem' }}>
          Staff access only
        </p>
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            placeholder="email@example.com"
          />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            placeholder="••••••••"
          />
        </div>
        {error && <p className="error-msg">{error}</p>}
        <button className="login-btn" onClick={handleSubmit}>Login</button>
        <p style={{ textAlign: 'center', fontSize: '0.78rem', color: '#aaa', marginTop: '1.5rem' }}>
          No account? Contact Yoyo to get access.
        </p>
      </div>
    </div>
  )
}

export default Login

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginUser } from '../service/api'
import { jwtDecode } from 'jwt-decode'
import {
  Box, Card, CardContent, TextField,
  Button, Typography, Alert
} from '@mui/material'

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
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
      <Card sx={{ width: 360, boxShadow: 2 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" fontWeight={700} textAlign="center" mb={0.5}>
            Yoyo's Club
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center" mb={3}>
            Staff access only
          </Typography>

          <TextField
            fullWidth
            label="Email"
            type="email"
            size="small"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            size="small"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            sx={{ mb: 2 }}
          />

          {error && <Alert severity="error" sx={{ mb: 2, py: 0 }}>{error}</Alert>}

          <Button fullWidth variant="contained" onClick={handleSubmit}
            sx={{ backgroundColor: '#1a1a2e', '&:hover': { backgroundColor: '#2d2d4e' } }}>
            Login
          </Button>

          <Typography variant="caption" color="text.secondary" textAlign="center" display="block" mt={2}>
            No account? Contact Yoyo to get access.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}

export default Login
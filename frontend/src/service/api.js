import axios from 'axios'

const API = axios.create({
  baseURL: 'http://localhost:8001'
})

export const getEmployees = () => API.get('/employees/')
export const createEmployee = (data) => API.post('/employees/', data)
export const deleteEmployee = (id) => API.delete(`/employees/${id}`)
export const updateEmployee = (id, data) => API.put(`/employees/${id}`, data)
export const getAttendance = () => API.get('/attendance/')
export const createAttendance = (data) => API.post('/attendance/', data)
export const createCheckoutSession = (data) => API.post('/payments/create-checkout-session', data)
export const getTickets = () => API.get('/tickets/')
export const createTicket = (data) => API.post('/tickets/', data)
export const sellTickets = (id, data) => API.post(`/tickets/${id}/sell`, data)
export const deleteTicket = (id) => API.delete(`/tickets/${id}`)
export const loginUser = (data) => API.post('/auth/login', data)
export const registerUser = (data) => API.post('/auth/register', data)
export const getPayments = () => API.get('/payroll/')
export const addPayment = (data) => API.post('/payroll/', data)
export const clockIn = (data) => API.post('/clockin/in', data)
export const clockOut = (data) => API.post('/clockin/out', data)
export const getClockIns = (employeeId) => API.get(`/clockin/${employeeId}`)
export const getClockSummary = (employeeId) => API.get(`/clockin/summary/${employeeId}`)
export const getAllClockSummary = () => API.get('/clockin/all-summary')
export const forceClockOut = (employeeId) => API.post(`/clockin/force-out/${employeeId}`)
export const resetClockHours = (employeeId) => API.delete(`/clockin/reset/${employeeId}`)
export const resetTodayHours = (employeeId) => API.delete(`/clockin/reset-today/${employeeId}`)
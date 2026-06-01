import axios from 'axios'

const API = axios.create({
  baseURL: 'http://localhost:8001'
})

export const getEmployees = () => API.get('/employees/')
export const createEmployee = (data) => API.post('/employees/', data)
export const deleteEmployee = (id) => API.delete(`/employees/${id}`)
export const getAttendance = () => API.get('/attendance/')
export const createCheckoutSession = (data) => API.post('/payments/create-checkout-session', data)
export const createAttendance = (data) => API.post('/attendance/', data)
export const getTickets = () => API.get('/tickets/')
export const createTicket = (data) => API.post('/tickets/', data)
export const sellTickets = (id, data) => API.post(`/tickets/${id}/sell`, data)
export const deleteTicket = (id) => API.delete(`/tickets/${id}`)
export const loginUser = (data) => API.post('/auth/login', data)
export const registerUser = (data) => API.post('/auth/register', data)
export const updateEmployee = (id, data) => API.put(`/employees/${id}`, data)
export const createCheckoutSessionSingle = (data) => API.post('/payments/create-checkout-session', data)
export const getPayments = () => API.get('/payroll/')
export const addPayment = (data) => API.post('/payroll/', data)

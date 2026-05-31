import axios from 'axios'

const API = axios.create({
  baseURL: 'http://localhost:8001'
})

export const getEmployees = () => API.get('/employees/')
export const createEmployee = (data) => API.post('/employees/', data)
export const deleteEmployee = (id) => API.delete(`/employees/${id}`)
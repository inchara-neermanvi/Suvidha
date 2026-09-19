const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

async function request(path, options = {}) {
  const token = localStorage.getItem('suvidha_token')
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
  })
  const data = await response.json().catch(() => ({ message: `Server returned ${response.status}` }))
  if (!response.ok) throw new Error(data.message || 'Request failed')
  return data
}

export const api = {
  login: credentials => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  ownerRegister: details => request('/auth/owner/register', { method: 'POST', body: JSON.stringify(details) }),
  ownerLogin: credentials => request('/auth/owner/login', { method: 'POST', body: JSON.stringify(credentials) }),
  residentLogin: credentials => request('/auth/resident/login', { method: 'POST', body: JSON.stringify(credentials) }),
  staffLogin: credentials => request('/auth/staff/login', { method: 'POST', body: JSON.stringify(credentials) }),
  residentRegister: details => request('/auth/resident/register', { method: 'POST', body: JSON.stringify(details) }),
  staffRegister: details => request('/auth/staff/register', { method: 'POST', body: JSON.stringify(details) }),
  register: details => request('/auth/register', { method: 'POST', body: JSON.stringify(details) }),
  me: () => request('/auth/me'),
  complaints: () => request('/complaints'),
  createComplaint: details => request('/complaints', { method: 'POST', body: JSON.stringify(details) }),
  updateComplaint: (id, details) => request(`/complaints/${id}`, { method: 'PATCH', body: JSON.stringify(details) }),
  addComplaintUpdate: (id, text) => request(`/complaints/${id}/updates`, { method: 'POST', body: JSON.stringify({ text }) }),
  properties: () => request('/properties'),
  createProperty: details => request('/properties', { method: 'POST', body: JSON.stringify(details) }),
  propertySummary: id => request(`/properties/${id}/summary`),
  apartments: () => request('/apartments'),
  createApartment: details => request('/apartments', { method: 'POST', body: JSON.stringify(details) }),
  updateApartment: (id, details) => request(`/apartments/${id}`, { method: 'PUT', body: JSON.stringify(details) }),
  assignResident: (id, details) => request(`/apartments/${id}/assign`, { method: 'POST', body: JSON.stringify(details) }),
  residents: () => request('/residents'),
  createResident: details => request('/residents', { method: 'POST', body: JSON.stringify(details) }),
  invoices: () => request('/invoices'),
  generateInvoices: details => request('/invoices/generate', { method: 'POST', body: JSON.stringify(details) }),
  payments: () => request('/payments/history'),
  createPaymentOrder: invoiceId => request('/payments/create', { method: 'POST', body: JSON.stringify({ invoiceId }) }),
  verifyTestPayment: orderId => request('/payments/verify', { method: 'POST', body: JSON.stringify({ orderId, testConfirmation: 'NIVASA_TEST_PAYMENT' }) }),
  notifications: () => request('/notifications'),
  readNotification: id => request(`/notifications/${id}/read`, { method: 'PUT' }),
  serviceProviders: params => request(`/service-providers${params ? `?${new URLSearchParams(params)}` : ''}`),
  createServiceProvider: details => request('/service-providers', { method: 'POST', body: JSON.stringify(details) }),
  updateServiceProvider: (id, details) => request(`/service-providers/${id}`, { method: 'PUT', body: JSON.stringify(details) }),
  deleteServiceProvider: id => request(`/service-providers/${id}`, { method: 'DELETE' }),
  reportServiceProvider: (id, reason) => request(`/service-providers/${id}/report`, { method: 'POST', body: JSON.stringify({ reason }) }),
}

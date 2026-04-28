// src/utils/api.js
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

// Request interceptor - attach access token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, (error) => Promise.reject(error));

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && error.response?.data?.code === 'TOKEN_EXPIRED' && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const { data } = await axios.post(`${API_BASE}/auth/refresh-token`, { refreshToken });
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth
export const authAPI = {
  adminLogin: (data) => api.post('/auth/admin/login', data),
  agentLogin: (data) => api.post('/auth/agent/login', data),
  agentRegister: (data) => api.post('/auth/agent/register', data),
  logout: (refreshToken) => api.post('/auth/logout', { refreshToken }),
  refreshToken: (refreshToken) => api.post('/auth/refresh-token', { refreshToken }),
};

// Admin
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
};

// Agents
export const agentsAPI = {
  getAll: (params) => api.get('/agents', { params }),
  getById: (id) => api.get(`/agents/${id}`),
  update: (id, data) => api.put(`/agents/${id}`, data),
  delete: (id) => api.delete(`/agents/${id}`),
  getPerformance: (id) => api.get(`/agents/${id}/performance`),
  getEarnings: (id) => api.get(`/agents/${id}/earnings`),
  getActivity: (id) => api.get(`/agents/${id}/activity`),
};

// Merchants
export const merchantsAPI = {
  create: (data) => api.post('/merchants', data),
  getAll: (params) => api.get('/merchants', { params }),
  getById: (id) => api.get(`/merchants/${id}`),
  update: (id, data) => api.put(`/merchants/${id}`, data),
  delete: (id) => api.delete(`/merchants/${id}`),
  approve: (id) => api.patch(`/merchants/${id}/approve`),
  reject: (id, reason) => api.patch(`/merchants/${id}/reject`, { reason }),
};

// QR
export const qrAPI = {
  generate: (merchantId) => api.post(`/qr/generate/${merchantId}`),
  get: (merchantId) => api.get(`/qr/${merchantId}`),
  getSticker: (merchantId) => api.get(`/qr/sticker/${merchantId}`),
  regenerate: (merchantId) => api.post(`/qr/regenerate/${merchantId}`),
  // downloadUrl: (merchantId) => `${API_BASE}/qr/download/${merchantId}`,
  download: (merchantId) =>
  api.get(`/qr/download/${merchantId}`, { responseType: 'blob' }),
};

// Payment
export const paymentAPI = {
  getMerchantInfo: (merchantId) => api.get(`/merchants?merchantId=${merchantId}`),
  initiate: (data) => api.post('/payment/initiate', data),
};

// Transactions
export const transactionsAPI = {
  getAll: (params) => api.get('/transactions', { params }),
  getById: (id) => api.get(`/transactions/${id}`),
  getSummary: () => api.get('/transactions/summary'),
  exportCSV: () => `${API_BASE}/transactions/export`,
};

// Commission
export const commissionAPI = {
  getAll: () => api.get('/commission'),
  getByAgent: (agentId) => api.get(`/commission/agent/${agentId}`),
  getByMerchant: (merchantId) => api.get(`/commission/merchant/${merchantId}`),
};

// Analytics
export const analyticsAPI = {
  getOverview: () => api.get('/analytics/overview'),
  getRevenue: (period) => api.get('/analytics/revenue', { params: { period } }),
  getTransactions: () => api.get('/analytics/transactions'),
  getTopMerchants: () => api.get('/analytics/top-merchants'),
  getAgentPerformance: () => api.get('/analytics/agent-performance'),
};

// Notifications
export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  markRead: (id) => api.patch(`/notifications/read/${id}`),
};

// Settings
export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
};

// Logs
export const logsAPI = {
  getAll: (params) => api.get('/logs', { params }),
  getPayments: () => api.get('/logs/payments'),
  getErrors: () => api.get('/logs/errors'),
};

// Upload
export const uploadAPI = {
  uploadIdCard: (formData) => api.post('/upload/id-card', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  uploadLogo: (formData) => api.post('/upload/logo', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};
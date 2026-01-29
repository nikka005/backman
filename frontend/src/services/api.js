import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Create axios instance with default config
const api = axios.create({
  baseURL: API,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API}/auth/refresh`, {
            refresh_token: refreshToken,
          });
          
          const { access_token, refresh_token } = response.data;
          localStorage.setItem('accessToken', access_token);
          localStorage.setItem('refreshToken', refresh_token);
          
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed, logout user
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  refresh: (refreshToken) => api.post('/auth/refresh', { refresh_token: refreshToken }),
  verifyEmail: (token) => api.post('/auth/verify-email', { token }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
  getMe: () => api.get('/auth/me'),
  updateMe: (data) => api.put('/auth/me', data),
};

// Instagram API
export const instagramAPI = {
  connect: (data) => api.post('/instagram/connect', data),
  getAccount: () => api.get('/instagram/account'),
  updateAccount: (data) => api.put('/instagram/account', data),
  disconnect: () => api.delete('/instagram/account'),
  getStats: () => api.get('/instagram/stats'),
  getTargeting: () => api.get('/instagram/targeting'),
  updateTargeting: (data) => api.put('/instagram/targeting', data),
  getLogs: (params) => api.get('/instagram/logs', { params }),
};

// Subscription API
export const subscriptionAPI = {
  getPlans: () => api.get('/subscriptions/plans'),
  getCurrent: () => api.get('/subscriptions/current'),
  subscribe: (data) => api.post('/subscriptions/subscribe', data),
  cancel: () => api.post('/subscriptions/cancel'),
  getPaymentHistory: (limit = 20) => api.get('/subscriptions/payments', { params: { limit } }),
};

// Tickets API
export const ticketsAPI = {
  create: (data) => api.post('/tickets/', data),
  getAll: (statusFilter) => api.get('/tickets/', { params: { status_filter: statusFilter } }),
  get: (ticketId) => api.get(`/tickets/${ticketId}`),
  reply: (ticketId, message) => api.post(`/tickets/${ticketId}/reply`, { message }),
  close: (ticketId) => api.post(`/tickets/${ticketId}/close`),
};

// Notifications API
export const notificationsAPI = {
  getAll: (unreadOnly = false) => api.get('/notifications/', { params: { unread_only: unreadOnly } }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (notificationId) => api.post(`/notifications/${notificationId}/read`),
  markAllAsRead: () => api.post('/notifications/read-all'),
};

// Public API (no auth required)
export const publicAPI = {
  getStats: () => api.get('/public/stats'),
  getTestimonials: () => api.get('/public/testimonials'),
  getFaqs: () => api.get('/public/faqs'),
  getPlans: () => api.get('/public/plans'),
  getReviews: () => api.get('/public/reviews'),
};

// Admin API
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  getUser: (userId) => api.get(`/admin/users/${userId}`),
  updateUser: (userId, data) => api.put(`/admin/users/${userId}`, data),
  suspendUser: (userId) => api.post(`/admin/users/${userId}/suspend`),
  activateUser: (userId) => api.post(`/admin/users/${userId}/activate`),
  getSubscriptions: (params) => api.get('/admin/subscriptions', { params }),
  changePlan: (userId, newPlan) => api.post(`/admin/subscriptions/${userId}/change-plan`, null, { params: { new_plan: newPlan } }),
  getPayments: (params) => api.get('/admin/payments', { params }),
  processRefund: (paymentId, amount, reason) => api.post(`/admin/payments/${paymentId}/refund`, null, { params: { amount, reason } }),
  getInstagramAccounts: (params) => api.get('/admin/instagram-accounts', { params }),
  updateGrowth: (accountId, data) => api.post(`/admin/instagram-accounts/${accountId}/update-growth`, null, { params: data }),
  getTickets: (params) => api.get('/admin/tickets', { params }),
  updateTicket: (ticketId, data) => api.put(`/admin/tickets/${ticketId}`, data),
  broadcastNotification: (data) => api.post('/admin/notifications/broadcast', data),
  getCmsContent: (key) => api.get(`/admin/cms/${key}`),
  updateCmsContent: (key, data) => api.put(`/admin/cms/${key}`, data),
  getLogs: (params) => api.get('/admin/logs', { params }),
};

export default api;

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
  // 2FA
  get2faStatus: () => api.get('/auth/2fa/status'),
  setup2fa: () => api.post('/auth/2fa/setup'),
  verify2fa: (code) => api.post('/auth/2fa/verify', { code }),
  disable2fa: (code) => api.post('/auth/2fa/disable', { code }),
  regenerateBackupCodes: (code) => api.post('/auth/2fa/regenerate-backup-codes', { code }),
  validate2fa: (code) => api.post('/auth/2fa/validate', { code }),
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
  getSettings: () => api.get('/public/settings'),
  getBranding: () => api.get('/public/branding'),
  getUI: () => api.get('/public/ui'),
  getFeatures: () => api.get('/public/features'),
  getHero: () => api.get('/public/hero'),
  getPromoBanner: () => api.get('/public/promo-banner'),
  getStats: () => api.get('/public/stats'),
  getTestimonials: () => api.get('/public/testimonials'),
  getFaqs: () => api.get('/public/faqs'),
  getPlans: () => api.get('/public/plans'),
  getReviews: () => api.get('/public/reviews'),
  getFeatureMatrix: () => api.get('/public/feature-matrix'),
};

// Payment API
export const paymentAPI = {
  createCheckoutSession: (packageId, originUrl) => 
    api.post('/payments/checkout/session', null, { params: { package_id: packageId, origin_url: originUrl } }),
  getCheckoutStatus: (sessionId) => api.get(`/payments/checkout/status/${sessionId}`),
  getPaymentHistory: () => api.get('/payments/history'),
  getCurrentSubscription: () => api.get('/payments/subscription'),
  cancelSubscription: () => api.post('/payments/subscription/cancel'),
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
  cancelSubscription: (subscriptionId) => api.post(`/admin/subscriptions/${subscriptionId}/cancel`),
  changePlan: (userId, newPlan) => api.post(`/admin/subscriptions/${userId}/change-plan`, null, { params: { new_plan: newPlan } }),
  getPayments: (params) => api.get('/admin/payments', { params }),
  processRefund: (paymentId, amount, reason) => api.post(`/admin/payments/${paymentId}/refund`, null, { params: { amount, reason } }),
  getInstagramAccounts: (params) => api.get('/admin/instagram-accounts', { params }),
  updateInstagramAccount: (accountId, data) => api.put(`/admin/instagram-accounts/${accountId}`, data),
  updateGrowth: (accountId, data) => api.post(`/admin/instagram-accounts/${accountId}/update-growth`, null, { params: data }),
  getTickets: (params) => api.get('/admin/tickets', { params }),
  updateTicket: (ticketId, data) => api.put(`/admin/tickets/${ticketId}`, data),
  sendNotification: (data) => api.post('/admin/notifications/broadcast', data),
  broadcastNotification: (data) => api.post('/admin/notifications/broadcast', data),
  getCmsContent: (key) => api.get(`/admin/cms/${key}`),
  updateCmsContent: (key, data) => api.put(`/admin/cms/${key}`, data),
  getLogs: (params) => api.get('/admin/logs', { params }),
  
  // Settings Management
  getSettings: () => api.get('/admin/settings/'),
  updateSettings: (data) => api.put('/admin/settings/', data),
  getBranding: () => api.get('/admin/settings/branding'),
  updateBranding: (data) => api.put('/admin/settings/branding', data),
  getUISettings: () => api.get('/admin/settings/ui'),
  updateUISettings: (data) => api.put('/admin/settings/ui', data),
  getFeatureToggles: () => api.get('/admin/settings/features'),
  updateFeatureToggles: (data) => api.put('/admin/settings/features', data),
  toggleFeature: (featureKey, enabled) => api.put(`/admin/settings/features/${featureKey}?enabled=${enabled}`),
  getHeroContent: () => api.get('/admin/settings/hero'),
  updateHeroContent: (data) => api.put('/admin/settings/hero', data),
  getStatsContent: () => api.get('/admin/settings/stats'),
  updateStatsContent: (data) => api.put('/admin/settings/stats', data),
  getPromoBanner: () => api.get('/admin/settings/promo-banner'),
  updatePromoBanner: (data) => api.put('/admin/settings/promo-banner', data),
  
  // Testimonials
  getTestimonials: () => api.get('/admin/settings/testimonials'),
  createTestimonial: (data) => api.post('/admin/settings/testimonials', data),
  updateTestimonial: (id, data) => api.put(`/admin/settings/testimonials/${id}`, data),
  deleteTestimonial: (id) => api.delete(`/admin/settings/testimonials/${id}`),
  
  // FAQs
  getFAQs: () => api.get('/admin/settings/faqs'),
  createFAQ: (data) => api.post('/admin/settings/faqs', data),
  updateFAQ: (id, data) => api.put(`/admin/settings/faqs/${id}`, data),
  deleteFAQ: (id) => api.delete(`/admin/settings/faqs/${id}`),
  
  // Plans Management
  getPlans: (includeHidden = false) => api.get('/admin/plans/', { params: { include_hidden: includeHidden } }),
  getPlan: (planId) => api.get(`/admin/plans/${planId}`),
  createPlan: (data) => api.post('/admin/plans/', data),
  updatePlan: (planId, data) => api.put(`/admin/plans/${planId}`, data),
  deletePlan: (planId) => api.delete(`/admin/plans/${planId}`),
  clonePlan: (planId, newName, newSlug) => api.post(`/admin/plans/${planId}/clone?new_name=${newName}&new_slug=${newSlug}`),
  togglePlanPopular: (planId) => api.post(`/admin/plans/${planId}/toggle-popular`),
  reorderPlans: (planOrders) => api.post('/admin/plans/reorder', planOrders),
  
  // Feature Matrix Management
  getFeatureMatrix: () => api.get('/admin/plans/feature-matrix'),
  updateFeatureMatrix: (matrix) => api.put('/admin/plans/feature-matrix', matrix),
  updateFeatureMatrixItem: (featureKey, item) => api.put(`/admin/plans/feature-matrix/${featureKey}`, item),
  seedFeatureMatrix: () => api.post('/admin/plans/feature-matrix/seed'),
  
  // Analytics
  getPlatformAnalytics: (period = 'monthly') => api.get('/admin/analytics/platform', { params: { period } }),
  getPlatformTrends: (days = 30) => api.get('/admin/analytics/platform/trends', { params: { days } }),
  getUsersAnalytics: () => api.get('/admin/analytics/users'),
  getUserAnalytics: (userId) => api.get(`/admin/analytics/users/${userId}`),
  getGrowthEngineAnalytics: () => api.get('/admin/analytics/growth-engine'),
  getFunnelAnalytics: (days = 30) => api.get('/admin/analytics/funnel', { params: { days } }),
  getGeographyAnalytics: () => api.get('/admin/analytics/geography'),
  getConversionFunnel: (days = 30) => api.get('/admin/analytics/conversion-funnel', { params: { days } }),
  trackEvent: (event) => api.post('/admin/analytics/events', event),
  
  // Promotions - Dashboard
  getPromotionsDashboard: () => api.get('/admin/promotions/dashboard'),
  
  // Promotions - ICPs
  getICPs: () => api.get('/admin/promotions/icps'),
  getICP: (icpId) => api.get(`/admin/promotions/icps/${icpId}`),
  createICP: (data) => api.post('/admin/promotions/icps', data),
  updateICP: (icpId, data) => api.put(`/admin/promotions/icps/${icpId}`, data),
  deleteICP: (icpId) => api.delete(`/admin/promotions/icps/${icpId}`),
  setPrimaryICP: (icpId) => api.post(`/admin/promotions/icps/${icpId}/set-primary`),
  
  // Promotions - A/B Tests
  getABTests: (status) => api.get('/admin/promotions/ab-tests', { params: { status } }),
  getABTest: (testId) => api.get(`/admin/promotions/ab-tests/${testId}`),
  createABTest: (data) => api.post('/admin/promotions/ab-tests', data),
  updateABTest: (testId, data) => api.put(`/admin/promotions/ab-tests/${testId}`, data),
  startABTest: (testId) => api.post(`/admin/promotions/ab-tests/${testId}/start`),
  stopABTest: (testId) => api.post(`/admin/promotions/ab-tests/${testId}/stop`),
  selectABWinner: (testId, variantId) => api.post(`/admin/promotions/ab-tests/${testId}/select-winner/${variantId}`),
  
  // Promotions - Campaigns
  getCampaigns: (status, type) => api.get('/admin/promotions/campaigns', { params: { status, campaign_type: type } }),
  getCampaign: (campaignId) => api.get(`/admin/promotions/campaigns/${campaignId}`),
  createCampaign: (data) => api.post('/admin/promotions/campaigns', data),
  updateCampaign: (campaignId, data) => api.put(`/admin/promotions/campaigns/${campaignId}`, data),
  deleteCampaign: (campaignId) => api.delete(`/admin/promotions/campaigns/${campaignId}`),
  launchCampaign: (campaignId) => api.post(`/admin/promotions/campaigns/${campaignId}/launch`),
  pauseCampaign: (campaignId) => api.post(`/admin/promotions/campaigns/${campaignId}/pause`),
  completeCampaign: (campaignId) => api.post(`/admin/promotions/campaigns/${campaignId}/complete`),
  
  // Promotions - Templates
  getTemplates: () => api.get('/admin/promotions/templates'),
  createTemplate: (data) => api.post('/admin/promotions/templates', data),
  updateTemplate: (templateId, data) => api.put(`/admin/promotions/templates/${templateId}`, data),
  deleteTemplate: (templateId) => api.delete(`/admin/promotions/templates/${templateId}`),
};

export default api;

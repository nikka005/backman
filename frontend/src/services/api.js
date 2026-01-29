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

// Payment API
export const paymentAPI = {
  // Stripe
  createStripeCheckout: (packageId, originUrl) => 
    api.post(`/payments/checkout/session?package_id=${packageId}&origin_url=${encodeURIComponent(originUrl)}`),
  createCheckoutSession: (packageId, originUrl) => 
    api.post('/payments/checkout/session', null, { params: { package_id: packageId, origin_url: originUrl } }),
  getCheckoutStatus: (sessionId) => api.get(`/payments/checkout/status/${sessionId}`),
  getPaymentHistory: () => api.get('/payments/history'),
  getCurrentSubscription: () => api.get('/payments/subscription'),
  cancelSubscription: () => api.post('/payments/subscription/cancel'),
  
  // Razorpay
  createRazorpayOrder: (packageId) => 
    api.post(`/payments/razorpay/create-order?package_id=${packageId}`),
  verifyRazorpayPayment: (data) => 
    api.post('/payments/razorpay/verify-payment', data),
  getRazorpayPackages: () => 
    api.get('/payments/razorpay/packages'),
  
  // Localized pricing
  getLocalizedPricing: () => 
    api.get('/public/localized-pricing'),
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
  getLocalizedPricing: () => api.get('/public/localized-pricing'),
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
  
  // Feature Management System
  initializeFeatures: () => api.post('/admin/feature-management/initialize'),
  // Pages
  getFeaturePages: () => api.get('/admin/feature-management/pages'),
  getFeaturePage: (key) => api.get(`/admin/feature-management/pages/${key}`),
  updateFeaturePage: (key, data) => api.put(`/admin/feature-management/pages/${key}`, data),
  publishPage: (key) => api.post(`/admin/feature-management/pages/${key}/publish`),
  saveDraftPage: (key) => api.post(`/admin/feature-management/pages/${key}/draft`),
  // Sections
  getFeatureSections: () => api.get('/admin/feature-management/sections'),
  getFeatureSection: (key) => api.get(`/admin/feature-management/sections/${key}`),
  updateFeatureSection: (key, data) => api.put(`/admin/feature-management/sections/${key}`, data),
  reorderSections: (orderData) => api.put('/admin/feature-management/sections/reorder', orderData),
  publishSection: (key) => api.post(`/admin/feature-management/sections/${key}/publish`),
  // Platform Features
  getPlatformFeatures: () => api.get('/admin/feature-management/platform'),
  getPlatformFeature: (key) => api.get(`/admin/feature-management/platform/${key}`),
  updatePlatformFeature: (key, data) => api.put(`/admin/feature-management/platform/${key}`, data),
  // Payment Options
  getPaymentOptions: () => api.get('/admin/feature-management/payments'),
  getPaymentOption: (key) => api.get(`/admin/feature-management/payments/${key}`),
  updatePaymentOption: (key, data) => api.put(`/admin/feature-management/payments/${key}`, data),
  testPaymentConnection: (key) => api.post(`/admin/feature-management/payments/${key}/test-connection`),
  // Auth Options
  getAuthOptions: () => api.get('/admin/feature-management/auth'),
  getAuthOption: (key) => api.get(`/admin/feature-management/auth/${key}`),
  updateAuthOption: (key, data) => api.put(`/admin/feature-management/auth/${key}`, data),
  // Feature Logs
  getFeatureLogs: (params) => api.get('/admin/feature-management/logs', { params }),
  // Bulk Operations
  bulkToggleFeatures: (featureType, keys, enabled) => api.post('/admin/feature-management/bulk-toggle', { feature_type: featureType, keys, enabled }),
  syncFeaturesToSettings: () => api.post('/admin/feature-management/sync-to-site-settings'),
  
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
  
  // Email Templates
  initializeEmailTemplates: () => api.post('/admin/email-templates/initialize'),
  getEmailTemplates: () => api.get('/admin/email-templates/'),
  getEmailTemplate: (key) => api.get(`/admin/email-templates/${key}`),
  updateEmailTemplate: (key, data) => api.put(`/admin/email-templates/${key}`, data),
  previewEmailTemplate: (key, data) => api.post(`/admin/email-templates/${key}/preview`, data),
  testSendEmailTemplate: (key, email) => api.post(`/admin/email-templates/${key}/test-send?test_email=${email}`),
  resetEmailTemplate: (key) => api.post(`/admin/email-templates/${key}/reset`),
  
  // Rate Limits Dashboard
  getRateLimitConfig: () => api.get('/admin/rate-limits/config'),
  updateRateLimitConfig: (key, data) => api.put(`/admin/rate-limits/config/${key}`, data),
  resetRateLimitsToDefault: () => api.post('/admin/rate-limits/config/reset-defaults'),
  getRateLimitStats: () => api.get('/admin/rate-limits/stats'),
  getBlockedIPs: () => api.get('/admin/rate-limits/blocked-ips'),
  unblockIP: (ip) => api.post(`/admin/rate-limits/unblock-ip/${ip}`),
  blockIP: (ip, hours, reason) => api.post(`/admin/rate-limits/block-ip?ip_address=${ip}&duration_hours=${hours}&reason=${reason}`),
  getLiveRequests: (limit = 50) => api.get('/admin/rate-limits/live-requests', { params: { limit } }),
  getRateLimitEndpointDetails: (key) => api.get(`/admin/rate-limits/endpoint-details/${key}`),
  
  // Data Export
  exportUsers: (format = 'csv') => api.get('/admin/export/users', { params: { format }, responseType: 'blob' }),
  exportSubscriptions: (format = 'csv', status) => api.get('/admin/export/subscriptions', { params: { format, status_filter: status }, responseType: 'blob' }),
  exportPayments: (format = 'csv', startDate, endDate, status) => api.get('/admin/export/payments', { params: { format, start_date: startDate, end_date: endDate, status_filter: status }, responseType: 'blob' }),
  exportAnalytics: (format = 'csv', days = 30) => api.get('/admin/export/analytics', { params: { format, period_days: days }, responseType: 'blob' }),
  exportInstagramAccounts: (format = 'csv') => api.get('/admin/export/instagram-accounts', { params: { format }, responseType: 'blob' }),
  exportTickets: (format = 'csv', status) => api.get('/admin/export/tickets', { params: { format, status_filter: status }, responseType: 'blob' }),
  exportFunnelEvents: (format = 'csv', days = 30) => api.get('/admin/export/funnel-events', { params: { format, days }, responseType: 'blob' }),
  exportGrowthLogs: (format = 'csv', days = 30) => api.get('/admin/export/growth-logs', { params: { format, days }, responseType: 'blob' }),
  exportFullReport: (days = 30) => api.get('/admin/export/full-report', { params: { format: 'json', period_days: days }, responseType: 'blob' }),
};

export default api;

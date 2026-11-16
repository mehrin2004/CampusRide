import axios from 'axios';

const API = axios.create({
  baseURL: '/api'
});

// Interceptor to attach Authorization Bearer token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('campusride_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor to handle 401 stale token / User not found gracefully
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const msg = error.response.data?.message || '';
      if (msg.includes('User not found') || msg.includes('Not authorized')) {
        localStorage.removeItem('campusride_token');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data) => API.post('/auth/login', data),
  register: (data) => API.post('/auth/register', data),
  seedDemo: () => API.post('/auth/seed-demo'),
  getMe: () => API.get('/auth/me'),
  updateAssignedBus: (data) => API.put('/auth/assigned-bus', data),
  getUsers: () => API.get('/auth/users'),
  toggleLeadDriver: (id) => API.put(`/auth/users/${id}/lead-driver`)
};

export const busAPI = {
  getAll: () => API.get('/buses'),
  getById: (id) => API.get(`/buses/${id}`),
  create: (data) => API.post('/buses', data),
  update: (id, data) => API.put(`/buses/${id}`, data),
  updateLocation: (id, data) => API.put(`/buses/${id}/location`, data),
  updateStatus: (id, data) => API.put(`/buses/${id}/status`, data),
  startSimulation: (id, data) => API.post(`/buses/${id}/start-simulation`, data),
  stopSimulation: (id) => API.post(`/buses/${id}/stop-simulation`),
  resetTrip: (id, data) => API.post(`/buses/${id}/reset-trip`, data)
};

export const routeAPI = {
  getAll: () => API.get('/routes'),
  create: (data) => API.post('/routes', data),
  update: (id, data) => API.put(`/routes/${id}`, data)
};

export const complaintAPI = {
  getAll: () => API.get('/complaints'),
  getById: (id) => API.get(`/complaints/${id}`),
  create: (data) => API.post('/complaints', data),
  updateProgress: (id, data) => API.put(`/complaints/${id}/progress`, data)
};

export const announcementAPI = {
  getAll: () => API.get('/announcements'),
  create: (data) => API.post('/announcements', data),
  update: (id, data) => API.put(`/announcements/${id}`, data),
  delete: (id) => API.delete(`/announcements/${id}`)
};

export const analyticsAPI = {
  getStats: () => API.get('/analytics/stats')
};

export const demandAPI = {
  submitResponse: (data) => API.post('/demand/respond', data),
  getMyStatus: (date) => API.get('/demand/my-status', { params: { date } }),
  getBusSummary: (busNumber, date) => API.get(`/demand/bus-summary/${busNumber}`, { params: { date } }),
  recordBoardingScan: (data) => API.post('/demand/scan-boarding', data)
};

export const notificationAPI = {
  getAll: () => API.get('/notifications'),
  markAsRead: (id) => API.put(`/notifications/${id}/read`),
  markAllAsRead: () => API.put('/notifications/read-all')
};

export default API;

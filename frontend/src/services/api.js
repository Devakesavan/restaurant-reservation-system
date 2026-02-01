import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// JWT interceptor: attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Optional: handle 401 and redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const register = (data) => api.post('/auth/register', data);
export const login = (data) => api.post('/auth/login', data);

// Restaurants
export const getRestaurants = () => api.get('/restaurants');
export const searchRestaurants = (q) => api.get('/restaurants/search', { params: { q } });
export const getSeatsAvailability = (restaurantId, date, time) =>
  api.get(`/restaurants/${restaurantId}/availability`, { params: { date, time } });
export const getMyRestaurants = () => api.get('/restaurants/my');
export const getRestaurantBookings = (id) => api.get(`/restaurants/${id}/bookings`);
export const addRestaurant = (data) => api.post('/restaurants', data);
export const updateRestaurant = (id, data) => api.put(`/restaurants/${id}`, data);
export const deleteRestaurant = (id) => api.delete(`/restaurants/${id}`);

// Reservations
export const createReservation = (data) => api.post('/reservations', data);
export const getMyReservations = () => api.get('/reservations/my');

// Admin (read-only)
export const getAdminStats = () => api.get('/admin/stats');
export const getActivityLogs = (params) => api.get('/admin/activity-logs', { params });

export default api;

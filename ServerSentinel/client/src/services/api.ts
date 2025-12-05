import axios, { AxiosInstance, AxiosError } from 'axios';
import { useAuthStore } from '@/store/auth-store';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // Handle 401 errors (token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { refreshToken } = useAuthStore.getState();
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/api/auth/refresh`, {
            refreshToken,
          });

          const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
            response.data.data;

          useAuthStore.getState().setTokens(newAccessToken, newRefreshToken);

          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),
  
  logout: (refreshToken: string) =>
    apiClient.post('/auth/logout', { refreshToken }),
  
  refresh: (refreshToken: string) =>
    apiClient.post('/auth/refresh', { refreshToken }),
  
  me: () => apiClient.get('/auth/me'),
};

// Clients API
export const clientsApi = {
  getAll: (includeInactive = false) =>
    apiClient.get('/clients', { params: { includeInactive } }),
  
  getById: (id: string) => apiClient.get(`/clients/${id}`),
  
  create: (data: any) => apiClient.post('/clients', data),
  
  update: (id: string, data: any) => apiClient.put(`/clients/${id}`, data),
  
  delete: (id: string) => apiClient.delete(`/clients/${id}`),
  
  getStats: () => apiClient.get('/clients/stats'),
};

// Metrics API
export const metricsApi = {
  query: (params: any) => apiClient.get('/metrics', { params }),
  
  getLatest: (clientId: string, count = 1) =>
    apiClient.get(`/metrics/latest/${clientId}`, { params: { count } }),
  
  getAggregated: (clientId?: string, hours = 1) =>
    apiClient.get('/metrics/aggregated', { params: { clientId, hours } }),
};

// Alerts API
export const alertsApi = {
  query: (params: any) => apiClient.get('/alerts', { params }),
  
  getById: (id: string) => apiClient.get(`/alerts/${id}`),
  
  acknowledge: (id: string) => apiClient.post(`/alerts/${id}/acknowledge`),
  
  close: (id: string) => apiClient.post(`/alerts/${id}/close`),
  
  getStats: (clientId?: string, hours = 24) =>
    apiClient.get('/alerts/stats', { params: { clientId, hours } }),
};

export default apiClient;

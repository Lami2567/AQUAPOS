import axios from 'axios';

// Resolve Backend API URL: Checks VITE_API_URL, VITE_CLOUD_API_URL, or defaults to central server
const RAW_API_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_CLOUD_API_URL ||
  'https://aquapos-nsw3.onrender.com';

export const API_BASE_URL = RAW_API_URL.replace(/\/+$/, '');

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor to attach authorization JWT token from active session
apiClient.interceptors.request.use((config) => {
  try {
    const token = sessionStorage.getItem('aquapos-auth-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (_) {
    // Ignore storage issues
  }
  return config;
});

export default apiClient;

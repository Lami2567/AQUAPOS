import axios from 'axios';

// Resolve Backend API URL: Checks VITE_API_URL, VITE_CLOUD_API_URL, or defaults to local server
export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_CLOUD_API_URL ||
  'http://localhost:3001';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor to attach authorization JWT token if present in localStorage
apiClient.interceptors.request.use((config) => {
  try {
    const authStorage = localStorage.getItem('water-pos-storage');
    if (authStorage) {
      const parsed = JSON.parse(authStorage);
      const token = parsed?.state?.currentUser?.token || parsed?.state?.token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch (_) {
    // Ignore storage parse issues
  }
  return config;
});

export default apiClient;

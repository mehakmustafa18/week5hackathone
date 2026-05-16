import axios from 'axios';

const getBaseURL = () => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== 'undefined') {
    return `http://${window.location.hostname}:3000`;
  }
  return 'http://localhost:3000';
};

// Create a centralized Axios instance connecting to the backend API on port 3000
const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add an interceptor to inject the JWT token automatically
api.interceptors.request.use(
  (config) => {
    // Only access localStorage in the browser (client-side)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;

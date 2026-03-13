import axios from "axios";

// In production (Vercel), VITE_API_URL must be set in Vercel environment variables
// In development, it falls back to localhost
const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : "http://localhost:5000/api";

console.log("API Base URL:", BASE_URL); // helps debug on mobile

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: false,
  timeout: 15000, // 15 seconds timeout - prevents infinite loading
});

// Attach accessToken to every request automatically
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle timeout and network errors - prevents infinite loading
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === "ECONNABORTED" || error.message === "Network Error") {
      console.error("Network error or timeout:", error.message);
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;

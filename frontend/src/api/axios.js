import axios from "axios";
const api = axios.create({ baseURL: "/api" });

// Just attach the token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// REMOVED the aggressive 401 interceptor that was kicking you out
export default api;

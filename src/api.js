import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api"
});

api.interceptors.request.use((config) => {
  const raw = localStorage.getItem("userInfo");
  if (raw) {
    const token = JSON.parse(raw)?.token;
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
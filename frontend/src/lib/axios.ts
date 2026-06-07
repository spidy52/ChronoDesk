import axios from 'axios';
import { useAuthStore } from '../modules/auth/store';
import { API_URL } from '@/config';

export const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;

  console.log('TOKEN:', token);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;

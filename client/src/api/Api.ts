import axios from 'axios';
import { getAuth } from 'firebase/auth';

const api = axios.create({
  baseURL: 'http://localhost:3000',
  withCredentials: true,
});

api.interceptors.request.use(async (config) => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  console.log('Making request with config:', {
    url: config.url,
    method: config.method,
    withCredentials: config.withCredentials,
    headers: config.headers
  });
  
  return config;
});

export default api;
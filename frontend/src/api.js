import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:5000/api' });

export const getErr = (err) =>
  err.response?.data?.message || 'Something went wrong. Is the server running?';

export default api;
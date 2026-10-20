import client from './client';

export const authApi = {
  login: async (email, password) => {
    const res = await client.post('/api/auth/login', { email, password });
    return res.data;
  },
  register: async (userData) => {
    const res = await client.post('/api/auth/register', userData);
    return res.data;
  },
  getMe: async () => {
    const res = await client.get('/api/auth/me');
    return res.data;
  },
  updateProfile: async (data) => {
    const res = await client.put('/api/auth/profile', data);
    return res.data;
  },
};

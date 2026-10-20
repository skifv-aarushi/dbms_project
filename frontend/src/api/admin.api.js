import client from './client';

export const adminApi = {
  getAllAllocations: async (status) => {
    const res = await client.get('/api/admin/allocations', { params: { status } });
    return res.data;
  },
  createAllocation: async (data) => {
    const res = await client.post('/api/admin/allocations', data);
    return res.data;
  },
  updateAllocationStatus: async (id, data) => {
    const res = await client.patch(`/api/admin/allocations/${id}`, data);
    return res.data;
  },
  getUnassignedMentees: async () => {
    const res = await client.get('/api/admin/unassigned-mentees');
    return res.data;
  },
  getMentorsLoad: async () => {
    const res = await client.get('/api/admin/mentors-load');
    return res.data;
  },
  getReports: async () => {
    const res = await client.get('/api/admin/reports');
    return res.data;
  },
  getAllUsers: async (params) => {
    const res = await client.get('/api/admin/users', { params });
    return res.data;
  },
  createUser: async (userData) => {
    const res = await client.post('/api/admin/users', userData);
    return res.data;
  },
  deleteUser: async (id) => {
    const res = await client.delete(`/api/admin/users/${id}`);
    return res.data;
  },
  getRecommendations: async (menteeId) => {
    const res = await client.get(`/api/admin/recommendations/${menteeId}`);
    return res.data;
  },
  getAutoMatchPreview: async () => {
    const res = await client.get('/api/admin/auto-match');
    return res.data;
  },
  applyAutoMatch: async () => {
    const res = await client.post('/api/admin/auto-match/apply');
    return res.data;
  },
};

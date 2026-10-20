import client from './client';

export const mentorApi = {
  getAssignedMentees: async () => {
    const res = await client.get('/api/mentor/mentees');
    return res.data;
  },
  getMentorMeetings: async () => {
    const res = await client.get('/api/mentor/meetings');
    return res.data;
  },
  getAllPairings: async () => {
    const res = await client.get('/api/mentor/pairings');
    return res.data;
  },
  scheduleMeeting: async (meetingData) => {
    const res = await client.post('/api/meetings', meetingData);
    return res.data;
  },
  updateMeeting: async (id, data) => {
    const res = await client.patch(`/api/meetings/${id}`, data);
    return res.data;
  },
  submitFeedback: async (id, data) => {
    const res = await client.post(`/api/meetings/${id}/feedback`, data);
    return res.data;
  },
  logProgress: async (menteeId, data) => {
    const res = await client.post(`/api/progress/${menteeId}`, data);
    return res.data;
  },
  getProgressRecords: async (menteeId) => {
    const res = await client.get(`/api/progress/${menteeId}`);
    return res.data;
  },
};

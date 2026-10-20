import client from './client';

export const menteeApi = {
  getDashboard: async () => {
    const res = await client.get('/api/mentee/dashboard');
    return res.data;
  },
  updateSkills: async (skills) => {
    const res = await client.put('/api/mentee/skills', { skills });
    return res.data;
  },
  getRecommendedMentors: async () => {
    const res = await client.get('/api/mentee/recommended-mentors');
    return res.data;
  },
  selectMentor: async (mentorId) => {
    const res = await client.post('/api/mentee/select-mentor', { mentorId });
    return res.data;
  },
  submitFeedback: async (meetingId, data) => {
    const res = await client.post(`/api/meetings/${meetingId}/feedback`, data);
    return res.data;
  },
};

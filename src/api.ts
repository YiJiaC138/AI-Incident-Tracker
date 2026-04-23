import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
});

export const createIncident = async (data: { title: string; description: string; department: string }) => {
  const response = await api.post('/incidents', data);
  return response.data;
};

export const getTickets = async () => {
  const response = await api.get('/tickets');
  return response.data;
};

export const triggerEscalation = async () => {
  const response = await api.post('/escalate');
  return response.data;
};

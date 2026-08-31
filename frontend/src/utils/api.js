import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});

export const getStatsSummary = () => api.get('/stats/summary').then(res => res.data);
export const getStatsSector = () => api.get('/stats/sector').then(res => res.data);
export const getStatsState = () => api.get('/stats/state').then(res => res.data);
export const getBenchmarks = () => api.get('/stats/benchmarks').then(res => res.data);

export const getProjects = (params) => api.get('/projects', { params }).then(res => res.data);
export const getProjectDetail = (id) => api.get(`/projects/${id}`).then(res => res.data);
export const runProjectPredict = (id) => api.get(`/projects/${id}/predict`).then(res => res.data);
export const runProjectExplain = (id) => api.get(`/projects/${id}/explain`).then(res => res.data);

export const getAlerts = (params) => api.get('/alerts', { params }).then(res => res.data);
export const resolveAlert = (id) => api.post(`/alerts/${id}/resolve`).then(res => res.data);
export const resolveAllAlerts = () => api.post('/alerts/resolve-all').then(res => res.data);

export const getAssistantBriefing = () => api.get('/assistant/briefing').then(res => res.data);
export const sendAssistantMessage = (message, history) => 
  api.post('/assistant/chat', { message, history }).then(res => res.data);

export default api;

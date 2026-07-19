import apiClient from './axiosClient';

const clientApi = {
  getDashboardSummary: async () => {
    const response = await apiClient.get('/client/dashboard');
    return response.data;
  },

  getDocuments: async () => {
    const response = await apiClient.get('/client/documents');
    return response.data;
  },

  uploadDocument: async (formData) => {
    const response = await apiClient.post('/client/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  deleteDocument: async (documentId) => {
    const response = await apiClient.delete(`/client/documents/${documentId}`);
    return response.data;
  },

  getCases: async () => {
    const response = await apiClient.get('/client/cases');
    return response.data;
  },

  getCaseTimeline: async (caseId) => {
    const response = await apiClient.get(`/client/cases/${caseId}/timeline`);
    return response.data;
  },

  getNotifications: async () => {
    const response = await apiClient.get('/client/notifications');
    return response.data;
  },

  markNotificationRead: async (notificationId) => {
    const response = await apiClient.patch(`/client/notifications/${notificationId}/read`);
    return response.data;
  },

  markAllNotificationsRead: async () => {
    const response = await apiClient.patch('/client/notifications/read-all');
    return response.data;
  },

  getAssignedAdvocate: async () => {
    const response = await apiClient.get('/client/advocate');
    return response.data;
  },

  sendChatMessage: async (message) => {
    const response = await apiClient.post('/client/chat', { message });
    return response.data;
  },

  getChatHistory: async () => {
    const response = await apiClient.get('/client/chat/history');
    return response.data;
  },
};

export default clientApi;

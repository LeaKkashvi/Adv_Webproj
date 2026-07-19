import apiClient from './axiosClient';

const adminApi = {
  getDashboardMetrics: async () => {
    const response = await apiClient.get('/admin/dashboard');
    return response.data;
  },

  getAllUsers: async (params) => {
    const response = await apiClient.get('/admin/users', { params });
    return response.data;
  },

  getUserDetail: async (userId) => {
    const response = await apiClient.get(`/admin/users/${userId}`);
    return response.data;
  },

  updateUserStatus: async (userId, updates) => {
    const response = await apiClient.patch(`/admin/users/${userId}`, updates);
    return response.data;
  },

  updateUserRole: async (userId, role) => {
    const response = await apiClient.patch(`/admin/users/${userId}`, { role });
    return response.data;
  },

  getCases: async (params) => {
    const response = await apiClient.get('/admin/cases', { params });
    return response.data;
  },

  createCase: async (data) => {
    const response = await apiClient.post('/admin/cases', data);
    return response.data;
  },

  updateCase: async (caseId, updates) => {
    const response = await apiClient.patch(`/admin/cases/${caseId}`, updates);
    return response.data;
  },

  addCaseUpdate: async (caseId, data) => {
    const response = await apiClient.post(`/admin/cases/${caseId}/updates`, data);
    return response.data;
  },

  getCaseDetail: async (caseId) => {
    const response = await apiClient.get(`/admin/cases/${caseId}`);
    return response.data;
  },

  getRoles: async () => {
    const response = await apiClient.get('/admin/roles');
    return response.data;
  },

  updateRolePermissions: async (roleName, permissions) => {
    const response = await apiClient.patch(`/admin/roles/${roleName}`, { permissions });
    return response.data;
  },

  getDocuments: async (params) => {
    const response = await apiClient.get('/admin/documents', { params });
    return response.data;
  },

  approveDocument: async (documentId, notes) => {
    const response = await apiClient.patch(`/admin/documents/${documentId}/approve`, { notes });
    return response.data;
  },

  rejectDocument: async (documentId, reason) => {
    const response = await apiClient.patch(`/admin/documents/${documentId}/reject`, { reason });
    return response.data;
  },
};

export default adminApi;

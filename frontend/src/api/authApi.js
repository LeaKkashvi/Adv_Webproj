import apiClient from './axiosClient';

export const authApi = {
  registerClient: async (data) => {
    const response = await apiClient.post('/auth/register/client', data);
    return response.data;
  },

  registerAdvocate: async (data) => {
    const response = await apiClient.post('/auth/register/advocate', data);
    return response.data;
  },

  login: async (data) => {
    const response = await apiClient.post('/auth/login', data);
    return response.data;
  },

  refresh: async () => {
    const response = await apiClient.post('/auth/refresh');
    return response.data;
  },

  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },

  verifyEmail: async (token) => {
    const response = await apiClient.get(`/auth/verify-email?token=${token}`);
    return response.data;
  },

  forgotPassword: async (email) => {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token, password) => {
    const response = await apiClient.post('/auth/reset-password', {
      token,
      password,
    });
    return response.data;
  },
};

export default authApi;

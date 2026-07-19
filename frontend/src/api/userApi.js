import apiClient from './axiosClient';

export const userApi = {
  getProfile: async () => {
    const response = await apiClient.get('/users/me');
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await apiClient.patch('/users/me', data);
    return response.data;
  },

  updatePassword: async (data) => {
    const response = await apiClient.patch('/users/me/password', data);
    return response.data;
  },

  getAdvocateProfile: async (id) => {
    const response = await apiClient.get(`/users/advocates/${id}`);
    return response.data;
  },

  updateAdvocateProfile: async (data) => {
    const response = await apiClient.patch('/users/advocates/me/profile', data);
    return response.data;
  },
};

export default userApi;

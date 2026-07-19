import apiClient from './axiosClient';

const submitCredentials = async (formData) => {
  const response = await apiClient.post('/verification/submit', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

const getVerificationStatus = async () => {
  const response = await apiClient.get('/verification/status');
  return response.data;
};

const removeDocument = async (documentIndex) => {
  const response = await apiClient.delete(
    `/verification/documents/${documentIndex}`,
  );
  return response.data;
};

const getVerificationQueue = async (params) => {
  const response = await apiClient.get('/verification/admin/queue', { params });
  return response.data;
};

const getAdvocateDetail = async (advocateId) => {
  const response = await apiClient.get(`/verification/admin/${advocateId}`);
  return response.data;
};

const approveVerification = async (advocateId, notes) => {
  const response = await apiClient.patch(
    `/verification/admin/${advocateId}/approve`,
    { notes },
  );
  return response.data;
};

const rejectVerification = async (advocateId, reason, notes) => {
  const response = await apiClient.patch(
    `/verification/admin/${advocateId}/reject`,
    { reason, notes },
  );
  return response.data;
};

const requestMoreInfo = async (advocateId, notes) => {
  const response = await apiClient.patch(
    `/verification/admin/${advocateId}/request-info`,
    { notes },
  );
  return response.data;
};

const getVerifiedAdvocates = async (params) => {
  const response = await apiClient.get('/verification/directory', { params });
  return response.data;
};

export default {
  submitCredentials,
  getVerificationStatus,
  removeDocument,
  getVerificationQueue,
  getAdvocateDetail,
  approveVerification,
  rejectVerification,
  requestMoreInfo,
  getVerifiedAdvocates,
};

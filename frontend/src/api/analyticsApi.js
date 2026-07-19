import axiosClient from "./axiosClient";

export const getDashboardOverview = async () => {
  const response = await axiosClient.get("/admin/dashboard");
  return response.data;
};

export const getCaseAnalytics = async () => {
  const response = await axiosClient.get("/admin/analytics/cases");
  return response.data;
};

export const getUserAnalytics = async () => {
  const response = await axiosClient.get("/admin/analytics/users");
  return response.data;
};

export const getDocumentAnalytics = async () => {
  const response = await axiosClient.get("/admin/analytics/documents");
  return response.data;
};

export const getAdvocateAnalytics = async () => {
  const response = await axiosClient.get("/admin/analytics/advocates");
  return response.data;
};

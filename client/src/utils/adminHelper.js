import apiClient from "./api";

export const verifyAdminStatus = async () => {
  const token = localStorage.getItem('authToken');
  if (!token) return false;
  const res = await apiClient.get('/auth/verify-admin');
  return res.data;
};

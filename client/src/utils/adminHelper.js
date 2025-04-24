export const verifyAdminStatus = async () => {
  const token = localStorage.getItem('authToken');
  if (!token) return false;
  const res = await fetch('http://localhost:5000/api/auth/verify-admin', { headers: { Authorization: `Bearer ${token}` } });
  return res.json();
};

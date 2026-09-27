const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (payload) => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  getMembers: () => request('/members'),
  getMember: (id) => request(`/members/${id}`),
  getDownline: (id) => request(`/members/${id}/downline`),
  getSummary: (id) => request(`/members/${id}/summary`),
  getProducts: () => request('/products'),
  getOrders: (memberId) => request(`/orders/member/${memberId}`),
  placeOrder: (payload) => request('/orders', { method: 'POST', body: JSON.stringify(payload) }),
  setOrderStatus: (id, status) => request(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  getCommissions: (memberId) => request(`/commissions/member/${memberId}`),
  payCommission: (id) => request(`/commissions/${id}/pay`, { method: 'POST' })
};

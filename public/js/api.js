// api.js - tiny fetch helper shared by every page
const API_BASE = "/api";

async function apiRequest(path, options = {}) {
  const res = await fetch(API_BASE + path, options);
  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    /* no JSON body */
  }
  if (!res.ok) {
    const message = (data && data.error) || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}

const Api = {
  login: (username, password) =>
    apiRequest("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    }),

  getProducts: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest("/products" + (qs ? `?${qs}` : ""));
  },
  getOutOfStock: () => apiRequest("/products/out-of-stock"),
  getDashboardCounts: () => apiRequest("/products/dashboard-counts"),
  getProduct: (id) => apiRequest(`/products/${id}`),
  addProduct: (formData) =>
    apiRequest("/products", { method: "POST", body: formData }),
  updateProduct: (id, formData) =>
    apiRequest(`/products/${id}`, { method: "PUT", body: formData }),
  updateStock: (id, body) =>
    apiRequest(`/products/${id}/stock`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  deleteProduct: (id) => apiRequest(`/products/${id}`, { method: "DELETE" }),

  getUsers: () => apiRequest("/users"),
  getUser: (id) => apiRequest(`/users/${id}`),
  addUser: (body) =>
    apiRequest("/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  updateUser: (id, body) =>
    apiRequest(`/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  toggleUserStatus: (id) =>
    apiRequest(`/users/${id}/toggle-status`, { method: "PATCH" }),
  deleteUser: (id) => apiRequest(`/users/${id}`, { method: "DELETE" }),

  getActivity: (limit = 100) => apiRequest(`/activity?limit=${limit}`),
};

// ---- session helpers (sessionStorage instead of Python's session.py globals) ----
const Session = {
  set(user) {
    sessionStorage.setItem("dc_user", JSON.stringify(user));
  },
  get() {
    const raw = sessionStorage.getItem("dc_user");
    return raw ? JSON.parse(raw) : null;
  },
  clear() {
    sessionStorage.removeItem("dc_user");
  },
  requireLogin() {
    const user = Session.get();
    if (!user) {
      window.location.href = "index.html";
    }
    return user;
  },
};

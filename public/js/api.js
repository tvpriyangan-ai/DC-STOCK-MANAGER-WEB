// api.js - tiny fetch wrapper shared by login.js and dashboard.js

function authHeader() {
  const stored = sessionStorage.getItem('dc_user');
  if (!stored) return {};
  try {
    const user = JSON.parse(stored);
    return user && user.token ? { 'Authorization': 'Bearer ' + user.token } : {};
  } catch (e) {
    return {};
  }
}

function handleAuthFailure(status) {
  if (status === 401) {
    sessionStorage.removeItem('dc_user');
    if (!location.pathname.endsWith('index.html') && location.pathname !== '/') {
      location.href = 'index.html';
    }
  }
}

const API = {
  base: '/api',

  async get(path) {
    const res = await fetch(this.base + path, { headers: authHeader() });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      handleAuthFailure(res.status);
      throw new Error(data.error || 'Request failed.');
    }
    return data;
  },

  async post(path, body, isFormData = false) {
    const res = await fetch(this.base + path, {
      method: 'POST',
      headers: isFormData ? authHeader() : { 'Content-Type': 'application/json', ...authHeader() },
      body: isFormData ? body : JSON.stringify(body)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      handleAuthFailure(res.status);
      throw new Error(data.error || 'Request failed.');
    }
    return data;
  },

  async put(path, body, isFormData = false) {
    const res = await fetch(this.base + path, {
      method: 'PUT',
      headers: isFormData ? authHeader() : { 'Content-Type': 'application/json', ...authHeader() },
      body: isFormData ? body : JSON.stringify(body)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      handleAuthFailure(res.status);
      throw new Error(data.error || 'Request failed.');
    }
    return data;
  },

  async patch(path, body, isFormData = false) {
    const res = await fetch(this.base + path, {
      method: 'PATCH',
      headers: isFormData ? authHeader() : { 'Content-Type': 'application/json', ...authHeader() },
      body: isFormData ? body : JSON.stringify(body)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      handleAuthFailure(res.status);
      throw new Error(data.error || 'Request failed.');
    }
    return data;
  },

  async delete(path) {
    const res = await fetch(this.base + path, { method: 'DELETE', headers: authHeader() });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      handleAuthFailure(res.status);
      throw new Error(data.error || 'Request failed.');
    }
    return data;
  }
};

// login.js - mirrors login.py's login() function

document.addEventListener('DOMContentLoaded', () => {
  // If already logged in, skip straight to dashboard
  if (sessionStorage.getItem('dc_user')) {
    window.location.href = 'dashboard.html';
    return;
  }

  const form = document.getElementById('loginForm');
  const errorText = document.getElementById('loginError');
  const showPassword = document.getElementById('showPassword');
  const passwordField = document.getElementById('password');

  showPassword.addEventListener('change', () => {
    passwordField.type = showPassword.checked ? 'text' : 'password';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorText.textContent = '';

    const username = document.getElementById('username').value.trim();
    const password = passwordField.value.trim();

    if (!username) {
      errorText.textContent = 'Please enter username.';
      return;
    }
    if (!password) {
      errorText.textContent = 'Please enter password.';
      return;
    }

    try {
      const user = await API.post('/auth/login', { username, password });
      sessionStorage.setItem('dc_user', JSON.stringify(user));
      window.location.href = 'dashboard.html';
    } catch (err) {
      errorText.textContent = err.message;
    }
  });
});

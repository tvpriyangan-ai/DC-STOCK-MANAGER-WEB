// login.js - equivalent of the login() function in login.py

const form = document.getElementById("loginForm");
const usernameEl = document.getElementById("username");
const passwordEl = document.getElementById("password");
const errorEl = document.getElementById("loginError");
const showPwEl = document.getElementById("showPassword");
const loginBtn = document.getElementById("loginBtn");

showPwEl.addEventListener("change", () => {
  passwordEl.type = showPwEl.checked ? "text" : "password";
});

function showError(message) {
  errorEl.textContent = message;
  errorEl.classList.add("show");
}

function clearError() {
  errorEl.textContent = "";
  errorEl.classList.remove("show");
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearError();

  const username = usernameEl.value.trim();
  const password = passwordEl.value.trim();

  if (!username) {
    showError("Please enter username.");
    usernameEl.focus();
    return;
  }
  if (!password) {
    showError("Please enter password.");
    passwordEl.focus();
    return;
  }

  loginBtn.disabled = true;
  loginBtn.textContent = "Logging in...";

  try {
    const user = await Api.login(username, password);
    Session.set(user);
    window.location.href = "dashboard.html";
  } catch (err) {
    showError(err.message || "Invalid Username or Password.");
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = "LOGIN";
  }
});

// If already logged in this session, skip straight to dashboard
if (Session.get()) {
  window.location.href = "dashboard.html";
}

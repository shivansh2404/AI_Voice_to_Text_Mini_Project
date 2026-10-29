/**
 * Authentication Module
 * Handles login, registration, password visibility toggles, and session checking.
 */

// Determine API base URL (Relative path if served by Express, or localhost:5000 if opened on another port)

const API_BASE = window.location.port === '5000'
  ? ''
  : `http://${window.location.hostname}:5000`;


/**
 * Display an alert message in the alert box
 */
function showAlert(message, type = 'danger') {
  const alertBox = document.getElementById('alertBox');
  if (!alertBox) return;

  alertBox.className = `alert alert-${type}`;
  alertBox.textContent = message;
  alertBox.style.display = 'block';
}

/**
 * Hide the alert message
 */
function hideAlert() {
  const alertBox = document.getElementById('alertBox');
  if (alertBox) {
    alertBox.style.display = 'none';
  }
}

/**
 * Setup Show/Hide password toggle button
 */
function setupPasswordToggle(inputId, toggleBtnId) {
  const input = document.getElementById(inputId);
  const toggleBtn = document.getElementById(toggleBtnId);

  if (!input || !toggleBtn) return;

  toggleBtn.addEventListener('click', () => {
    if (input.type === 'password') {
      input.type = 'text';
      toggleBtn.textContent = 'Hide';
    } else {
      input.type = 'password';
      toggleBtn.textContent = 'Show';
    }
  });
}

/**
 * Check if the user is already authenticated
 * Used on login and register pages to redirect logged-in users directly to dashboard
 */
async function checkExistingSession() {
  try {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      method: 'GET',
      credentials: 'include'
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.user) {
        window.location.replace('dashboard.html');
      }
    }
  } catch (err) {
    // Backend may not be running yet; fail silently on login page
    console.warn('Could not verify existing session:', err.message);
  }
}

/**
 * Initialize the Login page logic
 */
function initLoginPage() {
  checkExistingSession();
  setupPasswordToggle('loginPassword', 'togglePasswordBtn');

  const form = document.getElementById('loginForm');
  const loginBtn = document.getElementById('loginBtn');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
      showAlert('Please enter both email and password.');
      return;
    }

    loginBtn.disabled = true;
    loginBtn.textContent = 'Logging in...';

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Redirect to Dashboard upon successful authentication
        window.location.href = 'dashboard.html';
      } else {
        showAlert(data.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error('Login error:', err);
      showAlert('Unable to connect to the server. Please ensure the backend server and MongoDB are running.');
    } finally {
      loginBtn.disabled = false;
      loginBtn.textContent = 'Log In';
    }
  });
}

/**
 * Initialize the Register page logic
 */
function initRegisterPage() {
  checkExistingSession();
  setupPasswordToggle('regPassword', 'toggleRegPasswordBtn');

  const form = document.getElementById('registerForm');
  const registerBtn = document.getElementById('registerBtn');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();

    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;

    // Client-side validations
    if (!name || !email || !password || !confirmPassword) {
      showAlert('All fields are required.');
      return;
    }

    if (password !== confirmPassword) {
      showAlert('Passwords do not match. Please re-enter.');
      return;
    }

    if (password.length < 6) {
      showAlert('Password must be at least 6 characters long.');
      return;
    }

    registerBtn.disabled = true;
    registerBtn.textContent = 'Creating account...';

    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ name, email, password, confirmPassword })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        showAlert('Registration successful! Redirecting to dashboard...', 'success');
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 1200);
      } else {
        showAlert(data.message || 'Registration failed. Please try again.');
        registerBtn.disabled = false;
        registerBtn.textContent = 'Register';
      }
    } catch (err) {
      console.error('Registration error:', err);
      showAlert('Unable to connect to the server. Please ensure the backend server and MongoDB are running.');
      registerBtn.disabled = false;
      registerBtn.textContent = 'Register';
    }
  });
}


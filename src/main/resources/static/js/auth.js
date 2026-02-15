/* ============================================
   AUTH.JS – Login & Registration Logic
   Email/Password Authentication
   ============================================ */
(function () {
    'use strict';

    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const authError = document.getElementById('authError');
    const loginBtn = document.getElementById('loginBtn');
    const regBtn = document.getElementById('regBtn');

    // ---- Helper: show error message ----
    function showError(msg) {
        if (authError) {
            authError.textContent = msg;
            authError.classList.remove('hidden');
            setTimeout(() => authError.classList.add('hidden'), 4000);
        }
    }

    function showSuccess(msg) {
        if (authError) {
            authError.textContent = msg;
            authError.style.color = '#10b981';
            authError.style.borderColor = '#10b981';
            authError.style.background = 'rgba(16, 185, 129, 0.1)';
            authError.classList.remove('hidden');
            setTimeout(() => {
                authError.classList.add('hidden');
                // Reset styles
                authError.style.color = '';
                authError.style.borderColor = '';
                authError.style.background = '';
            }, 4000);
        }
    }

    // ---- Tab Switching ----
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update buttons
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Show target form
            const target = btn.getAttribute('data-target');
            if (target === 'loginParams') {
                loginForm.classList.remove('hidden');
                registerForm.classList.add('hidden');
            } else {
                loginForm.classList.add('hidden');
                registerForm.classList.remove('hidden');
            }
            authError.classList.add('hidden');
        });
    });

    // ---- Login Logic ----
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (!email || !password) return;

        loginBtn.classList.add('loading');
        loginBtn.disabled = true;

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();

            if (data.success) {
                localStorage.setItem('user', JSON.stringify(data.user));
                // Smooth transition
                document.querySelector('.login-card').style.transform = 'scale(0.95)';
                document.querySelector('.login-card').style.opacity = '0';
                setTimeout(() => { window.location.href = '/home'; }, 300);
            } else {
                showError(data.message || 'Login failed');
            }
        } catch (e) {
            console.error('Login error:', e);
            showError('Connection error. Please try again.');
        } finally {
            loginBtn.classList.remove('loading');
            loginBtn.disabled = false;
        }
    });

    // ---- Registration Logic ----
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('regName').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const phone = document.getElementById('regPhone').value.trim();
        const password = document.getElementById('regPassword').value;

        if (!name || !email || !password) return;

        regBtn.classList.add('loading');
        regBtn.disabled = true;

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, phone, password })
            });
            const data = await res.json();

            if (data.success) {
                showSuccess('Registration successful! Please login.');
                // Switch to login tab
                setTimeout(() => {
                    tabBtns[0].click();
                    document.getElementById('loginEmail').value = email;
                    document.getElementById('loginPassword').focus();
                }, 1500);
            } else {
                showError(data.message || 'Registration failed');
            }
        } catch (e) {
            console.error('Registration error:', e);
            showError('Connection error. Please try again.');
        } finally {
            regBtn.classList.remove('loading');
            regBtn.disabled = false;
        }
    });

})();

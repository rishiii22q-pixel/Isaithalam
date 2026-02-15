/* ============================================
   AUTH.JS – Login Page Logic
   Real Google OAuth + Phone OTP Verification
   ============================================ */
(function () {
    'use strict';

    const phoneSection = document.getElementById('phoneSection');
    const otpSection = document.getElementById('otpSection');
    const phoneInput = document.getElementById('phoneInput');
    const sendOtpBtn = document.getElementById('sendOtpBtn');
    const verifyOtpBtn = document.getElementById('verifyOtpBtn');
    const backToPhone = document.getElementById('backToPhone');
    const otpPhone = document.getElementById('otpPhone');
    const googleLoginBtn = document.getElementById('googleLoginBtn');
    const otpDigits = document.querySelectorAll('.otp-digit');
    const authError = document.getElementById('authError');
    const otpBanner = document.getElementById('otpBanner');
    const otpCode = document.getElementById('otpCode');

    let currentPhone = '';

    // ---- Helper: show error message ----
    function showError(msg) {
        if (authError) {
            authError.textContent = msg;
            authError.classList.remove('hidden');
            setTimeout(() => authError.classList.add('hidden'), 4000);
        }
    }

    // =============================================
    // GOOGLE SIGN-IN (Google Identity Services)
    // =============================================

    // This global function is called by Google's GIS when user signs in
    window.handleGoogleCredential = async function (response) {
        // response.credential is the JWT ID token from Google
        const idToken = response.credential;

        if (!idToken) {
            showError('Google sign-in failed. Please try again.');
            return;
        }

        try {
            const res = await fetch('/api/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken: idToken })
            });
            const data = await res.json();

            if (data.success) {
                localStorage.setItem('user', JSON.stringify(data.user));
                // Smooth transition
                document.querySelector('.login-card').style.transform = 'scale(0.95)';
                document.querySelector('.login-card').style.opacity = '0';
                setTimeout(() => { window.location.href = '/home'; }, 300);
            } else {
                showError(data.message || 'Google sign-in failed.');
            }
        } catch (e) {
            console.error('Google login error:', e);
            showError('Connection error. Please try again.');
        }
    };

    // Check if Google Identity Services loaded properly
    // If the client ID is not configured, show a fallback button
    setTimeout(() => {
        const gisButton = document.querySelector('.g_id_signin iframe');
        const gisOnload = document.getElementById('g_id_onload');
        const clientId = gisOnload ? gisOnload.getAttribute('data-client_id') : '';

        if (!gisButton && googleLoginBtn) {
            // GIS didn't render (likely client ID not configured)
            // Show the fallback button that uses a popup approach
            if (clientId === 'YOUR_GOOGLE_CLIENT_ID' || !clientId) {
                googleLoginBtn.style.display = 'flex';
                googleLoginBtn.textContent = '⚙️ Configure Google Client ID to enable';
                googleLoginBtn.style.fontSize = '13px';
                googleLoginBtn.style.opacity = '0.7';
                googleLoginBtn.style.cursor = 'default';
                googleLoginBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    showError('Set your Google Client ID in login.html (data-client_id attribute) to enable Google Sign-In. Get one at console.cloud.google.com');
                });
            } else {
                googleLoginBtn.style.display = 'flex';
            }
        }
    }, 2000);

    // Fallback Google button (manual popup, if GIS not available)
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', async () => {
            const gisOnload = document.getElementById('g_id_onload');
            const clientId = gisOnload ? gisOnload.getAttribute('data-client_id') : '';

            if (clientId === 'YOUR_GOOGLE_CLIENT_ID' || !clientId) {
                showError('Please configure a Google Client ID first.');
                return;
            }

            // Try to trigger GIS prompt
            if (window.google && window.google.accounts) {
                window.google.accounts.id.prompt();
            }
        });
    }


    // =============================================
    // PHONE OTP VERIFICATION
    // =============================================

    // Send OTP
    sendOtpBtn.addEventListener('click', async () => {
        const phone = phoneInput.value.trim();
        if (!phone || phone.length < 10) {
            phoneInput.style.borderColor = '#ef4444';
            phoneInput.focus();
            showError('Please enter a valid phone number (at least 10 digits)');
            setTimeout(() => phoneInput.style.borderColor = '', 2000);
            return;
        }

        currentPhone = phone;
        sendOtpBtn.classList.add('loading');
        sendOtpBtn.disabled = true;

        try {
            const res = await fetch('/api/auth/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone })
            });
            const data = await res.json();

            if (data.success) {
                phoneSection.classList.add('hidden');
                otpSection.classList.remove('hidden');
                otpPhone.textContent = phone;
                otpDigits[0].focus();

                // Show the OTP in a banner (since we can't send real SMS without Twilio)
                if (data.demo_otp && otpBanner && otpCode) {
                    otpCode.textContent = data.demo_otp;
                    otpBanner.classList.remove('hidden');
                }
            } else {
                showError(data.message || 'Failed to send OTP');
            }
        } catch (e) {
            console.error('Send OTP error:', e);
            showError('Connection error. Please try again.');
        } finally {
            sendOtpBtn.classList.remove('loading');
            sendOtpBtn.disabled = false;
        }
    });

    // OTP Input - Auto advance
    otpDigits.forEach((input, idx) => {
        input.addEventListener('input', (e) => {
            // Only allow digits
            e.target.value = e.target.value.replace(/[^0-9]/g, '');
            const val = e.target.value;
            if (val && idx < otpDigits.length - 1) {
                otpDigits[idx + 1].focus();
            }
        });
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !input.value && idx > 0) {
                otpDigits[idx - 1].focus();
            }
        });
        input.addEventListener('paste', (e) => {
            e.preventDefault();
            const pasteData = e.clipboardData.getData('text').trim();
            if (pasteData.length === 6 && /^\d+$/.test(pasteData)) {
                otpDigits.forEach((d, i) => d.value = pasteData[i]);
                otpDigits[5].focus();
            }
        });
    });

    // Verify OTP
    verifyOtpBtn.addEventListener('click', async () => {
        const otp = Array.from(otpDigits).map(d => d.value).join('');
        if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
            otpDigits.forEach(d => d.style.borderColor = '#ef4444');
            showError('Please enter the complete 6-digit OTP');
            setTimeout(() => otpDigits.forEach(d => d.style.borderColor = ''), 2000);
            return;
        }

        verifyOtpBtn.classList.add('loading');
        verifyOtpBtn.disabled = true;

        try {
            const res = await fetch('/api/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: currentPhone, otp, name: 'User' })
            });
            const data = await res.json();

            if (data.success) {
                localStorage.setItem('user', JSON.stringify(data.user));
                // Smooth transition
                document.querySelector('.login-card').style.transform = 'scale(0.95)';
                document.querySelector('.login-card').style.opacity = '0';
                setTimeout(() => { window.location.href = '/home'; }, 300);
            } else {
                // Wrong OTP – shake inputs and show error
                otpDigits.forEach(d => {
                    d.style.borderColor = '#ef4444';
                    d.value = '';
                });
                otpDigits[0].focus();
                showError(data.message || 'Invalid OTP. Please try again.');
                setTimeout(() => otpDigits.forEach(d => d.style.borderColor = ''), 2000);
            }
        } catch (e) {
            console.error('Verify OTP error:', e);
            showError('Connection error. Please try again.');
        } finally {
            verifyOtpBtn.classList.remove('loading');
            verifyOtpBtn.disabled = false;
        }
    });

    // Back to phone
    backToPhone.addEventListener('click', () => {
        otpSection.classList.add('hidden');
        phoneSection.classList.remove('hidden');
        otpDigits.forEach(d => d.value = '');
        if (otpBanner) otpBanner.classList.add('hidden');
        phoneInput.focus();
    });

    // Enter key support
    phoneInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendOtpBtn.click();
    });

    // Auto-verify when all 6 digits entered
    otpDigits[otpDigits.length - 1].addEventListener('input', () => {
        const otp = Array.from(otpDigits).map(d => d.value).join('');
        if (otp.length === 6 && /^\d{6}$/.test(otp)) {
            setTimeout(() => verifyOtpBtn.click(), 300);
        }
    });
})();

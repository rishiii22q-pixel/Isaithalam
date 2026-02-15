/* ============================================
   AUTH.JS – Login Page Logic
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

    let currentPhone = '';

    // Google Login (Demo)
    googleLoginBtn.addEventListener('click', async () => {
        googleLoginBtn.classList.add('loading');
        googleLoginBtn.style.pointerEvents = 'none';

        try {
            const res = await fetch('/api/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'demo@gmail.com',
                    name: 'Demo User'
                })
            });
            const data = await res.json();
            if (data.success) {
                localStorage.setItem('user', JSON.stringify(data.user));
                window.location.href = '/home';
            }
        } catch (e) {
            console.error('Google login error:', e);
        } finally {
            googleLoginBtn.classList.remove('loading');
            googleLoginBtn.style.pointerEvents = '';
        }
    });

    // Send OTP
    sendOtpBtn.addEventListener('click', async () => {
        const phone = phoneInput.value.trim();
        if (!phone || phone.length < 6) {
            phoneInput.style.borderColor = '#ef4444';
            phoneInput.focus();
            setTimeout(() => phoneInput.style.borderColor = '', 2000);
            return;
        }

        currentPhone = phone;
        sendOtpBtn.classList.add('loading');

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
            }
        } catch (e) {
            console.error('Send OTP error:', e);
        } finally {
            sendOtpBtn.classList.remove('loading');
        }
    });

    // OTP Input - Auto advance
    otpDigits.forEach((input, idx) => {
        input.addEventListener('input', (e) => {
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
        if (otp.length !== 6) {
            otpDigits.forEach(d => d.style.borderColor = '#ef4444');
            setTimeout(() => otpDigits.forEach(d => d.style.borderColor = ''), 2000);
            return;
        }

        verifyOtpBtn.classList.add('loading');

        try {
            const res = await fetch('/api/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: currentPhone, otp, name: 'User' })
            });
            const data = await res.json();
            if (data.success) {
                localStorage.setItem('user', JSON.stringify(data.user));
                window.location.href = '/home';
            } else {
                otpDigits.forEach(d => {
                    d.style.borderColor = '#ef4444';
                    d.value = '';
                });
                otpDigits[0].focus();
                setTimeout(() => otpDigits.forEach(d => d.style.borderColor = ''), 2000);
            }
        } catch (e) {
            console.error('Verify OTP error:', e);
        } finally {
            verifyOtpBtn.classList.remove('loading');
        }
    });

    // Back to phone
    backToPhone.addEventListener('click', () => {
        otpSection.classList.add('hidden');
        phoneSection.classList.remove('hidden');
        otpDigits.forEach(d => d.value = '');
        phoneInput.focus();
    });

    // Enter key support
    phoneInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendOtpBtn.click();
    });

    otpDigits[otpDigits.length - 1].addEventListener('input', () => {
        const otp = Array.from(otpDigits).map(d => d.value).join('');
        if (otp.length === 6) {
            setTimeout(() => verifyOtpBtn.click(), 200);
        }
    });
})();

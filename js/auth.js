// Authentication Logic - SIMPLIFIED WORKING VERSION
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔐 Auth script loaded');
    
    // Elements
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const forgotPassword = document.getElementById('forgotPassword');
    const loginBtn = document.getElementById('loginBtn');
    const verifyBtn = document.getElementById('verifyBtn');
    const resendBtn = document.getElementById('resendBtn');
    const sendResetBtn = document.getElementById('sendResetBtn');
    const backToLogin = document.getElementById('backToLogin');
    const backToLoginFromReset = document.getElementById('backToLoginFromReset');
    const forgotPasswordBtn = document.getElementById('forgotPasswordBtn');
    const emailDisplay = document.getElementById('emailDisplay');
    const timer = document.getElementById('timer');
    const loadingOverlay = document.querySelector('.loading-overlay');
    const passwordToggle = document.querySelector('.password-toggle');
    const passwordInput = document.getElementById('password');
    
    // State variables
    let currentEmail = '';
    let otpTimer = null;
    let resendTimer = null;
    let timeLeft = 120;
    let resendTimeLeft = 60;
    
    // Initialize auth system
    initAuth();
    
    function initAuth() {
        console.log('🔄 Initializing auth...');
        
        // Password toggle
        if (passwordToggle && passwordInput) {
            passwordToggle.addEventListener('click', function() {
                const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordInput.setAttribute('type', type);
                this.innerHTML = type === 'password' ? 
                    '<i class="fas fa-eye"></i>' : 
                    '<i class="fas fa-eye-slash"></i>';
            });
        }
        
        // Login button
        if (loginBtn) {
            loginBtn.addEventListener('click', handleLogin);
        }
        
        // Verify OTP button
        if (verifyBtn) {
            verifyBtn.addEventListener('click', handleVerifyOTP);
        }
        
        // Resend OTP button
        if (resendBtn) {
            resendBtn.addEventListener('click', handleResendOTP);
        }
        
        // Forgot password buttons
        if (forgotPasswordBtn) {
            forgotPasswordBtn.addEventListener('click', showForgotPassword);
        }
        
        if (sendResetBtn) {
            sendResetBtn.addEventListener('click', handleResetPassword);
        }
        
        // Back buttons
        if (backToLogin) {
            backToLogin.addEventListener('click', () => showStep('step1'));
        }
        
        if (backToLoginFromReset) {
            backToLoginFromReset.addEventListener('click', () => showStep('step1'));
        }
        
        // Enter key support
        document.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                if (step1 && step1.classList.contains('active')) {
                    handleLogin();
                } else if (step2 && step2.classList.contains('active')) {
                    handleVerifyOTP();
                }
            }
        });
        
        // OTP input auto-focus
        setupOTPInputs();
        
        console.log('✅ Auth system initialized');
    }
    
    // OTP Input Management
    function setupOTPInputs() {
        const otpDigits = document.querySelectorAll('.otp-digit');
        
        otpDigits.forEach((digit, index) => {
            digit.addEventListener('input', function(e) {
                const value = e.target.value;
                
                // Only allow numbers
                if (!/^\d*$/.test(value)) {
                    e.target.value = '';
                    return;
                }
                
                // Auto-focus next
                if (value.length === 1 && index < otpDigits.length - 1) {
                    otpDigits[index + 1].focus();
                }
                
                // Enable verify button when all digits are filled
                checkOTPComplete();
            });
            
            digit.addEventListener('keydown', function(e) {
                // Handle backspace
                if (e.key === 'Backspace' && !e.target.value && index > 0) {
                    otpDigits[index - 1].focus();
                }
                
                // Handle arrow keys
                if (e.key === 'ArrowLeft' && index > 0) {
                    otpDigits[index - 1].focus();
                }
                if (e.key === 'ArrowRight' && index < otpDigits.length - 1) {
                    otpDigits[index + 1].focus();
                }
            });
            
            digit.addEventListener('paste', function(e) {
                e.preventDefault();
                const pastedData = e.clipboardData.getData('text').trim();
                
                if (/^\d{6}$/.test(pastedData)) {
                    const digits = pastedData.split('');
                    otpDigits.forEach((digitEl, idx) => {
                        if (digits[idx]) {
                            digitEl.value = digits[idx];
                        }
                    });
                    
                    // Focus last digit
                    otpDigits[5].focus();
                    checkOTPComplete();
                }
            });
        });
    }
    
    function checkOTPComplete() {
        const otpDigits = document.querySelectorAll('.otp-digit');
        const allFilled = Array.from(otpDigits).every(digit => digit.value.length === 1);
        
        if (verifyBtn) {
            verifyBtn.disabled = !allFilled;
        }
        
        // Add filled class
        otpDigits.forEach(digit => {
            if (digit.value.length === 1) {
                digit.classList.add('filled');
            } else {
                digit.classList.remove('filled');
            }
        });
    }
    
    // Step Management
    function showStep(stepId) {
        // Hide all steps
        if (step1) step1.classList.remove('active');
        if (step2) step2.classList.remove('active');
        if (forgotPassword) forgotPassword.classList.remove('active');
        
        // Show selected step
        const step = document.getElementById(stepId);
        if (step) {
            step.classList.add('active');
        }
        
        // Clear OTP inputs when switching away from step2
        if (stepId !== 'step2') {
            clearOTPInputs();
            stopOTPTimer();
        }
    }
    
    function showForgotPassword() {
        showStep('forgotPassword');
    }
    
    // Login Handler
    async function handleLogin() {
        console.log('🔑 Login attempt');
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        
        if (!validateEmail(email)) {
            showNotification('Please enter a valid email address', 'error');
            return;
        }
        
        if (!password) {
            showNotification('Please enter your password', 'error');
            return;
        }
        
        showLoading(true);
        
        try {
            console.log('Checking Supabase functions...');
            
            // Check if supabaseFunctions is available
            if (!window.supabaseFunctions) {
                throw new Error('Authentication service not available. Please refresh the page.');
            }
            
            // Initialize Supabase
            const client = window.supabaseFunctions.init();
            if (!client) {
                throw new Error('Failed to initialize authentication service.');
            }
            
            console.log('Attempting login for:', email);
            
            // First verify email and password
            const { data: userData, error: signInError } = await window.supabaseFunctions.signIn(email, password);
            
            if (signInError) {
                throw signInError;
            }
            
            console.log('Password verified, sending OTP...');
            
            // If successful, send OTP
            await window.supabaseFunctions.sendOTP(email);
            
            // Store email and show OTP step
            currentEmail = email;
            if (emailDisplay) {
                emailDisplay.textContent = email;
            }
            showStep('step2');
            startOTPTimer();
            
            showNotification('OTP sent to your email', 'success');
            
        } catch (error) {
            console.error('Login error:', error);
            showNotification(error.message || 'Authentication failed', 'error');
            
            // If it's an invalid login, vibrate the form
            if (step1) {
                step1.classList.add('vibrate');
                setTimeout(() => {
                    if (step1) step1.classList.remove('vibrate');
                }, 500);
            }
        } finally {
            showLoading(false);
        }
    }
    
    // Verify OTP Handler
    async function handleVerifyOTP() {
        const otpDigits = document.querySelectorAll('.otp-digit');
        const otp = Array.from(otpDigits).map(d => d.value).join('');
        
        if (otp.length !== 6) {
            showNotification('Please enter the 6-digit OTP', 'warning');
            return;
        }
        
        showLoading(true);
        
        try {
            const { data, error } = await window.supabaseFunctions.verifyOTP(currentEmail, otp);
            
            if (error) {
                throw error;
            }
            
            // Stop timer
            stopOTPTimer();
            
            // Show success
            showNotification('Authentication successful! Redirecting...', 'success');
            
            // Redirect to dashboard after 1.5 seconds
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
            
        } catch (error) {
            console.error('OTP verification error:', error);
            showNotification(error.message || 'Invalid OTP. Please try again.', 'error');
            
            // Vibrate OTP inputs on error
            const otpContainer = document.querySelector('.otp-inputs');
            if (otpContainer) {
                otpContainer.classList.add('vibrate');
                setTimeout(() => otpContainer.classList.remove('vibrate'), 500);
            }
            
            // Clear OTP inputs
            clearOTPInputs();
        } finally {
            showLoading(false);
        }
    }
    
    // Resend OTP Handler
    async function handleResendOTP() {
        if (!resendBtn || resendBtn.disabled) return;
        
        showLoading(true);
        
        try {
            await window.supabaseFunctions.sendOTP(currentEmail);
            
            // Reset and start timer
            resetOTPTimer();
            startOTPTimer();
            
            // Reset resend timer
            resetResendTimer();
            
            showNotification('New OTP sent to your email', 'success');
            
        } catch (error) {
            console.error('Resend OTP error:', error);
            showNotification(error.message || 'Failed to resend OTP', 'error');
        } finally {
            showLoading(false);
        }
    }
    
    // Reset Password Handler
    async function handleResetPassword() {
        const email = document.getElementById('resetEmail').value.trim();
        
        if (!validateEmail(email)) {
            showNotification('Please enter a valid email address', 'error');
            return;
        }
        
        showLoading(true);
        
        try {
            await window.supabaseFunctions.resetPassword(email);
            
            showNotification('Password reset instructions sent to your email', 'success');
            
            // Reset form and go back to login
            document.getElementById('resetEmail').value = '';
            setTimeout(() => showStep('step1'), 2000);
            
        } catch (error) {
            console.error('Reset password error:', error);
            showNotification(error.message || 'Failed to send reset email', 'error');
        } finally {
            showLoading(false);
        }
    }
    
    // Timer Functions
    function startOTPTimer() {
        stopOTPTimer();
        
        otpTimer = setInterval(() => {
            timeLeft--;
            
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            
            if (timer) {
                timer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
            
            if (timeLeft <= 0) {
                stopOTPTimer();
                showNotification('OTP has expired', 'warning');
                if (verifyBtn) {
                    verifyBtn.disabled = true;
                }
            }
        }, 1000);
    }
    
    function stopOTPTimer() {
        if (otpTimer) {
            clearInterval(otpTimer);
            otpTimer = null;
        }
    }
    
    function resetOTPTimer() {
        timeLeft = 120;
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        
        if (timer) {
            timer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }
    
    function startResendTimer() {
        if (!resendBtn) return;
        
        resendBtn.disabled = true;
        resendBtn.innerHTML = `Resend OTP (${resendTimeLeft}s)`;
        
        resendTimer = setInterval(() => {
            resendTimeLeft--;
            resendBtn.innerHTML = `Resend OTP (${resendTimeLeft}s)`;
            
            if (resendTimeLeft <= 0) {
                resetResendTimer();
            }
        }, 1000);
    }
    
    function resetResendTimer() {
        if (resendTimer) {
            clearInterval(resendTimer);
            resendTimer = null;
        }
        
        resendTimeLeft = 60;
        if (resendBtn) {
            resendBtn.disabled = false;
            resendBtn.innerHTML = 'Resend OTP';
        }
    }
    
    // Utility Functions
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    function clearOTPInputs() {
        const otpDigits = document.querySelectorAll('.otp-digit');
        otpDigits.forEach(digit => {
            digit.value = '';
            digit.classList.remove('filled');
        });
        
        if (verifyBtn) {
            verifyBtn.disabled = true;
        }
    }
    
    function showLoading(show) {
        if (loadingOverlay) {
            if (show) {
                loadingOverlay.classList.add('active');
            } else {
                loadingOverlay.classList.remove('active');
            }
        }
    }
    
    function showNotification(message, type = 'info') {
        // Use Utils.showNotification if available
        if (window.Utils && window.Utils.showNotification) {
            window.Utils.showNotification(message, type);
        } else {
            // Fallback to simple alert
            alert(`${type.toUpperCase()}: ${message}`);
        }
    }
    
    // Start resend timer when page loads
    startResendTimer();
});
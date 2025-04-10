document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const errorDisplay = document.getElementById('login-error');

    // Clear any previous session data on login page load
    sessionStorage.removeItem('userId');
    sessionStorage.removeItem('userRole');

    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Prevent default form submission
            errorDisplay.textContent = ''; // Clear previous errors

            const email = emailInput.value.trim();
            const password = passwordInput.value.trim();

            if (!email || !password) {
                errorDisplay.textContent = 'Please enter both email and password.';
                return;
            }

            try {
                const response = await fetch('/api/users/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        official_mail_id: email,
                        password: password,
                    }),
                });

                const data = await response.json();

                if (response.ok) {
                    // Login successful
                    console.log('Login successful:', data);
                    // Store user info in sessionStorage
                    sessionStorage.setItem('userId', data.userId);
                    sessionStorage.setItem('userRole', data.role);

                    // Redirect based on role
                    switch (data.role) {
                        case 'mentor':
                            window.location.href = '/mentor-dashboard.html'; // Relative path from web root
                            break;
                        case 'mentee':
                            window.location.href = '/mentee-dashboard.html'; // Relative path from web root
                            break;
                        case 'admin':
                            window.location.href = '/admin-dashboard.html'; // Relative path from web root
                            break;
                        default:
                            console.error('Unknown user role:', data.role);
                            errorDisplay.textContent = 'Login successful, but role is unknown.';
                            // Redirect to a generic page or stay here
                            window.location.href = '/'; // Redirect to index/default page
                    }
                } else {
                    // Login failed - display error message from backend
                    console.error('Login failed:', data.message);
                    errorDisplay.textContent = data.message || 'Invalid credentials. Please try again.';
                }
            } catch (error) {
                console.error('Error during login request:', error);
                errorDisplay.textContent = 'An error occurred during login. Please try again later.';
            }
        });
    } else {
        console.error('Login form not found!');
    }

    // Also handle the password visibility toggle if it wasn't handled inline
    const togglePassword = document.getElementById('togglePassword');
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function() {
            // Toggle the type attribute
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            // Optional: Change the eye icon
            // this.textContent = type === 'password' ? '👁️' : '🙈';
        });
    }
});

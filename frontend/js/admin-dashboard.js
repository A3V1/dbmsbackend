document.addEventListener('DOMContentLoaded', () => {
    console.log("Admin Dashboard JS Loaded");

    // --- Retrieve User Info from Session Storage ---
    const loggedInUserId = sessionStorage.getItem('userId');
    const loggedInUserRole = sessionStorage.getItem('userRole');

    // --- Redirect to login if not logged in or not an admin ---
    if (!loggedInUserId) {
        console.log("User not logged in. Redirecting to login page.");
        window.location.href = '/mit-wpu-login.html'; // Adjust path if needed
        return; // Stop script execution
    }
    if (loggedInUserRole !== 'admin') {
        console.error("Access Denied: User is not an admin.");
        // Optionally redirect to login or an error page
        alert("Access Denied: This dashboard is for admins only.");
        window.location.href = '/mit-wpu-login.html'; // Redirect to login
        return; // Stop script execution
    }

    console.log(`Logged in Admin ID: ${loggedInUserId}`);

    // --- Admin Specific Dashboard Logic ---
    // Add functions here to fetch and display admin-specific data
    // Example: loadUserManagementTable(), loadSystemStats(), etc.

    function initializeAdminDashboard() {
        console.log("Initializing admin dashboard...");
        // Call functions to load admin data
        // loadUserManagementTable();
        // loadSystemStats();
        const welcomeMessage = document.getElementById('admin-welcome'); // Assuming an element with this ID exists
        if(welcomeMessage) {
            welcomeMessage.textContent = `Welcome, Admin User ${loggedInUserId}`;
        }
    }

    initializeAdminDashboard();

});

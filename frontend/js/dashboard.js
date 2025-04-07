// Dashboard Navigation Handler
class DashboardManager {
    constructor() {
        this.currentUser = UserManager.getCurrentUser();
        this.currentPage = window.location.pathname.split('/').pop().replace('.html', '');
        this.initializeNavigation();
        this.setupEventListeners();
    }

    initializeNavigation() {
        // Update user info in sidebar
        this.updateUserInfo();
        
        // Show/hide role-specific menu items
        this.updateRoleSpecificItems();
        
        // Set active navigation item
        this.setActiveNavigationItem();
        
        // Initialize mobile sidebar
        this.initializeMobileSidebar();
    }

    updateUserInfo() {
        if (this.currentUser) {
            const userNameElement = document.querySelector('.user-name');
            const userRoleElement = document.querySelector('.user-role');
            
            if (userNameElement) {
                userNameElement.textContent = this.currentUser.official_mail_id.split('@')[0];
            }
            
            if (userRoleElement) {
                userRoleElement.textContent = this.currentUser.role.charAt(0).toUpperCase() + 
                                            this.currentUser.role.slice(1);
            }
        }
    }

    updateRoleSpecificItems() {
        if (!this.currentUser) return;

        const adminItems = document.querySelectorAll('.admin-only');
        const mentorItems = document.querySelectorAll('.mentor-only');
        const menteeItems = document.querySelectorAll('.mentee-only');

        // Hide all role-specific items first
        [...adminItems, ...mentorItems, ...menteeItems].forEach(item => {
            item.style.display = 'none';
        });

        // Show items based on user role
        switch (this.currentUser.role) {
            case 'admin':
                adminItems.forEach(item => item.style.display = 'block');
                break;
            case 'mentor':
                mentorItems.forEach(item => item.style.display = 'block');
                break;
            case 'mentee':
                menteeItems.forEach(item => item.style.display = 'block');
                break;
        }
    }

    setActiveNavigationItem() {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            if (link.getAttribute('data-page') === this.currentPage) {
                link.classList.add('active');
            }
        });
    }

    initializeMobileSidebar() {
        const sidebarToggle = document.getElementById('sidebarToggle');
        const sidebar = document.querySelector('.sidebar');
        const mainContent = document.querySelector('.main-content');

        if (sidebarToggle && sidebar) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('active');
                mainContent.classList.toggle('sidebar-active');
            });

            // Close sidebar when clicking outside on mobile
            document.addEventListener('click', (e) => {
                if (window.innerWidth <= 768 && 
                    !sidebar.contains(e.target) && 
                    !sidebarToggle.contains(e.target)) {
                    sidebar.classList.remove('active');
                    mainContent.classList.remove('sidebar-active');
                }
            });
        }
    }

    setupEventListeners() {
        // Navigation link clicks
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.getAttribute('data-page');
                this.navigateToPage(page);
            });
        });

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                UserManager.logout();
            });
        }

        // Search functionality
        const searchInput = document.querySelector('.search-bar input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
        }

        // Notifications
        const notifications = document.querySelector('.notifications');
        if (notifications) {
            notifications.addEventListener('click', () => {
                this.showNotifications();
            });
        }

        // Settings
        const settings = document.querySelector('.settings');
        if (settings) {
            settings.addEventListener('click', () => {
                this.showSettings();
            });
        }
    }

    navigateToPage(page) {
        // Update active state
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-page') === page) {
                link.classList.add('active');
            }
        });

        // Navigate to the page
        window.location.href = `${page}.html`;
    }

    handleSearch(query) {
        // Implement search functionality based on user role
        console.log('Searching for:', query);
        // Add search logic here
    }

    showNotifications() {
        // Implement notifications panel
        console.log('Showing notifications');
        // Add notifications panel logic here
    }

    showSettings() {
        // Implement settings panel
        console.log('Showing settings');
        // Add settings panel logic here
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DashboardManager();
}); 
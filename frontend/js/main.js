// Sample Data Structure matching database
const SAMPLE_DATA = {
    users: [
        { id: 1, official_mail_id: 'admin1@college.edu', prn_id: 'PRN001', role: 'admin', phone_num: '9876543210', calendar_id: 'calendar001' },
        { id: 2, official_mail_id: 'mentor1@college.edu', prn_id: 'PRN003', role: 'mentor', phone_num: '9876543212', calendar_id: 'calendar003' },
        { id: 3, official_mail_id: 'mentee1@college.edu', prn_id: 'PRN008', role: 'mentee', phone_num: '9876543217', calendar_id: 'calendar008' }
    ],
    mentors: [
        { mentor_id: 1, unique_user_no: 2, room_no: 'Room A1', timetable: 'Mon-Wed: 10AM-1PM', department: 'Computer Science', academic_background: 'PhD in Computer Science' }
    ],
    mentees: [
        { mentee_id: 1, unique_user_no: 3, mentor_id: 1 }
    ],
    mentee_academics: [
        { 
            mentee_id: 1, 
            course: 'B.Sc. Computer Science', 
            year: 1, 
            attendance: 85.5, 
            academic_context: 'Good', 
            academic_background: 'Completed high school with distinction.' 
        }
    ],
    achievements: [
        {
            id: 1,
            mentor_id: 1,
            mentee_id: 1,
            title: 'Best Project Award',
            description: 'Awarded for outstanding performance in the semester project.',
            date_awarded: '2025-03-01',
            badge_icon: 'project_badge.png'
        }
    ],
    communications: [
        {
            id: 1,
            sender_id: 2,
            receiver_id: 3,
            message_content: 'Meeting scheduled for Monday at 10 AM.',
            message_status: 'delivered',
            attached_file: null,
            type: 'one-to-one'
        }
    ],
    emergency_alerts: [
        {
            id: 1,
            comm_id: 1,
            alert_reason: 'Mentee reported feeling unwell during a meeting.',
            alert_status: 'pending'
        }
    ],
    activity_logs: [
        {
            id: 1,
            user_id: 3,
            log_time: '2025-03-11 09:15:00',
            activity: 'Logged in as Mentee',
            ip_address: '192.168.0.1',
            last_login: '2025-03-11 09:00:00'
        }
    ]
};

// Feature access control
const FEATURE_PERMISSIONS = {
    admin: [
        'meeting_schedule',
        'student_profile',
        'communication_hub',
        'reports',
        'user_management',
        'system_stats',
        'activity_logs',
        'emergency_management',
        'achievements'
    ],
    mentor: [
        'meeting_schedule',
        'student_profile',
        'communication_hub',
        'achievements',
        'mentee_list',
        'assign_tasks',
        'track_progress'
    ],
    mentee: [
        'meeting_schedule',
        'student_profile',
        'communication_hub',
        'achievements',
        'assignments',
        'view_progress',
        'request_meeting',
        'submit_work'
    ]
};

// Initialize localStorage with sample data if empty
function initializeData() {
    console.log('Initializing data');
    if (!localStorage.getItem('users')) {
        console.log('No users found in localStorage, adding sample data');
        Object.keys(SAMPLE_DATA).forEach(key => {
            localStorage.setItem(key, JSON.stringify(SAMPLE_DATA[key]));
        });
        console.log('Sample data added to localStorage');
    } else {
        console.log('Users already exist in localStorage');
    }
}

// Debug function to check localStorage
function debugLocalStorage() {
    console.log('--- DEBUG: localStorage contents ---');
    console.log('users:', localStorage.getItem('users'));
    console.log('currentUser:', localStorage.getItem('currentUser'));
    console.log('mentors:', localStorage.getItem('mentors'));
    console.log('mentees:', localStorage.getItem('mentees'));
    console.log('mentee_academics:', localStorage.getItem('mentee_academics'));
    console.log('achievements:', localStorage.getItem('achievements'));
    console.log('communications:', localStorage.getItem('communications'));
    console.log('emergency_alerts:', localStorage.getItem('emergency_alerts'));
    console.log('activity_logs:', localStorage.getItem('activity_logs'));
    console.log('--- END DEBUG ---');
}

// Helper Functions
function getBaseUrl() {
    const currentPath = window.location.pathname;
    return currentPath.substring(0, currentPath.lastIndexOf('/') + 1);
}

function updateDashboardCard(elementId, value, label) {
    const element = document.getElementById(elementId);
    if (element) {
        const valueElement = element.querySelector('.value') || element.querySelector('h3');
        const labelElement = element.querySelector('.label') || element.querySelector('p');
        
        if (valueElement) valueElement.textContent = value;
        if (labelElement) labelElement.textContent = label;
    }
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// User Management
class UserManager {
    static getCurrentUser() {
        return JSON.parse(localStorage.getItem('currentUser'));
    }

    static login(email) {
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const user = users.find(u => u.official_mail_id === email);
        
        if (user) {
            // Get additional user data based on role
            let additionalData = {};
            
            if (user.role === 'mentor') {
                const mentors = JSON.parse(localStorage.getItem('mentors')) || [];
                const mentorData = mentors.find(m => m.unique_user_no === user.id);
                if (mentorData) {
                    additionalData = mentorData;
                }
            } else if (user.role === 'mentee') {
                const mentees = JSON.parse(localStorage.getItem('mentees')) || [];
                let menteeData = mentees.find(m => m.unique_user_no === user.id);
                
                if (!menteeData) {
                    // Create new mentee data if it doesn't exist
                    menteeData = {
                        mentee_id: mentees.length + 1,
                        unique_user_no: user.id,
                        mentor_id: 1  // Assign to first mentor by default
                    };
                    mentees.push(menteeData);
                    localStorage.setItem('mentees', JSON.stringify(mentees));
                }
                
                const academics = JSON.parse(localStorage.getItem('mentee_academics')) || [];
                let academicData = academics.find(a => a.mentee_id === menteeData.mentee_id);
                
                if (!academicData) {
                    // Create new academic data if it doesn't exist
                    academicData = {
                        mentee_id: menteeData.mentee_id,
                        course: 'Not specified',
                        year: 1,
                        attendance: 0,
                        academic_context: 'New student',
                        academic_background: 'Not provided'
                    };
                    academics.push(academicData);
                    localStorage.setItem('mentee_academics', JSON.stringify(academics));
                }
                
                additionalData = { ...menteeData, ...academicData };
            }
            
            const userData = { ...user, ...additionalData };
            localStorage.setItem('currentUser', JSON.stringify(userData));
            return userData;
        }
        return null;
    }

    static logout() {
        localStorage.removeItem('currentUser');
        window.location.href = getBaseUrl() + 'mit-wpu-login.html';
    }
}

// Page Load Handlers
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM content loaded');
    
    // Initialize data
    initializeData();
    
    // Apply feature access restrictions
    applyFeatureAccess();
    
    // Add logout handler to all pages except login
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', UserManager.logout);
    }
    
    // Handle navigation based on current page
    const path = window.location.pathname;
    console.log('Current path:', path);
    
    // Extract the page name from the path
    let currentPage = path.split('/').pop();
    
    // Remove .html extension if present
    if (currentPage.endsWith('.html')) {
        currentPage = currentPage.replace('.html', '');
    }
    
    // Handle empty path (root)
    if (currentPage === '') {
        currentPage = 'mit-wpu-login';
    }
    
    console.log('Current page:', currentPage);
    
    switch(currentPage) {
        case 'mit-wpu-login':
            setupLoginPage();
            break;
        case 'admin-dashboard':
            setupAdminDashboard();
            break;
        case 'mentor-dashboard':
            setupMentorDashboard();
            break;
        case 'mentee-dashboard':
            setupMenteeDashboard();
            break;
        case 'meeting-schedule':
            setupMeetingSchedule();
            break;
        case 'student-profile':
            setupStudentProfile();
            break;
        case 'achievements':
            setupAchievements();
            break;
        default:
            console.error('Unknown page:', currentPage);
            break;
    }
});

// Page Setup Functions
function setupLoginPage() {
    console.log('Setting up login page');
    
    // Initialize data on page load
    initializeData();
    
    // Debug localStorage
    debugLocalStorage();
    
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const roleSelect = document.getElementById('role');
            const selectedRole = roleSelect.value;
            
            console.log('Selected role:', selectedRole);
            
            if (!selectedRole) {
                alert('Please select a role');
                return;
            }
            
            // Find a sample user with the selected role
            const users = JSON.parse(localStorage.getItem('users')) || [];
            console.log('Users from localStorage:', users);
            
            const user = users.find(u => u.role === selectedRole);
            console.log('Found user:', user);
            
            if (user) {
                // Login the user
                const loggedInUser = UserManager.login(user.official_mail_id);
                console.log('Logged in user:', loggedInUser);
                
                if (loggedInUser) {
                    // Log the activity
                    const activityLogs = JSON.parse(localStorage.getItem('activity_logs')) || [];
                    activityLogs.push({
                        id: activityLogs.length + 1,
                        user_id: loggedInUser.id,
                        log_time: new Date().toISOString(),
                        activity: `Logged in as ${selectedRole}`,
                        ip_address: '127.0.0.1',
                        last_login: new Date().toISOString()
                    });
                    localStorage.setItem('activity_logs', JSON.stringify(activityLogs));
                    
                    // Debug localStorage after login
                    debugLocalStorage();
                    
                    // Redirect based on role
                    console.log('Redirecting to dashboard for role:', selectedRole);
                    
                    const baseUrl = getBaseUrl();
                    console.log('Base URL:', baseUrl);
                    
                    switch(selectedRole) {
                        case 'admin':
                            window.location.href = baseUrl + 'admin-dashboard.html';
                            break;
                        case 'mentor':
                            window.location.href = baseUrl + 'mentor-dashboard.html';
                            break;
                        case 'mentee':
                            window.location.href = baseUrl + 'mentee-dashboard.html';
                            break;
                        default:
                            console.error('Unknown role:', selectedRole);
                            break;
                    }
                } else {
                    console.error('Failed to login user');
                    alert('Login failed. Please try again.');
                }
            } else {
                console.error('No user found with role:', selectedRole);
                alert('No user found with selected role. Please try again.');
            }
        });
    } else {
        console.error('Login form not found');
    }
}

function setupAdminDashboard() {
    const currentUser = UserManager.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
        window.location.href = getBaseUrl() + 'mit-wpu-login.html';
        return;
    }

    // Update dashboard stats
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const mentors = JSON.parse(localStorage.getItem('mentors')) || [];
    const mentees = JSON.parse(localStorage.getItem('mentees')) || [];
    const alerts = JSON.parse(localStorage.getItem('emergency_alerts')) || [];

    // Update statistics cards
    updateDashboardCard('totalUsers', users.length, 'Total Users');
    updateDashboardCard('totalMentors', mentors.length, 'Total Mentors');
    updateDashboardCard('totalMentees', mentees.length, 'Total Mentees');
    updateDashboardCard('pendingAlerts', alerts.filter(a => a.alert_status === 'pending').length, 'Pending Alerts');

    // Load activity logs
    const activityLogs = JSON.parse(localStorage.getItem('activity_logs')) || [];
    const logsContainer = document.getElementById('activityLogs');
    if (logsContainer) {
        logsContainer.innerHTML = activityLogs.map(log => `
            <div class="activity-log">
                <p><strong>${formatDate(log.log_time)}</strong></p>
                <p>${log.activity}</p>
                <small>User ID: ${log.user_id}</small>
            </div>
        `).join('');
    }

    // Load emergency alerts
    const alertsContainer = document.getElementById('emergencyAlerts');
    if (alertsContainer) {
        alertsContainer.innerHTML = alerts.map(alert => `
            <div class="alert ${alert.alert_status === 'pending' ? 'alert-warning' : 'alert-success'}">
                <h4>Alert #${alert.id}</h4>
                <p>${alert.alert_reason}</p>
                <small>Status: ${alert.alert_status}</small>
            </div>
        `).join('');
    }
}

function setupMentorDashboard() {
    const currentUser = UserManager.getCurrentUser();
    if (!currentUser || currentUser.role !== 'mentor') {
        window.location.href = getBaseUrl() + 'mit-wpu-login.html';
        return;
    }

    // Get mentor's mentees
    const mentees = JSON.parse(localStorage.getItem('mentees')) || [];
    const myMentees = mentees.filter(m => m.mentor_id === currentUser.mentor_id);
    
    // Get communications
    const communications = JSON.parse(localStorage.getItem('communications')) || [];
    const unreadMessages = communications.filter(c => 
        c.receiver_id === currentUser.id && 
        c.message_status === 'delivered'
    );

    // Update dashboard cards
    updateDashboardCard('totalMentees', myMentees.length, 'My Mentees');
    updateDashboardCard('unreadMessages', unreadMessages.length, 'Unread Messages');
    
    // Load mentee list
    const menteeList = document.getElementById('menteeList');
    if (menteeList) {
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const academics = JSON.parse(localStorage.getItem('mentee_academics')) || [];
        
        menteeList.innerHTML = myMentees.map(mentee => {
            const userData = users.find(u => u.id === mentee.unique_user_no);
            const academicData = academics.find(a => a.mentee_id === mentee.mentee_id);
            return `
                <div class="mentee-card">
                    <h3>${userData.official_mail_id}</h3>
                    <p>PRN: ${userData.prn_id}</p>
                    <p>Course: ${academicData.course}</p>
                    <p>Year: ${academicData.year}</p>
                    <p>Attendance: ${academicData.attendance}%</p>
                    <p>Academic Status: ${academicData.academic_context}</p>
                </div>
            `;
        }).join('');
    }
}

function setupMenteeDashboard() {
    const currentUser = UserManager.getCurrentUser();
    if (!currentUser || currentUser.role !== 'mentee') {
        window.location.href = getBaseUrl() + 'mit-wpu-login.html';
        return;
    }

    // Get mentee's achievements
    const achievements = JSON.parse(localStorage.getItem('achievements')) || [];
    const myAchievements = achievements.filter(a => a.mentee_id === currentUser.mentee_id);

    // Get communications
    const communications = JSON.parse(localStorage.getItem('communications')) || [];
    const myMessages = communications.filter(c => 
        c.receiver_id === currentUser.id || 
        c.sender_id === currentUser.id
    );

    // Update dashboard cards
    updateDashboardCard('totalAchievements', myAchievements.length, 'My Achievements');
    updateDashboardCard('attendance', currentUser.attendance + '%', 'Attendance');
    updateDashboardCard('academicStatus', currentUser.academic_context, 'Academic Status');
    updateDashboardCard('unreadMessages', communications.filter(c => 
        c.receiver_id === currentUser.id && 
        c.message_status === 'delivered'
    ).length, 'Unread Messages');

    // Load achievements
    const achievementsList = document.getElementById('achievementsList');
    if (achievementsList) {
        achievementsList.innerHTML = myAchievements.map(achievement => `
            <div class="feature-card">
                <div class="feature-icon">🏆</div>
                <h3 class="feature-title">${achievement.title}</h3>
                <p class="feature-description">${achievement.description}</p>
                <small>Awarded on: ${formatDate(achievement.date_awarded)}</small>
            </div>
        `).join('');
    }

    // Load upcoming meetings
    const upcomingMeetings = communications.filter(c => 
        (c.type === 'meeting_req' || c.type === 'one-to-one') &&
        (c.receiver_id === currentUser.id || c.sender_id === currentUser.id)
    );

    const meetingsList = document.getElementById('upcomingMeetings');
    if (meetingsList) {
        meetingsList.innerHTML = upcomingMeetings.map(meeting => `
            <div class="feature-card">
                <div class="feature-icon">📅</div>
                <h3 class="feature-title">Meeting</h3>
                <p class="feature-description">${meeting.message_content}</p>
                <small>Status: ${meeting.message_status}</small>
            </div>
        `).join('');
    }
}

function setupMeetingSchedule() {
    const currentUser = UserManager.getCurrentUser();
    if (!currentUser) {
        window.location.href = getBaseUrl() + 'mit-wpu-login.html';
        return;
    }

    // Get relevant meetings from communications
    const communications = JSON.parse(localStorage.getItem('communications')) || [];
    const meetings = communications.filter(c => 
        (c.type === 'meeting_req' || c.type === 'one-to-one') &&
        (c.sender_id === currentUser.id || c.receiver_id === currentUser.id)
    );

    // Display meetings
    const meetingsList = document.getElementById('meetingsList');
    if (meetingsList) {
        meetingsList.innerHTML = meetings.map(meeting => `
            <div class="meeting-card ${meeting.message_status}">
                <h3>Meeting Request</h3>
                <p>${meeting.message_content}</p>
                <p>Status: ${meeting.message_status}</p>
                ${meeting.attached_file ? `<p>Attachment: ${meeting.attached_file}</p>` : ''}
                <small>Time: ${formatDate(meeting.timestamp)}</small>
            </div>
        `).join('');
    }
}

function setupStudentProfile() {
    const currentUser = UserManager.getCurrentUser();
    if (!currentUser || !['admin', 'mentor', 'mentee'].includes(currentUser.role)) {
        window.location.href = getBaseUrl() + 'mit-wpu-login.html';
        return;
    }
    // Student profile specific setup
    loadStudentProfile();
}

function setupAchievements() {
    const currentUser = UserManager.getCurrentUser();
    if (!currentUser || !['admin', 'mentor', 'mentee'].includes(currentUser.role)) {
        window.location.href = getBaseUrl() + 'mit-wpu-login.html';
        return;
    }
    // Achievement page specific setup
    loadAchievements();
}

// Check if user has access to a feature
function hasFeatureAccess(featureId) {
    const currentUser = UserManager.getCurrentUser();
    if (!currentUser) return false;
    
    return FEATURE_PERMISSIONS[currentUser.role].includes(featureId);
}

// Apply feature access restrictions
function applyFeatureAccess() {
    // Hide feature cards based on permissions
    document.querySelectorAll('[data-feature]').forEach(element => {
        const featureId = element.getAttribute('data-feature');
        if (!hasFeatureAccess(featureId)) {
            element.style.display = 'none';
        }
    });
}

function loadAchievements() {
    const currentUser = UserManager.getCurrentUser();
    const achievements = JSON.parse(localStorage.getItem('achievements')) || [];
    const users = JSON.parse(localStorage.getItem('users')) || [];

    let displayAchievements = [];
    
    if (currentUser.role === 'admin') {
        // Admin sees all achievements
        displayAchievements = achievements;
    } else if (currentUser.role === 'mentor') {
        // Mentor sees achievements of their mentees
        displayAchievements = achievements.filter(a => a.mentor_id === currentUser.mentor_id);
    } else if (currentUser.role === 'mentee') {
        // Mentee sees their own achievements
        displayAchievements = achievements.filter(a => a.mentee_id === currentUser.mentee_id);
    }

    const achievementsContainer = document.getElementById('achievementsList');
    if (achievementsContainer) {
        if (displayAchievements.length > 0) {
            achievementsContainer.innerHTML = displayAchievements.map(achievement => `
                <div class="feature-card" data-feature="achievements">
                    <div class="feature-icon">🏆</div>
                    <h3 class="feature-title">${achievement.title}</h3>
                    <p class="feature-description">${achievement.description}</p>
                    <small>Awarded on: ${formatDate(achievement.date_awarded)}</small>
                </div>
            `).join('');
        } else {
            // No achievements found
            achievementsContainer.innerHTML = `
                <div class="feature-card">
                    <div class="feature-icon">📝</div>
                    <h3 class="feature-title">No Achievements Yet</h3>
                    <p class="feature-description">Keep working hard to earn achievements from your mentor!</p>
                </div>
            `;
        }
    }
}

function loadStudentProfile() {
    const currentUser = UserManager.getCurrentUser();
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const mentees = JSON.parse(localStorage.getItem('mentees')) || [];
    const academics = JSON.parse(localStorage.getItem('mentee_academics')) || [];

    let studentData = null;

    if (currentUser.role === 'mentee') {
        // Load mentee's own profile
        const academicData = academics.find(a => a.mentee_id === currentUser.mentee_id);
        studentData = { ...currentUser, ...academicData };
    } else {
        // For admin and mentor, get data from URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        const studentId = urlParams.get('id');
        
        if (studentId) {
            const studentUser = users.find(u => u.id === parseInt(studentId));
            if (studentUser && studentUser.role === 'mentee') {
                const menteeData = mentees.find(m => m.unique_user_no === studentUser.id);
                const academicData = academics.find(a => a.mentee_id === menteeData.mentee_id);
                studentData = { ...studentUser, ...menteeData, ...academicData };
            }
        }
    }

    if (studentData) {
        // Update profile information
        const elements = {
            'studentName': studentData.official_mail_id,
            'studentPRN': studentData.prn_id,
            'studentCourse': studentData.course,
            'studentYear': studentData.year,
            'studentAttendance': studentData.attendance + '%',
            'academicStatus': studentData.academic_context,
            'academicBackground': studentData.academic_background
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
    }
}

// Initialize the application
initializeData(); 
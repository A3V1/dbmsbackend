class MentorDashboard {
    constructor() {
        this.api = new MentorAPI();
        this.currentUser = null;
        this.mentees = [];
        this.currentMenteeId = null;
        this.meetings = [];
        this.messages = [];
        this.broadcastMessages = [];
        this.achievements = [];
        this.activityLogs = [];
        this.alerts = [];
        this.selectedMenteeId = null;
        
        // Initialize the dashboard
        this.init();
    }

    async init() {
        try {
            // Get current user info
            const userInfo = await this.getUserInfo();
            if (!userInfo || !userInfo.mentor_id) {
                this.showNotification('Error: User information not found or you are not a mentor', 'error');
                return;
            }
            
            this.currentUser = userInfo;
            
            // Initialize components
            this.initNavigation();
            this.initModals();
            this.setupEventListeners();
            
            // Load dashboard data
            await this.loadDashboardData();
        } catch (error) {
            console.error('Error initializing dashboard:', error);
            this.showNotification('Failed to initialize dashboard', 'error');
        }
    }
    
    async loadDashboardData() {
        try {
            // Load all required data
            await Promise.all([
                this.loadMentees(),
                this.loadMessages(),
                this.loadBroadcastMessages(),
                this.loadAchievements(),
                this.loadActivityLogs()
            ]);
            
            // Update UI
            this.updateDashboardStats();
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showNotification('Failed to load dashboard data', 'error');
        }
    }

    async getUserInfo() {
        // This is a placeholder - in a real app, you would get this from a session or API
        // For demo purposes, we'll use a hardcoded mentor ID
        return {
            mentor_id: 1,
            name: 'Demo Mentor'
        };
    }
    
    async loadMentees() {
        try {
            this.mentees = await this.api.getMentees(this.currentUser.mentor_id);
            this.renderMentees();
            return this.mentees;
        } catch (error) {
            console.error('Error loading mentees:', error);
            this.showNotification('Error loading mentees. Please try again.', 'error');
            return [];
        }
    }

    renderMentees() {
        const menteesList = document.getElementById('mentees-list');
        if (!menteesList) return;

        if (!this.mentees.length) {
            menteesList.innerHTML = '<p>No mentees assigned yet.</p>';
            return;
        }

        menteesList.innerHTML = this.mentees.map(mentee => `
            <div class="mentee-card" data-mentee-id="${mentee.mentee_id}">
                <img src="${mentee.avatar_url || 'img/default-profile.svg'}" alt="${mentee.first_name}" class="mentee-avatar">
                <div class="mentee-info">
                    <h3 class="mentee-name">${mentee.first_name} ${mentee.last_name || ''}</h3>
                    <p class="mentee-program">${mentee.program || mentee.course || 'Program not specified'}</p>
                    <div class="mentee-academic-details">
                        <p><strong>Year:</strong> ${mentee.year || 'N/A'}</p>
                        <p><strong>Attendance:</strong> ${mentee.attendance || 'N/A'}%</p>
                        <p><strong>Academic Status:</strong> <span class="${this.getAcademicStatusClass(mentee.academic_context)}">${mentee.academic_context || 'N/A'}</span></p>
                    </div>
                </div>
                <div class="mentee-actions">
                    <button class="action-btn view-mentee" data-mentee-id="${mentee.mentee_id}">
                        <i class="fas fa-eye"></i> View Profile
                    </button>
                    <button class="action-btn message-mentee" data-mentee-id="${mentee.mentee_id}">
                        <i class="fas fa-envelope"></i> Message
                    </button>
                    <button class="action-btn schedule-meeting" data-mentee-id="${mentee.mentee_id}">
                        <i class="fas fa-calendar-alt"></i> Schedule Meeting
                    </button>
                    <button class="action-btn remove-mentee" data-mentee-id="${mentee.mentee_id}">
                        <i class="fas fa-user-minus"></i> Remove Mentee
                    </button>
                </div>
            </div>
        `).join('');

        // Add event listeners for the action buttons
        this.addMenteeActionListeners();
    }

    // Helper method to determine the CSS class for academic status
    getAcademicStatusClass(status) {
        if (!status) return '';
        
        status = status.toLowerCase();
        if (status.includes('good') || status.includes('excellent')) {
            return 'status-good';
        } else if (status.includes('average') || status.includes('satisfactory')) {
            return 'status-average';
        } else if (status.includes('poor') || status.includes('concern') || status.includes('risk')) {
            return 'status-poor';
        }
        return '';
    }

    addMenteeActionListeners() {
        // View Profile buttons
        document.querySelectorAll('.view-mentee').forEach(button => {
            button.addEventListener('click', () => {
                const menteeId = button.getAttribute('data-mentee-id');
                this.viewMenteeProfile(menteeId);
            });
        });

        // Message buttons
        document.querySelectorAll('.message-mentee').forEach(button => {
            button.addEventListener('click', () => {
                const menteeId = button.getAttribute('data-mentee-id');
                this.openMessageDialog(menteeId);
            });
        });

        // Schedule Meeting buttons
        document.querySelectorAll('.schedule-meeting').forEach(button => {
            button.addEventListener('click', () => {
                const menteeId = button.getAttribute('data-mentee-id');
                this.openScheduleMeetingDialog(menteeId);
            });
        });

        // Remove Mentee buttons
        document.querySelectorAll('.remove-mentee').forEach(button => {
            button.addEventListener('click', () => {
                const menteeId = button.getAttribute('data-mentee-id');
                this.openRemoveMenteeModal(menteeId);
            });
        });
    }

    filterMentees(searchTerm) {
        if (!searchTerm) {
            this.renderMentees();
            return;
        }
        
        searchTerm = searchTerm.toLowerCase();
        const filteredMentees = this.mentees.filter(mentee => {
            return (
                (mentee.first_name && mentee.first_name.toLowerCase().includes(searchTerm)) ||
                (mentee.last_name && mentee.last_name.toLowerCase().includes(searchTerm)) ||
                (mentee.email && mentee.email.toLowerCase().includes(searchTerm)) ||
                (mentee.course && mentee.course.toLowerCase().includes(searchTerm)) ||
                (mentee.year && mentee.year.toString().includes(searchTerm))
            );
        });
        
        const menteesList = document.getElementById('mentees-list');
        if (!menteesList) return;

        if (filteredMentees.length === 0) {
            menteesList.innerHTML = '<p>No mentees match your search.</p>';
            return;
        }

        menteesList.innerHTML = filteredMentees.map(mentee => `
            <div class="mentee-card" data-mentee-id="${mentee.mentee_id}">
                <img src="${mentee.avatar_url || 'img/default-profile.svg'}" alt="${mentee.first_name}" class="mentee-avatar">
                <div class="mentee-info">
                    <h3 class="mentee-name">${mentee.first_name} ${mentee.last_name || ''}</h3>
                    <p class="mentee-program">${mentee.program || mentee.course || 'Program not specified'}</p>
                    <div class="mentee-academic-details">
                        <p><strong>Year:</strong> ${mentee.year || 'N/A'}</p>
                        <p><strong>Attendance:</strong> ${mentee.attendance || 'N/A'}%</p>
                        <p><strong>Academic Status:</strong> <span class="${this.getAcademicStatusClass(mentee.academic_context)}">${mentee.academic_context || 'N/A'}</span></p>
                    </div>
                </div>
                <div class="mentee-actions">
                    <button class="action-btn view-mentee" data-mentee-id="${mentee.mentee_id}">
                        <i class="fas fa-eye"></i> View Profile
                    </button>
                    <button class="action-btn message-mentee" data-mentee-id="${mentee.mentee_id}">
                        <i class="fas fa-envelope"></i> Message
                    </button>
                    <button class="action-btn schedule-meeting" data-mentee-id="${mentee.mentee_id}">
                        <i class="fas fa-calendar-alt"></i> Schedule Meeting
                    </button>
                    <button class="action-btn remove-mentee" data-mentee-id="${mentee.mentee_id}">
                        <i class="fas fa-user-minus"></i> Remove Mentee
                    </button>
                </div>
            </div>
        `).join('');

        this.addMenteeActionListeners();
    }

    async viewMenteeProfile(menteeId) {
        try {
            const menteeProfile = await this.api.getMenteeProfile(menteeId);
            
            // Update the profile modal with mentee data
            const modal = document.getElementById('mentee-profile-modal');
            if (modal) {
                // Update profile details
                const nameElement = document.getElementById('mentee-profile-name');
                const emailElement = document.getElementById('mentee-profile-email');
                const phoneElement = document.getElementById('mentee-profile-phone');
                
                if (nameElement) {
                    nameElement.textContent = `${menteeProfile.first_name || ''} ${menteeProfile.last_name || ''}`;
                }
                
                if (emailElement) {
                    emailElement.textContent = menteeProfile.email || 'No email available';
                }
                
                if (phoneElement) {
                    phoneElement.textContent = menteeProfile.phone_num || 'No phone available';
                }
                
                // Add academic details if they exist
                const academicDetailsContainer = document.getElementById('mentee-profile-academic-details');
                if (academicDetailsContainer) {
                    academicDetailsContainer.innerHTML = `
                        <h4>Academic Information</h4>
                        <div class="profile-detail-item">
                            <span class="detail-label">Program:</span>
                            <span class="detail-value">${menteeProfile.course || 'N/A'}</span>
                        </div>
                        <div class="profile-detail-item">
                            <span class="detail-label">Year:</span>
                            <span class="detail-value">${menteeProfile.year || 'N/A'}</span>
                        </div>
                        <div class="profile-detail-item">
                            <span class="detail-label">Attendance:</span>
                            <span class="detail-value">${menteeProfile.attendance || 'N/A'}%</span>
                        </div>
                        <div class="profile-detail-item">
                            <span class="detail-label">Academic Status:</span>
                            <span class="detail-value ${this.getAcademicStatusClass(menteeProfile.academic_context)}">${menteeProfile.academic_context || 'N/A'}</span>
                        </div>
                        <div class="profile-detail-item">
                            <span class="detail-label">Background:</span>
                            <span class="detail-value">${menteeProfile.academic_background || 'No background information available'}</span>
                        </div>
                    `;
                }
                
                // Display the modal
                modal.style.display = 'block';
            }
        } catch (error) {
            console.error('Error viewing mentee profile:', error);
            this.showNotification('Failed to load mentee profile', 'error');
        }
    }

    async openAddMenteeModal() {
        try {
            // Get available mentees
            const availableMentees = await this.api.getAvailableMentees();
            
            // Populate select dropdown
            const selectElement = document.getElementById('available-mentees-select');
            if (selectElement) {
                // Clear previous options except the first one
                while (selectElement.options.length > 1) {
                    selectElement.remove(1);
                }
                
                // Add available mentees
                availableMentees.forEach(mentee => {
                    const option = document.createElement('option');
                    option.value = mentee.email;
                    option.textContent = mentee.email;
                    selectElement.appendChild(option);
                });
            }
            
            // Clear input field
            const inputElement = document.getElementById('mentee-email-input');
            if (inputElement) {
                inputElement.value = '';
            }
            
            // Open modal
            this.openModal('add-mentee-modal');
        } catch (error) {
            console.error('Error loading available mentees:', error);
            this.showNotification('Failed to load available mentees', 'error');
        }
    }

    async handleAddMentee() {
        try {
            // Get mentee email from input or select
            let menteeEmail = '';
            
            const inputElement = document.getElementById('mentee-email-input');
            const selectElement = document.getElementById('available-mentees-select');
            
            if (selectElement && selectElement.value) {
                menteeEmail = selectElement.value;
            } else if (inputElement && inputElement.value) {
                menteeEmail = inputElement.value;
            }
            
            if (!menteeEmail) {
                this.showNotification('Please select or enter a mentee email', 'warning');
                return;
            }
            
            // Assign mentee to mentor
            const result = await this.api.addMentee(this.currentUser.mentor_id, menteeEmail);
            
            // Close modal
            this.closeModal('add-mentee-modal');
            
            // Show success notification
            this.showNotification(result.message || 'Mentee added successfully', 'success');
            
            // Reload mentees
            await this.loadMentees();
        } catch (error) {
            console.error('Error adding mentee:', error);
            this.showNotification(error.message || 'Failed to add mentee', 'error');
        }
    }

    openRemoveMenteeModal(menteeId) {
        // Set current mentee ID
        this.currentMenteeId = menteeId;
        
        // Open modal
        this.openModal('remove-mentee-modal');
    }

    async handleRemoveMentee() {
        if (!this.currentMenteeId) {
            this.showNotification('Mentee ID not found', 'error');
            return;
        }
        
        try {
            // Remove mentee
            const result = await this.api.removeMentee(this.currentMenteeId, this.currentUser.mentor_id);
            
            // Close modal
            this.closeModal('remove-mentee-modal');
            
            // Show success notification
            this.showNotification(result.message || 'Mentee removed successfully', 'success');
            
            // Reload mentees
            await this.loadMentees();
        } catch (error) {
            console.error('Error removing mentee:', error);
            this.showNotification(error.message || 'Failed to remove mentee', 'error');
        } finally {
            // Reset current mentee ID
            this.currentMenteeId = null;
        }
    }

    openMessageDialog(menteeId) {
        this.selectedMenteeId = menteeId;
        const mentee = this.mentees.find(m => m.mentee_id == menteeId);
        
        // Show the messaging modal
        const modal = document.getElementById('message-modal');
        if (modal) {
            document.getElementById('message-recipient').textContent = mentee ? `${mentee.first_name} ${mentee.last_name || ''}` : 'Mentee';
            modal.style.display = 'block';
        }
        
        // Focus on the message input
        const messageInput = document.getElementById('message-input');
        if (messageInput) {
            messageInput.focus();
        }
    }

    openScheduleMeetingDialog(menteeId) {
        this.selectedMenteeId = menteeId;
        const mentee = this.mentees.find(m => m.mentee_id == menteeId);
        
        // Show the meeting scheduling modal
        const modal = document.getElementById('schedule-meeting-modal');
        if (modal) {
            document.getElementById('meeting-mentee-name').textContent = mentee ? `${mentee.first_name} ${mentee.last_name || ''}` : 'Mentee';
            modal.style.display = 'block';
        }
    }

    updateDashboardStats() {
        const menteeCountElement = document.getElementById('mentee-count');
        if (menteeCountElement) {
            menteeCountElement.textContent = this.mentees.length;
        }
        
        // Other stats would be updated here if we had the data
    }

    showNotification(message, type = 'info') {
        const notificationContainer = document.getElementById('notification-container');
        if (!notificationContainer) return;
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icon = document.createElement('i');
        icon.className = `fas ${this.getNotificationIcon(type)}`;
        
        const textSpan = document.createElement('span');
        textSpan.textContent = message;
        
        notification.appendChild(icon);
        notification.appendChild(textSpan);
        
        notificationContainer.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => {
                notification.remove();
            }, 500);
        }, 5000);
    }
    
    getNotificationIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    initModals() {
        // Close modal when clicking on close button or outside the modal
        document.querySelectorAll('.close-modal').forEach(closeBtn => {
            closeBtn.addEventListener('click', () => {
                const modalId = closeBtn.getAttribute('data-modal');
                this.closeModal(modalId);
            });
        });

        // Close modal when clicking outside of it
        window.addEventListener('click', (event) => {
            document.querySelectorAll('.modal').forEach(modal => {
                if (event.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }

    initNavigation() {
        const navItems = document.querySelectorAll('.sidebar-nav li');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const tabId = item.getAttribute('data-tab');
                this.switchTab(tabId);
            });
        });
    }

    switchTab(tabId) {
        // Update active nav item
        document.querySelectorAll('.sidebar-nav li').forEach(item => {
            item.classList.toggle('active', item.getAttribute('data-tab') === tabId);
        });

        // Update active section
        document.querySelectorAll('.dashboard-section').forEach(section => {
            section.classList.toggle('active', section.id === tabId);
        });
    }

    setupEventListeners() {
        // Add mentee button
        const addMenteeBtn = document.getElementById('add-mentee-btn');
        if (addMenteeBtn) {
            addMenteeBtn.addEventListener('click', () => this.openAddMenteeModal());
        }
        
        // Confirm add mentee button
        const confirmAddMenteeBtn = document.getElementById('confirm-add-mentee-btn');
        if (confirmAddMenteeBtn) {
            confirmAddMenteeBtn.addEventListener('click', () => this.handleAddMentee());
        }
        
        // Cancel remove mentee button
        const cancelRemoveMenteeBtn = document.getElementById('cancel-remove-mentee-btn');
        if (cancelRemoveMenteeBtn) {
            cancelRemoveMenteeBtn.addEventListener('click', () => this.closeModal('remove-mentee-modal'));
        }
        
        // Confirm remove mentee button
        const confirmRemoveMenteeBtn = document.getElementById('confirm-remove-mentee-btn');
        if (confirmRemoveMenteeBtn) {
            confirmRemoveMenteeBtn.addEventListener('click', () => this.handleRemoveMentee());
        }
        
        // Mentee search input
        const menteeSearchInput = document.getElementById('mentee-search');
        if (menteeSearchInput) {
            menteeSearchInput.addEventListener('input', (e) => this.filterMentees(e.target.value));
        }
        
        // Send message button
        const sendMessageBtn = document.getElementById('send-message-btn');
        if (sendMessageBtn) {
            sendMessageBtn.addEventListener('click', () => {
                const messageInput = document.getElementById('message-input');
                if (messageInput && messageInput.value.trim()) {
                    this.sendMessage(messageInput.value.trim());
                    this.closeModal('message-modal');
                }
            });
        }
        
        // Schedule meeting button
        const scheduleBtn = document.getElementById('schedule-meeting-btn');
        if (scheduleBtn) {
            scheduleBtn.addEventListener('click', () => {
                const dateInput = document.getElementById('meeting-date');
                const timeInput = document.getElementById('meeting-time');
                
                if (dateInput && timeInput && dateInput.value && timeInput.value) {
                    this.scheduleMeeting({
                        menteeId: this.selectedMenteeId,
                        date: dateInput.value,
                        time: timeInput.value
                    });
                    this.closeModal('schedule-meeting-modal');
                } else {
                    this.showNotification('Please fill in all required fields', 'warning');
                }
            });
        }
    }
    
    sendMessage(message) {
        if (!message || !this.selectedMenteeId) {
            this.showNotification('Cannot send message: Missing message or recipient', 'error');
            return;
        }
        
        try {
            // In a real implementation, this would send the message to the server
            console.log(`Sending message to mentee ${this.selectedMenteeId}: ${message}`);
            this.showNotification('Message sent successfully', 'success');
            
            // Clear message input
            const messageInput = document.getElementById('message-input');
            if (messageInput) {
                messageInput.value = '';
            }
        } catch (error) {
            console.error('Error sending message:', error);
            this.showNotification('Failed to send message', 'error');
        }
    }
    
    scheduleMeeting(meetingData) {
        if (!meetingData || !meetingData.menteeId) {
            this.showNotification('Cannot schedule meeting: Missing mentee information', 'error');
            return;
        }
        
        try {
            // In a real implementation, this would send the data to the server
            console.log('Scheduling meeting:', meetingData);
            this.showNotification(`Meeting scheduled with mentee on ${meetingData.date} at ${meetingData.time}`, 'success');
        } catch (error) {
            console.error('Error scheduling meeting:', error);
            this.showNotification('Failed to schedule meeting', 'error');
        }
    }

    async loadMessages() {
        try {
            this.messages = await this.api.getMessages(this.currentUser.mentor_id);
            this.renderMessages();
        } catch (error) {
            console.error('Error loading messages:', error);
            this.showNotification('Failed to load messages', 'error');
        }
    }

    async loadBroadcastMessages() {
        try {
            this.broadcastMessages = await this.api.getBroadcastMessages(this.currentUser.mentor_id);
            this.renderBroadcastMessages();
        } catch (error) {
            console.error('Error loading broadcast messages:', error);
            this.showNotification('Failed to load broadcast messages', 'error');
        }
    }

    async loadAchievements() {
        try {
            this.achievements = await this.api.getAchievements(this.currentUser.mentor_id);
            this.renderAchievements();
        } catch (error) {
            console.error('Error loading achievements:', error);
            this.showNotification('Failed to load achievements', 'error');
        }
    }

    async loadActivityLogs() {
        try {
            this.activityLogs = await this.api.getActivityLogs(this.currentUser.mentor_id);
            this.renderActivityLogs();
        } catch (error) {
            console.error('Error loading activity logs:', error);
            this.showNotification('Failed to load activity logs', 'error');
        }
    }

    renderMessages() {
        const messagesContainer = document.getElementById('messages-list');
        if (!messagesContainer) return;

        messagesContainer.innerHTML = this.messages.map(message => `
            <div class="message-card ${message.sender_id === this.currentUser.mentor_id ? 'sent' : 'received'}">
                <div class="message-header">
                    <span class="sender-name">${message.sender_name}</span>
                    <span class="timestamp">${new Date(message.timestamp).toLocaleString()}</span>
                </div>
                <div class="message-content">${message.message}</div>
            </div>
        `).join('');
    }

    renderBroadcastMessages() {
        const broadcastContainer = document.getElementById('broadcast-messages-list');
        if (!broadcastContainer) return;

        broadcastContainer.innerHTML = this.broadcastMessages.map(message => `
            <div class="broadcast-message-card">
                <div class="message-header">
                    <span class="timestamp">${new Date(message.timestamp).toLocaleString()}</span>
                </div>
                <div class="message-content">${message.message}</div>
            </div>
        `).join('');
    }

    renderAchievements() {
        const achievementsContainer = document.getElementById('achievements-list');
        if (!achievementsContainer) return;

        achievementsContainer.innerHTML = this.achievements.map(achievement => `
            <div class="achievement-card">
                <div class="achievement-header">
                    <h3>${achievement.title}</h3>
                    <span class="mentee-name">${achievement.mentee_name}</span>
                </div>
                <div class="achievement-content">
                    <p>${achievement.description}</p>
                    <p class="date">Submitted: ${new Date(achievement.date_submitted).toLocaleDateString()}</p>
                    <p class="status ${achievement.status}">Status: ${achievement.status}</p>
                </div>
                ${achievement.status === 'pending' ? `
                    <div class="achievement-actions">
                        <button class="action-btn approve-achievement" data-achievement-id="${achievement.achievement_id}">
                            <i class="fas fa-check"></i> Approve
                        </button>
                        <button class="action-btn reject-achievement" data-achievement-id="${achievement.achievement_id}">
                            <i class="fas fa-times"></i> Reject
                        </button>
                    </div>
                ` : ''}
            </div>
        `).join('');

        this.addAchievementActionListeners();
    }

    renderActivityLogs() {
        const logsContainer = document.getElementById('activity-logs-list');
        if (!logsContainer) return;

        logsContainer.innerHTML = this.activityLogs.map(log => `
            <div class="activity-log-card">
                <div class="log-header">
                    <span class="mentee-name">${log.mentee_name}</span>
                    <span class="timestamp">${new Date(log.timestamp).toLocaleString()}</span>
                </div>
                <div class="log-content">
                    <p class="activity-type">${log.activity_type}</p>
                    <p>${log.description}</p>
                </div>
            </div>
        `).join('');
    }

    async approveAchievement(achievementId) {
        try {
            const remarks = prompt('Enter your remarks for this achievement:');
            if (!remarks) return;

            await this.api.approveAchievement(achievementId, remarks);
            this.showNotification('Achievement approved successfully', 'success');
            await this.loadAchievements();
        } catch (error) {
            console.error('Error approving achievement:', error);
            this.showNotification('Failed to approve achievement', 'error');
        }
    }

    addAchievementActionListeners() {
        document.querySelectorAll('.approve-achievement').forEach(button => {
            button.addEventListener('click', (e) => {
                const achievementId = e.target.closest('.approve-achievement').dataset.achievementId;
                this.approveAchievement(achievementId);
            });
        });

        document.querySelectorAll('.reject-achievement').forEach(button => {
            button.addEventListener('click', (e) => {
                const achievementId = e.target.closest('.reject-achievement').dataset.achievementId;
                this.rejectAchievement(achievementId);
            });
        });
    }
}

// Initialize the dashboard when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const dashboard = new MentorDashboard();
});

class MentorDashboard {
    constructor() {
        // Get current user data immediately. Redirect if not a mentor.
        // Note: Assumes UserManager is globally available or imported.
        this.currentUser = UserManager.getCurrentUser();
        if (!this.currentUser || this.currentUser.role !== 'mentor') {
            console.error("User is not a mentor or not logged in. Redirecting...");
            // Assuming getBaseUrl is available or defined elsewhere
            window.location.href = getBaseUrl() + 'mit-wpu-login.html';
            return; // Stop initialization if redirecting
        }
        console.log("Current Mentor User:", this.currentUser); // Log mentor data
        this.init();
    }

    init() {
        this.updateDateTime();
        this.renderMenteeList();
        this.renderTaskList();
        this.setupEventListeners();
        this.setupModalEventListeners(); // Add this line
    }

    // --- Modal Helper Functions ---
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex'; // Use flex to center content
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
        // Also hide the achievement form when closing the main modal
        this.hideAchievementForm();
    }

    hideAchievementForm() {
        const form = document.getElementById('addAchievementForm');
        const achievementIdToEdit = document.getElementById('achievementIdToEdit');
        if (form) form.style.display = 'none';
        if (achievementIdToEdit) achievementIdToEdit.value = ''; // Clear edit state
        // Optionally clear form fields here
        document.getElementById('achievementTitle').value = '';
        document.getElementById('achievementDescription').value = '';
        document.getElementById('achievementDate').value = '';
        document.getElementById('achievementBadgeIcon').value = '';
        document.getElementById('achievementMenteeId').value = '';
    }
    // --- End Modal Helper Functions ---


    updateDateTime() {
        const updateTime = () => {
            const now = new Date();
            document.getElementById('current-date').textContent = now.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            document.getElementById('current-time').textContent = now.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
            });
        };
        updateTime();
        setInterval(updateTime, 1000);
    }

    async renderMenteeList() { // Make the function async to use await
        const menteeList = document.getElementById('mentee-list');
        menteeList.innerHTML = '<p>Loading mentees...</p>'; // Show loading state

        try {
            // Fetch all necessary data in parallel
            const [viewRes, usersRes, menteeRes, achievementRes] = await Promise.all([
                fetch('/api/mentee_academic_view'), // Core academic info
                fetch('/api/users'),                 // For PRN and potentially name
                fetch('/api/mentee'),                 // To link mentee_id to unique_user_no
                fetch('/api/achievement')              // For achievement count
            ]);

            // Check all responses
            if (!viewRes.ok) throw new Error(`Mentee View fetch failed: ${viewRes.status}`);
            if (!usersRes.ok) throw new Error(`Users fetch failed: ${usersRes.status}`);
            if (!menteeRes.ok) throw new Error(`Mentee fetch failed: ${menteeRes.status}`);
            if (!achievementRes.ok) throw new Error(`Achievement fetch failed: ${achievementRes.status}`);

            const menteeViews = await viewRes.json();
            const users = await usersRes.json();
            const mentees = await menteeRes.json();
            const achievements = await achievementRes.json();

            if (!menteeViews || menteeViews.length === 0) {
                menteeList.innerHTML = '<p>No mentees found.</p>';
                return;
            }

            // --- Data Processing ---
            // Create lookup maps for efficient data combination
            const userMap = new Map(users.map(u => [u.unique_user_no, u])); // Map unique_user_no to user object
            // Combine mentee info (including mentor_id) with user info
            const menteeDataMap = new Map(mentees.map(m => [m.mentee_id, { ...m, user: userMap.get(m.unique_user_no) }]));
            const achievementCounts = achievements.reduce((acc, ach) => {
                acc[ach.mentee_id] = (acc[ach.mentee_id] || 0) + 1;
                return acc;
            }, {}); // Map mentee_id to achievement count


            // --- Filtering based on logged-in mentor ---
            const mentorId = this.currentUser.mentor_id; // Get mentor_id from logged-in user
            if (mentorId === undefined) {
                 console.error("Mentor ID not found in currentUser object:", this.currentUser);
                 menteeList.innerHTML = '<p class="text-danger">Could not identify the current mentor. Unable to load mentees.</p>';
                 return;
            }

            const filteredMenteeViews = menteeViews.filter(menteeView => {
                const menteeData = menteeDataMap.get(menteeView.mentee_id);
                return menteeData && menteeData.mentor_id === mentorId;
            });

             if (filteredMenteeViews.length === 0) {
                menteeList.innerHTML = '<p>You currently have no assigned mentees.</p>';
                return;
            }

            // --- Rendering ---
            menteeList.innerHTML = filteredMenteeViews.map(menteeView => {
                const menteeData = menteeDataMap.get(menteeView.mentee_id); // Includes user info now
                const user = menteeData ? menteeData.user : null;
                const achievementCount = achievementCounts[menteeView.mentee_id] || 0;
                const prn = user ? user.prn_id : 'N/A';
                // Prefer official_mail_id for name if available, fallback to mentee_email from view
                const displayName = user ? user.official_mail_id.split('@')[0] : menteeView.mentee_email.split('@')[0];

                return `
                    <div class="mentee-card card" data-mentee-id="${menteeView.mentee_id}" data-user-no="${uniqueUserNo || ''}">
                        <div class="mentee-header">
                            <div class="mentee-avatar"><i class="fas fa-user-graduate fa-2x"></i></div>
                            <div class="mentee-info">
                                {/* Display name derived from user data */}
                                <h3>${displayName}</h3>
                                {/* Using columns from mentee_academic_view */}
                                <p>${menteeView.course || 'N/A'} - Year ${menteeView.year || 'N/A'}</p>
                                <div class="mentee-badges">
                                    {/* Using attendance from mentee_academic_view */}
                                    <span class="badge ${this.getStatusClass(menteeView.attendance || 0)}">
                                        ${this.getAttendanceStatus(menteeView.attendance || 0)}
                                    </span>
                                    {/* Displaying PRN from user data */}
                                    <span class="badge badge-info">PRN: ${prn}</span>
                                </div>
                            </div>
                        </div>
                        <div class="mentee-body">
                            <div class="mentee-stat">
                                <span>Attendance</span>
                                <div class="progress-bar-container">
                                    {/* Using attendance from mentee_academic_view */}
                                    <div class="progress-bar" style="width: ${menteeView.attendance || 0}%"></div>
                                </div>
                                <span>${menteeView.attendance || 0}%</span>
                            </div>
                            {/* Displaying achievement count */}
                            <div class="mentee-achievements">Achievements: ${achievementCount}</div>
                        </div>
                    </div>
                `;
            }).join('');

            // Add event listeners AFTER rendering the list
            this.addMenteeCardListeners();

        } catch (error) {
            console.error('Error fetching mentee list:', error);
            menteeList.innerHTML = '<p class="text-danger">Could not load mentee list. Please try again later.</p>';
        }
    }

    addMenteeCardListeners() {
        const menteeCards = document.querySelectorAll('#mentee-list .mentee-card');
        menteeCards.forEach(card => {
            card.addEventListener('click', () => {
                const menteeId = card.dataset.menteeId;
                if (menteeId) {
                    this.showMenteeDetails(menteeId);
                } else {
                    console.error("Mentee ID not found on card:", card);
                }
            });
            // Add hover effect or cursor pointer if needed via CSS or JS
            card.style.cursor = 'pointer';
        });
    }

    async showMenteeDetails(menteeId) {
        console.log(`Showing details for mentee ID: ${menteeId}`);
        const modalBody = document.getElementById('modalMenteeBody');
        const modalName = document.getElementById('modalMenteeName');
        const modalAchievements = document.getElementById('modalMenteeAchievements');
        const addAchievementBtn = document.getElementById('addAchievementBtn');
        const achievementMenteeIdField = document.getElementById('achievementMenteeId'); // Get hidden field

        // Set loading states
        modalName.textContent = 'Loading...';
        modalBody.innerHTML = '<p>Loading details...</p>';
        modalAchievements.innerHTML = '<p>Loading achievements...</p>';
        addAchievementBtn.onclick = null; // Clear previous listener
        achievementMenteeIdField.value = menteeId; // Store menteeId for the achievement form

        try {
            // Fetch mentee academic details, user details, and mentee record in parallel
            // Assuming API endpoints like /api/mentee_academics/:id and /api/mentee/:id exist
            // If not, adjust fetch URLs or fetch all and filter client-side (less efficient)
            const [academicRes, userRes, menteeRes] = await Promise.all([
                fetch(`/api/mentee_academics/${menteeId}`), // Fetch specific academic record
                fetch(`/api/users`), // Fetch all users to find the specific one
                fetch(`/api/mentee/${menteeId}`) // Fetch specific mentee record
            ]);

            // Check responses carefully
            if (!academicRes.ok && academicRes.status !== 404) throw new Error(`Academic details fetch failed: ${academicRes.status}`);
            if (!userRes.ok) throw new Error(`Users fetch failed: ${userRes.status}`);
            if (!menteeRes.ok && menteeRes.status !== 404) throw new Error(`Mentee record fetch failed: ${menteeRes.status}`);

            const academicData = academicRes.status !== 404 ? await academicRes.json() : null; // Handle potential 404
            const users = await userRes.json();
            const menteeData = menteeRes.status !== 404 ? await menteeRes.json() : null; // Handle potential 404

            if (!menteeData) throw new Error(`Mentee record not found for ID: ${menteeId}`);

            // Find the specific user associated with this mentee
            const user = users.find(u => u.unique_user_no === menteeData.unique_user_no);

            if (!user) throw new Error(`User not found for mentee ID: ${menteeId} (unique_user_no: ${menteeData.unique_user_no})`);

            const displayName = user.official_mail_id.split('@')[0];
            modalName.textContent = `Details for ${displayName}`;

            // Populate modal body - Use data safely, checking if academicData exists
            modalBody.innerHTML = `
                <p><strong>Email:</strong> ${user.official_mail_id}</p>
                <p><strong>PRN ID:</strong> ${user.prn_id}</p>
                <p><strong>Phone:</strong> ${user.phone_num || 'N/A'}</p>
                <hr>
                <h4>Academic Information</h4>
                ${academicData ? `
                    <p><strong>Course:</strong> ${academicData.course || 'N/A'}</p>
                    <p><strong>Year:</strong> ${academicData.year || 'N/A'}</p>
                    <p><strong>Attendance:</strong> ${academicData.attendance !== null ? academicData.attendance + '%' : 'N/A'}</p>
                    <p><strong>Academic Context:</strong> ${academicData.academic_context || 'N/A'}</p>
                    <p><strong>Academic Background:</strong></p>
                    <p>${academicData.academic_background || 'N/A'}</p>
                ` : '<p>No academic details found.</p>'}
            `;

            // Setup "Add Achievement" button listener for this specific mentee
            addAchievementBtn.onclick = () => this.showAddAchievementForm(menteeId);

            // Load achievements
            this.loadAchievements(menteeId);

            // Open the modal
            this.openModal('menteeDetailModal');

        } catch (error) {
            console.error('Error fetching mentee details:', error);
            modalName.textContent = 'Error';
            modalBody.innerHTML = `<p class="text-danger">Could not load mentee details: ${error.message}</p>`;
            modalAchievements.innerHTML = ''; // Clear achievements section on error
            this.openModal('menteeDetailModal'); // Still open modal to show error
        }
    }

    async loadAchievements(menteeId) {
        const achievementsContainer = document.getElementById('modalMenteeAchievements');
        achievementsContainer.innerHTML = '<p>Loading achievements...</p>';

        try {
            // Assuming the backend API supports filtering achievements by mentee_id
            const response = await fetch(`/api/achievement?mentee_id=${menteeId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const achievements = await response.json();

            if (!achievements || achievements.length === 0) {
                achievementsContainer.innerHTML = '<p>No achievements recorded yet.</p>';
                return;
            }

            // Render achievements with Edit and Delete buttons
            achievementsContainer.innerHTML = achievements.map(ach => `
                <div class="achievement-item" data-achievement-id="${ach.achvmt_id}">
                    <div class="achievement-details">
                        <strong>${ach.title || 'N/A'}</strong> (${ach.date_awarded ? new Date(ach.date_awarded).toLocaleDateString() : 'N/A'})
                        <p>${ach.description || 'No description'}</p>
                        ${ach.badge_icon ? `<p><small>Badge: ${ach.badge_icon}</small></p>` : ''}
                    </div>
                    <div class="achievement-actions">
                        <button class="btn-secondary btn-sm edit-achievement">Edit</button>
                        <button class="btn-danger btn-sm delete-achievement">Delete</button>
                    </div>
                </div>
            `).join('');

        } catch (error) {
            console.error('Error fetching achievements:', error);
            achievementsContainer.innerHTML = '<p class="text-danger">Could not load achievements.</p>';
        }
    }

    showAddAchievementForm(menteeId, achievementToEdit = null) {
        const form = document.getElementById('addAchievementForm');
        const menteeIdField = document.getElementById('achievementMenteeId');
        const achievementIdField = document.getElementById('achievementIdToEdit');
        const titleField = document.getElementById('achievementTitle');
        const descriptionField = document.getElementById('achievementDescription');
        const dateField = document.getElementById('achievementDate');
        const badgeIconField = document.getElementById('achievementBadgeIcon');

        menteeIdField.value = menteeId; // Ensure mentee ID is set

        if (achievementToEdit) {
            // Populate form for editing
            achievementIdField.value = achievementToEdit.achvmt_id;
            titleField.value = achievementToEdit.title || '';
            descriptionField.value = achievementToEdit.description || '';
            // Format date correctly for input type="date" (YYYY-MM-DD)
            dateField.value = achievementToEdit.date_awarded ? new Date(achievementToEdit.date_awarded).toISOString().split('T')[0] : '';
            badgeIconField.value = achievementToEdit.badge_icon || '';
            form.querySelector('h4').textContent = 'Edit Achievement'; // Change form title
        } else {
            // Clear form for adding new
            achievementIdField.value = '';
            titleField.value = '';
            descriptionField.value = '';
            dateField.value = '';
            badgeIconField.value = '';
            form.querySelector('h4').textContent = 'New Achievement'; // Reset form title
        }

        form.style.display = 'block'; // Show the form
    }

    async saveAchievement() {
        const menteeId = document.getElementById('achievementMenteeId').value;
        const achievementId = document.getElementById('achievementIdToEdit').value;
        const title = document.getElementById('achievementTitle').value;
        const description = document.getElementById('achievementDescription').value;
        const date_awarded = document.getElementById('achievementDate').value;
        const badge_icon = document.getElementById('achievementBadgeIcon').value;
        const mentorId = this.currentUser.mentor_id; // Get mentor ID from logged-in user

        if (!title || !description || !date_awarded || !menteeId) {
            alert('Mentee ID, Title, Description, and Date Awarded are required.');
            return;
        }
         if (mentorId === undefined) {
             alert('Error: Could not identify the current mentor. Cannot save achievement.');
             return;
         }


        const achievementData = {
            mentor_id: mentorId, // Associate with the current mentor
            mentee_id: parseInt(menteeId, 10),
            title,
            description,
            date_awarded,
            badge_icon: badge_icon || null // Send null if empty
        };

        const isEditing = !!achievementId;
        // Assuming backend routes like /api/achievement/:id for PUT/DELETE
        const url = isEditing ? `/api/achievement/${achievementId}` : '/api/achievement';
        const method = isEditing ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(achievementData)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Unknown error saving achievement.' }));
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            alert(`Achievement ${isEditing ? 'updated' : 'added'} successfully!`);
            this.hideAchievementForm(); // Hide form on success
            this.loadAchievements(menteeId); // Reload achievements in the modal
            this.renderMenteeList(); // Also refresh the main mentee list to update counts

        } catch (error) {
            console.error('Error saving achievement:', error);
            alert(`Error saving achievement: ${error.message}`);
        }
    }

    async deleteAchievement(achievementId, menteeId) {
        if (!confirm('Are you sure you want to delete this achievement?')) {
            return;
        }

        try {
            // Assuming backend route /api/achievement/:id for DELETE
            const response = await fetch(`/api/achievement/${achievementId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                 const errorData = await response.json().catch(() => ({ message: 'Unknown error deleting achievement.' }));
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            alert('Achievement deleted successfully!');
            this.loadAchievements(menteeId); // Reload achievements in the modal
            this.renderMenteeList(); // Refresh main list to update counts

        } catch (error) {
            console.error('Error deleting achievement:', error);
            alert(`Error deleting achievement: ${error.message}`);
        }
    }

    async renderTaskList() { // Make the function async
        const taskList = document.getElementById('task-list');
        taskList.innerHTML = '<p>Loading tasks...</p>'; // Show loading state

        try {
            // Fetch data from the communication table
            const response = await fetch('/api/communication');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            let communications = await response.json();

            // --- Filtering based on logged-in mentor ---
            const mentorUserId = this.currentUser.id; // Get user ID (unique_user_no) from logged-in user
             if (mentorUserId === undefined) {
                 console.error("Mentor User ID not found in currentUser object:", this.currentUser);
                 taskList.innerHTML = '<p class="text-danger">Could not identify the current mentor. Unable to load tasks.</p>';
                 return;
            }

            // Filter communications where the mentor is either the sender or receiver
            communications = communications.filter(comm =>
                comm.sender_id === mentorUserId || comm.receiver_id === mentorUserId
            );


            if (!communications || communications.length === 0) {
                taskList.innerHTML = '<p>No relevant communications found.</p>'; // Updated message
                return;
            }

            // Map over the filtered communication data
            // NOTE: Mapping communication status ('sent', 'delivered', 'read') to task status ('Pending', 'In Progress', 'Completed') is an approximation.
            taskList.innerHTML = communications.map(comm => {
                // Simple status mapping: 'read' -> 'Completed', others -> 'Pending'
                // A more complex mapping or a dedicated status field might be needed.
                const taskStatus = comm.message_status === 'read' ? 'Completed' : 'Pending';

                return `
                    <div class="task-card" data-comm-id="${comm.comm_id}">
                        {/* Using message_content from communication table */}
                        <h4>${comm.message_content || 'N/A'}</h4>
                        {/* Using timestamp from communication table */}
                        <p>Time: ${new Date(comm.timestamp).toLocaleString() || 'N/A'}</p>
                        {/* Using mapped status */}
                        <span class="badge ${this.getTaskStatusClass(taskStatus)}">${taskStatus}</span>
                    </div>
                `;
            }).join('');

        } catch (error) {
            console.error('Error fetching communication list:', error); // Updated error message
            taskList.innerHTML = '<p class="text-danger">Could not load communications. Please try again later.</p>'; // Updated error message
        }
    }

    // Separate listener setup for modal elements
    setupModalEventListeners() {
        const modal = document.getElementById('menteeDetailModal');
        if (!modal) return;

        // Close button inside modal
        const closeBtn = modal.querySelector('.close-button');
        if (closeBtn) {
            // Check if listener already exists to avoid duplicates if init runs multiple times
            if (!closeBtn.dataset.listenerAttached) {
                closeBtn.addEventListener('click', () => this.closeModal('menteeDetailModal'));
                closeBtn.dataset.listenerAttached = 'true';
            }
        }

        // Add Achievement button (listener added dynamically in showMenteeDetails)

        // Save Achievement button
        const saveBtn = document.getElementById('saveAchievementBtn');
        if (saveBtn && !saveBtn.dataset.listenerAttached) {
            saveBtn.addEventListener('click', () => this.saveAchievement());
            saveBtn.dataset.listenerAttached = 'true';
        }

        // Cancel Achievement button (in the form)
        const cancelBtn = document.getElementById('addAchievementForm').querySelector('.btn-secondary');
         if (cancelBtn && !cancelBtn.dataset.listenerAttached) {
            cancelBtn.addEventListener('click', () => this.hideAchievementForm());
            cancelBtn.dataset.listenerAttached = 'true';
        }


        // Event delegation for Edit/Delete achievement buttons
        const achievementsContainer = document.getElementById('modalMenteeAchievements');
        if (achievementsContainer && !achievementsContainer.dataset.listenerAttached) {
            achievementsContainer.addEventListener('click', async (event) => {
                const target = event.target;
                const achievementItem = target.closest('.achievement-item');
                if (!achievementItem) return;

                const achievementId = achievementItem.dataset.achievementId;
                // Get current mentee ID from the hidden field within the modal
                const menteeId = document.getElementById('achievementMenteeId').value;

                if (!menteeId) {
                    console.error("Mentee ID not found in modal context for achievement action.");
                    return;
                }


                if (target.classList.contains('edit-achievement')) {
                    // Fetch the specific achievement data again to ensure freshness
                    try {
                        // Assuming an endpoint like /api/achievement/:id exists
                        const res = await fetch(`/api/achievement/${achievementId}`);
                        if (!res.ok) throw new Error(`Could not fetch achievement details for editing. Status: ${res.status}`);
                        const achievementData = await res.json();
                        // Pass the menteeId along with the achievement data
                        this.showAddAchievementForm(menteeId, achievementData);
                    } catch (error) {
                        console.error("Error fetching achievement for edit:", error);
                        alert(`Could not load achievement details for editing: ${error.message}`);
                    }
                } else if (target.classList.contains('delete-achievement')) {
                    this.deleteAchievement(achievementId, menteeId);
                }
            });
             achievementsContainer.dataset.listenerAttached = 'true';
        }


        // Close modal if clicking outside the content (on the backdrop)
        // Ensure this listener is added only once
        if (!modal.dataset.backdropListenerAttached) {
            modal.addEventListener('click', (event) => {
                // Check if the click is directly on the modal backdrop itself
                if (event.target === modal) {
                    this.closeModal('menteeDetailModal');
                }
            });
            modal.dataset.backdropListenerAttached = 'true';
        }
    }


    setupEventListeners() {
        // Existing listeners...
        const menteeFilter = document.getElementById('mentee-filter');
        if (menteeFilter) {
            menteeFilter.addEventListener('change', () => {
                // Future implementation for filtering
                console.log('Mentee filter changed');
            });
        }

        const addMenteeBtn = document.getElementById('add-mentee');
        if (addMenteeBtn) {
            addMenteeBtn.addEventListener('click', async () => {
                const uniqueUserNo = prompt("Enter unique user number:");
                const mentorId = prompt("Enter mentor ID:");
                if (!uniqueUserNo || !mentorId) return; // Handle cancel or empty input

                try {
                    const response = await fetch('/api/mentee', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ unique_user_no: uniqueUserNo, mentor_id: mentorId })
                }); // Added semicolon


                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(`Error creating mentee: ${errorData.message}`);
                    }

                    const data = await response.json();
                    alert(`Mentee created successfully! ID: ${data.insertId}`);
                    this.renderMenteeList(); // Refresh the mentee list

                } catch (error) {
                    alert(`Error creating mentee: ${error.message}`);
                }
            });
        }

        const createTaskBtn = document.getElementById('create-task');
        if (createTaskBtn) {
            createTaskBtn.addEventListener('click', async () => { // Make async
                const menteeUserNo = prompt("Enter the unique user number of the mentee to assign the task:");
                const taskContent = prompt("Enter the task description:");

                if (!menteeUserNo || !taskContent) {
                    alert("Mentee user number and task description are required.");
                    return; // Exit if user cancels or provides no input
                }

                const senderId = this.currentUser.id; // Mentor's user ID

                // Basic validation (can be improved)
                if (!senderId) {
                    alert("Error: Could not identify the sender (mentor). Please log in again.");
                    return;
                }

                // Find the receiver's user ID (mentee's user ID) - assuming menteeUserNo is the unique_user_no
                // In a real app, you'd likely fetch users or have them cached to validate menteeUserNo exists
                const receiverId = parseInt(menteeUserNo, 10); // Assuming the input is the user ID directly
                if (isNaN(receiverId)) {
                    alert("Invalid mentee user number provided.");
                    return;
                }


                try {
                    const response = await fetch('/api/communication', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            sender_id: senderId,
                            receiver_id: receiverId,
                            message_content: taskContent,
                            message_status: 'sent', // Or 'delivered' depending on logic
                            type: 'task' // Indicate this is a task assignment
                        })
                    });

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({ message: 'Unknown error' })); // Handle non-JSON error response
                        throw new Error(`Error creating task: ${errorData.message || response.statusText}`);
                    }

                    const data = await response.json();
                    alert(`Task created successfully! Communication ID: ${data.insertId}`);
                    this.renderTaskList(); // Refresh the task list

                } catch (error) {
                    console.error('Error creating task:', error);
                    alert(`Error creating task: ${error.message}`);
                }
            });
        }
    }

    getStatusClass(attendance) {
        if (attendance >= 90) return 'badge-success';
        if (attendance >= 80) return 'badge-info';
        if (attendance >= 70) return 'badge-warning';
        return 'badge-danger';
    }

    getAttendanceStatus(attendance) {
        if (attendance >= 90) return 'Excellent';
        if (attendance >= 80) return 'Good';
        if (attendance >= 70) return 'Average';
        return 'Needs Improvement';
    }

    getTaskStatusClass(status) {
        switch (status) {
            case 'Completed': return 'badge-success';
            case 'In Progress': return 'badge-info';
            case 'Pending': return 'badge-warning';
            default: return 'badge-secondary';
        }
    }

    // Removed static init method
}

// Make modal close/hide functions globally accessible if called directly from HTML onclick
// Need to ensure the instance is available
let mentorDashboardInstance = null;

window.closeModal = (modalId) => {
    if (mentorDashboardInstance) {
        mentorDashboardInstance.closeModal(modalId);
    } else {
        console.error("MentorDashboard instance not available for closeModal");
    }
};
window.hideAchievementForm = () => {
     if (mentorDashboardInstance) {
        mentorDashboardInstance.hideAchievementForm();
    } else {
         console.error("MentorDashboard instance not available for hideAchievementForm");
     }
};


document.addEventListener('DOMContentLoaded', () => {
    // Create and store the instance
    mentorDashboardInstance = new MentorDashboard();
    // Ensure UserManager is loaded and available if needed by constructor
    if (typeof UserManager === 'undefined') {
         console.error("UserManager is not defined. Cannot initialize MentorDashboard correctly.");
         // Optionally display an error to the user on the page
    }
});

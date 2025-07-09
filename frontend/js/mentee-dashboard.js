document.addEventListener('DOMContentLoaded', async () => { // Corrected syntax and made async
    console.log('Mentee Dashboard JS Loaded');

    // --- Retrieve User Info from Session Storage ---
    const loggedInUserId = sessionStorage.getItem('userId');
    const loggedInUserRole = sessionStorage.getItem('userRole');

    // --- Redirect to login if not logged in ---
    if (!loggedInUserId) {
        console.log("User not logged in. Redirecting to login page.");
        window.location.href = '/mit-wpu-login.html'; // Adjust path if needed
        return; // Stop script execution if not logged in
    }

    console.log(`Logged in User ID: ${loggedInUserId}, Role: ${loggedInUserRole}`);

    // --- Mentee Dashboard Specific Logic ---
    let currentUniqueUserNo = parseInt(loggedInUserId, 10); // This is the unique_user_no
    let currentMenteeId = null; // This will be fetched

    // --- Element References ---
    const menteeSelect = document.getElementById('mentee-select');
    const menteeGreeting = document.getElementById('mentee-greeting');
    const menteeCourseYear = document.getElementById('mentee-course-year');
    const menteeProfilePic = document.getElementById('mentee-profile-pic');
    const mentorNameWelcome = document.getElementById('mentor-name');
    const mentorEmailWelcome = document.getElementById('mentor-email');
    const academicCourse = document.getElementById('academic-course');
    const academicAttendance = document.getElementById('academic-attendance');
    const attendanceBar = document.getElementById('attendance-bar');
    const academicContext = document.getElementById('academic-context');
    // Removed: academicBackground, academicBackgroundCard
    // Removed: upcomingMeetingsList, remindersList
    const newMessageBtn = document.getElementById('new-message-btn');
    const newMessageArea = document.getElementById('new-message-area');
    const newMessageText = document.getElementById('new-message-text');
    const messageAttachment = document.getElementById('message-attachment');
    const sendMessageBtn = document.getElementById('send-message-btn');
    const messageList = document.getElementById('message-list');
    // Removed: newAlertBtn, newAlertArea, alertReason, sendAlertBtn, alertList
    const achievementFilter = document.getElementById('achievement-filter');
    const achievementList = document.getElementById('achievement-list');
    const submitFeedbackBtn = document.getElementById('submit-feedback-btn');
const submitFeedbackArea = document.getElementById('submit-feedback-area');
const feedbackText = document.getElementById('feedback-text');
const sendFeedbackBtn = document.getElementById('send-feedback-btn');
const feedbackList = document.getElementById('feedback-list');
    const mentorDetailName = document.getElementById('mentor-detail-name');
    const mentorDetailEmail = document.getElementById('mentor-detail-email');
    // Removed: mentorDetailPhone, mentorPhoneLine
    const mentorDetailRoom = document.getElementById('mentor-detail-room');
    const mentorRoomLine = document.getElementById('mentor-room-line'); // Keep for room conditional display
    const mentorDetailDept = document.getElementById('mentor-detail-dept');
    const mentorTimetable = document.getElementById('mentor-timetable');
    const currentDateSpan = document.getElementById('current-date');
    const currentTimeSpan = document.getElementById('current-time');

    // --- Helper function for API calls ---
    async function apiFetch(url, options = {}) {
        // Simplified loading states - only for achievements now
        if (url.includes('/api/mentee/achievements')) {
            achievementList.innerHTML = '<p class="no-data">Loading achievements...</p>';
        }

        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(`HTTP error! status: ${response.status} - ${errorData.message}`);
            }
            if (response.status === 204) {
                return null;
            }
            return await response.json();
        } catch (error) {
            console.error(`Error fetching ${url}:`, error);
            // Simplified error display
            if (url.includes('/api/mentee/achievements')) {
                achievementList.innerHTML = '<p class="no-data error">Error loading achievements.</p>';
            }
            // Removed error handling for calendar/alerts
            throw error;
        }
    }

    // --- Data Fetching Functions ---

    // Assigned Mentor Info
    async function fetchMentorInfo(menteeId) {
        if (!menteeId) return;
        console.log(`Fetching detailed mentor info for mentee ID: ${menteeId}...`);
        try {
            // Backend Requirement: Ensure /api/mentee/mentor-info returns room_no, mentor_unique_user_no (phone_num no longer needed)
            const results = await apiFetch(`/api/mentee/mentor-info?menteeId=${menteeId}`);
            const data = results[0] || {};

            mentorNameWelcome.textContent = data.mentor_name || 'N/A';
            mentorEmailWelcome.textContent = data.official_mail_id || 'N/A';
            mentorEmailWelcome.href = data.official_mail_id ? `mailto:${data.official_mail_id}` : '#';

            mentorDetailName.textContent = data.mentor_name || 'N/A';
            mentorDetailEmail.textContent = data.official_mail_id || 'N/A';
            mentorDetailEmail.href = data.official_mail_id ? `mailto:${data.official_mail_id}` : '#';

            // Removed phone logic

            // Conditionally display room
            if (data.room_no && mentorRoomLine) {
                mentorDetailRoom.textContent = data.room_no;
                mentorRoomLine.style.display = '';
            } else if (mentorRoomLine) {
                mentorRoomLine.style.display = 'none';
            }

            mentorDetailDept.textContent = data.department || 'N/A';
            mentorTimetable.textContent = data.timetable || 'Not specified';

        } catch (error) {
            console.error('Error fetching mentor details:', error);
            mentorNameWelcome.textContent = '[Error]';
            mentorEmailWelcome.textContent = 'N/A'; mentorEmailWelcome.href = '#';
            mentorDetailName.textContent = '[Error Loading]';
            mentorDetailEmail.textContent = 'N/A'; mentorDetailEmail.href = '#';
            // Removed phone error handling
            if (mentorRoomLine) mentorRoomLine.style.display = 'none';
            mentorDetailDept.textContent = 'N/A'; mentorTimetable.textContent = 'N/A';
        }
    }

    // Profile and Academics
    async function fetchProfileAndAcademics(unique_user_no, menteeId) {
        if (!unique_user_no || !menteeId) return;
        console.log(`Fetching profile for user: ${unique_user_no}, academics for mentee: ${menteeId}...`);

        // Fetch User Details (Email, Profile Pic)
        // *** Backend Requirement ***
        // Ensure /api/users/:unique_user_no returns official_mail_id and profile_picture
        try {
            const userResults = await apiFetch(`/api/users/${unique_user_no}`);
            // Ensure userResults is treated as an array even if API returns single object
            const userDataArray = Array.isArray(userResults) ? userResults : [userResults]; 
            const userData = userDataArray[0] || {};
            console.log("User Data fetched for greeting:", userData); // Debug log
            // Update greeting with email
            menteeGreeting.textContent = `Hi, ${userData.official_mail_id || `User ${unique_user_no}`}!`;
            menteeProfilePic.src = userData.profile_picture || 'img/default-profile.svg';
            menteeProfilePic.onerror = () => { menteeProfilePic.src = 'img/default-profile.svg'; };
        } catch (userError) {
            console.error('Error fetching user details:', userError);
            // Update fallback greeting to mention email or user number
            menteeGreeting.textContent = `Hi, User ${unique_user_no}!`; // Or potentially 'Error loading email'
            menteeProfilePic.src = 'img/default-profile.svg';
        }

        // Fetch Academic Details (Course, Year, Attendance, Context - Background removed)
        try {
            // Backend Requirement: /api/mentee/academic-progress no longer needs academic_background
            const results = await apiFetch(`/api/mentee/academic-progress?menteeId=${menteeId}`);
            const data = results[0] || {};

            academicCourse.textContent = data.course || 'N/A';
            const attendance = parseFloat(data.attendance);
            academicAttendance.textContent = !isNaN(attendance) ? `${attendance.toFixed(1)}%` : 'N/A';
            attendanceBar.style.width = !isNaN(attendance) ? `${attendance}%` : '0%';
            academicContext.textContent = data.academic_context || 'N/A';
            menteeCourseYear.textContent = `${data.course || 'N/A'}, Year ${data.year || 'N/A'}`;

            // Removed academic background logic

        } catch (error) {
            console.error('Error fetching academic progress:', error);
            academicCourse.textContent = '[Error]';
            academicAttendance.textContent = 'N/A';
            attendanceBar.style.width = '0%';
            academicContext.textContent = 'N/A';
            // Removed background error handling
            menteeCourseYear.textContent = '';
        }
    }

    // Communications (Messages & Feedback)
    async function fetchCommunications(unique_user_no) {
        if (!unique_user_no) return;
        console.log(`Fetching communications for user ID: ${unique_user_no}...`);
        messageList.innerHTML = '<p class="no-data">Loading messages...</p>';
        feedbackList.innerHTML = '<p class="no-data">Loading feedback...</p>';
        try {
            const communications = await apiFetch(`/api/mentee/communication?userId=${unique_user_no}`);

            const messages = communications.filter(c => c.type === 'one-to-one');
            const feedbackItems = communications.filter(c => c.type === 'feedback');

            // Populate Message List
            if (messages.length > 0) {
                const senderIds = [...new Set(messages.map(m => m.sender_id).filter(id => id !== currentUniqueUserNo))];
                 // Ensure API call returns array
                const senderDetailsPromises = senderIds.map(id => apiFetch(`/api/users/${id}`).then(res => Array.isArray(res) ? res[0] : res));
                const senderDetails = await Promise.all(senderDetailsPromises);
                const senderMap = senderDetails.reduce((map, user) => { if(user) map[user.unique_user_no] = user.full_name; return map; }, {});


                messageList.innerHTML = messages.map(msg => {
                    const isSelf = currentUniqueUserNo !== null && msg.sender_id === currentUniqueUserNo;
                    const senderName = isSelf ? "You" : (senderMap[msg.sender_id] || `User ${msg.sender_id}`);
                    return `
                        <div class="message-item ${isSelf ? 'self' : ''}">
                            <p><strong>${senderName}:</strong> ${msg.message || ''}</p>
                            <span class="message-meta">${msg.message_status || ''} | ${new Date(msg.sent_at).toLocaleString()}</span>
                        </div>`;
                }).join('');
            } else {
                messageList.innerHTML = '<p class="no-data">No messages found.</p>';
            }

            // Populate Feedback List
            if (feedbackItems.length > 0) {
                 const feedbackSenderIds = [...new Set(feedbackItems.map(m => m.sender_id).filter(id => id !== currentUniqueUserNo))];
                 const senderMap = {}; // Re-initialize or reuse from above if appropriate
                 // Ensure API call returns array
                 const senderDetailsPromises = feedbackSenderIds.map(id => apiFetch(`/api/users/${id}`).then(res => Array.isArray(res) ? res[0] : res));
                 const senderDetails = await Promise.all(senderDetailsPromises);
                 senderDetails.forEach(user => { if(user) senderMap[user.unique_user_no] = user.full_name; });


                feedbackList.innerHTML = feedbackItems.map(fb => {
                     const isSelf = currentUniqueUserNo !== null && fb.sender_id === currentUniqueUserNo;
                     const senderName = isSelf ? "You" : (senderMap[fb.sender_id] || `User ${fb.sender_id}`);
                     return `
                        <div class="feedback-item">
                            <p><strong>${senderName}:</strong> ${fb.message || ''}</p>
                            <span class="feedback-meta">Received | ${new Date(fb.sent_at).toLocaleString()}</span>
                        </div>`;
                }).join('');
            } else {
                feedbackList.innerHTML = '<p class="no-data">No feedback received yet.</p>';
            }

        } catch (error) {
            console.error('Error fetching communications:', error);
            messageList.innerHTML = '<p class="no-data error">Error loading messages.</p>';
            feedbackList.innerHTML = '<p class="no-data error">Error loading feedback.</p>';
        }
    }

    // Removed fetchCalendarData function

    // Removed fetchEmergencyAlerts function

    // My Achievements
    async function fetchAchievements(menteeId) { // Removed filter parameter for now
        if (!menteeId) return;
        console.log(`Fetching achievements for mentee ID: ${menteeId}...`);
        achievementList.innerHTML = '<p class="no-data">Loading achievements...</p>'; // Set loading state
        try {
            // Use the new backend route
            const achievements = await apiFetch(`/api/achievement/mentee/${menteeId}`);
            console.log("Achievements data fetched:", achievements); // Debug log

            if (achievements && achievements.length > 0) {
                achievementList.innerHTML = achievements.map(ach => {
                    // Format date nicely (YYYY-MM-DD)
                    const dateAwarded = ach.date_awarded ? new Date(ach.date_awarded).toISOString().split('T')[0] : '[Date Unknown]';
                    let iconHtml;
                    if (ach.badge_icon) {
                        const isCertificateUrl = ach.badge_icon.startsWith('http') || ach.badge_icon.toLowerCase().endsWith('.pdf');
                        if (isCertificateUrl) {
                            iconHtml = `<a href="${ach.badge_icon}" target="_blank" rel="noopener noreferrer" style="text-decoration: none; color: inherit;">
                                            <i class="fas fa-file-pdf achievement-icon" style="color: var(--danger-color);"></i>
                                        </a>`;
                        } else {
                            iconHtml = `<img src="assets/${ach.badge_icon}" alt="Badge" class="achievement-icon" style="width: 24px; height: 24px; margin-right: 8px;">`; // Assuming icons are in assets/
                        }
                    } else {
                        iconHtml = `<i class="fas fa-trophy achievement-icon"></i>`;
                    }

                    return `
                    <div class="achievement-item" data-achievement-id="${ach.achvmt_id}">
                        ${iconHtml}
                        <div style="flex-grow: 1;">
                            <h4 style="margin-bottom: 4px;">${ach.title || 'Achievement'}</h4>
                            <p style="margin-bottom: 4px; font-size: 0.9em;">${ach.description || ''}</p>
                            <p style="font-size: 0.8em; color: var(--light-text);">Awarded: ${dateAwarded}</p>
                        </div>
                    </div>
                `;}).join('');
            } else {
                 achievementList.innerHTML = '<p class="no-data">No achievements recorded.</p>';
            }
        } catch (error) {
            console.error('Error fetching achievements:', error);
            achievementList.innerHTML = '<p class="no-data error">Error loading achievements.</p>'; // Error message
        }
    }

    // --- Function to clear all dashboard sections ---
    function clearDashboardSections() {
        menteeGreeting.textContent = 'Loading...';
        menteeCourseYear.textContent = '';
        menteeProfilePic.src = 'img/default-profile.svg';
        mentorNameWelcome.textContent = '[Mentor Name]';
        mentorEmailWelcome.textContent = '[Mentor Email]';
        mentorEmailWelcome.href = '#';
        academicCourse.textContent = '-';
        academicAttendance.textContent = '-';
        attendanceBar.style.width = '0%';
        academicContext.textContent = '-';
        // Removed background clear
        // Removed calendar/reminder clear
        messageList.innerHTML = '<p class="no-data">Select a mentee.</p>';
        // Removed alert clear
        achievementList.innerHTML = '<p class="no-data">Select a mentee.</p>';
        feedbackList.innerHTML = '<p class="no-data">Select a mentee.</p>';
        mentorDetailName.textContent = '-';
        mentorDetailEmail.textContent = '-';
        mentorDetailEmail.href = '#';
        // Removed phone clear
        mentorDetailRoom.textContent = '-';
        if (mentorRoomLine) mentorRoomLine.style.display = ''; // Reset room display
        mentorDetailDept.textContent = '-';
        mentorTimetable.textContent = '-';
        newMessageArea.style.display = 'none';
        submitFeedbackArea.style.display = 'none';
        // Removed alert area clear
    }

    // --- Event Listeners ---

    achievementFilter?.addEventListener('change', (event) => {
        if (currentMenteeId) {
            fetchAchievements(currentMenteeId, event.target.value);
        }
    });

    newMessageBtn?.addEventListener('click', () => {
        if (!currentUniqueUserNo) return alert("User ID not found.");
        newMessageArea.style.display = newMessageArea.style.display === 'none' ? 'block' : 'none';
    });

submitFeedbackBtn?.addEventListener('click', () => {
        if (!currentUniqueUserNo) return alert("User ID not found.");
        submitFeedbackArea.style.display = submitFeedbackArea.style.display === 'none' ? 'block' : 'none';
    });

    // Removed newAlertBtn listener

    // --- Send Actions (Using API calls) ---

    sendMessageBtn?.addEventListener('click', async () => {
        // ... (Keep existing sendMessageBtn logic) ...
        if (!currentUniqueUserNo) return alert("Login required to send messages.");
        let mentorUserId = null;
        try {
            const mentorInfo = await apiFetch(`/api/mentee/mentor-info?menteeId=${currentMenteeId}`);
            mentorUserId = mentorInfo[0]?.mentor_unique_user_no;
        } catch {
             return alert("Could not retrieve mentor details to send message.");
        }
        if (!mentorUserId) return alert("Could not determine mentor's user ID.");

        const content = newMessageText.value.trim();
        const file = messageAttachment.files[0];
        if (!content && !file) return alert('Please enter a message or attach a file.');

        console.log('Sending message to mentor:', content, file ? `File: ${file.name}` : '');
        try {
            const formData = new FormData();
            formData.append('message_content', content);
            formData.append('receiver_id', mentorUserId);
            formData.append('sender_id', currentUniqueUserNo);
            formData.append('type', 'one-to-one');
            if (file) formData.append('attachment', file);

            await apiFetch('/api/communications', {
                method: 'POST',
                body: formData
            });

            newMessageText.value = '';
            messageAttachment.value = null;
            newMessageArea.style.display = 'none';
            fetchCommunications(currentUniqueUserNo);
            alert('Message sent successfully.');
        } catch (error) {
            console.error('Failed to send message:', error);
            alert(`Failed to send message: ${error.message}`);
        }
    });

sendFeedbackBtn?.addEventListener('click', async () => {
    console.log("sendFeedbackBtn clicked!"); // Add this line
    if (!currentUniqueUserNo) return alert("Login required to send feedback.");

    let mentorUserId = null;
    try {
        const mentorInfo = await apiFetch(`/api/mentee/mentor-info?menteeId=${currentMenteeId}`);
        mentorUserId = mentorInfo[0]?.mentor_id; // Use mentor_id instead of mentor_unique_user_no
    } catch {
        return alert("Could not retrieve mentor details to send feedback.");
    }
    if (!mentorUserId) return alert("Could not determine mentor's user ID.");

    const content = feedbackText.value.trim();
    const file = feedbackAttachment.files[0];

    if (!content && !file) return alert('Please enter feedback or attach a file.');

    console.log('Submitting feedback to mentor:', content, file ? `File: ${file.name}` : '');

    try {
        const formData = new FormData();
        formData.append('menteeId', currentUniqueUserNo); // Use currentUniqueUserNo as menteeId
        formData.append('mentorId', mentorUserId); // Use mentorUserId as mentorId
        formData.append('message_content', content); // Text content

        if (file) {
            formData.append('feedback-attachment', file); // Append the file
        }

        await apiFetch('/api/mentee/submit-feedback', {
            method: 'POST',
            headers: {
                'Content-Type': undefined
            },
            body: formData,
        });

        feedbackText.value = '';
        feedbackAttachment.value = null;
        submitFeedbackArea.style.display = 'none';
        fetchCommunications(currentUniqueUserNo);
        alert('Feedback submitted successfully.');
    } catch (error) {
        console.error('Failed to submit feedback:', error);
        alert(`Failed to submit feedback: ${error.message}`);
    }
});

    // Removed sendAlertBtn listener and logic

    // --- Global Modal Functions (for consistency) ---
    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            document.body.classList.add('modal-open'); // Add class to body to prevent scroll
        }
    }

    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            document.body.classList.remove('modal-open'); // Remove class from body
        }
    }

    // Close modals if clicking outside the content area
    window.addEventListener('click', function(event) {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (event.target === modal) {
                closeModal(modal.id);
            }
        });
    });

    // --- Achievement Modal Elements and Handlers ---
    const addAchievementBtn = document.getElementById('add-achievement-btn');
    const addAchievementModal = document.getElementById('add-achievement-modal');
    const addAchievementForm = document.getElementById('add-achievement-form');
    const achievementTitleInput = document.getElementById('achievement-title');
    const achievementDescriptionInput = document.getElementById('achievement-description');
    const achievementDateInput = document.getElementById('achievement-date');
    const achievementBadgeIconInput = document.getElementById('achievement-badge-icon');

    addAchievementBtn?.addEventListener('click', () => {
        if (!currentMenteeId) {
            alert("Please select a mentee or ensure mentee details are loaded to add an achievement.");
            return;
        }
        // Pre-fill date with today's date
        achievementDateInput.value = new Date().toISOString().split('T')[0];
        openModal('add-achievement-modal');
    });

    // Close modal buttons within the achievement modal
    addAchievementModal?.querySelectorAll('.close-modal, .btn-secondary').forEach(button => {
        button.addEventListener('click', () => closeModal('add-achievement-modal'));
    });

    addAchievementForm?.addEventListener('submit', async (event) => {
        event.preventDefault();

        if (!currentMenteeId) {
            alert("Mentee ID not found. Cannot add achievement.");
            return;
        }

        let mentorId = null;
        try {
            // Fetch mentor_id directly from the mentee table using the new route
            const mentorResponse = await apiFetch(`/api/mentee/get-mentor-id/${currentMenteeId}`);
            mentorId = mentorResponse?.mentor_id;
        } catch (error) {
            console.error("Failed to get mentor ID for achievement:", error);
            alert("Failed to get mentor details. Cannot add achievement.");
            return;
        }

        if (!mentorId) {
            alert("Mentor ID not found for the current mentee. Cannot add achievement. Please ensure a mentor is assigned.");
            return;
        }

        const achievementData = {
            mentee_id: currentMenteeId,
            mentor_id: mentorId,
            title: achievementTitleInput.value.trim(),
            description: achievementDescriptionInput.value.trim(),
            date_awarded: achievementDateInput.value,
            badge_icon: achievementBadgeIconInput.value.trim() || null // Allow null if empty
        };

        console.log('Submitting new achievement:', achievementData);

        try {
            await apiFetch('/api/achievement', { // Use the generic achievement endpoint
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(achievementData)
            });

            alert('Achievement added successfully!');
            addAchievementForm.reset();
            closeModal('add-achievement-modal');
            fetchAchievements(currentMenteeId); // Refresh the list
        } catch (error) {
            console.error('Failed to add achievement:', error);
            alert(`Failed to add achievement: ${error.message}`);
        }
    });

    // --- Data Loading Logic ---

    function loadMenteeSpecificData(unique_user_no, menteeId) {
        if (!unique_user_no || !menteeId) {
            console.error("Cannot load data without both unique_user_no and menteeId");
            return;
        }
        console.log(`Loading all data for user: ${unique_user_no}, mentee: ${menteeId}`);
        fetchProfileAndAcademics(unique_user_no, menteeId);
        fetchMentorInfo(menteeId);
        // Removed fetchCalendarData call
        fetchCommunications(unique_user_no);
        // Removed fetchEmergencyAlerts call
        fetchAchievements(menteeId); // Removed filter argument
    }

    // --- Initial Data Load ---
    async function initializeDashboard() {
        clearDashboardSections();

        if (!currentUniqueUserNo) {
             console.error("Logged in User ID (unique_user_no) not found in session storage.");
             menteeGreeting.textContent = 'Error: User ID not found.';
             return;
        }

        if (loggedInUserRole === 'mentee') {
            if (menteeSelect) {
                 menteeSelect.style.display = 'none';
                 const menteeSelectLabel = document.querySelector('label[for="mentee-select"]');
                 if (menteeSelectLabel) menteeSelectLabel.style.display = 'none';
            }

            try {
                // Backend Requirement: GET /api/mentee/details-by-user/{unique_user_no}
                console.log(`Fetching mentee details for user ID: ${currentUniqueUserNo}...`);
                const menteeDetails = await apiFetch(`/api/mentee/details-by-user/${currentUniqueUserNo}`);

                if (menteeDetails && menteeDetails.mentee_id) {
                    currentMenteeId = menteeDetails.mentee_id;
                    console.log(`Found mentee ID: ${currentMenteeId}`);
                    loadMenteeSpecificData(currentUniqueUserNo, currentMenteeId);
                } else {
                    console.error(`Could not find mentee_id for user ${currentUniqueUserNo}.`);
                    menteeGreeting.textContent = 'Error: Could not load mentee details.';
                }
            } catch (error) {
                 console.error(`Error fetching mentee details for user ${currentUniqueUserNo}:`, error);
                 menteeGreeting.textContent = 'Error loading dashboard data.';
            }

        } else if (loggedInUserRole === 'mentor') {
             console.warn("Mentor view for mentee dashboard not fully implemented.");
             menteeGreeting.textContent = 'Select a mentee from the dropdown';
        } else {
            console.error("User role is not 'mentee' or 'mentor'. Cannot display dashboard correctly.");
            menteeGreeting.textContent = 'Access Denied for this Role';
        }
    }

    initializeDashboard();

    // --- Date/Time Update ---
    function updateDateTime() {
        const now = new Date();
        const dateOptions = { year: 'numeric', month: '2-digit', day: '2-digit' };
        const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: true };

        if (currentDateSpan) currentDateSpan.textContent = now.toLocaleDateString(undefined, dateOptions);
        if (currentTimeSpan) currentTimeSpan.textContent = now.toLocaleTimeString(undefined, timeOptions);
    }

    updateDateTime();
    setInterval(updateDateTime, 60000);

});

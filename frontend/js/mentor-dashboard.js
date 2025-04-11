document.addEventListener('DOMContentLoaded', async () => { // Made async for potential await during init
    console.log("Mentor Dashboard JS Loaded");

    // --- Retrieve User Info from Session Storage ---
    const loggedInUserId = sessionStorage.getItem('userId')-2;
    const loggedInUserRole = sessionStorage.getItem('userRole');


    // --- Redirect to login if not logged in or not a mentor ---
    if (!loggedInUserId) {
        console.log("User not logged in. Redirecting to login page.");
        window.location.href = '/mit-wpu-login.html'; // Adjust path if needed
        return; // Stop script execution
    }
    if (loggedInUserRole !== 'mentor') {
        console.error("Access Denied: User is not a mentor.");
        // Optionally redirect to login or an error page
        alert("Access Denied: This dashboard is for mentors only.");
        window.location.href = '/mit-wpu-login.html'; // Redirect to login
        return; // Stop script execution
    }

    console.log(`Logged in Mentor ID: ${loggedInUserId}`);

    // The logged-in user IS the mentor for this dashboard
    // NOTE: The backend uses mentor_id (primary key from mentor table),
    // but sessionStorage stores unique_user_no (from users table).
    // We need to fetch the mentor_id based on unique_user_no if API calls rely on mentor_id.
    // For now, assuming the API endpoints correctly use the ID passed (which seems to be mentor_id based on route structure).
    // Let's keep selectedMentorId as the ID from session storage for now, assuming it's the correct one needed by the API.
    // If APIs fail with 404, we might need to fetch mentor details first to get the correct mentor_id.
    let selectedMentorId = parseInt(loggedInUserId, 10); // Assuming this is the correct ID for API calls
    let apiBaseUrl = `/api/mentor-dashboard/${selectedMentorId}`; // Set API base URL immediately
    let mentorDetails = null;
    // let academicChart = null; // Remove if not used
    let allMenteesData = []; // Store all fetched mentees for filtering

    const mentorSelectEl = document.getElementById('mentor-select'); // Will be hidden/removed
    const menteeListEl = document.getElementById('mentee-list');
    const achievementListEl = document.getElementById('achievement-list');
    const totalMenteesEl = document.getElementById('total-mentees');
    const mentorNameEl = document.getElementById('mentor-name');
    const mentorDepartmentEl = document.getElementById('mentor-department');
    const currentDateEl = document.getElementById('current-date');
    const currentTimeEl = document.getElementById('current-time');
    const menteeFilterEl = document.getElementById('mentee-filter'); // Get the filter dropdown
    // Add placeholders for new sections (even if just for logging)
    // const communicationStatsEl = document.getElementById('communication-stats-container'); // Removed as section is removed
    const recentCommunicationsEl = document.getElementById('recent-communications-list'); // Needs to be added to HTML
    const pendingAlertsEl = document.getElementById('pending-alerts-list'); // Needs to be added to HTML


    const fetchData = async (endpoint, options = {}) => {
        // Use selectedMentorId directly in the URL construction
        if (!selectedMentorId) {
            console.error("Mentor ID not set. Cannot fetch data.");
            return null;
        }
        // Construct URL using the base path and the specific endpoint
        const url = `/api/mentor-dashboard/${selectedMentorId}${endpoint}`;
        console.log(`Fetching: ${url}`);
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`HTTP error! Status: ${response.status}, URL: ${url}, Response: ${errorText}`);
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            if (response.status === 204) {
                return null;
            }
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                return await response.json();
            } else {
                console.warn(`Received non-JSON response from ${url}`);
                return await response.text();
            }
        } catch (error) {
            console.error(`Error fetching ${endpoint}:`, error);
            const errorTargetEl = getElementForEndpoint(endpoint);
            if (errorTargetEl) {
                errorTargetEl.innerHTML = `<p class="error-message">Could not load data for this section. Please try again later.</p>`;
            }
            return null;
        }
    };

    const getElementForEndpoint = (endpoint) => {
        if (endpoint.includes('/mentees')) return menteeListEl;
        if (endpoint.includes('/achievements')) return achievementListEl;
        // if (endpoint.includes('/communication-stats')) return communicationStatsEl; // Removed
        if (endpoint.includes('/communications')) return recentCommunicationsEl;
        if (endpoint.includes('/pending-alerts')) return pendingAlertsEl;
        // Add other endpoint-to-element mappings here
        return null; // Default if no specific element target
    };

    const formatDate = (dateString, includeTime = true) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                console.warn("Invalid date string received:", dateString);
                return 'Invalid Date';
            }
            const options = {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                ...(includeTime && { hour: '2-digit', minute: '2-digit', hour12: true })
            };
            return date.toLocaleDateString('en-IN', options);
        } catch (e) {
            console.error("Error formatting date:", dateString, e);
            return 'Invalid Date';
        }
    };

    const updateDateTime = () => {
        const now = new Date();
        if (currentDateEl) currentDateEl.textContent = now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        if (currentTimeEl) currentTimeEl.textContent = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    const loadMentorDetails = async () => {
        // Fetch details using the new dedicated endpoint
        mentorDetails = await fetchData('/details'); // Endpoint relative to apiBaseUrl

        if (mentorDetails) {
            // Use official_mail_id as display name since 'name' column doesn't exist
            const displayName = mentorDetails.official_mail_id || `Mentor ${selectedMentorId}`;
            if (mentorNameEl) mentorNameEl.textContent = `${displayName}`;
            if (mentorDepartmentEl && mentorDetails.department) mentorDepartmentEl.textContent = `${mentorDetails.department}`;

            // Populate the new profile details section
            const roomEl = document.getElementById('mentor-room');
            const timetableEl = document.getElementById('mentor-timetable');
            const backgroundEl = document.getElementById('mentor-background');

            if (roomEl) roomEl.textContent = mentorDetails.room_no || 'N/A';
            if (timetableEl) timetableEl.textContent = mentorDetails.timetable || 'N/A';
            if (backgroundEl) backgroundEl.textContent = mentorDetails.academic_background || 'N/A';

        } else {
            console.error(`Failed to load details for Mentor ID ${selectedMentorId}`);
            if (mentorNameEl) mentorNameEl.textContent = "Mentor Details Unavailable";
            if (mentorDepartmentEl) mentorDepartmentEl.textContent = "";
            // Clear profile details if fetch fails
            const roomEl = document.getElementById('mentor-room');
            const timetableEl = document.getElementById('mentor-timetable');
            const backgroundEl = document.getElementById('mentor-background');
            if (roomEl) roomEl.textContent = 'N/A';
            if (timetableEl) timetableEl.textContent = 'N/A';
            if (backgroundEl) backgroundEl.textContent = 'N/A';
        }
    };

    // Remove populateMentorDropdown function as it's no longer needed

    const loadDashboardData = async () => {
        // selectedMentorId is already set from loggedInUserId
        if (!selectedMentorId) {
            console.error("Mentor ID not set. Cannot load dashboard.");
            return;
        }
        console.log(`Loading dashboard for Mentor ID: ${selectedMentorId}`);
        // apiBaseUrl is already set

        await loadMentorDetails();          // Load mentor's own details first
        loadMentees();                  // Load assigned mentees
        loadAchievements();             // Load achievements awarded by this mentor
        // loadCommunicationStats();    // Removed call
        loadRecentCommunications();     // Load recent messages
        loadPendingAlerts();            // Load pending alerts
        // Add calls to load other sections if needed (e.g., academic summary if separate endpoint is used)
    };

    const clearDashboardSections = () => {
        const sections = [menteeListEl, achievementListEl, /*communicationStatsEl,*/ recentCommunicationsEl, pendingAlertsEl]; // Removed communicationStatsEl
        sections.forEach(el => { if (el) el.innerHTML = '<p>Loading...</p>'; }); // Clear content with loading message

        if (totalMenteesEl) totalMenteesEl.textContent = '-'; // Default placeholder
        // Mentor name/dept are loaded by loadMentorDetails, no need to clear here
    };

    const displayMentees = () => {
        if (!menteeListEl) return;

        const filterValue = menteeFilterEl ? menteeFilterEl.value : 'all';
        let filteredMentees = allMenteesData;

        if (filterValue === 'excellent') {
            filteredMentees = allMenteesData.filter(m => m.academic_context === 'Excellent');
        } // Add more filters here if needed (e.g., 'poor', 'average')

        menteeListEl.innerHTML = ''; // Clear previous list

        if (filteredMentees.length === 0) {
            menteeListEl.innerHTML = '<p>No mentees match the current filter.</p>';
            // Keep total count based on all mentees, not filtered
            if (totalMenteesEl) totalMenteesEl.textContent = allMenteesData.length;
            return;
        }

        const list = document.createElement('ul');
        filteredMentees.forEach(mentee => {
            const li = document.createElement('li');
            // Use the correct field 'profile_picture' and assume it contains the filename relative to 'img/'
            const profilePic = mentee.profile_picture ? `img/${mentee.profile_picture}` : 'img/default-profile.svg';
            const menteeName = mentee.mentee_email; // Use email as name since 'name' column doesn't exist
            li.innerHTML = `
                <div class="mentee-info">
                    <img src="${profilePic}" alt="Profile" class="profile-pic-small" onerror="this.src='img/default-profile.svg'; this.onerror=null;">
                    <div>
                        <strong>${menteeName}</strong> (${mentee.course || 'N/A'} - Year ${mentee.year || 'N/A'})<br>
                        <!-- Removed email display here as it's used for the name -->
                        <span class="small-text">Attendance: ${mentee.attendance !== null ? mentee.attendance + '%' : 'N/A'} | Status: ${mentee.academic_context || 'N/A'}</span>
                    </div>
                </div>
                <div class="mentee-actions">
                     <button class="btn-outline small-text view-profile-btn" data-mentee-id="${mentee.mentee_id}">View Profile</button>
                     <!-- Delete Mentee Button Removed -->
                 </div>
            `;
            list.appendChild(li);
        });
        menteeListEl.appendChild(list);
        // Update total count based on all mentees
        if (totalMenteesEl) totalMenteesEl.textContent = allMenteesData.length;
    };

    const loadMentees = async () => {
        const mentees = await fetchData('/mentees');
        if (!mentees) {
             allMenteesData = []; // Clear data if fetch fails
             if (menteeListEl) menteeListEl.innerHTML = '<p>Could not load mentees.</p>';
             if (totalMenteesEl) totalMenteesEl.textContent = '-';
             return;
        }
        allMenteesData = mentees; // Store fetched data
        displayMentees(); // Display based on current filter
    };


    const loadAchievements = async () => {
        const achievements = await fetchData('/achievements');
        if (!achievements || !achievementListEl) {
             if (achievementListEl) achievementListEl.innerHTML = '<p>Could not load achievements.</p>';
             return;
        }
        achievementListEl.innerHTML = '';
        if (achievements.length === 0) {
            achievementListEl.innerHTML = '<p>No achievements awarded yet.</p>';
            return;
        }
        const list = document.createElement('ul');
        achievements.forEach(ach => {
            const li = document.createElement('li');
            // Corrected image path to point to the 'img' directory relative to the HTML file
            const badgeSrc = ach.badge_icon ? `img/${ach.badge_icon}` : 'img/default-avatar.svg';
            li.innerHTML = `
                <div>
                    <img src="${badgeSrc}" alt="Badge" width="20" height="20" style="vertical-align: middle; margin-right: 5px;" onerror="this.src='img/default-avatar.svg'; this.onerror=null;">
                    <strong>${ach.title}</strong> for ${ach.mentee_email}
                </div>
                <div class="small-text">${ach.description || 'No description.'} | Awarded: ${formatDate(ach.date_awarded, false)}</div>
                <button class="btn-danger small-text delete-achievement-btn" data-achievement-id="${ach.achvmt_id}" style="float: right; margin-top: -20px; padding: 2px 6px;">
                    <i class="fas fa-trash-alt"></i> Delete
                </button>
            `;
            list.appendChild(li);
        });
        achievementListEl.appendChild(list);
    };

    // --- New Data Loading Functions ---

    // Removed loadCommunicationStats function

    const loadRecentCommunications = async () => {
        const communications = await fetchData('/communications');
        if (communications) {
            console.log("Recent Communications:", communications);
            // TODO: Display these communications in the UI (e.g., a list or table)
            if (recentCommunicationsEl) {
                if (communications.length === 0) {
                    recentCommunicationsEl.innerHTML = '<p>No recent communications.</p>';
                    return;
                }
                const list = document.createElement('ul');
                communications.forEach(comm => {
                    const li = document.createElement('li');
                    li.innerHTML = `
                        <div><strong>From:</strong> ${comm.sender_email} | <strong>To:</strong> ${comm.receiver_email}</div>
                        <div>${comm.message_content || ''}</div>
                        <div class="small-text">Status: ${comm.message_status} | Date: ${formatDate(comm.timestamp)}</div>
                    `; // Assuming timestamp exists
                    list.appendChild(li);
                });
                recentCommunicationsEl.innerHTML = ''; // Clear loading
                recentCommunicationsEl.appendChild(list);
            }
        } else {
             if (recentCommunicationsEl) recentCommunicationsEl.innerHTML = '<p>Could not load recent communications.</p>';
        }
    };

     const loadPendingAlerts = async () => {
        const alerts = await fetchData('/pending-alerts');
        if (alerts) {
            console.log("Pending Alerts:", alerts);
            // TODO: Display these alerts prominently in the UI
            if (pendingAlertsEl) {
                 if (alerts.length === 0) {
                    pendingAlertsEl.innerHTML = '<p>No pending alerts.</p>';
                    return;
                }
                const list = document.createElement('ul');
                alerts.forEach(alert => {
                    const li = document.createElement('li');
                    li.classList.add('alert-item', 'alert-warning'); // Add some styling classes
                    li.innerHTML = `
                        <strong>Alert:</strong> ${alert.alert_reason || 'No reason specified.'} (ID: ${alert.emergency_alert_id})<br>
                        <span class="small-text">Related Comm ID: ${alert.comm_id} | Status: ${alert.alert_status}</span>
                        <button class="btn-outline small-text resolve-alert-btn" data-alert-id="${alert.emergency_alert_id}">Mark Resolved</button> <!-- Example action -->
                    `;
                    list.appendChild(li);
                });
                 pendingAlertsEl.innerHTML = ''; // Clear loading
                 pendingAlertsEl.appendChild(list);
            }
        } else {
             if (pendingAlertsEl) pendingAlertsEl.innerHTML = '<p>Could not load pending alerts.</p>';
        }
    };


    const initializeDashboard = async () => {
        updateDateTime();
        setInterval(updateDateTime, 1000);

        // Hide the mentor selection dropdown
        if (mentorSelectEl) {
            mentorSelectEl.style.display = 'none';
            const mentorSelectLabel = document.querySelector('label[for="mentor-select"]');
             if (mentorSelectLabel) mentorSelectLabel.style.display = 'none';
        }

        // Load data directly for the logged-in mentor
        await loadDashboardData();

        // Setup event listeners
        // document.getElementById('add-mentee-btn')?.addEventListener('click', handleAddMenteeClick); // Removed listener
        document.getElementById('award-achievement-btn')?.addEventListener('click', showAwardAchievementModal);
        menteeFilterEl?.addEventListener('change', displayMentees); // Add event listener for filter changes

        document.body.addEventListener('click', (event) => {
            if (event.target.matches('.view-profile-btn[data-mentee-id]')) {
                viewMenteeProfile(event.target.dataset.menteeId);
            }
            // Removed delete mentee button click handling
            else if (event.target.closest('.delete-achievement-btn[data-achievement-id]')) {
                const button = event.target.closest('.delete-achievement-btn');
                const achievementId = button.dataset.achievementId;
                const achievementTitle = button.closest('li').querySelector('strong').textContent; // Get title for confirmation message
                handleDeleteAchievementClick(achievementId, achievementTitle);
            }
        });
    };

    // --- Modal Elements ---
    const modal = document.getElementById("menteeProfileModal");
    const modalCloseBtn = modal.querySelector(".close-btn");
    const modalMenteeNameEl = document.getElementById("modalMenteeName");
    const modalMenteeCourseEl = document.getElementById("modalMenteeCourse");
    const modalMenteeYearEl = document.getElementById("modalMenteeYear");
    const modalMenteeAttendanceEl = document.getElementById("modalMenteeAttendance");
    const modalMenteeContextEl = document.getElementById("modalMenteeContext");
    const modalMenteeBackgroundEl = document.getElementById("modalMenteeBackground");

    // --- Award Achievement Modal Elements ---
    const awardModal = document.getElementById("awardAchievementModal");
    const awardModalCloseBtn = awardModal.querySelector(".award-close-btn");
    const awardForm = document.getElementById("awardAchievementForm");
    const awardErrorEl = document.getElementById("awardError");


    // --- Helper Functions (Moved inside DOMContentLoaded) ---

    async function viewMenteeProfile(menteeId) { // Made async
        console.log(`Fetching academic details for mentee ID: ${menteeId}`);
        // Show loading state in modal (optional)
        modalMenteeNameEl.textContent = `Loading Profile for Mentee ${menteeId}...`;
        modalMenteeCourseEl.textContent = '...';
        modalMenteeYearEl.textContent = '...';
        modalMenteeAttendanceEl.textContent = '...';
        modalMenteeContextEl.textContent = '...';
        modalMenteeBackgroundEl.textContent = 'Loading...';
        modal.style.display = "block"; // Show modal immediately

        try {
            // Fetch details from the new endpoint
            const response = await fetch(`/api/mentee/${menteeId}/academic-details`);
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Academic details not found for this mentee.');
                }
                const errorText = await response.text();
                throw new Error(`Failed to fetch academic details: ${response.status} - ${errorText}`);
            }
            const details = await response.json();

            // Construct the message for the alert
            const message = `
Mentee ID: ${details.mentee_id}
Course: ${details.course || 'N/A'}
Year: ${details.year || 'N/A'}
Attendance: ${details.attendance !== null ? details.attendance + '%' : 'N/A'}
Context: ${details.academic_context || 'N/A'}

Academic Background:
${details.academic_background || 'No background information available.'}
            `.trim(); // Use trim to remove leading/trailing whitespace

            // Display details in an alert box
            // Populate modal content
            // Find the mentee's email from the allMenteesData array to display as name
            const menteeData = allMenteesData.find(m => m.mentee_id == menteeId); // Use == for potential type difference
            modalMenteeNameEl.textContent = menteeData ? `Profile: ${menteeData.mentee_email}` : `Profile: Mentee ${details.mentee_id}`;
            modalMenteeCourseEl.textContent = details.course || 'N/A';
            modalMenteeYearEl.textContent = details.year || 'N/A';
            modalMenteeAttendanceEl.textContent = details.attendance !== null ? `${details.attendance}%` : 'N/A';
            modalMenteeContextEl.textContent = details.academic_context || 'N/A';
            modalMenteeBackgroundEl.textContent = details.academic_background || 'No background information available.';

            // Display modal (already displayed above)
            // modal.style.display = "block";

        } catch (error) {
            console.error('Error fetching or displaying mentee academic details:', error);
            // Update modal to show error
            modalMenteeNameEl.textContent = `Error Loading Profile`;
            modalMenteeBackgroundEl.textContent = `Could not load academic details for mentee ${menteeId}. ${error.message}`;
            // Optionally clear other fields
            modalMenteeCourseEl.textContent = '-';
            modalMenteeYearEl.textContent = '-';
            modalMenteeAttendanceEl.textContent = '-';
            modalMenteeContextEl.textContent = '-';
        }
    }

    // --- Modal Close Logic (Mentee Profile) ---
    if (modalCloseBtn) {
        modalCloseBtn.onclick = function() {
            modal.style.display = "none";
        }
    }
    // Close modals if user clicks outside of them
    window.onclick = function(event) {
        if (event.target == modal) { // Mentee profile modal
            modal.style.display = "none";
        }
        if (event.target == awardModal) { // Award achievement modal
             awardModal.style.display = "none";
        }
    } // End window.onclick

    // --- Award Achievement Modal Close Logic ---
     if (awardModalCloseBtn) {
        awardModalCloseBtn.onclick = function() {
            awardModal.style.display = "none";
        }
     } // Removed extra braces


    // Removed handleAddMenteeClick and addMentee functions
    // Removed handleDeleteMenteeClick and deleteMentee functions

    function showAwardAchievementModal() {
        if (!selectedMentorId) {
            alert("Cannot determine mentor ID. Please reload."); // Should not happen if logged in
            return;
        }
        // Clear previous errors and reset form
        awardErrorEl.style.display = 'none';
        awardErrorEl.textContent = '';
        awardForm.reset();
        // Set default date to today
        document.getElementById('awardDate').valueAsDate = new Date();
        // Display the modal
        awardModal.style.display = "block";
    }

     async function handleAwardAchievementSubmit(event) {
        event.preventDefault(); // Prevent default form submission
        awardErrorEl.style.display = 'none'; // Hide error initially

        if (!selectedMentorId) {
            awardErrorEl.textContent = 'Error: Mentor ID not found.';
            awardErrorEl.style.display = 'block';
            return;
        }

        const formData = new FormData(awardForm);
        const achievementData = {
            mentee_id: parseInt(formData.get('mentee_id'), 10),
            title: formData.get('title'),
            description: formData.get('description') || null,
            date_awarded: formData.get('date_awarded'),
            badge_icon: formData.get('badge_icon') || null
        };

        // Basic client-side validation
        if (!achievementData.mentee_id || !achievementData.title || !achievementData.date_awarded) {
             awardErrorEl.textContent = 'Please fill in Mentee ID, Title, and Date Awarded.';
             awardErrorEl.style.display = 'block';
             return;
        }
         if (isNaN(achievementData.mentee_id)) {
             awardErrorEl.textContent = 'Invalid Mentee ID.';
             awardErrorEl.style.display = 'block';
             return;
         }

        try {
            const response = await fetch(`/api/mentor-dashboard/${selectedMentorId}/achievements`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(achievementData),
            });

            const result = await response.json();

            if (!response.ok) {
                console.error("Error awarding achievement:", result);
                throw new Error(result.message || `Failed to award achievement. Status: ${response.status}`);
            }

            alert(result.message || 'Achievement awarded successfully!');
            awardModal.style.display = "none"; // Close modal on success
            loadAchievements(); // Reload the achievements list

        } catch (error) {
            console.error('Error awarding achievement:', error);
            awardErrorEl.textContent = `Error: ${error.message}`;
            awardErrorEl.style.display = 'block';
            // Don't close modal on error
        }
    }

    // Add form submit listener
    awardForm.addEventListener('submit', handleAwardAchievementSubmit);


    const handleDeleteAchievementClick = (achievementId, achievementTitle) => {
        if (!achievementId) return;

        const confirmation = confirm(`Are you sure you want to delete the achievement "${achievementTitle}" (ID: ${achievementId})? This action cannot be undone.`);

        if (confirmation) {
            deleteAchievement(achievementId);
        }
    };

    const deleteAchievement = async (achievementId) => {
        try {
            // Use the new DELETE endpoint. Note the URL structure.
            const response = await fetch(`/api/mentor-dashboard/achievements/${achievementId}`, {
                method: 'DELETE',
            });

            const result = await response.json(); // Try to parse JSON even for errors

            if (!response.ok) {
                console.error("Error deleting achievement:", result);
                throw new Error(result.message || `Failed to delete achievement. Status: ${response.status}`);
            }

            alert(result.message || `Achievement ${achievementId} deleted successfully.`);
            loadAchievements(); // Reload achievement list

        } catch (error) {
            console.error('Error deleting achievement:', error);
            alert(`Error deleting achievement: ${error.message}`);
        }
    };

    // --- Initialize ---
    initializeDashboard();

}); // End of DOMContentLoaded

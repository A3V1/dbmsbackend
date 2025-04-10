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
    let selectedMentorId = parseInt(loggedInUserId, 10);
    let apiBaseUrl = `/api/mentor-dashboard/${selectedMentorId}`; // Set API base URL immediately
    let mentorDetails = null;
    let academicChart = null;
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

    const fetchData = async (endpoint, options = {}) => {
        if (!apiBaseUrl) {
            console.error("API base URL not set. Cannot fetch data.");
            return null;
        }
        const url = `${apiBaseUrl}${endpoint}`;
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
        return null;
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
        // Use loggedInUserId directly as it's the mentor's ID
        const mentorIdToLoad = selectedMentorId+2; // selectedMentorId is set from loggedInUserId
        if (!mentorIdToLoad) {
            console.error("Cannot load mentor details: Mentor ID not available.");
            if (mentorNameEl) mentorNameEl.textContent = "Mentor: Error";
            if (mentorDepartmentEl) mentorDepartmentEl.textContent = "";
            return;
        }
        console.log(`Loading details for Mentor User ID: ${mentorIdToLoad}`); // Log the unique_user_no being used
        try {
             // Fetch mentor record using the NEW endpoint based on unique_user_no (loggedInUserId)
             const mentorBasicInfoResponse = await fetch(`/api/mentor/details/by-user/${mentorIdToLoad}`);
             if (!mentorBasicInfoResponse.ok) {
                 const errorText = await mentorBasicInfoResponse.text();
                 console.error(`Failed to fetch mentor basic data for User ID ${mentorIdToLoad}: ${mentorBasicInfoResponse.status} - ${errorText}`);
                 throw new Error('Failed to fetch mentor basic data');
             }
             const mentorRecord = await mentorBasicInfoResponse.json();

            if (!mentorRecord || !mentorRecord.unique_user_no) {
                 console.error("Mentor record or unique user number not found for ID:", mentorIdToLoad, mentorRecord);
                 throw new Error('Mentor unique user number not found');
            }

            // Fetch user record using unique_user_no from mentor record
            const userNo = mentorRecord.unique_user_no;
            console.log(`Fetching user data for unique_user_no: ${userNo}`);
            const userDataResponse = await fetch(`/api/users/${userNo}`); // Use the correct user ID
             if (!userDataResponse.ok) {
                 const errorText = await userDataResponse.text();
                 console.error(`Failed to fetch mentor user data for user_no ${userNo}: ${userDataResponse.status} - ${errorText}`);
                 throw new Error('Failed to fetch mentor user data');
             }
             const mentorUserInfo = await userDataResponse.json();

             if (!mentorUserInfo) {
                 throw new Error('Mentor user info could not be fetched.');
             }

             mentorDetails = { ...mentorRecord, ...mentorUserInfo }; // Combine data

            // Use official_mail_id from user data for display name
            const displayName = mentorDetails.official_mail_id || `Mentor ${mentorIdToLoad}`;
            if (mentorNameEl) mentorNameEl.textContent = `Mentor: ${displayName}`;
            // Use department from mentor record
            if (mentorDepartmentEl && mentorDetails.department) mentorDepartmentEl.textContent = `Dept: ${mentorDetails.department}`;

        } catch (error) {
            console.error(`Error loading mentor details for ID ${mentorIdToLoad}:`, error);
            if (mentorNameEl) mentorNameEl.textContent = "Mentor: Error Loading Details";
            if (mentorDepartmentEl) mentorDepartmentEl.textContent = "";
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

        await loadMentorDetails(); // Load mentor's own details first
        loadMentees();             // Load assigned mentees
        loadAchievements();        // Load achievements awarded by this mentor
        // Add calls to load other sections if needed
    };

    const clearDashboardSections = () => {
        const sections = [menteeListEl, achievementListEl];
        sections.forEach(el => { if (el) el.innerHTML = ''; }); // Clear content

        if (totalMenteesEl) totalMenteesEl.textContent = '0'; // Default to 0
        // Mentor name/dept are loaded by loadMentorDetails
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
            li.innerHTML = `
                <div class="mentee-info">
                    <img src="img/default-profile.svg" alt="Profile" class="profile-pic-small">
                    <div>
                        <strong>${mentee.mentee_email}</strong> (${mentee.course || 'N/A'} - Year ${mentee.year || 'N/A'})<br>
                        <span class="small-text">Attendance: ${mentee.attendance !== null ? mentee.attendance + '%' : 'N/A'} | Status: ${mentee.academic_context || 'N/A'}</span>
                    </div>
                </div>
                <div class="mentee-actions">
                     <button class="btn-outline small-text view-profile-btn" data-mentee-id="${mentee.mentee_id}">View Profile</button>
                     <button class="btn-danger small-text delete-mentee-btn" data-mentee-id="${mentee.mentee_id}" data-mentee-email="${mentee.mentee_email}"><i class="fas fa-trash-alt"></i> Delete</button>
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
            // Corrected image path to be relative
            const badgeSrc = ach.badge_icon ? `img/${ach.badge_icon}` : 'img/default-avatar.svg';
            li.innerHTML = `
                <div>
                    <img src="${badgeSrc}" alt="Badge" width="20" height="20" style="vertical-align: middle; margin-right: 5px;" onerror="this.src='img/default-avatar.svg'; this.onerror=null;"> <!-- Added fallback -->
                    <strong>${ach.title}</strong> for ${ach.mentee_email} (${ach.mentee_prn || 'N/A'})
                </div>
                <div class="small-text">${ach.description || ''} | Awarded: ${formatDate(ach.date_awarded, false)}</div>
            `;
            list.appendChild(li);
        });
        achievementListEl.appendChild(list);
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
        document.getElementById('add-mentee-btn')?.addEventListener('click', handleAddMenteeClick);
        document.getElementById('award-achievement-btn')?.addEventListener('click', showAwardAchievementModal);
        menteeFilterEl?.addEventListener('change', displayMentees); // Add event listener for filter changes

        document.body.addEventListener('click', (event) => {
            if (event.target.matches('.view-profile-btn[data-mentee-id]')) {
                viewMenteeProfile(event.target.dataset.menteeId);
            }
            else if (event.target.closest('.delete-mentee-btn[data-mentee-id]')) {
                 const button = event.target.closest('.delete-mentee-btn');
                 const menteeId = button.dataset.menteeId;
                 const menteeEmail = button.dataset.menteeEmail || `ID ${menteeId}`;
                 handleDeleteMenteeClick(menteeId, menteeEmail);
            }
        });
    };

    // --- Helper Functions (Moved inside DOMContentLoaded) ---

    function viewMenteeProfile(menteeId) {
        console.log(`Viewing profile for mentee ID: ${menteeId}`);
        // TODO: Implement actual navigation or modal display
        alert(`Navigate to profile page for mentee ${menteeId}`);
    }

    const handleAddMenteeClick = () => {
        if (!selectedMentorId) {
            alert("Please select a mentor first.");
            return;
        }
        const menteeUserNo = prompt("Enter the Unique User Number (unique_user_no) of the mentee to add:");
        if (menteeUserNo && !isNaN(menteeUserNo)) {
            addMentee(parseInt(menteeUserNo, 10));
        } else if (menteeUserNo !== null) {
            alert("Invalid Unique User Number entered.");
        }
    };

    const addMentee = async (menteeUserNo) => {
        // selectedMentorId is now accessible here
        if (!selectedMentorId) {
            alert("Cannot add mentee: No mentor selected.");
            return;
        }

        const menteeData = {
            unique_user_no: menteeUserNo,
            mentor_id: selectedMentorId
        };

        try {
            // Correct endpoint should likely be POST /api/mentee (needs verification in server.js)
            const response = await fetch('/api/mentee', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(menteeData),
            });

            // Check for 404 specifically
             if (response.status === 404) {
                 console.error("Error adding mentee: Endpoint /api/mentee not found (404). Check server routes.");
                 throw new Error("Add mentee feature is currently unavailable (endpoint not found).");
             }

            const result = await response.json();

            if (!response.ok) {
                console.error("Error adding mentee:", result);
                throw new Error(result.message || `Failed to add mentee. Status: ${response.status}`);
            }

            alert(`Mentee (User No: ${menteeUserNo}) added successfully!`);
            loadMentees(); // Reload mentee list

        } catch (error) {
            console.error('Error adding mentee:', error);
            alert(`Error adding mentee: ${error.message}`);
        }
    };

    const handleDeleteMenteeClick = (menteeId, menteeIdentifier) => {
         if (!menteeId) return;

         const confirmation = confirm(`Are you sure you want to remove mentee "${menteeIdentifier}" (ID: ${menteeId}) from your list? This will delete their record in the 'mentee' table.`);

         if (confirmation) {
             deleteMentee(menteeId);
         }
    };

    const deleteMentee = async (menteeId) => {
        // selectedMentorId is accessible if needed, but loadMentees is called which uses it
        try {
            // Correct endpoint should likely be DELETE /api/mentee/:menteeId (needs verification)
            const response = await fetch(`/api/mentee/${menteeId}`, {
                method: 'DELETE',
            });

             if (response.status === 404) {
                 console.error(`Error deleting mentee: Endpoint /api/mentee/${menteeId} not found (404). Check server routes.`);
                 throw new Error("Delete mentee feature is currently unavailable (endpoint not found).");
             }

            const result = await response.json();

            if (!response.ok) {
                 console.error("Error deleting mentee:", result);
                throw new Error(result.message || `Failed to delete mentee. Status: ${response.status}`);
            }

            alert(result.message || `Mentee ${menteeId} deleted successfully.`);
            loadMentees(); // Reload mentee list

        } catch (error) {
            console.error('Error deleting mentee:', error);
            alert(`Error deleting mentee: ${error.message}`);
        }
    };

    async function showAwardAchievementModal() {
        // selectedMentorId is now accessible here
        if (!selectedMentorId) {
            alert("Please select a mentor first.");
            return;
        }

        // Simple prompt-based modal for now
        const menteeId = prompt("Enter the Mentee ID to award:");
        if (!menteeId || isNaN(menteeId)) {
            alert("Invalid Mentee ID.");
            return;
        }

        const title = prompt("Enter the Achievement Title:");
        if (!title) {
            alert("Achievement Title is required.");
            return;
        }

        const description = prompt("Enter the Achievement Description (optional):");
        const dateAwarded = prompt("Enter the Date Awarded (YYYY-MM-DD):", new Date().toISOString().split('T')[0]); // Default to today
        if (!dateAwarded || !/^\d{4}-\d{2}-\d{2}$/.test(dateAwarded)) {
            alert("Invalid Date format. Please use YYYY-MM-DD.");
            return;
        }

        const badgeIcon = prompt("Enter the Badge Icon filename (e.g., project_badge.png, optional):");

        const achievementData = {
            mentee_id: parseInt(menteeId, 10),
            title: title,
            description: description || null,
            date_awarded: dateAwarded,
            badge_icon: badgeIcon || null
        };

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
            loadAchievements(); // Reload the achievements list

        } catch (error) {
            console.error('Error awarding achievement:', error);
            alert(`Error awarding achievement: ${error.message}`);
        }
    }

    // --- Initialize ---
    initializeDashboard();

}); // End of DOMContentLoaded

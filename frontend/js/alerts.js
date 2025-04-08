// Emergency Alerts Management

// Function to get auth token
function getAuthToken() {
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('No authentication token found in localStorage');
        return null;
    }
    console.log('Token found:', token.substring(0, 10) + '...'); // Log first 10 chars for debugging
    return token;
}

// Function to check if user is authenticated
function isAuthenticated() {
    const token = getAuthToken();
    if (!token) {
        console.log('User is not authenticated');
        showNotification('error', 'Please login to view alerts');
        return false;
    }
    console.log('User is authenticated');
    return true;
}

// Function to update emergency alerts table
async function updateEmergencyAlertsTable() {
    console.log('updateEmergencyAlertsTable function called');
    const tableBody = document.getElementById('emergencyAlertsTableBody');
    
    if (!tableBody) {
        console.error("Emergency alerts table body not found!");
        return;
    }

    // Check authentication first
    if (!isAuthenticated()) {
        tableBody.innerHTML = '<tr><td colspan="6">Please login to view alerts</td></tr>';
        return;
    }

    tableBody.innerHTML = '<tr><td colspan="6">Loading emergency alerts...</td></tr>';

    try {
        const token = getAuthToken();
        console.log('Fetching data from /api/emergency-alerts endpoint...');
        const apiUrl = window.location.origin + '/api/emergency-alerts';
        console.log('Full API URL:', apiUrl);
        
        // Log the full request details for debugging
        console.log('Request headers:', {
            'Authorization': `Bearer ${token.substring(0, 10)}...`,
            'Content-Type': 'application/json'
        });

        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Fetch response status:', response.status);
        
        if (!response.ok) {
            if (response.status === 403) {
                console.log('Access denied - clearing token');
                localStorage.removeItem('token');
                throw new Error('Session expired. Please login again.');
            }
            const errorText = await response.text();
            console.error('Error response:', errorText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const alerts = await response.json();
        console.log('Received emergency alerts data:', alerts);

        if (!alerts || alerts.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6">No emergency alerts found.</td></tr>';
            return;
        }

        tableBody.innerHTML = alerts.map(alert => `
            <tr>
                <td>${alert.alert_id}</td>
                <td>${alert.comm_id}</td>
                <td>${alert.alert_reason}</td>
                <td>
                    <span class="alert-status ${alert.alert_status}">
                        ${alert.alert_status}
                    </span>
                </td>
                <td>${new Date(alert.created_at).toLocaleString()}</td>
                <td>
                    <button class="btn btn-sm btn-outline mr-1" onclick="resolveEmergencyAlert(${alert.alert_id})">
                        <i class="fas fa-check"></i> Resolve
                    </button>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Error fetching emergency alerts:', error);
        tableBody.innerHTML = `<tr><td colspan="6">Error: ${error.message}</td></tr>`;
        showNotification('error', error.message);
    }
}

// Function to resolve an emergency alert
async function resolveEmergencyAlert(alertId) {
    if (!isAuthenticated()) {
        return;
    }

    if (confirm(`Are you sure you want to resolve alert ID: ${alertId}?`)) {
        try {
            const token = getAuthToken();
            console.log('Resolving alert:', alertId);
            
            const response = await fetch(`/api/emergency-alerts/${alertId}/resolve`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                if (response.status === 403) {
                    console.log('Access denied - clearing token');
                    localStorage.removeItem('token');
                    throw new Error('Session expired. Please login again.');
                }
                const errorText = await response.text();
                console.error('Error response:', errorText);
                throw new Error(`Failed to resolve alert: ${errorText}`);
            }
            
            // Show success message
            showNotification('success', 'Alert resolved successfully');
            
            // Refresh the table
            updateEmergencyAlertsTable();
            
        } catch (error) {
            console.error('Error resolving alert:', error);
            showNotification('error', error.message);
        }
    }
}

// Function to show notifications
function showNotification(type, message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `form-status ${type}`;
    messageDiv.style.position = 'fixed';
    messageDiv.style.top = '20px';
    messageDiv.style.right = '20px';
    messageDiv.style.zIndex = '9999';
    messageDiv.style.padding = '15px 25px';
    messageDiv.style.borderRadius = '5px';
    messageDiv.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${message}`;
    
    document.body.appendChild(messageDiv);
    
    // Remove the message after 3 seconds
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.parentNode.removeChild(messageDiv);
        }
    }, 3000);
}

// Initialize alerts functionality when the page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded - Checking authentication');
    if (isAuthenticated()) {
        updateEmergencyAlertsTable();
    }
}); 
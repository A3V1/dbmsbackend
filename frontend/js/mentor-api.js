/**
 * mentor-api.js
 * 
 * This file contains functions for interacting with the mentor-specific API endpoints.
 * It provides methods for retrieving and manipulating mentor data, mentees, achievements,
 * communications, emergency alerts, activity logs, and meetings.
 */

class MentorAPI {
    constructor(baseUrl = '/api') {
        this.baseUrl = baseUrl;
        this.endpoints = {
            mentees: `${baseUrl}/mentor/mentees`,
            menteeProfile: `${baseUrl}/mentor/mentee`,
            messages: `${baseUrl}/mentor/messages`,
            broadcastMessages: `${baseUrl}/mentor/broadcast-messages`,
            activityLogs: `${baseUrl}/mentor/activity-logs`,
            achievements: `${baseUrl}/mentor/achievements`,
            addMentee: `${baseUrl}/mentor/mentee/add`,
            removeMentee: `${baseUrl}/mentor/mentee`,
            availableMentees: `${baseUrl}/mentor/available-mentees`
        };
    }

    /**
     * Helper method for making API requests
     * @param {string} endpoint - The API endpoint URL
     * @param {Object} options - Optional request options (method, headers, body)
     * @returns {Promise} - Promise with API response data
     */
    async fetchAPI(endpoint, options = {}) {
        try {
            const response = await fetch(endpoint, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `API request failed with status ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request error:', error);
            throw error;
        }
    }

    /**
     * Get mentees for a mentor
     * @param {number} mentorId - The ID of the mentor
     * @returns {Promise} - Promise with mentee list
     */
    async getMentees(mentorId) {
        return this.fetchAPI(`${this.endpoints.mentees}/${mentorId}`);
    }

    /**
     * Get mentee profile
     * @param {number} menteeId - The ID of the mentee
     * @returns {Promise} - Promise with mentee profile
     */
    async getMenteeProfile(menteeId) {
        return this.fetchAPI(`${this.endpoints.menteeProfile}/${menteeId}`);
    }

    /**
     * Get messages for a mentor
     * @param {number} mentorId - The ID of the mentor
     * @returns {Promise} - Promise with messages list
     */
    async getMessages(mentorId) {
        return this.fetchAPI(`${this.endpoints.messages}/${mentorId}`);
    }

    /**
     * Get broadcast messages sent by a mentor
     * @param {number} mentorId - The ID of the mentor
     * @returns {Promise} - Promise with broadcast messages list
     */
    async getBroadcastMessages(mentorId) {
        return this.fetchAPI(`${this.endpoints.broadcastMessages}/${mentorId}`);
    }

    /**
     * Get activity logs for a mentor's mentees
     * @param {number} mentorId - The ID of the mentor
     * @param {Object} filters - Optional filters (menteeId, startDate, endDate, activityType)
     * @returns {Promise} - Promise with activity logs list
     */
    async getActivityLogs(mentorId, filters = {}) {
        let url = `${this.endpoints.activityLogs}/${mentorId}`;
        
        // Add query parameters for filters if provided
        const queryParams = new URLSearchParams();
        if (filters.menteeId) queryParams.append('menteeId', filters.menteeId);
        if (filters.startDate) queryParams.append('startDate', filters.startDate);
        if (filters.endDate) queryParams.append('endDate', filters.endDate);
        if (filters.activityType) queryParams.append('activityType', filters.activityType);
        
        if (queryParams.toString()) {
            url += `?${queryParams.toString()}`;
        }
        
        return this.fetchAPI(url);
    }

    /**
     * Get achievements for a mentor's mentees
     * @param {number} mentorId - The ID of the mentor
     * @returns {Promise} - Promise with achievements list
     */
    async getAchievements(mentorId) {
        return this.fetchAPI(`${this.endpoints.achievements}/${mentorId}`);
    }

    /**
     * Get available mentees (not assigned to any mentor)
     * @returns {Promise} - Promise with available mentees list
     */
    async getAvailableMentees() {
        return this.fetchAPI(this.endpoints.availableMentees);
    }

    /**
     * Add a mentee to a mentor
     * @param {number} mentorId - The ID of the mentor
     * @param {string} menteeEmail - The email of the mentee to add
     * @returns {Promise} - Promise with API response
     */
    async addMentee(mentorId, menteeEmail) {
        return this.fetchAPI(this.endpoints.addMentee, {
            method: 'POST',
            body: JSON.stringify({ mentorId, menteeEmail })
        });
    }

    /**
     * Remove a mentee from a mentor
     * @param {number} menteeId - The ID of the mentee to remove
     * @param {number} mentorId - The ID of the mentor
     * @returns {Promise} - Promise with API response
     */
    async removeMentee(menteeId, mentorId) {
        return this.fetchAPI(`${this.endpoints.removeMentee}/${menteeId}`, {
            method: 'DELETE',
            body: JSON.stringify({ mentorId })
        });
    }

    /**
     * Send a message to a mentee
     * @param {number} senderId - The ID of the sender (mentor)
     * @param {number} receiverId - The ID of the receiver (mentee)
     * @param {string} message - The message content
     * @returns {Promise} - Promise with API response
     */
    async sendMessage(senderId, receiverId, message) {
        return this.fetchAPI(`${this.baseUrl}/mentor/message`, {
            method: 'POST',
            body: JSON.stringify({ senderId, receiverId, message })
        });
    }

    /**
     * Update achievement status
     * @param {number} achievementId - The ID of the achievement
     * @param {string} status - The new status
     * @param {string} remarks - Remarks for the status update
     * @returns {Promise} - Promise with API response
     */
    async updateAchievementStatus(achievementId, status, remarks) {
        return this.fetchAPI(`${this.baseUrl}/mentor/achievement/${achievementId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status, remarks })
        });
    }
}

// Export the MentorAPI class
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MentorAPI;
} else {
    window.MentorAPI = MentorAPI;
}

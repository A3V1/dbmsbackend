# Mentor-Mentee Management System

The Mentor-Mentee Management System is a web-based platform designed to streamline and enhance the academic mentoring process at MIT World Peace University. The system provides tailored dashboards and tools for administrators, mentors, and mentees, enabling efficient communication, progress tracking, achievement management, and reporting.

## Features

- **Role-Based Dashboards:**

  - **Admin Dashboard:** Manage users, mentors, mentees, view system statistics, handle emergency alerts, and generate reports.
  - **Mentor Dashboard:** View assigned mentees, manage achievements, communicate with mentees, monitor mentee progress, and handle alerts.
  - **Mentee Dashboard:** View academic progress, achievements, assigned mentor details, communicate with mentor, and submit feedback.

- **User Management:**

  - Admins can add, edit, or remove users (mentors, mentees, admins).
  - Assign mentors to mentees and manage mentor-mentee relationships.
  - View and filter users by role, department, or other criteria.

- **Academic Progress Tracking:**

  - Mentees can view their course, year, attendance, and academic context.
  - Mentors can monitor the academic status and attendance of their mentees.
  - Visual progress indicators and statistics.

- **Communication Hub:**

  - Secure one-to-one and broadcast messaging between users.
  - Notifications for important events, meetings, and achievements.
  - Emergency alert system for urgent situations.

- **Meeting Scheduling:**

  - Mentees can request meetings with mentors, specifying type, mode, date, time, and agenda.
  - Mentors can view, approve, or reschedule meeting requests.
  - Meeting details, status, and history are tracked.

- **Achievements:**

  - Mentors can award achievements to mentees for academic or extracurricular accomplishments.
  - Mentees can view and filter their achievements.
  - Achievements can include badges, certificates, and descriptions.

- **Feedback System:**

  - Mentees can submit feedback to mentors.
  - Mentors can provide feedback on mentee performance.
  - Feedback history is accessible for both parties.

- **Reports & Analytics:**

  - Visualize user statistics, mentor-mentee distribution, department overviews, and more using interactive charts.
  - Download detailed reports for administrative review.

- **Responsive Design:**
  - Optimized for desktops, tablets, and mobile devices.
  - Accessible and user-friendly interface.

## Technologies Used

- **Frontend:** HTML5, CSS3, JavaScript (ES6+), [Chart.js](https://www.chartjs.org/), Font Awesome
- **Backend:** Node.js, Express.js (API endpoints, not included in this repo)
- **Database:** MySQL (schema and queries not included in this repo)
- **Storage:** Uses browser `localStorage` for demo/sample data

## Functionality Overview

- **Authentication:**

  - Role-based login system (admin, mentor, mentee).
  - Session management using browser storage (for demo).

- **Data Handling:**

  - Uses browser `localStorage` for demo/sample data.
  - API endpoints referenced in the frontend must be implemented in the backend for full functionality.

- **Dynamic UI Updates:**

  - Dashboards update in real-time based on user actions and data changes.
  - Modals for adding/editing users, achievements, and handling alerts.

- **Sample Data:**
  - Demo includes pre-populated users, mentors, mentees, achievements, and communications for testing.

## Getting Started

1. **Clone the repository:**
   ```
   git clone https://github.com/your-org/dbmsbackend.git
   ```
2. **Open the `frontend` folder in your browser:**

   - For demo purposes, open `index.html` directly.
   - For full functionality, run with a backend server supporting the API endpoints.

3. **Login:**
   - Use the sample login page to log in as Admin, Mentor, or Mentee.

## Folder Structure

- `frontend/` - All HTML, CSS, and JS files for the web interface.
- `js/` - JavaScript files for dashboard logic and data handling.
- `assets/` - Images, icons, and static assets.

## Notes

- This project is a prototype/demo. Some features (like authentication, file uploads, and real-time messaging) require backend implementation.
- Sample data is loaded into `localStorage` for demonstration.
- API endpoints referenced in the frontend must be implemented in the backend for full functionality.

## License

MIT License

---

© 2025 MIT World Peace University. All rights reserved.

## How the Frontend Works

### Overview

The frontend of the Mentor-Mentee Management System is a responsive, role-based web application built with HTML, CSS, and JavaScript. It provides tailored interfaces for admins, mentors, and mentees, ensuring each user accesses only the features relevant to their role.

### Structure & Navigation

Navigation is handled through a sidebar and top navigation bar, dynamically showing or hiding menu items based on the logged-in user's role. The sidebar includes quick access to dashboards, communication tools, reports, and user management. The navigation component updates user info and menu visibility in real time.

### Role-Based Dashboards

- **Admin Dashboard:** Displays system statistics, user management tables, emergency alerts, and activity logs. Admins can add, edit, or delete users and view mentor-mentee relationships.
- **Mentor Dashboard:** Shows assigned mentees, achievement management, recent communications, and pending alerts. Mentors can award achievements, communicate with mentees, and monitor mentee progress.
- **Mentee Dashboard:** Presents academic progress, achievements, feedback, and communication with mentors. Mentees can request meetings, submit feedback, and view mentor details and timetable.

### Data Handling & Interactivity

The frontend interacts with backend APIs to fetch and update data. For demo purposes, sample data is loaded into `localStorage`. JavaScript modules manage data retrieval, UI updates, and form submissions. Modals are used for adding/editing users, achievements, and sending messages. Dynamic lists and tables update automatically after actions like adding or deleting records.

### Communication & Alerts

A dedicated Communication Hub allows users to send messages, receive notifications, and manage emergency alerts. Broadcast and one-to-one messaging are supported, with real-time UI updates and modal forms for message composition.

### Reports & Analytics

Admins can access analytics and reports visualized with Chart.js, including user statistics, mentor-mentee distribution, and department overviews. Reports can be downloaded for further analysis.

### Responsiveness & Accessibility

CSS Grid and Flexbox ensure the layout adapts to desktops, tablets, and mobile devices, providing a seamless user experience across platforms. The UI uses accessible color schemes, clear icons, and consistent button styles for usability.

### Customization & Extensibility

The frontend is modular, making it easy to add new features or adapt to different institutional requirements. All user-facing text and navigation can be customized, and the system is designed to integrate with various backend APIs.

## How Everything is Connected

The Mentor-Mentee Management System frontend is organized into modular HTML, CSS, and JavaScript files, each responsible for specific parts of the user interface and functionality. Here’s how the pieces work together:

- **Navigation & Layout:**  
  The sidebar and top navigation components are included on every page, providing consistent access to features. JavaScript dynamically updates navigation based on the logged-in user's role, ensuring users only see relevant options.

- **Role-Based Pages:**  
  Each dashboard (admin, mentor, mentee) is a separate HTML file with its own layout and widgets. Shared CSS and JavaScript files provide consistent styling and behavior across all dashboards.

- **Data Flow:**  
  JavaScript modules fetch data from backend API endpoints (or from `localStorage` in demo mode) and update the DOM. User actions—such as submitting forms, sending messages, or awarding achievements—trigger API calls, which update the backend and then refresh the UI.

- **Modals & Forms:**  
  Modals are used for adding/editing users, achievements, and sending messages. Form submissions are handled by JavaScript, which validates input, sends data to the backend, and updates the UI on success.

- **Communication & Alerts:**  
  The Communication Hub centralizes messaging, notifications, and emergency alerts. All communication data is fetched and rendered dynamically, ensuring users see real-time updates.

- **Reports & Analytics:**  
  The reports page uses Chart.js to visualize data fetched from the backend, providing insights into system usage and performance.

- **Session & Access Control:**  
  User authentication and role information are stored in browser storage. JavaScript checks this information on each page load to control access and personalize the experience.

This modular, API-driven approach ensures that all parts of the frontend remain in sync, providing a seamless and interactive experience for all users.

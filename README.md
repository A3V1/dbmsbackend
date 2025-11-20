# Mentor-Mentee Management System

A comprehensive full-stack web-based platform designed to streamline and enhance the academic mentoring process at MIT World Peace University. The system provides tailored dashboards and tools for administrators, mentors, and mentees, enabling efficient communication, progress tracking, achievement management, and detailed reporting.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [API Documentation](#api-documentation)
- [Frontend Components](#frontend-components)
- [Installation & Setup](#installation--setup)
- [Authentication & Authorization](#authentication--authorization)
- [Usage Guide](#usage-guide)
- [Project Structure](#project-structure)
- [Security Considerations](#security-considerations)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

The **Mentor-Mentee Management System** is a role-based academic mentoring platform that facilitates:

- **Student mentorship tracking** across courses and academic years
- **Real-time communication** between mentors and mentees
- **Achievement recognition** and progress monitoring
- **Emergency alert management** for urgent situations
- **Meeting scheduling** with approval workflows
- **Comprehensive analytics** and reporting for administrators

**Current Version:** 1.0
**Institution:** MIT World Peace University
**Default Port:** 3000

---

## Features

### Role-Based Dashboards

#### **Admin Dashboard**
- **User Management:** Create, update, and delete users (admins, mentors, mentees)
- **System Statistics:** View total users, mentor-mentee ratios, active alerts
- **Emergency Alerts:** Monitor and resolve urgent situations
- **Activity Logging:** Track user actions, login times, and IP addresses
- **Reports & Analytics:** Generate comprehensive system reports with visualizations
- **Mentor-Mentee Assignment:** Assign and reassign mentor relationships

#### **Mentor Dashboard**
- **Mentee Management:** View assigned mentees with filtering capabilities
- **Achievement Awards:** Create and award achievements with badges
- **Academic Monitoring:** Track mentee attendance, performance, and progress
- **Communication Tools:** One-to-one messaging and broadcast announcements
- **Meeting Management:** View and approve meeting requests
- **Alert Handling:** Respond to emergency alerts from mentees
- **Profile Management:** Update room number, timetable, department details

#### **Mentee Dashboard**
- **Academic Progress:** View course, year, attendance, and academic context
- **Achievement Gallery:** Display earned achievements with badges
- **Mentor Information:** Access mentor details, room number, and timetable
- **Feedback Submission:** Submit feedback with optional PDF attachments
- **Meeting Requests:** Schedule meetings with mentors (type, mode, agenda)
- **Communication:** Direct messaging with assigned mentor
- **Calendar View:** Upcoming meetings and important dates

### Core Functionality

#### **Communication System**
- **One-to-One Messaging:** Private conversations between users
- **Broadcast Messages:** Announcements to multiple recipients
- **Message Status Tracking:** Sent, delivered, read indicators
- **File Attachments:** Support for PDF and document uploads
- **Meeting Requests:** Integrated meeting scheduling via communication
- **Feedback Communication:** Structured feedback exchange

#### **Achievement Management**
- **Custom Achievements:** Create achievements with titles, descriptions, dates
- **Badge System:** Visual badges for recognition
- **Mentor Attribution:** Track which mentor awarded each achievement
- **Achievement History:** Complete record of mentee accomplishments
- **Filtering & Sorting:** Search achievements by date, mentor, or type

#### **Meeting Scheduling**
- **Request Meetings:** Specify type, mode (online/offline), date, time, agenda
- **Approval Workflow:** Mentors review and approve/reschedule requests
- **Status Tracking:** Pending, approved, completed, cancelled states
- **Calendar Integration:** Visual calendar view of scheduled meetings
- **Meeting History:** Complete record of past meetings

#### **Emergency Alert System**
- **Alert Creation:** Mentees can raise urgent alerts with reasons
- **Status Management:** Track alerts as pending or resolved
- **Admin Oversight:** Admins monitor all emergency situations
- **Communication Linking:** Alerts tied to communication records

#### **Activity Logging**
- **User Actions:** Comprehensive audit trail of system activities
- **Login Tracking:** Record login times and IP addresses
- **Session Management:** Track user sessions and activity patterns
- **Security Auditing:** Monitor suspicious activities

#### **Reports & Analytics**
- **User Statistics:** Count by role (admin, mentor, mentee)
- **Mentor-Mentee Distribution:** Visual charts of assignment ratios
- **Department Overviews:** Analytics by academic department
- **Attendance Trends:** Track mentee attendance patterns
- **Academic Performance:** Progress tracking and visualizations
- **Downloadable Reports:** Export reports for administrative review

---

## Technology Stack

### Backend

- **Runtime:** Node.js
- **Framework:** Express.js (v5.1.0)
- **Database:** MySQL 8.0+ with mysql2 (v3.14.0)
- **Connection Pooling:** Max 10 connections, unlimited queue
- **Middleware:**
  - `cors` (v2.8.5) - Cross-origin resource sharing
  - `express.json()` - JSON body parsing
  - `express.urlencoded()` - URL-encoded body parsing
  - `multer` (v2.0.1) - File upload handling
- **Environment Management:** dotenv (v16.4.7)
- **Development Tool:** nodemon (v3.1.9) - Auto-reload on file changes

### Frontend

- **HTML5:** Semantic markup with accessibility features
- **CSS3:** Modern styling with CSS Grid, Flexbox, CSS Variables
- **JavaScript:** ES6+ with async/await, modules, fetch API
- **Visualization:** Chart.js - Interactive charts and graphs
- **Icons:** Font Awesome 6.0.0
- **Fonts:** Inter (Google Fonts) for admin dashboard
- **Storage:** LocalStorage API for demo data, SessionStorage for authentication

### Database

- **MySQL 8.0+**
- **12 Tables:** Users, mentors, mentees, communications, achievements, etc.
- **3 Database Views:** Optimized query patterns for common data needs
- **3 Stored Procedures:** Complex operations (AddNewMentee, DeleteMenteeAndAllAssociations, etc.)
- **Foreign Key Constraints:** Referential integrity enforcement
- **Triggers:** Automated data management

---

## Architecture

### System Design

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Admin UI   │  │  Mentor UI   │  │  Mentee UI   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
│                   ┌────────▼────────┐                        │
│                   │  JavaScript API │                        │
│                   │   Client (Fetch)│                        │
│                   └────────┬────────┘                        │
└────────────────────────────┼──────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   CORS Layer    │
                    └────────┬────────┘
┌────────────────────────────┼──────────────────────────────────┐
│                   ┌────────▼────────┐                          │
│                   │  Express Router │                          │
│                   └────────┬────────┘                          │
│                            │                                   │
│     ┌──────────────────────┼──────────────────────┐           │
│     │                      │                      │           │
│  ┌──▼──┐  ┌──────▼──────┐ │ ┌───▼────┐  ┌────▼─────┐        │
│  │Users│  │Generic CRUD │ │ │Mentor  │  │  Mentee  │        │
│  │Route│  │   Router    │ │ │ Route  │  │  Route   │        │
│  └──┬──┘  └──────┬──────┘ │ └───┬────┘  └────┬─────┘        │
│     │            │        │     │            │               │
│     │  ┌─────────▼────────▼─────▼────────────▼───┐          │
│     │  │    Achievement, Alerts, Activity,        │          │
│     │  │   Communication, Dashboard Routes        │          │
│     │  └─────────────────┬──────────────────────┘           │
│     └────────────────────┘                                   │
│                          │                                   │
│                 ┌────────▼────────┐                          │
│                 │  MySQL Pool     │                          │
│                 │  (mysql2/promise)│                         │
│                 └────────┬────────┘                          │
└──────────────────────────┼────────────────────────────────────┘
                           │
┌──────────────────────────┼────────────────────────────────────┐
│                 ┌────────▼────────┐                           │
│                 │   MySQL Server  │                           │
│                 │                 │                           │
│   ┌─────────────┼─────────────────┼──────────────┐           │
│   │   Tables    │   Views         │  Procedures  │           │
│   │   (12)      │   (3)           │  (3)         │           │
│   └─────────────┴─────────────────┴──────────────┘           │
└────────────────────────────────────────────────────────────────┘
```

### Request Flow

1. **Client Request:** User interacts with frontend (HTML/CSS/JS)
2. **API Call:** JavaScript sends HTTP request to Express server
3. **Routing:** Express router directs to appropriate route handler
4. **Validation:** Middleware validates table names, request data
5. **Database Query:** Route handler executes SQL via MySQL pool
6. **Data Processing:** Results processed and formatted
7. **Response:** JSON response sent back to client
8. **UI Update:** JavaScript updates DOM with new data

---

## Database Schema

### Tables (12)

#### **1. users** (Primary User Table)
```sql
CREATE TABLE users (
  unique_user_no INT PRIMARY KEY AUTO_INCREMENT,
  official_mail_id VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone_num VARCHAR(20),
  prn_id VARCHAR(50) UNIQUE,
  role ENUM('admin', 'mentor', 'mentee') NOT NULL,
  profile_picture VARCHAR(255),
  calendar_id VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
**Purpose:** Central user authentication and profile management
**Key Fields:** Unique user number, email, role-based access

#### **2. mentor** (Mentor Details)
```sql
CREATE TABLE mentor (
  mentor_id INT PRIMARY KEY AUTO_INCREMENT,
  unique_user_no INT,
  room_no VARCHAR(50),
  timetable TEXT,
  department VARCHAR(100),
  academic_background TEXT,
  FOREIGN KEY (unique_user_no) REFERENCES users(unique_user_no) ON DELETE CASCADE
);
```
**Purpose:** Store mentor-specific information
**Key Fields:** Room number, timetable, department

#### **3. mentee** (Mentee Details)
```sql
CREATE TABLE mentee (
  mentee_id INT PRIMARY KEY AUTO_INCREMENT,
  unique_user_no INT,
  mentor_id INT,
  FOREIGN KEY (unique_user_no) REFERENCES users(unique_user_no) ON DELETE CASCADE,
  FOREIGN KEY (mentor_id) REFERENCES mentor(mentor_id) ON DELETE SET NULL
);
```
**Purpose:** Link mentees to users and mentors
**Key Fields:** User reference, assigned mentor

#### **4. mentee_academics** (Academic Progress)
```sql
CREATE TABLE mentee_academics (
  mentee_id INT PRIMARY KEY,
  course VARCHAR(100),
  year VARCHAR(20),
  attendance DECIMAL(5,2),
  academic_context TEXT,
  academic_background TEXT,
  FOREIGN KEY (mentee_id) REFERENCES mentee(mentee_id) ON DELETE CASCADE
);
```
**Purpose:** Track mentee academic information
**Key Fields:** Course, year, attendance percentage

#### **5. communication** (Messages & Alerts)
```sql
CREATE TABLE communication (
  comm_id INT PRIMARY KEY AUTO_INCREMENT,
  sender_id INT,
  receiver_id INT,
  message_content TEXT,
  message_status ENUM('sent', 'delivered', 'read') DEFAULT 'sent',
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  attached_file VARCHAR(255),
  type ENUM('one-to-one', 'broadcast', 'feedback', 'meeting_req'),
  FOREIGN KEY (sender_id) REFERENCES users(unique_user_no) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(unique_user_no) ON DELETE CASCADE
);
```
**Purpose:** Store all system communications
**Key Fields:** Sender, receiver, message type, status

#### **6. emergency_alerts** (Emergency Management)
```sql
CREATE TABLE emergency_alerts (
  emergency_alert_id INT PRIMARY KEY AUTO_INCREMENT,
  comm_id INT,
  alert_reason TEXT,
  alert_status ENUM('pending', 'resolved') DEFAULT 'pending',
  FOREIGN KEY (comm_id) REFERENCES communication(comm_id) ON DELETE CASCADE
);
```
**Purpose:** Track urgent alerts
**Key Fields:** Alert reason, status

#### **7. admin** (Admin Privileges)
```sql
CREATE TABLE admin (
  admin_id INT PRIMARY KEY AUTO_INCREMENT,
  unique_user_no INT,
  privilege TEXT,
  FOREIGN KEY (unique_user_no) REFERENCES users(unique_user_no) ON DELETE CASCADE
);
```
**Purpose:** Store admin-specific data
**Key Fields:** Privilege level

#### **8. activity_log** (User Activity Tracking)
```sql
CREATE TABLE activity_log (
  log_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  log_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  activity TEXT,
  ip_address VARCHAR(45),
  last_login TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(unique_user_no) ON DELETE CASCADE
);
```
**Purpose:** Audit trail of user actions
**Key Fields:** User ID, activity description, IP address

#### **9. achievement** (Mentee Achievements)
```sql
CREATE TABLE achievement (
  achvmt_id INT PRIMARY KEY AUTO_INCREMENT,
  mentor_id INT,
  mentee_id INT,
  title VARCHAR(255),
  description TEXT,
  date_awarded DATE,
  badge_icon VARCHAR(255),
  FOREIGN KEY (mentor_id) REFERENCES mentor(mentor_id) ON DELETE CASCADE,
  FOREIGN KEY (mentee_id) REFERENCES mentee(mentee_id) ON DELETE CASCADE
);
```
**Purpose:** Record mentee accomplishments
**Key Fields:** Title, description, badge, date

### Database Views (3)

#### **1. communication_view**
```sql
CREATE VIEW communication_view AS
SELECT
  c.sender_id,
  c.receiver_id,
  u1.official_mail_id AS sender_email,
  u2.official_mail_id AS receiver_email,
  c.message_content,
  c.message_status
FROM communication c
JOIN users u1 ON c.sender_id = u1.unique_user_no
JOIN users u2 ON c.receiver_id = u2.unique_user_no;
```
**Purpose:** Simplified communication queries with email details

#### **2. mentor_view**
```sql
CREATE VIEW mentor_view AS
SELECT
  m.mentor_id,
  u1.official_mail_id AS mentor_email,
  me.mentee_id,
  u2.official_mail_id AS mentee_email
FROM mentor m
JOIN users u1 ON m.unique_user_no = u1.unique_user_no
LEFT JOIN mentee me ON m.mentor_id = me.mentor_id
LEFT JOIN users u2 ON me.unique_user_no = u2.unique_user_no;
```
**Purpose:** Show mentor-mentee relationships with emails

#### **3. mentee_academic_view**
```sql
CREATE VIEW mentee_academic_view AS
SELECT
  me.mentee_id,
  u.official_mail_id AS mentee_email,
  ma.course,
  ma.year,
  ma.attendance,
  ma.academic_context
FROM mentee me
JOIN users u ON me.unique_user_no = u.unique_user_no
JOIN mentee_academics ma ON me.mentee_id = ma.mentee_id;
```
**Purpose:** Academic details with mentee emails

### Stored Procedures (3)

#### **1. AddNewMentee**
**Purpose:** Atomically create user + mentee + mentee_academics records
**Parameters:**
- `email` VARCHAR(255)
- `password` VARCHAR(255)
- `phone` VARCHAR(20)
- `prn_id` VARCHAR(50)
- `calendar_id` VARCHAR(255)
- `mentor_id` INT
- `course` VARCHAR(100)
- `year` VARCHAR(20)
- `attendance` DECIMAL(5,2)
- `academic_context` TEXT
- `academic_background` TEXT

**Called By:** `POST /api/users` when role = 'mentee'

#### **2. DeleteMenteeAndAllAssociations**
**Purpose:** Cascading deletion of mentee and all related records
**Parameters:**
- `user_id` INT

**Handles Deletion Of:**
- mentee_academics
- achievements
- communications
- emergency_alerts
- mentee record
- user record

**Called By:** `DELETE /api/users/:id` when role = 'mentee'

#### **3. get_mentor_mentees_academics**
**Purpose:** Retrieve mentee academic details for a mentor
**Parameters:**
- `mentor_id` INT

**Called By:** Mentor dashboard queries

---

## API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication Endpoints

#### **POST /api/users/login**
**Description:** Authenticate user and return user ID and role
**Request Body:**
```json
{
  "official_mail_id": "user@college.edu",
  "password": "password123"
}
```
**Response (200):**
```json
{
  "userId": 1,
  "role": "mentor"
}
```
**Response (401):**
```json
{
  "error": "Invalid credentials"
}
```

### User Management Endpoints

#### **GET /api/users**
**Description:** Get all users (limited columns)
**Response (200):**
```json
[
  {
    "unique_user_no": 1,
    "official_mail_id": "user@college.edu",
    "prn_id": "PRN001",
    "role": "mentor",
    "phone_num": "1234567890",
    "created_at": "2025-01-15T10:30:00.000Z"
  }
]
```

#### **GET /api/users/:id**
**Description:** Get specific user by ID (excludes password)
**Response (200):**
```json
{
  "unique_user_no": 1,
  "official_mail_id": "user@college.edu",
  "phone_num": "1234567890",
  "prn_id": "PRN001",
  "role": "mentor",
  "profile_picture": null,
  "calendar_id": "CAL001",
  "created_at": "2025-01-15T10:30:00.000Z"
}
```

#### **POST /api/users**
**Description:** Create new user
**Request Body (Mentor):**
```json
{
  "official_mail_id": "newmentor@college.edu",
  "password": "password123",
  "phone_num": "9876543210",
  "prn_id": "PRN002",
  "role": "mentor",
  "calendar_id": "CAL002"
}
```
**Request Body (Mentee - uses stored procedure):**
```json
{
  "official_mail_id": "newmentee@college.edu",
  "password": "password123",
  "phone_num": "9876543210",
  "prn_id": "PRN003",
  "role": "mentee",
  "calendar_id": "CAL003",
  "mentor_id": 1,
  "course": "Computer Science",
  "year": "2",
  "attendance": 85.5,
  "academic_context": "Good performer",
  "academic_background": "High school graduate"
}
```
**Response (201):**
```json
{
  "message": "User created successfully",
  "userId": 3
}
```

#### **PUT /api/users/:id**
**Description:** Update user by ID
**Request Body:**
```json
{
  "official_mail_id": "updated@college.edu",
  "phone_num": "1112223333"
}
```

#### **DELETE /api/users/:id**
**Description:** Delete user (handles role-specific deletion)
**Response (200):**
```json
{
  "message": "User deleted successfully"
}
```

#### **PATCH /api/users/email/:id**
**Description:** Update only email field
**Request Body:**
```json
{
  "official_mail_id": "newemail@college.edu"
}
```

#### **PATCH /api/users/role/:id**
**Description:** Update only role field
**Request Body:**
```json
{
  "role": "admin"
}
```

#### **PATCH /api/users/prn/:id**
**Description:** Update only PRN ID field
**Request Body:**
```json
{
  "prn_id": "PRN999"
}
```

#### **PATCH /api/users/phone/:id**
**Description:** Update only phone number field
**Request Body:**
```json
{
  "phone_num": "5556667777"
}
```

#### **GET /api/users/count/total**
**Description:** Get total user count
**Response (200):**
```json
{
  "count": 27
}
```

#### **GET /api/users/count/mentors**
**Description:** Get mentor count
**Response (200):**
```json
{
  "count": 5
}
```

#### **GET /api/users/count/mentees**
**Description:** Get mentee count
**Response (200):**
```json
{
  "count": 20
}
```

### Generic CRUD Endpoints

**Allowed Tables:** achievement, activity_log, admin, communication, communication_view, emergency_alerts, mentee, mentee_academic_view, mentee_academics, mentor, mentor_view, users

#### **GET /api/:tableName**
**Description:** Get all records from table
**Example:** `GET /api/achievement`

#### **GET /api/:tableName/:id**
**Description:** Get single record by ID
**Example:** `GET /api/achievement/1`

#### **POST /api/:tableName**
**Description:** Create new record
**Example:** `POST /api/achievement`
**Request Body:**
```json
{
  "mentor_id": 1,
  "mentee_id": 5,
  "title": "Academic Excellence",
  "description": "Achieved 95% in midterm exams",
  "date_awarded": "2025-01-20",
  "badge_icon": "trophy"
}
```

#### **PUT /api/:tableName/:id**
**Description:** Update record
**Example:** `PUT /api/achievement/1`

#### **DELETE /api/:tableName/:id**
**Description:** Delete record
**Example:** `DELETE /api/achievement/1`

### Mentor Endpoints

#### **GET /api/mentor**
**Description:** Get all mentors
**Response (200):**
```json
[
  {
    "mentor_id": 1,
    "unique_user_no": 3,
    "room_no": "A-101",
    "timetable": "Mon-Fri 9AM-5PM",
    "department": "Computer Science",
    "academic_background": "PhD in CS"
  }
]
```

#### **GET /api/mentor/details/by-user/:userId**
**Description:** Get mentor details by unique_user_no
**Example:** `GET /api/mentor/details/by-user/3`

#### **GET /api/mentor/:id**
**Description:** Get mentor by mentor_id
**Example:** `GET /api/mentor/1`

#### **DELETE /api/mentor/:id**
**Description:** Delete mentor by mentor_id
**Example:** `DELETE /api/mentor/1`

### Mentee Endpoints

#### **GET /api/mentee/details-by-user/:unique_user_no**
**Description:** Get mentee ID by user number
**Example:** `GET /api/mentee/details-by-user/15`

#### **GET /api/mentee/mentee-dropdown**
**Description:** Get mentees dropdown (filtered by mentor)
**Query Parameters:** `mentorId` (optional)
**Example:** `GET /api/mentee/mentee-dropdown?mentorId=1`

#### **GET /api/mentee/mentor-info**
**Description:** Get assigned mentor information
**Query Parameters:** `menteeId`
**Example:** `GET /api/mentee/mentor-info?menteeId=5`

#### **GET /api/mentee/academic-progress**
**Description:** Get mentee's academic progress
**Query Parameters:** `menteeId`
**Example:** `GET /api/mentee/academic-progress?menteeId=5`

#### **GET /api/mentee/communication**
**Description:** Get recent communications (one-to-one & feedback)
**Query Parameters:** `menteeId`
**Example:** `GET /api/mentee/communication?menteeId=5`

#### **GET /api/mentee/calendar**
**Description:** Get upcoming meetings
**Query Parameters:** `menteeId`
**Example:** `GET /api/mentee/calendar?menteeId=5`

#### **GET /api/mentee/emergency-alerts**
**Description:** Get emergency alerts for mentee
**Query Parameters:** `menteeId`
**Example:** `GET /api/mentee/emergency-alerts?menteeId=5`

#### **GET /api/mentee/achievements**
**Description:** Get mentee achievements
**Query Parameters:** `menteeId`
**Example:** `GET /api/mentee/achievements?menteeId=5`

#### **GET /api/mentee/feedback**
**Description:** Get feedback from mentor
**Query Parameters:** `menteeId`
**Example:** `GET /api/mentee/feedback?menteeId=5`

#### **GET /api/mentee/:menteeId/academic-details**
**Description:** Get detailed academic background
**Example:** `GET /api/mentee/5/academic-details`

#### **GET /api/mentee/get-mentor-id/:menteeId**
**Description:** Get mentor ID for mentee
**Example:** `GET /api/mentee/get-mentor-id/5`

#### **POST /api/mentee/submit-feedback**
**Description:** Submit feedback with optional PDF upload
**Content-Type:** `multipart/form-data`
**Form Fields:**
- `menteeId` (number)
- `mentorId` (number)
- `feedback` (text)
- `feedbackFile` (file, optional, PDF)

**Example Response (200):**
```json
{
  "message": "Feedback submitted successfully",
  "filePath": "/uploads/feedback_pdfs/feedbackFile-1737123456789-abc123.pdf"
}
```

### Emergency Alerts Endpoints

#### **GET /api/alerts**
**Description:** Get all emergency alerts
**Response (200):**
```json
[
  {
    "emergency_alert_id": 1,
    "comm_id": 45,
    "alert_reason": "Medical emergency",
    "alert_status": "pending"
  }
]
```

#### **GET /api/alerts/count/pending**
**Description:** Get count of pending alerts
**Response (200):**
```json
{
  "count": 3
}
```

#### **DELETE /api/alerts/:id**
**Description:** Delete specific alert
**Example:** `DELETE /api/alerts/1`

### Activity Logging Endpoints

#### **GET /api/activity**
**Description:** Get all activity logs
**Response (200):**
```json
[
  {
    "log_id": 1,
    "user_id": 5,
    "log_time": "2025-01-20T14:30:00.000Z",
    "activity": "User logged in",
    "ip_address": "192.168.1.100",
    "last_login": "2025-01-20T14:30:00.000Z"
  }
]
```

### Achievement Endpoints

#### **GET /api/achievement**
**Description:** Get all achievements

#### **GET /api/achievement/mentee/:menteeId**
**Description:** Get achievements for specific mentee
**Example:** `GET /api/achievement/mentee/5`

#### **DELETE /api/achievement/:id**
**Description:** Delete achievement
**Example:** `DELETE /api/achievement/1`

### Communication View Endpoints

#### **GET /api/commview**
**Description:** Get communication view data
**Response (200):**
```json
[
  {
    "sender_id": 3,
    "receiver_id": 15,
    "sender_email": "mentor1@college.edu",
    "receiver_email": "mentee5@college.edu",
    "message_content": "Meeting scheduled for tomorrow",
    "message_status": "delivered"
  }
]
```

### Mentor-Mentee Relations Endpoints

#### **GET /api/mentor-mentee**
**Description:** Get mentor_view data
**Response (200):**
```json
[
  {
    "mentor_id": 1,
    "mentor_email": "mentor1@college.edu",
    "mentee_id": 5,
    "mentee_email": "mentee5@college.edu"
  }
]
```

### Mentor Dashboard Endpoints

#### **GET /api/mentor-dashboard/mentors**
**Description:** Get all mentors for dropdown

#### **GET /api/mentor-dashboard/:mentorId/details**
**Description:** Get mentor details
**Example:** `GET /api/mentor-dashboard/1/details`

#### **GET /api/mentor-dashboard/:mentorId/mentees**
**Description:** Get mentees assigned to mentor
**Example:** `GET /api/mentor-dashboard/1/mentees`

#### **GET /api/mentor-dashboard/:mentorId/meetings**
**Description:** Get meetings for mentor
**Example:** `GET /api/mentor-dashboard/1/meetings`

### Test Endpoint

#### **GET /api/test**
**Description:** Health check endpoint
**Response (200):**
```json
{
  "message": "API is working"
}
```

---

## Frontend Components

### Pages (11)

#### **1. index.html** - Landing/Login Page
- Beautiful gradient background (blue theme)
- Login form with email/password fields
- Role-based login redirect (admin/mentor/mentee)
- Password visibility toggle
- Responsive design with Font Awesome icons

#### **2. mentor-dashboard.html** - Mentor Dashboard
- **Header Section:** Mentor name, department, room, timetable, academic background
- **Date/Time Display:** Real-time clock
- **Mentee List Section:** Filterable list of assigned mentees
- **Achievement Management:** Award achievements with modal form
- **Recent Communications:** Message list with timestamps
- **Chat/Alert Interface:** Quick message and alert buttons

#### **3. mentee-dashboard.html** - Mentee Dashboard
- **Grid Layout:** 2-column responsive design
- **Academic Progress Card:** Course, year, attendance, context
- **Achievements Gallery:** Visual display of earned badges
- **Communication Section:** Direct messaging with mentor
- **Calendar Widget:** Upcoming meetings and events
- **Feedback Form:** Submit feedback with PDF upload
- **Mentor Information Card:** Mentor details, room, timetable

#### **4. admin-dashboard.html** - Admin Dashboard
- **Sidebar Navigation:** Profile, menu items, logout
- **User Management Table:** Add, edit, delete users
- **Statistics Cards:** Total users, mentors, mentees, alerts
- **System Monitoring:** Activity logs, emergency alerts
- **Inter Font Styling:** Modern, professional appearance
- **Dark Blue Color Scheme:** MIT WPU branding

#### **5. communication-hub.html** - Messaging Interface
- **One-to-One Messaging:** Private conversations
- **Broadcast Messages:** Announcements to groups
- **Notification System:** Real-time message alerts
- **Emergency Alert Handling:** Urgent situation management

#### **6. meeting-schedule.html** - Meeting Scheduling
- **Calendar Interface:** Visual date picker
- **Meeting Request Form:** Type, mode, date, time, agenda
- **Approval Workflow:** Status tracking (pending/approved)
- **Meeting History:** Past and upcoming meetings

#### **7. reports.html** - Analytics & Reports
- **Chart.js Visualizations:** Interactive charts and graphs
- **User Statistics:** Count by role, department
- **Mentor-Mentee Distribution:** Assignment ratios
- **Department Overviews:** Academic department analytics
- **Download Reports:** Export functionality

#### **8. student-profile.html** - Student Profile
- **Personal Information:** Name, email, phone, PRN ID
- **Academic Details:** Course, year, attendance
- **Contact Information:** Phone, email, address
- **Profile Picture:** Upload and display

#### **9. signup.html** - User Registration
- **Role Selection:** Admin, mentor, mentee
- **Form Fields:** Email, password, PRN ID, phone
- **Role-Specific Fields:** Mentor/mentee additional info
- **Validation:** Client-side form validation

#### **10. role.html** - Role Selection Page
- Initial role selection interface before signup

#### **11. mit-wpu-login.html** - Alternative Login Page
- Alternative login page variant with MIT WPU branding

### Stylesheets

#### **styles.css** (42 KB)
- **Color Scheme:**
  - Primary: #FF6B00 (Orange) / #2563eb (Blue)
  - Secondary: #FF8C38 (Light Orange)
  - Accent: #1E5CC8 (Blue)
  - Neutral: Grays, whites
- **CSS Variables:** Consistent theming
- **Responsive Design:** Mobile-first approach
- **CSS Grid & Flexbox:** Modern layouts
- **Animations:** Smooth transitions and hover effects

#### **dashboard-shared.css** - Shared Dashboard Styles
- Common components across all dashboards
- Card styles, buttons, forms

#### **mentor-dashboard.css** - Mentor-Specific Styles
- Mentee list styling
- Achievement badge styles

### JavaScript Modules

#### **main.js** (26 KB)
- **Sample Data Structure:** Matches database schema
- **Feature Permissions:** Role-based access control
- **LocalStorage Initialization:** Demo data setup
- **Helper Functions:** Data management utilities

#### **login.js** (4 KB)
- **Login Form Handler:** Submission logic
- **API Call:** POST /api/users/login
- **SessionStorage Management:** Store userId and role
- **Role-Based Redirect:** Navigate to appropriate dashboard
- **Error Display:** Show validation errors
- **Password Toggle:** Show/hide password

#### **dashboard.js** (6 KB)
- **Shared Dashboard Utilities:** Common functions
- **Data Fetching Functions:** API request helpers
- **UI Update Helpers:** DOM manipulation
- **Modal Management:** Show/hide modals

#### **admin-dashboard.js** (2 KB)
- **Admin-Specific Logic:** User management
- **Statistics Display:** Real-time counts

#### **mentor-dashboard.js** (32 KB)
- **Dashboard Initialization:** Load mentor data
- **Mentee List Management:** Display and filter
- **Achievement Management:** Award and track achievements
- **Communication Handling:** Send and receive messages
- **Real-Time Updates:** Dynamic content refresh

#### **mentee-dashboard.js** (30 KB)
- **Dashboard Initialization:** Load mentee data
- **Academic Progress Display:** Show course, attendance
- **Achievement Viewing:** Display earned badges
- **Communication with Mentor:** Messaging interface
- **Feedback Submission:** Submit feedback with PDF
- **Mentor Info Display:** Show mentor details

### Reusable Components

#### **navigation.html** - Dynamic Navigation
- **Sidebar/Top Nav:** Role-aware menu items
- **User Profile Display:** Avatar, name, role
- **Logout Functionality:** Session clearing

---

## Installation & Setup

### Prerequisites

- **Node.js:** v14.0.0 or higher
- **npm:** v6.0.0 or higher
- **MySQL:** v8.0.0 or higher
- **Git:** v2.0.0 or higher
- **Port 3000:** Available and not in use

### Step 1: Clone the Repository

```bash
git clone https://github.com/your-org/dbmsbackend.git
cd dbmsbackend
```

### Step 2: Install Dependencies

```bash
npm install
```

**Dependencies Installed:**
- express (v5.1.0)
- mysql2 (v3.14.0)
- cors (v2.8.5)
- dotenv (v16.4.7)
- multer (v2.0.1)
- nodemon (v3.1.9) - dev only

### Step 3: Configure Environment Variables

Create a `.env` file in the root directory:

```bash
# .env file
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=dbmm
PORT=3000
```

**Important:** Add `.env` to `.gitignore` to protect sensitive data.

### Step 4: Initialize Database

1. **Create Database:**
```sql
CREATE DATABASE dbmm;
USE dbmm;
```

2. **Run Schema Script:**
```bash
mysql -u root -p dbmm < database.sql
```

This will create:
- 12 tables with proper foreign keys
- 3 database views
- 3 stored procedures
- Sample data (optional)

### Step 5: Verify Database Connection

Test the database configuration:

```bash
node -e "require('./dbconfig.js').then(pool => pool.query('SELECT 1')).then(() => console.log('DB Connected!')).catch(err => console.error(err))"
```

### Step 6: Start the Server

**Production Mode:**
```bash
npm start
```

**Development Mode (with auto-reload):**
```bash
npm run dev
```

**Expected Output:**
```
Server running on http://localhost:3000
MySQL database connected
```

### Step 7: Access the Application

Open your browser and navigate to:
- **Login Page:** http://localhost:3000
- **Admin Dashboard:** http://localhost:3000/admin-dashboard.html
- **Mentor Dashboard:** http://localhost:3000/mentor-dashboard.html
- **Mentee Dashboard:** http://localhost:3000/mentee-dashboard.html

### Step 8: Test with Sample Accounts

**Admin Accounts:**
- Email: `admin1@college.edu` | Password: `pass123`
- Email: `admin2@college.edu` | Password: `pass456`

**Mentor Accounts:**
- Email: `mentor1@college.edu` | Password: `pass789`
- Email: `mentor2@college.edu` | Password: `pass012`
- Email: `mentor3@college.edu` | Password: `pass345`
- Email: `mentor4@college.edu` | Password: `pass678`
- Email: `mentor5@college.edu` | Password: `pass901`

**Mentee Accounts:**
- Email: `mentee1@college.edu` | Password: `pass111`
- Email: `mentee2@college.edu` | Password: `pass222`
- ... (mentee3 through mentee20 follow the same pattern)

### Troubleshooting

#### **Port Already in Use:**
```bash
# Change PORT in .env file
PORT=3001
```

#### **MySQL Connection Error:**
- Verify MySQL is running: `sudo systemctl status mysql`
- Check credentials in `.env` file
- Ensure database `dbmm` exists

#### **Module Not Found:**
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

#### **CORS Errors:**
- Ensure CORS is enabled in `server.js`
- Check browser console for specific errors

---

## Authentication & Authorization

### Authentication Method

**Type:** Simple email/password authentication
**Endpoint:** `POST /api/users/login`

#### **Login Flow:**

1. User enters `official_mail_id` and `password`
2. Frontend sends POST request to `/api/users/login`
3. Backend queries `users` table: `SELECT * FROM users WHERE official_mail_id = ?`
4. **Password Comparison:** Direct plaintext comparison (⚠️ SECURITY ISSUE)
5. On success: Returns `userId` (unique_user_no) and `role`
6. Frontend stores in `sessionStorage`:
   - `sessionStorage.setItem('userId', userId)`
   - `sessionStorage.setItem('userRole', role)`
7. Redirect to appropriate dashboard based on role

#### **Session Management:**

- **Storage:** Browser `sessionStorage`
- **Stored Data:** `userId`, `userRole`
- **Lifetime:** Cleared when tab/browser closes
- **Security:** ⚠️ No server-side session management
- **Tokens:** ⚠️ No JWT or encrypted tokens

### Authorization (Role-Based Access Control)

#### **Admin Role**
**Access:**
- User management (CRUD operations on all users)
- System statistics (total users, mentor/mentee counts)
- Emergency alerts (view and resolve)
- Activity logs (audit trail)
- Reports and analytics
- Mentor-mentee assignment
- All tables via Generic CRUD endpoints

**Restricted From:**
- Mentee-specific academic details
- Mentor-specific timetables (view only)

#### **Mentor Role**
**Access:**
- View assigned mentees
- Manage achievements (create, award, delete)
- Communicate with mentees (one-to-one, broadcast)
- Monitor mentee academic progress
- Respond to emergency alerts
- Approve meeting requests
- View own profile and timetable

**Restricted From:**
- User management (cannot add/delete users)
- System-wide statistics
- Other mentors' mentees
- Admin-level activity logs

#### **Mentee Role**
**Access:**
- View own academic progress
- View earned achievements
- View assigned mentor details
- Communicate with mentor
- Submit feedback (with PDF attachment)
- Request meetings
- Raise emergency alerts
- View own profile

**Restricted From:**
- User management
- Achievement creation (can only view)
- Other mentees' data
- System statistics
- Admin/mentor dashboards

### Security Issues Identified

⚠️ **CRITICAL SECURITY VULNERABILITIES:**

1. **Plaintext Passwords:**
   - Passwords stored directly in database without hashing
   - Direct comparison in login endpoint (server.js:980)
   - **Fix:** Implement bcrypt for password hashing

2. **No Token-Based Authentication:**
   - Uses sessionStorage instead of JWT tokens
   - No server-side session validation
   - **Fix:** Implement JWT with access/refresh tokens

3. **No HTTPS Enforcement:**
   - HTTP allows credentials to be intercepted
   - **Fix:** Enforce HTTPS in production

4. **CORS Wide Open:**
   - `cors()` allows all origins (*)
   - **Fix:** Whitelist specific origins

5. **Trigger Manipulation:**
   - Code attempts to disable triggers (users.js:707-774)
   - Potential database integrity issues
   - **Fix:** Remove trigger manipulation code

6. **No Input Validation:**
   - Middleware lacks comprehensive input validation
   - SQL injection potential
   - **Fix:** Implement input validation middleware (Joi, express-validator)

7. **No Rate Limiting:**
   - Brute-force attacks possible on login endpoint
   - **Fix:** Implement rate limiting (express-rate-limit)

8. **No CSRF Protection:**
   - Cross-site request forgery possible
   - **Fix:** Implement CSRF tokens

### Recommended Security Improvements

```javascript
// 1. Password Hashing (bcrypt)
const bcrypt = require('bcrypt');
const hashedPassword = await bcrypt.hash(password, 10);
const isMatch = await bcrypt.compare(password, user.password);

// 2. JWT Tokens
const jwt = require('jsonwebtoken');
const token = jwt.sign({ userId, role }, process.env.JWT_SECRET, { expiresIn: '1h' });

// 3. Authentication Middleware
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// 4. CORS Whitelist
const corsOptions = {
  origin: ['https://yourfrontend.com'],
  credentials: true
};
app.use(cors(corsOptions));

// 5. Rate Limiting
const rateLimit = require('express-rate-limit');
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5 // 5 attempts
});
app.post('/api/users/login', loginLimiter, loginHandler);
```

---

## Usage Guide

### For Administrators

#### **1. Login**
- Navigate to http://localhost:3000
- Enter admin credentials
- Click "Login" button
- Redirected to admin dashboard

#### **2. Manage Users**
- View all users in the table
- **Add User:** Click "Add User" button → Fill form → Select role → Submit
- **Edit User:** Click edit icon → Modify fields → Save
- **Delete User:** Click delete icon → Confirm deletion
- **Filter Users:** Use search bar to filter by email, role, or PRN ID

#### **3. View Statistics**
- **Total Users:** Displayed in statistics card
- **Mentor Count:** Total number of mentors
- **Mentee Count:** Total number of mentees
- **Pending Alerts:** Count of unresolved emergency alerts

#### **4. Handle Emergency Alerts**
- View pending alerts in "Emergency Alerts" section
- Click "View Details" to see alert reason and communication
- Mark as "Resolved" once addressed
- Delete resolved alerts from the system

#### **5. Generate Reports**
- Navigate to "Reports" page
- Select report type (user statistics, mentor-mentee distribution, etc.)
- View interactive Chart.js visualizations
- Click "Download Report" to export as PDF or CSV

#### **6. Monitor Activity**
- View activity logs in "Activity Log" section
- Filter by user, date range, or activity type
- Track login times, IP addresses, and user actions

### For Mentors

#### **1. Login**
- Navigate to http://localhost:3000
- Enter mentor credentials
- Click "Login" button
- Redirected to mentor dashboard

#### **2. View Mentees**
- See list of assigned mentees in "My Mentees" section
- Filter mentees by name, course, or year
- Click on mentee name to view detailed profile
- View academic progress, attendance, and performance

#### **3. Award Achievements**
- Navigate to mentee profile
- Click "Award Achievement" button
- Fill form:
  - **Title:** Achievement name (e.g., "Academic Excellence")
  - **Description:** Brief description (e.g., "Scored 95% in midterms")
  - **Badge Icon:** Select icon (trophy, star, medal)
  - **Date Awarded:** Select date
- Click "Award" to save
- Mentee will see achievement in their dashboard

#### **4. Communicate with Mentees**
- **One-to-One Message:**
  - Click "Message" button next to mentee name
  - Type message content
  - Attach file if needed
  - Click "Send"
- **Broadcast Message:**
  - Click "Broadcast" button
  - Select multiple mentees
  - Type message
  - Click "Send to All"

#### **5. Manage Meetings**
- View meeting requests in "Meetings" section
- Click "View Details" to see meeting type, mode, agenda
- **Approve:** Click "Approve" button
- **Reschedule:** Click "Reschedule" → Select new date/time
- **Reject:** Click "Reject" → Provide reason

#### **6. Respond to Alerts**
- View emergency alerts in "Alerts" section
- Click "View Details" to see alert reason
- Contact mentee via communication hub
- Mark alert as "Resolved" once addressed

### For Mentees

#### **1. Login**
- Navigate to http://localhost:3000
- Enter mentee credentials
- Click "Login" button
- Redirected to mentee dashboard

#### **2. View Academic Progress**
- See academic details in "Academic Progress" card:
  - **Course:** Current course name
  - **Year:** Current academic year
  - **Attendance:** Attendance percentage
  - **Academic Context:** Performance summary

#### **3. View Achievements**
- See earned achievements in "Achievements" gallery
- Click on achievement to view details:
  - **Title:** Achievement name
  - **Description:** What it was awarded for
  - **Date Awarded:** When it was earned
  - **Badge:** Visual icon

#### **4. View Mentor Information**
- See mentor details in "Mentor Info" card:
  - **Name:** Mentor's name
  - **Email:** Mentor's email address
  - **Department:** Academic department
  - **Room Number:** Office location
  - **Timetable:** Availability schedule

#### **5. Communicate with Mentor**
- Click "Message Mentor" button
- Type message content
- Attach file if needed (PDF, images)
- Click "Send"
- View message history in "Communication" section

#### **6. Submit Feedback**
- Navigate to "Feedback" section
- Fill feedback form:
  - **Feedback Text:** Type detailed feedback
  - **Attach PDF:** Upload supporting documents (optional)
- Click "Submit Feedback"
- Confirmation message appears on success

#### **7. Request Meeting**
- Navigate to "Meetings" section
- Click "Request Meeting" button
- Fill meeting form:
  - **Type:** One-on-one, group, academic, career guidance
  - **Mode:** Online (Zoom, Google Meet) or Offline (in-person)
  - **Date:** Preferred date
  - **Time:** Preferred time
  - **Agenda:** Brief meeting purpose
- Click "Submit Request"
- Wait for mentor approval
- View meeting status in calendar

#### **8. Raise Emergency Alert**
- Click "Emergency Alert" button in communication hub
- Fill alert form:
  - **Alert Reason:** Describe urgent situation
  - **Details:** Additional context
- Click "Submit Alert"
- Admin and mentor will be notified immediately

---

## Project Structure

```
D:\dbmsbackend/
│
├── server.js                     # Main Express server (118 lines)
├── dbconfig.js                   # MySQL connection pool setup (25 lines)
├── package.json                  # Node.js dependencies and scripts
├── package-lock.json             # Dependency lock file
├── .env                          # Environment variables (DB credentials)
├── .gitignore                    # Git ignore file
├── database.sql                  # Database schema (171 lines)
├── database.txt                  # Database sample data/logs
├── README.md                     # Project documentation
├── setup.md                      # Setup instructions
│
├── routes/                       # API route handlers
│   ├── genericcrud.js           # Generic CRUD operations (170 lines)
│   ├── users.js                 # User auth & management (1,080 lines)
│   ├── mentor.js                # Mentor-specific endpoints (94 lines)
│   ├── mentee.js                # Mentee-specific endpoints (305 lines)
│   ├── alerts.js                # Emergency alerts management (59 lines)
│   ├── activity.js              # Activity logging (40 lines)
│   ├── achievement.js           # Achievement management (70 lines)
│   ├── commview.js              # Communication view endpoints (45 lines)
│   ├── mentor-mentee.js         # Mentor-mentee relationship (50 lines)
│   └── mentor-dashboard.js      # Mentor dashboard endpoints (100+ lines)
│
├── frontend/                     # Frontend files
│   ├── index.html               # Landing/login page
│   ├── mentor-dashboard.html    # Mentor dashboard (80+ lines)
│   ├── mentee-dashboard.html    # Mentee dashboard (80+ lines)
│   ├── admin-dashboard.html     # Admin dashboard (100+ lines)
│   ├── communication-hub.html   # Communication interface
│   ├── meeting-schedule.html    # Meeting scheduling
│   ├── reports.html             # Reports page
│   ├── student-profile.html     # Student profile
│   ├── signup.html              # User registration
│   ├── role.html                # Role selection
│   ├── mit-wpu-login.html       # Login page variant
│   ├── styles.css               # Main stylesheet (42 KB)
│   │
│   ├── js/                      # JavaScript modules
│   │   ├── main.js              # Sample data & permissions (26 KB)
│   │   ├── login.js             # Login logic (4 KB)
│   │   ├── dashboard.js         # Dashboard utilities (6 KB)
│   │   ├── admin-dashboard.js   # Admin dashboard logic (2 KB)
│   │   ├── mentor-dashboard.js  # Mentor dashboard logic (32 KB)
│   │   └── mentee-dashboard.js  # Mentee dashboard logic (30 KB)
│   │
│   ├── css/                     # Stylesheet modules
│   │   ├── dashboard-shared.css # Shared dashboard styles
│   │   └── mentor-dashboard.css # Mentor-specific styles
│   │
│   ├── components/              # Reusable components
│   │   └── navigation.html      # Navigation component
│   │
│   ├── assets/                  # Static assets
│   └── img/                     # Images
│
├── uploads/                      # File uploads directory
│   └── feedback_pdfs/           # User feedback PDF storage
│
└── node_modules/                # Dependencies (not tracked in Git)
```

### Key Files Summary

| File | Lines | Purpose | Key Features |
|------|-------|---------|--------------|
| server.js | 118 | Main Express server & routing | Route mounting, CORS, static files, error handling |
| dbconfig.js | 25 | MySQL connection pool | mysql2/promise, 10 max connections, auto-test |
| routes/users.js | 1,080 | User authentication & CRUD | Login, user management, role updates, stored procedures |
| routes/genericcrud.js | 170 | Parameterized CRUD for tables | Table validation, GET/POST/PUT/DELETE for all tables |
| routes/mentee.js | 305 | Mentee-specific endpoints | Academic progress, achievements, feedback, alerts |
| routes/mentor.js | 94 | Mentor endpoints | Mentor details, mentee assignments |
| routes/mentor-dashboard.js | 100+ | Mentor dashboard queries | Dashboard data aggregation |
| routes/alerts.js | 59 | Emergency alerts | Create, view, resolve, delete alerts |
| routes/achievement.js | 70 | Achievement management | Award, view, delete achievements |
| frontend/mentor-dashboard.html | 80+ | Mentor dashboard UI | Mentee list, achievements, communications |
| frontend/mentee-dashboard.html | 80+ | Mentee dashboard UI | Academic progress, achievements, feedback |
| frontend/admin-dashboard.html | 100+ | Admin dashboard UI | User management, statistics, alerts |
| frontend/js/mentor-dashboard.js | 32 KB | Mentor dashboard logic | API calls, UI updates, event handlers |
| frontend/js/mentee-dashboard.js | 30 KB | Mentee dashboard logic | Dashboard initialization, data fetching |
| frontend/js/main.js | 26 KB | Sample data & utilities | Demo data, feature permissions, helpers |
| frontend/styles.css | 42 KB | Main styling | Responsive design, CSS Grid, Flexbox, theming |
| database.sql | 171 | Database schema | 12 tables, 3 views, 3 stored procedures, constraints |

---

## Security Considerations

### Current Security Issues

⚠️ **CRITICAL:**
1. **Plaintext Passwords:** Passwords stored without hashing (server.js:980)
2. **No JWT Authentication:** SessionStorage used instead of secure tokens
3. **CORS Wide Open:** Allows all origins (*)
4. **No Input Validation:** SQL injection potential
5. **No Rate Limiting:** Brute-force attacks possible
6. **Trigger Manipulation:** Database trigger disabling code (users.js:707-774)

⚠️ **HIGH:**
7. **No HTTPS Enforcement:** Credentials transmitted in plaintext
8. **No CSRF Protection:** Cross-site request forgery possible
9. **No Session Expiry:** SessionStorage persists until tab closes
10. **Exposed Error Messages:** Stack traces visible to users

⚠️ **MEDIUM:**
11. **No File Upload Validation:** Malicious file uploads possible
12. **No SQL Parameterization Consistency:** Some queries use string concatenation
13. **No Logging Framework:** Difficult to track security events
14. **No Database Connection Encryption:** MySQL connection not encrypted

### Production Security Checklist

#### **1. Authentication & Authorization**
- [ ] Implement bcrypt for password hashing
- [ ] Use JWT tokens with access/refresh pattern
- [ ] Add authentication middleware to all protected routes
- [ ] Implement role-based middleware (checkRole('admin'))
- [ ] Add session expiry and refresh logic
- [ ] Implement logout functionality (token invalidation)

#### **2. Input Validation & Sanitization**
- [ ] Install express-validator or Joi
- [ ] Validate all user inputs (email, phone, PRN ID, etc.)
- [ ] Sanitize inputs to prevent XSS attacks
- [ ] Implement request body size limits
- [ ] Validate file uploads (type, size, content)

#### **3. Network Security**
- [ ] Enforce HTTPS (redirect HTTP to HTTPS)
- [ ] Whitelist CORS origins (no '*')
- [ ] Add Helmet.js for security headers
- [ ] Implement rate limiting (express-rate-limit)
- [ ] Add CSRF protection (csurf middleware)

#### **4. Database Security**
- [ ] Use parameterized queries consistently (mysql2 ?)
- [ ] Encrypt database connection (ssl: true)
- [ ] Implement database user with minimal privileges
- [ ] Enable MySQL audit logging
- [ ] Regular database backups with encryption

#### **5. File Upload Security**
- [ ] Validate file types (whitelist PDF, images)
- [ ] Scan uploaded files for malware
- [ ] Store files outside web root
- [ ] Implement file size limits (max 10MB)
- [ ] Generate random filenames (avoid overwriting)

#### **6. Error Handling & Logging**
- [ ] Implement proper logging (Winston, Bunyan)
- [ ] Log security events (failed logins, privilege escalations)
- [ ] Hide stack traces in production
- [ ] Implement centralized error handling
- [ ] Set up monitoring and alerting

#### **7. Environment & Configuration**
- [ ] Move all secrets to environment variables
- [ ] Use different .env files per environment
- [ ] Never commit .env to version control
- [ ] Implement secret rotation policy
- [ ] Use secret management tools (AWS Secrets Manager, HashiCorp Vault)

#### **8. Code Security**
- [ ] Remove trigger manipulation code (users.js:707-774)
- [ ] Remove commented test code
- [ ] Implement SQL injection prevention
- [ ] Add dependency scanning (npm audit, Snyk)
- [ ] Regular security audits and penetration testing

### Recommended Security Packages

```json
{
  "dependencies": {
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2",
    "express-validator": "^7.0.1",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.1.5",
    "csurf": "^1.11.0",
    "winston": "^3.11.0",
    "dotenv": "^16.4.7"
  }
}
```

### Security Implementation Example

```javascript
// server.js - Production-ready security setup

const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const csrf = require('csurf');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const app = express();

// 1. Security headers
app.use(helmet());

// 2. CORS whitelist
const corsOptions = {
  origin: ['https://yourfrontend.com'],
  credentials: true
};
app.use(cors(corsOptions));

// 3. Rate limiting
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts, please try again later'
});

// 4. CSRF protection
const csrfProtection = csrf({ cookie: true });

// 5. Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// 6. Role-based middleware
const checkRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    next();
  };
};

// 7. Secure login endpoint
app.post('/api/users/login',
  loginLimiter,
  [
    body('official_mail_id').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { official_mail_id, password } = req.body;

    // Query user
    const [users] = await pool.query(
      'SELECT * FROM users WHERE official_mail_id = ?',
      [official_mail_id]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];

    // Compare hashed password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.unique_user_no, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const refreshToken = jwt.sign(
      { userId: user.unique_user_no },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      refreshToken,
      userId: user.unique_user_no,
      role: user.role
    });
  }
);

// 8. Protected route example
app.get('/api/admin/users',
  authenticateToken,
  checkRole(['admin']),
  async (req, res) => {
    // Admin-only logic
  }
);

// 9. Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message
  });
});
```

---

## Contributing

We welcome contributions to improve the Mentor-Mentee Management System! Please follow these guidelines:

### How to Contribute

1. **Fork the Repository**
   ```bash
   git clone https://github.com/your-org/dbmsbackend.git
   cd dbmsbackend
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**
   - Follow existing code style and conventions
   - Add comments for complex logic
   - Update documentation if needed

3. **Test Your Changes**
   - Test all affected functionality
   - Ensure no breaking changes
   - Add unit tests if applicable

4. **Commit with Clear Messages**
   ```bash
   git add .
   git commit -m "Add: Brief description of changes"
   git push origin feature/your-feature-name
   ```

5. **Create Pull Request**
   - Provide clear description of changes
   - Reference related issues
   - Wait for review and approval

### Code Style Guidelines

- **JavaScript:** ES6+ syntax, async/await preferred
- **Indentation:** 2 spaces (no tabs)
- **Naming:** camelCase for variables, PascalCase for classes
- **Comments:** JSDoc style for functions
- **SQL:** Uppercase keywords, parameterized queries

### Reporting Issues

When reporting bugs, please include:
- **Environment:** OS, Node.js version, MySQL version
- **Steps to Reproduce:** Detailed steps to trigger the bug
- **Expected Behavior:** What should happen
- **Actual Behavior:** What actually happens
- **Screenshots:** If applicable

### Feature Requests

For new features, please provide:
- **Description:** Clear description of the feature
- **Use Case:** Why this feature is needed
- **Proposed Solution:** How you envision it working
- **Alternatives:** Other approaches considered

---

## License

MIT License

Copyright (c) 2025 MIT World Peace University

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

## Acknowledgments

- **MIT World Peace University** for project sponsorship
- **Chart.js** for data visualization
- **Font Awesome** for icon library
- **Express.js community** for excellent documentation
- **MySQL** for robust database management

---

## Contact & Support

- **Institution:** MIT World Peace University
- **Project Repository:** [GitHub](https://github.com/your-org/dbmsbackend)
- **Issues & Bug Reports:** [GitHub Issues](https://github.com/your-org/dbmsbackend/issues)
- **Documentation:** [Wiki](https://github.com/your-org/dbmsbackend/wiki)

---

## Changelog

### Version 1.0.0 (2025-01-20)
- Initial release
- Full-stack mentor-mentee management system
- 12 database tables with 3 views and 3 stored procedures
- Role-based dashboards (admin, mentor, mentee)
- Communication hub with messaging and alerts
- Achievement management system
- Meeting scheduling with approval workflow
- Reports and analytics with Chart.js
- Responsive frontend design
- RESTful API with Express.js
- MySQL database with connection pooling

---

© 2025 MIT World Peace University. All rights reserved.

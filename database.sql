-- Create the database
CREATE DATABASE IF NOT EXISTS dbmm;
USE dbmm;

-- Table structure for table `users`
CREATE TABLE `users` (
  `official_mail_id` varchar(255) NOT NULL,
  `unique_user_no` int NOT NULL AUTO_INCREMENT,
  `password` varchar(255) NOT NULL,
  `phone_num` varchar(15) DEFAULT NULL,
  `prn_id` varchar(50) NOT NULL,
  `role` enum('admin','mentor','mentee') NOT NULL,
  `profile_picture` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `calendar_id` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`unique_user_no`),
  UNIQUE KEY `prn_id` (`prn_id`),
  UNIQUE KEY `calendar_id` (`calendar_id`),
  KEY `official_mail_id` (`official_mail_id`)
);

-- Table structure for table `mentor`
CREATE TABLE `mentor` (
  `mentor_id` int NOT NULL AUTO_INCREMENT,
  `unique_user_no` int NOT NULL,
  `room_no` varchar(50) DEFAULT NULL,
  `timetable` text,
  `department` varchar(255) DEFAULT NULL,
  `academic_background` text,
  PRIMARY KEY (`mentor_id`),
  KEY `unique_user_no` (`unique_user_no`),
  CONSTRAINT `mentor_ibfk_1` FOREIGN KEY (`unique_user_no`) REFERENCES `users` (`unique_user_no`)
);

-- Table structure for table `mentee`
CREATE TABLE `mentee` (
  `mentee_id` int NOT NULL AUTO_INCREMENT,
  `unique_user_no` int NOT NULL,
  `mentor_id` int NOT NULL,
  PRIMARY KEY (`mentee_id`),
  KEY `unique_user_no` (`unique_user_no`),
  KEY `mentor_id` (`mentor_id`),
  CONSTRAINT `mentee_ibfk_1` FOREIGN KEY (`unique_user_no`) REFERENCES `users` (`unique_user_no`),
  CONSTRAINT `mentee_ibfk_2` FOREIGN KEY (`mentor_id`) REFERENCES `mentor` (`mentor_id`)
);

-- Table structure for table `mentee_academics`
CREATE TABLE `mentee_academics` (
  `mentee_id` int NOT NULL,
  `course` varchar(255) DEFAULT NULL,
  `year` int DEFAULT NULL,
  `attendance` float DEFAULT NULL,
  `academic_context` varchar(15) DEFAULT NULL,
  `academic_background` text,
  PRIMARY KEY (`mentee_id`),
  CONSTRAINT `mentee_academics_ibfk_1` FOREIGN KEY (`mentee_id`) REFERENCES `mentee` (`mentee_id`)
);

-- Table structure for table `communication`
CREATE TABLE `communication` (
  `comm_id` int NOT NULL AUTO_INCREMENT,
  `sender_id` int NOT NULL,
  `receiver_id` int NOT NULL,
  `message_content` text,
  `message_status` enum('sent','delivered','read') DEFAULT 'sent',
  `timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `attached_file` varchar(255) DEFAULT NULL,
  `type` enum('one-to-one','broadcast','feedback','meeting_req') NOT NULL,
  PRIMARY KEY (`comm_id`),
  KEY `sender_id` (`sender_id`),
  KEY `receiver_id` (`receiver_id`),
  CONSTRAINT `communication_ibfk_1` FOREIGN KEY (`sender_id`) REFERENCES `users` (`unique_user_no`),
  CONSTRAINT `communication_ibfk_2` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`unique_user_no`)
);

-- Table structure for table `emergency_alerts`
CREATE TABLE `emergency_alerts` (
  `emergency_alert_id` int NOT NULL AUTO_INCREMENT,
  `comm_id` int NOT NULL,
  `alert_reason` text,
  `alert_status` enum('pending','resolved') DEFAULT NULL,
  PRIMARY KEY (`emergency_alert_id`),
  KEY `comm_id` (`comm_id`),
  CONSTRAINT `emergency_alerts_ibfk_1` FOREIGN KEY (`comm_id`) REFERENCES `communication` (`comm_id`)
);

-- Table structure for table `admin`
CREATE TABLE `admin` (
  `admin_id` int NOT NULL AUTO_INCREMENT,
  `unique_user_no` int NOT NULL,
  `privilege` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`admin_id`),
  KEY `unique_user_no` (`unique_user_no`),
  CONSTRAINT `admin_ibfk_1` FOREIGN KEY (`unique_user_no`) REFERENCES `users` (`unique_user_no`)
);

-- Table structure for table `activity_log`
CREATE TABLE `activity_log` (
  `log_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `log_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `activity` text,
  `ip_address` varchar(50) DEFAULT NULL,
  `last_login` timestamp NULL,
  PRIMARY KEY (`log_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `activity_log_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`unique_user_no`)
);

-- Table structure for table `achievement`
CREATE TABLE `achievement` (
  `achvmt_id` int NOT NULL AUTO_INCREMENT,
  `mentor_id` int DEFAULT NULL,
  `mentee_id` int DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `description` text,
  `date_awarded` date DEFAULT NULL,
  `badge_icon` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`achvmt_id`),
  KEY `mentor_id` (`mentor_id`),
  KEY `mentee_id` (`mentee_id`),
  CONSTRAINT `achievement_ibfk_1` FOREIGN KEY (`mentor_id`) REFERENCES `mentor` (`mentor_id`),
  CONSTRAINT `achievement_ibfk_2` FOREIGN KEY (`mentee_id`) REFERENCES `mentee` (`mentee_id`)
);

-- Creating views
CREATE OR REPLACE VIEW `mentor_view` AS
SELECT
    m.mentor_id,
    u_mentor.official_mail_id AS mentor_email,
    me.mentee_id,
    u_mentee.official_mail_id AS mentee_email
FROM
    mentor m
JOIN
    users u_mentor ON m.unique_user_no = u_mentor.unique_user_no
JOIN
    mentee me ON m.mentor_id = me.mentor_id
JOIN
    users u_mentee ON me.unique_user_no = u_mentee.unique_user_no;

CREATE OR REPLACE VIEW `mentee_academic_view` AS
SELECT
    ma.mentee_id,
    u.official_mail_id AS mentee_email,
    ma.course,
    ma.year,
    ma.attendance,
    ma.academic_context
FROM
    mentee_academics ma
JOIN
    mentee m ON ma.mentee_id = m.mentee_id
JOIN
    users u ON m.unique_user_no = u.unique_user_no;

CREATE OR REPLACE VIEW `communication_view` AS
SELECT
    c.sender_id,
    c.receiver_id,
    u_sender.official_mail_id AS sender_email,
    u_receiver.official_mail_id AS receiver_email,
    c.message_content,
    c.message_status
FROM
    communication c
JOIN
    users u_sender ON c.sender_id = u_sender.unique_user_no
JOIN
    users u_receiver ON c.receiver_id = u_receiver.unique_user_no;

-- ==============================================================================
-- Seed Data for University Mentor and Mentee Platform
-- Accounts: 1 Admin, 3 Faculty Mentors, 6 Student Mentees (3 paired, 3 unassigned)
-- Default Password for all seed accounts: "password123"
-- Bcrypt Hash (salt 10): $2a$10$pobyYbQa5zR9sLab5X5c0ubayaQcsRdqm9KGF.laZamJ5JjYpQOnu
-- ==============================================================================

-- 1. Insert Users
INSERT INTO USERS (UserID, Name, Email, PasswordHash, Role) VALUES
(1, 'Dr. Rajesh Sharma', 'admin@university.edu', '$2a$10$pobyYbQa5zR9sLab5X5c0ubayaQcsRdqm9KGF.laZamJ5JjYpQOnu', 'Admin'),
(2, 'Dr. Sunita Rao', 'sunita.rao@university.edu', '$2a$10$pobyYbQa5zR9sLab5X5c0ubayaQcsRdqm9KGF.laZamJ5JjYpQOnu', 'Mentor'),
(3, 'Dr. Vikram Malhotra', 'vikram.malhotra@university.edu', '$2a$10$pobyYbQa5zR9sLab5X5c0ubayaQcsRdqm9KGF.laZamJ5JjYpQOnu', 'Mentor'),
(4, 'Prof. Ananya Sen', 'ananya.sen@university.edu', '$2a$10$pobyYbQa5zR9sLab5X5c0ubayaQcsRdqm9KGF.laZamJ5JjYpQOnu', 'Mentor'),
(5, 'Aarav Patel', 'aarav.patel@student.edu', '$2a$10$pobyYbQa5zR9sLab5X5c0ubayaQcsRdqm9KGF.laZamJ5JjYpQOnu', 'Mentee'),
(6, 'Priya Sharma', 'priya.sharma@student.edu', '$2a$10$pobyYbQa5zR9sLab5X5c0ubayaQcsRdqm9KGF.laZamJ5JjYpQOnu', 'Mentee'),
(7, 'Rohan Verma', 'rohan.verma@student.edu', '$2a$10$pobyYbQa5zR9sLab5X5c0ubayaQcsRdqm9KGF.laZamJ5JjYpQOnu', 'Mentee'),
(8, 'Sneha Iyer', 'sneha.iyer@student.edu', '$2a$10$pobyYbQa5zR9sLab5X5c0ubayaQcsRdqm9KGF.laZamJ5JjYpQOnu', 'Mentee'),
(9, 'Aditya Nair', 'aditya.nair@student.edu', '$2a$10$pobyYbQa5zR9sLab5X5c0ubayaQcsRdqm9KGF.laZamJ5JjYpQOnu', 'Mentee'),
(10, 'Kavita Deshmukh', 'kavita.deshmukh@student.edu', '$2a$10$pobyYbQa5zR9sLab5X5c0ubayaQcsRdqm9KGF.laZamJ5JjYpQOnu', 'Mentee');

ALTER SEQUENCE users_userid_seq RESTART WITH 11;

-- 2. Insert User Profiles (with realistic subjects and skills)
INSERT INTO USER_PROFILES (UserID, Phone, Department, Designation, Year, CGPA, Skills) VALUES
-- Admin Profile
(1, '+91 98765 43210', 'Academic Affairs', 'Dean of Academic Affairs', NULL, NULL, '{}'),
-- Faculty Mentors Profiles
(2, '+91 98111 22334', 'Computer Science and Engineering', 'Associate Professor', NULL, NULL, ARRAY['Data Structures', 'Algorithms', 'Web Development', 'React', 'Database Systems', 'Python']),
(3, '+91 98222 33445', 'Information Technology', 'Professor & Head of Department', NULL, NULL, ARRAY['Cloud Computing', 'Database Systems', 'Java', 'Spring Boot', 'Computer Networks', 'Operating Systems']),
(4, '+91 98333 44556', 'Electronics & Communication', 'Assistant Professor', NULL, NULL, ARRAY['Embedded Systems', 'Internet of Things', 'C++', 'Python', 'Digital Electronics']),
-- Student Mentees Profiles
(5, '+91 98444 55667', 'Computer Science and Engineering', NULL, 3, 9.42, ARRAY['Data Structures', 'Algorithms', 'React', 'Web Development']),
(6, '+91 98555 66778', 'Computer Science and Engineering', NULL, 3, 9.15, ARRAY['Web Development', 'Node.js', 'Database Systems', 'Python']),
(7, '+91 98666 77889', 'Information Technology', NULL, 4, 8.70, ARRAY['Java', 'Spring Boot', 'Cloud Computing', 'Database Systems']),
(8, '+91 98777 88990', 'Information Technology', NULL, 2, 8.90, ARRAY['Python', 'Data Structures', 'Database Systems', 'Machine Learning']),
(9, '+91 98888 99001', 'Electronics & Communication', NULL, 3, 7.95, ARRAY['Embedded Systems', 'Internet of Things', 'C++', 'Python']),
(10, '+91 98999 00112', 'Computer Science and Engineering', NULL, 2, 8.30, ARRAY['Web Development', 'React', 'JavaScript', 'Python']);

ALTER SEQUENCE user_profiles_profileid_seq RESTART WITH 11;

-- 3. Insert Mentorship Pairings (3 Active)
INSERT INTO MENTORSHIP (MentorshipID, MentorID, MenteeID, StartDate, EndDate, Status) VALUES
(1, 2, 5, CURRENT_DATE - INTERVAL '60 days', NULL, 'Active'),
(2, 2, 6, CURRENT_DATE - INTERVAL '45 days', NULL, 'Active'),
(3, 3, 7, CURRENT_DATE - INTERVAL '30 days', NULL, 'Active');

ALTER SEQUENCE mentorship_mentorshipid_seq RESTART WITH 4;

-- 4. Insert Meetings & Feedback
INSERT INTO MEETING (MeetingID, MentorshipID, MeetingDate, MeetingTime, Mode, Discussion, Status, MentorRating, MentorRemarks, MenteeRating, MenteeRemarks, FeedbackDate) VALUES
(1, 1, CURRENT_DATE - INTERVAL '30 days', '14:00', 'Offline', 'Semester kickoff meeting. Discussed project topic selection, semester goals, and weekly study schedule.', 'Completed', 5, 'Aarav is well-prepared and clear about his project goals for this semester.', 5, 'Very helpful advice on how to balance coursework and project work.', CURRENT_DATE - INTERVAL '29 days'),
(2, 1, CURRENT_DATE - INTERVAL '10 days', '15:30', 'Online', 'Reviewed database design and API endpoints for the project. Addressed doubts regarding data validation.', 'Completed', 5, 'Good grasp of database concepts. Suggested testing edge cases in form inputs.', 5, 'Cleared doubts on relational schema design and handling user input.', CURRENT_DATE - INTERVAL '9 days'),
(3, 1, CURRENT_DATE + INTERVAL '5 days', '11:00', 'Offline', 'Mid-term review of project progress and preparation for upcoming practical exams.', 'Scheduled', NULL, NULL, NULL, NULL, NULL),
(4, 2, CURRENT_DATE - INTERVAL '20 days', '16:00', 'Online', 'Discussed backend development in Node.js and user authentication.', 'Completed', 4, 'Priya has made good progress on her backend project. Keep up the consistent effort.', 5, 'Understood authentication flow clearly. Great practical session.', CURRENT_DATE - INTERVAL '19 days'),
(5, 2, CURRENT_DATE + INTERVAL '3 days', '14:30', 'Online', 'Connecting frontend pages with backend APIs and testing user workflows.', 'Scheduled', NULL, NULL, NULL, NULL, NULL),
(6, 3, CURRENT_DATE - INTERVAL '15 days', '10:00', 'Offline', 'Cloud deployment walkthrough, hosting databases online, and managing environment configs.', 'Completed', 4, 'Rohan is doing well with his deployment setup and understanding cloud concepts.', 4, 'Gained practical knowledge on deploying web applications.', CURRENT_DATE - INTERVAL '14 days');

ALTER SEQUENCE meeting_meetingid_seq RESTART WITH 7;

-- 5. Insert Student Progress Records
INSERT INTO PROGRESS_RECORD (ProgressID, MenteeID, AcademicProgress, AttendancePercentage, Remarks, UpdatedDate) VALUES
(1, 5, 'Consistent Good Performance', 96.50, 'Regular in classes and attentive in lab sessions. Good test scores.', CURRENT_DATE - INTERVAL '15 days'),
(2, 6, 'Strong Academic Progress', 94.00, 'Submits assignments on time and demonstrates good coding skills.', CURRENT_DATE - INTERVAL '12 days'),
(3, 7, 'Satisfactory Progress', 91.50, 'Attends mentoring sessions regularly and is working well on course projects.', CURRENT_DATE - INTERVAL '10 days');

ALTER SEQUENCE progress_record_progressid_seq RESTART WITH 4;

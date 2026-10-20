# **Mentor and Mentee Management Platform: \_Comprehensive Implementation Plan**

**Team Members:** Aarushi Jha, Coral Jain & Pooja Nasre

### **1\. Exactly What the Project Does**

The **Mentor and Mentee Management Platform** automates institutional mentorship workflows, replacing manual records and unmonitored communication channels with an integrated relational database system.

#### **Primary Operational Workflows**

* **Unified Account & Access Control:** Provides a central portal where Administrators, Faculty Mentors, and Student Mentees authenticate via password-hashed credentials to access role-specific dashboards.  
* **Institutional Allocation Engine:** Allows administrators to pair faculty mentors with student mentees based on department and student load, enforcing that each mentee has at most one active mentorship pairing at a time.  
* **Meeting Lifecycle Management:** Enables mentors to schedule sessions (Online or Offline), log discussion agendas, transition meeting states (Scheduled $\rightarrow$ Completed / Cancelled), and document formal meeting minutes.  
* **Bilateral Feedback Loop:** Records numerical ratings (1–5 scale) and qualitative feedback from both mentors and mentees for completed sessions directly on the meeting record.  
* **Longitudinal Progress & Skill Tracking:** Enables faculty mentors to record periodic evaluations of academic performance, attendance percentages, and remarks, while tracking atomic technical skills acquired by students.  
* **Administrative Analytics & Reporting:** Aggregates session counts, completion rates, and average feedback scores across departments using relational SQL views.

### **2\. Problem Definition and Objectives**

**Problem Definition**  
In educational institutions, managing mentor-mentee relationships manually can be time-consuming and inefficient. Students face difficulties in finding suitable mentors, scheduling meetings, tracking discussions, and receiving continuous guidance. Mentors also require an organized way to manage assigned mentees, track their progress, and maintain interaction records.  
The Mentor and Mentee Management Platform provides a centralized, relational database-driven system to manage mentors, mentees, mentorship allocations, meetings, feedback, and student progress records with full referential integrity and transactional reliability.  
**Objectives**

* Allow mentors, mentees, and administrators to register and authenticate securely with password credentials.  
* Maintain structured profiles for faculty mentors and student mentees.  
* Manage formal mentorship pairings and track allocation periods.  
* Schedule, update, and manage mentorship meetings across different modes.  
* Log detailed meeting minutes, discussion points, and bilateral feedback.  
* Track mentee academic performance metrics, attendance, and skill acquisition over time.  
* Maintain a relational interaction history for auditing and continuity.  
* Provide administrators with centralized control over user accounts and pairing allocations.  
* Generate analytical reports on mentoring engagement and student progress using relational queries.

### **3\. Requirement Analysis**

#### **Functional Requirements**

* **User Authentication & Profile Management:** Secure registration and login for mentors, mentees, and administrators, maintaining departmental and contact details.  
* **Allocation Management:** Create, update, and terminate mentor-mentee assignments while ensuring valid pairing constraints.  
* **Meeting Lifecycle Management:** Schedule, update, log discussions, and cancel mentorship meetings.  
* **Feedback Logging:** Capture qualitative remarks and numerical ratings tied directly to specific meeting records.  
* **Progress Tracking:** Incrementally record student academic status, attendance rates, and acquired technical skills.  
* **Administrative Operations & Reporting:** Enable administrative queries, profile filtering, and summary reports on program outcomes.

#### **Non-Functional Requirements**

* **Data Integrity & Consistency:** Enforce primary keys, foreign keys, unique keys, and domain constraints across all entities to maintain 3NF compliance.  
* **Transactional Reliability (ACID):** Ensure atomic meeting scheduling and assignment state transitions without race conditions.  
* **Query Performance:** Index frequently joined foreign keys (MentorID, MenteeID, MentorshipID, MeetingID) for fast record retrieval.  
* **Scalability:** Handle expanding datasets across academic years without data redundancy.

### **4\. Database Architecture & DDL (Lean 5-Table Schema)**

SQL  
\-- 1\. ENUMERATIONS  
CREATE TYPE user\_role AS ENUM ('Admin', 'Mentor', 'Mentee');  
CREATE TYPE pairing\_status AS ENUM ('Active', 'Completed', 'Terminated');  
CREATE TYPE meeting\_mode AS ENUM ('Online', 'Offline');  
CREATE TYPE meeting\_status AS ENUM ('Scheduled', 'Completed', 'Cancelled');

\-- 2\. TABLE DEFINITIONS

\-- Table 1: Unified Identity & Authentication  
CREATE TABLE USERS (  
    UserID SERIAL PRIMARY KEY,  
    Name VARCHAR(100) NOT NULL,  
    Email VARCHAR(120) UNIQUE NOT NULL,  
    PasswordHash VARCHAR(255) NOT NULL,  
    Role user\_role NOT NULL,  
    CreatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT\_TIMESTAMP  
);

\-- Table 2: User Profiles (1:1 with USERS)  
CREATE TABLE USER\_PROFILES (  
    ProfileID SERIAL PRIMARY KEY,  
    UserID INT UNIQUE NOT NULL REFERENCES USERS(UserID) ON DELETE CASCADE,  
    Phone VARCHAR(15),  
    Department VARCHAR(100) NOT NULL,  
    Designation VARCHAR(100),                          \-- Set for Mentor  
    Year INT CHECK (Year BETWEEN 1 AND 5),             \-- Set for Mentee  
    CGPA NUMERIC(4, 2) CHECK (CGPA BETWEEN 0.00 AND 10.00), \-- Set for Mentee  
    Skills TEXT\[\] DEFAULT '{}'                         \-- Dynamic technical skills array  
);

\-- Table 3: Mentorship Pairing Associations  
CREATE TABLE MENTORSHIP (  
    MentorshipID SERIAL PRIMARY KEY,  
    MentorID INT NOT NULL REFERENCES USERS(UserID) ON DELETE RESTRICT,  
    MenteeID INT NOT NULL REFERENCES USERS(UserID) ON DELETE CASCADE,  
    StartDate DATE NOT NULL DEFAULT CURRENT\_DATE,  
    EndDate DATE,  
    Status pairing\_status DEFAULT 'Active' NOT NULL,  
    CONSTRAINT chk\_mentorship\_dates CHECK (EndDate IS NULL OR EndDate \>= StartDate)  
);

\-- Table 4: Meetings & Bilateral Feedback (Integrated)  
CREATE TABLE MEETING (  
    MeetingID SERIAL PRIMARY KEY,  
    MentorshipID INT NOT NULL REFERENCES MENTORSHIP(MentorshipID) ON DELETE CASCADE,  
    MeetingDate DATE NOT NULL,  
    MeetingTime TIME NOT NULL,  
    Mode meeting\_mode NOT NULL,  
    Discussion TEXT,  
    Status meeting\_status DEFAULT 'Scheduled' NOT NULL,  
      
    \-- Bilateral Session Feedback  
    MentorRating INT CHECK (MentorRating BETWEEN 1 AND 5),  
    MentorRemarks TEXT,  
    MenteeRating INT CHECK (MenteeRating BETWEEN 1 AND 5),  
    MenteeRemarks TEXT,  
    FeedbackDate DATE  
);

\-- Table 5: Student Longitudinal Progress & Academic Metrics  
CREATE TABLE PROGRESS\_RECORD (  
    ProgressID SERIAL PRIMARY KEY,  
    MenteeID INT NOT NULL REFERENCES USERS(UserID) ON DELETE CASCADE,  
    AcademicProgress VARCHAR(100) NOT NULL,  
    AttendancePercentage NUMERIC(5, 2) NOT NULL CHECK (AttendancePercentage BETWEEN 0.00 AND 100.00),  
    Remarks TEXT,  
    UpdatedDate DATE NOT NULL DEFAULT CURRENT\_DATE  
);

\-- 3\. INDEXES FOR PERFORMANCE  
CREATE INDEX idx\_users\_email\_role ON USERS(Email, Role);  
CREATE INDEX idx\_mentorship\_lookup ON MENTORSHIP(MentorID, MenteeID, Status);  
CREATE INDEX idx\_meeting\_mentorship\_date ON MEETING(MentorshipID, MeetingDate);  
CREATE INDEX idx\_progress\_mentee ON PROGRESS\_RECORD(MenteeID, UpdatedDate);

\-- 4\. BUSINESS LOGIC TRIGGER (Enforce 1 Active Pairing per Mentee)  
CREATE OR REPLACE FUNCTION enforce\_single\_active\_mentorship()  
RETURNS TRIGGER AS \$\$  
BEGIN  
    IF NEW.Status \= 'Active' THEN  
        IF EXISTS (  
            SELECT 1 FROM MENTORSHIP   
            WHERE MenteeID \= NEW.MenteeID   
              AND Status \= 'Active'   
              AND MentorshipID \<\> COALESCE(NEW.MentorshipID, \-1)  
        ) THEN  
            RAISE EXCEPTION 'Constraint Violation: Mentee (ID %) already has an active mentorship pairing.', NEW.MenteeID;  
        END IF;  
    END IF;  
    RETURN NEW;  
END;  
\$\$ LANGUAGE plpgsql;

CREATE TRIGGER trg\_single\_active\_mentorship  
BEFORE INSERT OR UPDATE ON MENTORSHIP  
FOR EACH ROW EXECUTE FUNCTION enforce\_single\_active\_mentorship();

### **5\. Analytical Views for Reporting**

SQL  
CREATE OR REPLACE VIEW View\_MentorshipPerformance AS  
SELECT   
    m.MentorshipID,  
    u\_men.Name AS MentorName,  
    p\_men.Department AS MentorDepartment,  
    u\_tee.Name AS MenteeName,  
    p\_tee.Department AS MenteeDepartment,  
    p\_tee.CGPA AS MenteeCGPA,  
    m.Status AS MentorshipStatus,  
    COUNT(mt.MeetingID) AS TotalMeetingsScheduled,  
    COUNT(CASE WHEN mt.Status \= 'Completed' THEN 1 END) AS CompletedMeetings,  
    ROUND(AVG(mt.MentorRating), 2) AS AvgMentorRatingGiven,  
    ROUND(AVG(mt.MenteeRating), 2) AS AvgMenteeSatisfactionScore  
FROM MENTORSHIP m  
JOIN USERS u\_men ON m.MentorID \= u\_men.UserID  
JOIN USER\_PROFILES p\_men ON u\_men.UserID \= p\_men.UserID  
JOIN USERS u\_tee ON m.MenteeID \= u\_tee.UserID  
JOIN USER\_PROFILES p\_tee ON u\_tee.UserID \= p\_tee.UserID  
LEFT JOIN MEETING mt ON m.MentorshipID \= mt.MentorshipID  
GROUP BY   
    m.MentorshipID, u\_men.Name, p\_men.Department,   
    u\_tee.Name, p\_tee.Department, p\_tee.CGPA, m.Status;

### **6\. Backend API Specifications**

| Endpoint | Method | Role | Description |
| :---- | :---- | :---- | :---- |
| /api/auth/register | POST | Public | Registers a new user and creates an entry in USER\_PROFILES. |
| /api/auth/login | POST | Public | Validates credentials and returns a signed JWT containing { userId, role }. |
| /api/users/profile | PUT | Authenticated | Updates department, year, designation, or skills. |
| /api/admin/allocations | POST | Admin | Creates a pairing in MENTORSHIP. |
| /api/admin/allocations/:id | PATCH | Admin | Updates status (Completed/Terminated) and sets EndDate. |
| /api/admin/reports | GET | Admin | Retrieves summary statistics from View\_MentorshipPerformance. |
| /api/meetings | POST | Mentor | Schedules a meeting with date, time, mode, and agenda. |
| /api/meetings/:id | PATCH | Mentor/Mentee | Sets status to Completed and attaches discussion notes. |
| /api/meetings/:id/feedback | POST | Mentor/Mentee | Records rating and remarks corresponding to the caller's role. |
| /api/progress/:menteeId | POST | Mentor | Logs academic status, attendance %, and remarks into PROGRESS\_RECORD. |
| /api/mentee/dashboard | GET | Mentee | Fetches assigned mentor profile, scheduled meetings, and progress logs. |

### **7\. Frontend Application Architecture**

#### **7.1 Tech Stack & UI Libraries**

* **Framework:** React.js (bundled with Vite)  
* **Styling & Components:** Tailwind CSS \+ Lucide React (icons)  
* **Routing:** React Router v6 (protected routes with role-based access checks)  
* **State & Networking:** Axios (configured with interceptors for JWT injection)

#### **7.2 Frontend Directory Structure**

Plaintext  
frontend/  
├── src/  
│   ├── api/  
│   │   ├── client.js             \# Axios instance with auth headers  
│   │   ├── auth.api.js           \# Login & register calls  
│   │   ├── admin.api.js          \# Allocations & report views  
│   │   ├── mentor.api.js         \# Mentees, schedule meetings, log progress  
│   │   └── mentee.api.js         \# View mentor, feedback, skills  
│   ├── components/  
│   │   ├── common/  
│   │   │   ├── Navbar.jsx        \# Navigation bar with user badge & logout  
│   │   │   ├── Sidebar.jsx       \# Role-dependent menu tabs  
│   │   │   ├── Modal.jsx         \# Accessible popups for meetings/evaluations  
│   │   │   └── ProtectedRoute.jsx\# Guards views based on JWT role  
│   │   ├── forms/  
│   │   │   ├── MeetingForm.jsx   \# Schedule meeting modal form  
│   │   │   ├── FeedbackModal.jsx \# Star rating & comments submission  
│   │   │   └── ProgressForm.jsx  \# Academic & attendance logging  
│   │   └── cards/  
│   │       ├── StatCard.jsx      \# Summary metrics card for Admin  
│   │       └── MenteeCard.jsx    \# Mentee overview card with skill chips  
│   ├── pages/  
│   │   ├── auth/  
│   │   │   ├── LoginPage.jsx     \# Split role login portal  
│   │   │   └── RegisterPage.jsx  \# Account creation with role selection  
│   │   ├── admin/  
│   │   │   ├── AllocationsPage.jsx \# Pairing workbench (Mentors \<-\> Mentees)  
│   │   │   ├── DirectoryPage.jsx   \# User table with filter & search  
│   │   │   └── ReportsPage.jsx     \# Institutional metrics & charts  
│   │   ├── mentor/  
│   │   │   ├── MenteesPage.jsx     \# Active mentees roster & progress log  
│   │   │   └── SchedulePage.jsx    \# Meeting calendar & discussion records  
│   │   └── mentee/  
│   │       ├── MenteeHome.jsx      \# Mentor contact & meeting roadmap  
│   │       ├── MyFeedbackPage.jsx  \# Post-meeting rating forms  
│   │       └── SkillsPage.jsx      \# Skill management workbench  
│   ├── App.jsx                     \# Route configuration  
│   └── main.jsx  
├── tailwind.config.js  
└── package.json

#### **7.3 Role-Based Screen Workflows**

**1\. Authentication Screens (/login, /register)**

* Single unified login screen with input fields for Email and Password.  
* On successful authentication, the backend JWT is stored in localStorage or sessionStorage.  
* The application decodes the token claims and routes the user directly to their respective portal (/admin, /mentor, or /mentee).

**2\. Administrator Portal**

* **Allocation Manager (/admin/allocations):** Two-column interactive layout:  
  * Left pane: Unassigned student mentees filterable by department and year.  
  * Right pane: Faculty mentors displaying their current active student load.  
  * Primary Action: Select student \+ mentor $\rightarrow$ click "Create Pairing" (triggers /api/admin/allocations).  
* **Reports Dashboard (/admin/reports):**  
  * Displays metrics cards (Total Active Mentorships, Completed Meetings, Average Student Satisfaction).  
  * Data table mapped directly to the View\_MentorshipPerformance SQL view.

**3\. Mentor Portal**

* **Mentees Roster (/mentor/mentees):** Grid of student cards showing Mentee Name, Department, Year, Current CGPA, and dynamic skill badges.  
  * Action button: "Log Progress Record" opens a modal to input Attendance Percentage, Academic Progress status, and remarks.  
* **Meeting Manager (/mentor/meetings):**  
  * "Schedule Meeting" button opens modal with Date, Time, Mode (Online/Offline dropdown), and Agenda text box.  
  * Meeting cards feature a status toggle (Scheduled $\rightarrow$ Completed) and text field to append meeting minutes/discussion notes.  
  * Post-meeting mentor review section: 5-star rating selector and qualitative remarks.

**4\. Mentee Portal**

* **Dashboard Overview (/mentee):**  
  * Profile card showing assigned faculty mentor name, designation, department, and contact email.  
  * Chronological meeting roadmap: Displays scheduled upcoming meetings with meeting modes and location/links.  
* **Meeting Feedback Modal (/mentee/meetings):**  
  * Shows completed meetings. If MenteeRating is null, a "Submit Feedback" button prompts a star rating (1–5) and feedback input field.  
* **Skills Profile (/mentee/skills):**  
  * Tag-input interface allowing students to add or remove skills (e.g., Python, PostgreSQL, Data Structures) that update their profile array.

#### **7.4 Client-Side Routing and Security**

JavaScript  
// src/components/common/ProtectedRoute.jsx  
import { Navigate, Outlet } from 'react-router-dom';

export default function ProtectedRoute({ allowedRoles }) {  
  const token \= localStorage.getItem('token');  
  const user \= JSON.parse(localStorage.getItem('user') || '{}');

  if (\!token) return \<Navigate to="/login" replace /\>;  
  if (allowedRoles && \!allowedRoles.includes(user.role)) {  
    return \<Navigate to="/unauthorized" replace /\>;  
  }

  return \<Outlet /\>;  
}

### **8\. End-to-End Implementation Roadmap**

* **Step 1: Database Setup & Trigger Verification**  
  * Run the PostgreSQL DDL script (5 tables, enums, secondary indexes, view, and the active-pairing trigger).  
  * Seed test data: 1 Admin, 3 Mentors, 6 Mentees, and 3 active mentorship pairings.  
  * Test trigger enforcement: Attempt an insert with a duplicate active mentee to confirm the exception raises correctly.  
* **Step 2: Backend REST APIs & Middleware**  
  * Configure PostgreSQL connection pool.  
  * Build the unified /api/auth/register and /api/auth/login endpoints with bcrypt and JWT.  
  * Implement route handlers for Admin allocations, Mentor meeting creation, and Feedback submission.  
* **Step 3: Frontend Foundation & Shared Components**  
  * Initialize Vite \+ React project, configure Tailwind CSS, and set up Axios with request interceptors to pass bearer tokens.  
  * Construct layout components (Navbar, Sidebar, Modal, ProtectedRoute).  
* **Step 4: Frontend Portal Integration**  
  * Build and link the Admin allocation interface and reports page.  
  * Connect the Mentor meeting scheduler, discussion logger, and progress record forms.  
  * Connect the Mentee portal for viewing assigned mentors, attending meetings, and submitting ratings.  
* **Step 5: Testing, Optimization & Review Preparation**  
  * Execute end-to-end integration flow: Admin allocates mentor $\rightarrow$ Mentor schedules meeting $\rightarrow$ Meeting marked completed with bilateral ratings logged $\rightarrow$ Admin view reflects updated averages.  
  * Run EXPLAIN ANALYZE on View\_MentorshipPerformance to demonstrate index hits during evaluations.
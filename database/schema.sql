-- ==============================================================================
-- Institutional Mentor and Mentee Management Platform: 5-Table Relational Schema
-- System Specification: Academic Mentorship Architecture
-- Compliance: Full 3NF, Domain Constraints, Triggers, Views & Secondary Indexes
-- ==============================================================================

-- Clean up existing artifacts
DROP VIEW IF EXISTS View_MentorshipPerformance CASCADE;
DROP TRIGGER IF EXISTS trg_single_active_mentorship ON MENTORSHIP CASCADE;
DROP FUNCTION IF EXISTS enforce_single_active_mentorship() CASCADE;
DROP TABLE IF EXISTS PROGRESS_RECORD CASCADE;
DROP TABLE IF EXISTS MEETING CASCADE;
DROP TABLE IF EXISTS MENTORSHIP CASCADE;
DROP TABLE IF EXISTS USER_PROFILES CASCADE;
DROP TABLE IF EXISTS USERS CASCADE;

DROP TYPE IF EXISTS meeting_status CASCADE;
DROP TYPE IF EXISTS meeting_mode CASCADE;
DROP TYPE IF EXISTS pairing_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- 1. ENUMERATIONS
CREATE TYPE user_role AS ENUM ('Admin', 'Mentor', 'Mentee');
CREATE TYPE pairing_status AS ENUM ('Active', 'Completed', 'Terminated');
CREATE TYPE meeting_mode AS ENUM ('Online', 'Offline');
CREATE TYPE meeting_status AS ENUM ('Scheduled', 'Completed', 'Cancelled');

-- 2. TABLE DEFINITIONS

-- Table 1: Unified Identity & Authentication
CREATE TABLE USERS (
    UserID SERIAL PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Email VARCHAR(120) UNIQUE NOT NULL,
    PasswordHash VARCHAR(255) NOT NULL,
    Role user_role NOT NULL,
    CreatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table 2: User Profiles (1:1 with USERS)
CREATE TABLE USER_PROFILES (
    ProfileID SERIAL PRIMARY KEY,
    UserID INT UNIQUE NOT NULL REFERENCES USERS(UserID) ON DELETE CASCADE,
    Phone VARCHAR(15),
    Department VARCHAR(100) NOT NULL,
    Designation VARCHAR(100),                          -- Set for Mentor
    Year INT CHECK (Year BETWEEN 1 AND 5),             -- Set for Mentee
    CGPA NUMERIC(4, 2) CHECK (CGPA BETWEEN 0.00 AND 10.00), -- Set for Mentee
    Skills TEXT[] DEFAULT '{}'                         -- Dynamic technical skills array
);

-- Table 3: Mentorship Pairing Associations
CREATE TABLE MENTORSHIP (
    MentorshipID SERIAL PRIMARY KEY,
    MentorID INT NOT NULL REFERENCES USERS(UserID) ON DELETE RESTRICT,
    MenteeID INT NOT NULL REFERENCES USERS(UserID) ON DELETE CASCADE,
    StartDate DATE NOT NULL DEFAULT CURRENT_DATE,
    EndDate DATE,
    Status pairing_status DEFAULT 'Active' NOT NULL,
    CONSTRAINT chk_mentorship_dates CHECK (EndDate IS NULL OR EndDate >= StartDate)
);

-- Table 4: Meetings & Bilateral Feedback (Integrated)
CREATE TABLE MEETING (
    MeetingID SERIAL PRIMARY KEY,
    MentorshipID INT NOT NULL REFERENCES MENTORSHIP(MentorshipID) ON DELETE CASCADE,
    MeetingDate DATE NOT NULL,
    MeetingTime TIME NOT NULL,
    Mode meeting_mode NOT NULL,
    Discussion TEXT,
    Status meeting_status DEFAULT 'Scheduled' NOT NULL,
      
    -- Bilateral Session Feedback
    MentorRating INT CHECK (MentorRating BETWEEN 1 AND 5),
    MentorRemarks TEXT,
    MenteeRating INT CHECK (MenteeRating BETWEEN 1 AND 5),
    MenteeRemarks TEXT,
    FeedbackDate DATE
);

-- Table 5: Student Longitudinal Progress & Academic Metrics
CREATE TABLE PROGRESS_RECORD (
    ProgressID SERIAL PRIMARY KEY,
    MenteeID INT NOT NULL REFERENCES USERS(UserID) ON DELETE CASCADE,
    AcademicProgress VARCHAR(100) NOT NULL,
    AttendancePercentage NUMERIC(5, 2) NOT NULL CHECK (AttendancePercentage BETWEEN 0.00 AND 100.00),
    Remarks TEXT,
    UpdatedDate DATE NOT NULL DEFAULT CURRENT_DATE
);

-- 3. INDEXES FOR PERFORMANCE
CREATE INDEX idx_users_email_role ON USERS(Email, Role);
CREATE INDEX idx_mentorship_lookup ON MENTORSHIP(MentorID, MenteeID, Status);
CREATE INDEX idx_meeting_mentorship_date ON MEETING(MentorshipID, MeetingDate);
CREATE INDEX idx_progress_mentee ON PROGRESS_RECORD(MenteeID, UpdatedDate);

-- 4. BUSINESS LOGIC TRIGGER (Enforce 1 Active Pairing per Mentee)
CREATE OR REPLACE FUNCTION enforce_single_active_mentorship()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.Status = 'Active' THEN
        IF EXISTS (
            SELECT 1 FROM MENTORSHIP 
            WHERE MenteeID = NEW.MenteeID 
              AND Status = 'Active' 
              AND MentorshipID <> COALESCE(NEW.MentorshipID, -1)
        ) THEN
            RAISE EXCEPTION 'Constraint Violation: Mentee (ID %) already has an active mentorship pairing.', NEW.MenteeID;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_single_active_mentorship
BEFORE INSERT OR UPDATE ON MENTORSHIP
FOR EACH ROW EXECUTE FUNCTION enforce_single_active_mentorship();

-- 5. ANALYTICAL VIEWS FOR REPORTING
CREATE OR REPLACE VIEW View_MentorshipPerformance AS
SELECT 
    m.MentorshipID,
    u_men.Name AS MentorName,
    p_men.Department AS MentorDepartment,
    u_tee.Name AS MenteeName,
    p_tee.Department AS MenteeDepartment,
    p_tee.CGPA AS MenteeCGPA,
    m.Status AS MentorshipStatus,
    COUNT(mt.MeetingID) AS TotalMeetingsScheduled,
    COUNT(CASE WHEN mt.Status = 'Completed' THEN 1 END) AS CompletedMeetings,
    ROUND(AVG(mt.MentorRating), 2) AS AvgMentorRatingGiven,
    ROUND(AVG(mt.MenteeRating), 2) AS AvgMenteeSatisfactionScore
FROM MENTORSHIP m
JOIN USERS u_men ON m.MentorID = u_men.UserID
JOIN USER_PROFILES p_men ON u_men.UserID = p_men.UserID
JOIN USERS u_tee ON m.MenteeID = u_tee.UserID
JOIN USER_PROFILES p_tee ON u_tee.UserID = p_tee.UserID
LEFT JOIN MEETING mt ON m.MentorshipID = mt.MentorshipID
GROUP BY 
    m.MentorshipID, u_men.Name, p_men.Department, 
    u_tee.Name, p_tee.Department, p_tee.CGPA, m.Status;

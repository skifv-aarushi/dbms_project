# Project Walkthrough & Presentation Guide

A step-by-step guide to demonstrating the **Mentor & Mentee Management Platform** to an evaluator, professor, or peer.

---

## 1. Quick 30-Second Elevator Pitch

> *"This is a full-stack DBMS application built for universities to manage faculty-student mentorship. It replaces manual spreadsheets with a relational database conforming to Third Normal Form (3NF). It handles mentor matching based on shared skills, session scheduling, two-way feedback ratings, academic progress tracking, and uses a PostgreSQL trigger to enforce business rules like preventing duplicate active mentors."*

---

## 2. Test Accounts Cheat Sheet

All accounts use the same password: **`password123`**

| Role | Name | Email | Purpose in Demo |
| :--- | :--- | :--- | :--- |
| **Admin** | Dr. Rajesh Sharma | `admin@university.edu` | Show department metrics, user directory, and pairing workbench |
| **Mentee (Unassigned)** | Sneha Iyer | `sneha.iyer@student.edu` | Show the smart recommendation matcher and mentor selection |
| **Mentee (Paired)** | Aarav Patel | `aarav.patel@student.edu` | Show active mentor, upcoming meetings, and progress records |
| **Mentor** | Dr. Sunita Rao | `sunita.rao@university.edu` | Show assigned student roster, schedule sessions, and rate meetings |

---

## 3. Step-by-Step Demo Flow

Follow these 5 steps in order for a smooth, impressive demonstration:

---

### Step 1: The Admin Overview (Big Picture)
1. Go to the login page and sign in as **`admin@university.edu`** (`password123`).
2. **Dashboard / Reports:**
   - Point out the summary cards: Total Students, Faculty Mentors, Active Pairings, and Completed Meetings.
   - Explain that these metrics are computed in real time from a PostgreSQL analytical view (`View_MentorshipPerformance`).
3. **Directory:**
   - Show the searchable directory of all faculty and students with department and skill tags.
   - Point out the **"Add Mentor"** and **"Add Mentee"** buttons to show full CRUD support.
4. **Allocations Page (Smart Recommender):**
   - Click on an unassigned student (e.g., Sneha Iyer or Aditya Nair).
   - Show how the faculty list instantly re-ranks mentors with a **compatibility score (e.g., 85% Match)** based on overlapping skills and department.
   - Click **"Auto-Assign"** or select a mentor manually to establish a pairing.

---

### Step 2: The Student (Mentee) Journey
1. Log out, then log in as **`sneha.iyer@student.edu`** (an unassigned mentee).
2. **Find a Mentor:**
   - Show that because Sneha has no mentor yet, she is directed to the **Find Mentor** page.
   - Show how faculty profiles display matching skill badges (e.g., *Python*, *Database Systems*).
   - Click **"Select as My Mentor"** on **Dr. Sunita Rao**.
3. **Mentee Dashboard:**
   - The page instantly updates to show her newly assigned mentor, contact details, and guidance timeline.

---

### Step 3: The Faculty (Mentor) Journey
1. Log out, then log in as **`sunita.rao@university.edu`** (Dr. Sunita Rao).
2. **My Mentees:**
   - Show the list of assigned students (including Aarav Patel, Priya Sharma, and newly assigned Sneha).
   - Show student CGPA, academic year, and technical interests.
3. **Schedule a Meeting:**
   - Go to **Schedule**.
   - Click **"Schedule Session"**.
   - Pick a student, choose a date and time, select Online/Offline, and enter an agenda (e.g., *"Midterm project review"*).
   - Click Submit — notice how the date and time format cleanly into human-readable format (`25 Oct 2026 at 3:30 PM`).
4. **Log Notes & Session Evaluation:**
   - On a completed meeting, click **"Add Notes"** to record discussion minutes.
   - Click **"Feedback"** to give the student a star rating (1–5) and remarks.

---

### Step 4: The Closed Feedback Loop (Student Side)
1. Log out, then log in as **`aarav.patel@student.edu`**.
2. **Upcoming Sessions:** Show the newly scheduled meeting on his dashboard.
3. **Feedback & Ratings:**
   - Open **Session Feedback**.
   - Show that students can also rate their mentor and submit reflections after a completed meeting.
4. **Academic Progress:**
   - Show his attendance percentage and semester milestone remarks updated by his faculty advisor.

---

### Step 5: Database Integrity & Trigger Demo (Impress Evaluators!)
Evaluators and professors look for real database constraints, not just frontend validation. Here is how to show it:

1. **Explain the 1-Active-Mentor Rule:**
   - *"In our university system, a student can have past completed mentorships, but only ONE active mentor at any given time."*
2. **Show the PostgreSQL Trigger:**
   - Open `database/schema.sql` (lines 80–105) and point out `trg_single_active_mentorship`.
   - Explain: *"Even if someone bypasses the UI and tries to insert a duplicate active pairing directly into the database, our PL/pgSQL trigger intercepts the query and rejects it with an exception."*
3. **Live Demonstration:**
   - If using a terminal, run:
     ```bash
     npm run db:test-trigger
     ```
   - Show how Test 1 attempts a duplicate insert and the database cleanly throws:
     `Constraint Violation: Mentee (ID 5) already has an active mentorship pairing.`

---

## 4. How the Recommender Algorithm Works

When asked: *"How does the system match mentors and mentees?"*

Explain the 4-part scoring rule:
1. **Skills Match (45% Weight):** Compares the student's skills (`USER_PROFILES.Skills`) against the mentor's expertise.
2. **Department Match (30% Weight):** Same department gives +30 points; allied engineering branches get +18 points.
3. **Mentor Workload (15% Weight):** Faculty with fewer current mentees are prioritized to balance teaching loads.
4. **Academic Seniority (10% Weight):** Senior students (Years 3 & 4) are matched with senior faculty.

---

## 5. Technical Highlights to Mention

| Component | Technical Implementation | Why It Matters |
| :--- | :--- | :--- |
| **Normalization** | Strict Third Normal Form (3NF) across 5 tables | Zero data redundancy and clean separation of concerns |
| **Security** | Bcrypt (salt 10) password hashing + JWT with role claims | Secure passwords and tamper-proof user sessions |
| **Role-Based Access** | Middleware protects `/api/admin`, `/api/mentor`, `/api/mentee` | Students cannot access faculty or admin endpoints |
| **Database Views** | `View_MentorshipPerformance` computes aggregates in SQL | Database does the heavy calculations, keeping API fast |
| **Date Formatting** | Component-level date utility without UTC shifts | Avoids timezone date-shift bugs across different regions |
| **Deployment** | Vercel multi-service architecture + Neon Serverless Postgres | Production-ready, cloud-hosted, and easily accessible |

---

## 6. How to Show Real-Time Database Updates Live

If the evaluator asks: *"Can you show me the database updating in real time?"*

1. Open **[console.neon.tech](https://console.neon.tech)** in one browser tab.
2. Click **Tables** → click **`meeting`** or **`mentorship`**.
3. In another tab, perform an action on your website (e.g., schedule a meeting).
4. Click **Refresh** in Neon — point out the newly inserted row appearing at the bottom with its timestamp and IDs!

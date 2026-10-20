# Mentor and Mentee Management Platform

A web application designed for universities and colleges to manage faculty-student mentorship programs. It helps institutions match students with faculty advisors, schedule and track guidance meetings, record two-way feedback, and monitor academic progress.

---

## Tech Stack

- **Database:** PostgreSQL (relational schema, foreign keys, triggers, and analytical views)
- **Backend:** Node.js & Express (JWT authentication, role-based access control, REST APIs)
- **Frontend:** React with Vite & Tailwind CSS (clean autumn theme, Playfair Display + Montserrat typography)

---

## Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [PostgreSQL](https://www.postgresql.org/) (optional — if local Postgres isn't running, the backend includes an automatic persistent database fallback)

---

### 1. Backend Setup

1. Open your terminal and navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Initialize the database schema and sample data:
   ```bash
   npm run db:init
   ```
4. Start the backend server:
   ```bash
   npm start
   ```
   The backend API will be running at `http://localhost:5000`.

---

### 2. Frontend Setup

1. Open a second terminal and navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   Open your browser and visit `http://localhost:5173`.

---

## Test Accounts

The database comes pre-loaded with sample accounts for testing. All accounts share the same password: **`password123`**.

| Role | Name | Email | Details |
| :--- | :--- | :--- | :--- |
| **Admin** | Dr. Rajesh Sharma | `admin@university.edu` | Dean of Academic Affairs |
| **Mentor** | Dr. Sunita Rao | `sunita.rao@university.edu` | Associate Professor, CSE (Web Dev, DSA, React) |
| **Mentor** | Dr. Vikram Malhotra | `vikram.malhotra@university.edu` | Professor & HOD, IT (Cloud, DBs, Spring Boot) |
| **Mentor** | Prof. Ananya Sen | `ananya.sen@university.edu` | Assistant Professor, ECE (IoT, Embedded, Python) |
| **Mentee** | Aarav Patel | `aarav.patel@student.edu` | CSE, 3rd Year (Active mentee of Dr. Sunita Rao) |
| **Mentee** | Priya Sharma | `priya.sharma@student.edu` | CSE, 3rd Year (Active mentee of Dr. Sunita Rao) |
| **Mentee** | Rohan Verma | `rohan.verma@student.edu` | IT, 4th Year (Active mentee of Dr. Vikram) |
| **Mentee** | Sneha Iyer | `sneha.iyer@student.edu` | IT, 2nd Year (Unassigned — can select a mentor) |
| **Mentee** | Aditya Nair | `aditya.nair@student.edu` | ECE, 3rd Year (Unassigned candidate) |
| **Mentee** | Kavita Deshmukh | `kavita.deshmukh@student.edu` | CSE, 2nd Year (Unassigned candidate) |

---

## Key Features

### For Students (Mentees)
- **Student Dashboard:** See your active mentor, upcoming scheduled sessions, and recent progress updates.
- **Find a Mentor:** If unassigned, browse faculty profiles and get smart recommendations based on shared skills, research areas, and department.
- **Meetings & Schedules:** Keep track of session dates, discussion agendas, and meeting links/locations.
- **Feedback & Ratings:** Provide feedback and rate sessions after each meeting.
- **Progress Tracking:** View your attendance and academic notes recorded by your mentor.

### For Faculty (Mentors)
- **Mentee Roster:** View all students assigned to you with their contact info, CGPA, and interests.
- **Meeting Scheduler:** Schedule upcoming offline or online sessions with your mentees.
- **Session Notes & Evaluation:** Mark meetings as completed, record discussion minutes, and give ratings/remarks.
- **Student Progress Updates:** Log semester progress, attendance percentage, and academic remarks.

### For Academic Administrators
- **Department Overview:** Real-time statistics on total students, faculty mentors, active pairings, and completed meetings.
- **User Directory:** View, search, filter, and register new mentors and mentees.
- **Pairing Workbench:** Match unassigned students with faculty manually or use the rule-based recommendation matcher (based on department alignment, matching skills, and faculty workload).
- **Mentorship History:** Track completed and active mentorship records across all departments.

---

## Database Schema (At a Glance)

The database uses 5 interconnected tables:

1. **`USERS`**: Stores login credentials (`Email`, `PasswordHash`, `Role: Admin | Mentor | Mentee`).
2. **`USER_PROFILES`**: Profile details linked 1:1 with each user (department, year, CGPA, phone, and skills array).
3. **`MENTORSHIP`**: Active and past mentor-mentee pairings with start and end dates.
4. **`MEETING`**: Scheduled sessions, discussion minutes, and two-way ratings/remarks.
5. **`PROGRESS_RECORD`**: Longitudinal tracking of student attendance and academic milestones.

### Database Trigger
- **`trg_single_active_mentorship`**: A PostgreSQL trigger that prevents a student from having more than one active mentor at the same time. If a duplicate pairing is attempted, the database cleanly raises an error.

---

## Project Structure

```
db_project/
├── backend/
│   ├── src/
│   │   ├── config/        # Database pool and environment config
│   │   ├── controllers/   # Request handlers (auth, admin, mentor, mentee)
│   │   ├── middleware/    # JWT authentication & role-based checks
│   │   ├── routes/        # API route definitions
│   │   ├── scripts/       # Database initialization & trigger test scripts
│   │   └── server.js      # Express server entry point
│   ├── .env               # Backend configuration
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/           # Axios API services
│   │   ├── components/    # Reusable UI cards, tables, forms, and modals
│   │   ├── context/       # Auth context and session state
│   │   ├── pages/         # Admin, Mentor, and Mentee views
│   │   ├── utils/         # Clean date & time formatting helpers
│   │   ├── App.jsx        # Routing and protected routes
│   │   └── main.jsx
│   └── package.json
│
├── database/
│   ├── schema.sql         # 5-table DDL, indexes, triggers, and views
│   ├── seed.sql           # Realistic Indian academic seed dataset
│   └── verify_trigger.sql # Verification script for single-active-mentor trigger
│
└── README.md
```

---

## Helpful Commands

From the root project directory, you can also use these shortcuts:

- Run backend: `npm run backend`
- Run frontend: `npm run frontend`
- Reinitialize database: `npm run db:init`
- Test database trigger: `npm run db:test-trigger`
- Test backend API: `npm run test:api`

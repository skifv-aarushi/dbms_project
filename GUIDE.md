# DBMS Project Viva Preparation & Schema Guide

A comprehensive, database-focused guide designed specifically for **DBMS (Database Management Systems)** course evaluations, viva voce, and project defenses.

---

## Table of Contents
1. [Entity-Relationship (ER) Architecture & Cardinality](#1-entity-relationship-er-architecture--cardinality)
2. [Exhaustive Table-by-Table Database Dictionary](#2-exhaustive-table-by-table-database-dictionary)
   - [Table 1: USERS (Core Identity)](#table-1-users-core-identity)
   - [Table 2: USER_PROFILES (1:1 Extended Profile)](#table-2-user_profiles-11-extended-profile)
   - [Table 3: MENTORSHIP (Associative Relationship)](#table-3-mentorship-associative-relationship)
   - [Table 4: MEETING (1:N Sessions & Bilateral Feedback)](#table-4-meeting-1n-sessions--bilateral-feedback)
   - [Table 5: PROGRESS_RECORD (1:N Longitudinal Academic Metrics)](#table-5-progress_record-1n-longitudinal-academic-metrics)
3. [Normalization Proof (UNF $\to$ 1NF $\to$ 2NF $\to$ 3NF)](#3-normalization-proof-unf--1nf--2nf--3nf)
4. [PL/pgSQL Trigger Deep-Dive](#4-plpgsql-trigger-deep-dive)
5. [Analytical View & SQL Joins Breakdown](#5-analytical-view--sql-joins-breakdown)
6. [Indexing Strategy & Query Optimization](#6-indexing-strategy--query-optimization)
7. [30 Core DBMS Viva Questions & Spoken Answers](#7-30-core-dbms-viva-questions--spoken-answers)

---

## 1. Entity-Relationship (ER) Architecture & Cardinality

Our system models university mentorship using **5 normalized relations**:

```
 [ USERS ] 1 ─── (has) ─── 1 [ USER_PROFILES ]
     │
     │ 1 (as Mentor)
     ▼
 [ MENTORSHIP ] ──── (contains) ──── N [ MEETING ]
     ▲
     │ 1 (as Mentee)
     │
 [ USERS ] 1 ─── (tracks) ─── N [ PROGRESS_RECORD ]
```

### Key Cardinalities & Relationship Types:
1. **`USERS` to `USER_PROFILES` (1 : 1):** Every registered user has exactly one profile row linked via `UserID`.
2. **`USERS` (Mentor) to `USERS` (Mentee) (M : N via Associative Entity):** A faculty mentor can guide multiple students, and over 4 university years, a student can be guided by different mentors across semesters. This Many-to-Many relationship is decomposed into two $1 : N$ relationships via the associative table **`MENTORSHIP`**.
3. **`MENTORSHIP` to `MEETING` (1 : N):** One mentorship pairing has zero, one, or multiple scheduled meetings.
4. **`USERS` (Mentee) to `PROGRESS_RECORD` (1 : N):** Each student mentee accumulates multiple progress updates across semesters.

---

## 2. Exhaustive Table-by-Table Database Dictionary

---

### Table 1: `USERS` (Core Identity)
- **Purpose:** Stores centralized authentication credentials and system role. Contains zero redundant academic data.

| Column | Data Type | Key Type | Nullable | Constraints & Defaults | Why this Data Type? |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`UserID`** | `SERIAL` | **Primary Key** | `NOT NULL` | Auto-incrementing integer sequence | Fast 4-byte numeric indexing; avoids natural key volatility |
| **`Name`** | `VARCHAR(100)` | - | `NOT NULL` | - | Variable character string up to 100 bytes; saves storage over `CHAR` |
| **`Email`** | `VARCHAR(120)` | **Alternate / Candidate Key** | `NOT NULL` | `UNIQUE` | Enforces single account per institutional email; standard max email length |
| **`PasswordHash`** | `VARCHAR(255)` | - | `NOT NULL` | - | Accommodates 60-character Bcrypt output (`$2a$10$...`) with headroom |
| **`Role`** | `user_role` (`ENUM`) | - | `NOT NULL` | Values: `'Admin'`, `'Mentor'`, `'Mentee'` | Custom PostgreSQL ENUM enforces domain integrity; uses only 4 bytes internally |
| **`CreatedAt`** | `TIMESTAMPTZ` | - | `NOT NULL` | `DEFAULT CURRENT_TIMESTAMP` | Records exact UTC timestamp with timezone to eliminate daylight-saving anomalies |

---

### Table 2: `USER_PROFILES` (1:1 Extended Profile)
- **Purpose:** Stores role-specific, extensible attributes (CGPA, Year, Department, Skills). Prevents the `USERS` table from becoming sparse.

| Column | Data Type | Key Type | Nullable | Constraints & Defaults | Why this Data Type? |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`ProfileID`** | `SERIAL` | **Primary Key** | `NOT NULL` | Auto-incrementing integer | Surrogate key for row identification |
| **`UserID`** | `INT` | **Foreign Key** | `NOT NULL` | `UNIQUE`, `REFERENCES USERS(UserID) ON DELETE CASCADE` | `UNIQUE` guarantees strict $1 : 1$ cardinality; `CASCADE` cleans profile on user deletion |
| **`Phone`** | `VARCHAR(15)` | - | `NULL` | - | String avoids numeric overflow and preserves leading zeros or `+` country codes |
| **`Department`** | `VARCHAR(100)` | - | `NOT NULL` | - | Institutional branch name (e.g., Computer Science, Information Technology) |
| **`Designation`** | `VARCHAR(100)` | - | `NULL` | - | Set for Faculty Mentors (e.g., *Associate Professor*, *HOD*); `NULL` for students |
| **`Year`** | `INT` | - | `NULL` | `CHECK (Year BETWEEN 1 AND 5)` | Set for Students; `CHECK` constraint rejects invalid academic year inputs |
| **`CGPA`** | `NUMERIC(4, 2)` | - | `NULL` | `CHECK (CGPA BETWEEN 0.00 AND 10.00)` | Exact fixed-point numeric (2 whole digits, 2 decimals); prevents IEEE floating-point rounding errors |
| **`Skills`** | `TEXT[]` | - | `NOT NULL` | `DEFAULT '{}'` | Native PostgreSQL array type for dynamic skill sets without requiring an extra junction table |

---

### Table 3: `MENTORSHIP` (Associative Relationship)
- **Purpose:** Models the formal mentorship pairing between a faculty mentor and a student mentee.

| Column | Data Type | Key Type | Nullable | Constraints & Defaults | Why this Data Type? |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`MentorshipID`** | `SERIAL` | **Primary Key** | `NOT NULL` | Auto-incrementing integer | Unique identifier for each pairing instance |
| **`MentorID`** | `INT` | **Foreign Key** | `NOT NULL` | `REFERENCES USERS(UserID) ON DELETE RESTRICT` | `ON DELETE RESTRICT` prevents accidental deletion of faculty with active student pairings |
| **`MenteeID`** | `INT` | **Foreign Key** | `NOT NULL` | `REFERENCES USERS(UserID) ON DELETE CASCADE` | References the student being guided; cascade cleans up pairing if student deregisters |
| **`StartDate`** | `DATE` | - | `NOT NULL` | `DEFAULT CURRENT_DATE` | Pure calendar date (Year-Month-Day); no time component needed |
| **`EndDate`** | `DATE` | - | `NULL` | - | Nullable while pairing is active; populated when completed |
| **`Status`** | `pairing_status` (`ENUM`) | - | `NOT NULL` | `DEFAULT 'Active'`, Values: `'Active'`, `'Completed'`, `'Terminated'` | Strictly controls state transitions; queried by trigger |

- **Table-Level Constraint:**
  ```sql
  CONSTRAINT chk_mentorship_dates CHECK (EndDate IS NULL OR EndDate >= StartDate)
  ```
  Guarantees temporal consistency (a pairing cannot terminate before it begins).

---

### Table 4: `MEETING` (1:N Sessions & Bilateral Feedback)
- **Purpose:** Tracks meeting logistics, agendas, minutes, and two-way evaluations between mentor and mentee.

| Column | Data Type | Key Type | Nullable | Constraints & Defaults | Why this Data Type? |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`MeetingID`** | `SERIAL` | **Primary Key** | `NOT NULL` | Auto-incrementing integer | Primary key for meeting lookup |
| **`MentorshipID`** | `INT` | **Foreign Key** | `NOT NULL` | `REFERENCES MENTORSHIP(MentorshipID) ON DELETE CASCADE` | Subordinate to mentorship; cascade deletes meetings if mentorship is purged |
| **`MeetingDate`** | `DATE` | - | `NOT NULL` | - | Date on which the meeting takes place |
| **`MeetingTime`** | `TIME` | - | `NOT NULL` | - | Scheduled time of day (e.g., `14:30:00`) |
| **`Mode`** | `meeting_mode` (`ENUM`) | - | `NOT NULL` | Values: `'Online'`, `'Offline'` | Domain constraint for session format |
| **`Discussion`** | `TEXT` | - | `NULL` | - | Unbounded text string for meeting minutes and action items |
| **`Status`** | `meeting_status` (`ENUM`) | - | `NOT NULL` | `DEFAULT 'Scheduled'`, Values: `'Scheduled'`, `'Completed'`, `'Cancelled'` | Lifecycle state of the meeting |
| **`MentorRating`** | `INT` | - | `NULL` | `CHECK (MentorRating BETWEEN 1 AND 5)` | Faculty evaluation of student preparation (1 to 5 stars) |
| **`MentorRemarks`**| `TEXT` | - | `NULL` | - | Detailed qualitative feedback written by faculty |
| **`MenteeRating`** | `INT` | - | `NULL` | `CHECK (MenteeRating BETWEEN 1 AND 5)` | Student evaluation of session usefulness (1 to 5 stars) |
| **`MenteeRemarks`**| `TEXT` | - | `NULL` | - | Qualitative reflection written by student |
| **`FeedbackDate`** | `DATE` | - | `NULL` | - | Date on which feedback was submitted |

---

### Table 5: `PROGRESS_RECORD` (1:N Longitudinal Academic Metrics)
- **Purpose:** Independent academic monitoring log tracking attendance and semester performance updates.

| Column | Data Type | Key Type | Nullable | Constraints & Defaults | Why this Data Type? |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`ProgressID`** | `SERIAL` | **Primary Key** | `NOT NULL` | Auto-incrementing integer | Unique record ID |
| **`MenteeID`** | `INT` | **Foreign Key** | `NOT NULL` | `REFERENCES USERS(UserID) ON DELETE CASCADE` | Direct reference to the student mentee being tracked |
| **`AcademicProgress`** | `VARCHAR(100)` | - | `NOT NULL` | - | Categorical milestone (e.g., *"Midterm Review - On Track"*, *"Needs Improvement"*) |
| **`AttendancePercentage`** | `NUMERIC(5, 2)` | - | `NOT NULL` | `CHECK (AttendancePercentage BETWEEN 0.00 AND 100.00)` | Supports percentages up to `100.00%` with two decimal precision |
| **`Remarks`** | `TEXT` | - | `NULL` | - | Mentor's academic guidance advice |
| **`UpdatedDate`** | `DATE` | - | `NOT NULL` | `DEFAULT CURRENT_DATE` | Timestamp of progress evaluation |

---

## 3. Normalization Proof (UNF $\to$ 1NF $\to$ 2NF $\to$ 3NF)

When the examiner asks: *"Prove that your schema is normalized up to 3NF"*, walk through this exact progression:

### 1. Unnormalized Form (UNF)
If we designed this system naively in an Excel spreadsheet, a single row would look like:
`Student(ID, Name, Email, Dept, MentorName, MentorEmail, Meeting1_Date, Meeting1_Notes, Meeting2_Date...)`
- **Flaws:** Repeating groups for meetings, multivalued attributes, data redundancy.

### 2. First Normal Form (1NF)
- **Requirement:** All column values must be atomic (no sets or repeating groups), and each record must have a unique identifier.
- **How our schema satisfies 1NF:**
  - Every table has a surrogate Primary Key (`UserID`, `ProfileID`, etc.).
  - We extracted recurring meetings out of the student record into a dedicated `MEETING` relation where each row represents exactly one session.

### 3. Second Normal Form (2NF)
- **Requirement:** The table must be in 1NF, and **no non-prime attribute may depend on a proper subset of any candidate key** (Zero Partial Functional Dependencies).
- **How our schema satisfies 2NF:**
  - Notice our associative table `MENTORSHIP`. If we had kept `MentorDepartment` or `MenteeDepartment` inside `MENTORSHIP`, those attributes would depend on `MentorID` or `MenteeID` individually, rather than the whole pairing key.
  - In our schema, `MENTORSHIP` only holds attributes of the *pairing itself* (`StartDate`, `EndDate`, `Status`). All mentor-specific and mentee-specific attributes remain strictly in `USERS` and `USER_PROFILES`.
  - Because all our tables use single-attribute primary keys (`SERIAL`), partial key dependencies are mathematically impossible!

### 4. Third Normal Form (3NF)
- **Requirement:** The table must be in 2NF, and **no non-prime attribute may depend on another non-prime attribute** (Zero Transitive Dependencies: $X \to Y$ and $Y \to Z$).
- **How our schema satisfies 3NF:**
  - Consider `MEETING`: It contains `MentorshipID`, `MeetingDate`, `Discussion`, `MentorRating`.
  - It does **not** store `MenteeName`, `MentorName`, or `StudentDepartment`. To get the student's department, you must follow the foreign key chain: `MEETING.MentorshipID` $\to$ `MENTORSHIP.MenteeID` $\to$ `USER_PROFILES.Department`.
  - If we had stored `StudentDepartment` directly in `MEETING`, we would have a transitive dependency:
    $\text{MeetingID} \to \text{MentorshipID} \to \text{MenteeID} \to \text{Department}$.
  - Storing it only in `USER_PROFILES` eliminates update anomalies (e.g., if a student changes branch, we update exactly 1 row, not 20 meeting rows).

---

## 4. PL/pgSQL Trigger Deep-Dive

### The Business Problem
In university regulations, a student can have multiple *historical* mentors across different years, but **can never have more than 1 active mentor at any given time**.

### Why couldn't this be solved with a simple `UNIQUE` constraint?
If we added `UNIQUE(MenteeID)` to the `MENTORSHIP` table, a student could **only ever have 1 mentor in their entire 4-year degree**! They could never be reassigned to a second mentor in a subsequent semester, even after the first pairing was marked `'Completed'`.

We need a **conditional uniqueness constraint** (`WHERE Status = 'Active'`). While PostgreSQL supports partial unique indexes, our trigger provides clear, programmatic business error messaging and enforces consistency during both `INSERT` and `UPDATE` operations.

### The Trigger Implementation

```sql
CREATE OR REPLACE FUNCTION enforce_single_active_mentorship()
RETURNS TRIGGER AS $$
BEGIN
    -- Check only if the new/updated pairing is set to 'Active'
    IF NEW.Status = 'Active' THEN
        IF EXISTS (
            SELECT 1 FROM MENTORSHIP 
            WHERE MenteeID = NEW.MenteeID 
              AND Status = 'Active' 
              -- Ignore current row if this is an UPDATE on an already active pairing
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
```

### Key Trigger Concepts for Viva:
1. **Trigger Timing (`BEFORE`):** Runs *before* the row is written to disk. If validation fails, it aborts immediately without wasting I/O.
2. **Execution Level (`FOR EACH ROW`):** Executes individually for every tuple affected by the `INSERT` or `UPDATE` statement.
3. **Pseudo-Records (`NEW` vs `OLD`):** `NEW` contains the proposed record being inserted or updated; `OLD` holds the prior database state during updates.
4. **`RAISE EXCEPTION`:** Aborts the current transaction immediately and rolls back any pending operations.

---

## 5. Analytical View & SQL Joins Breakdown

### Definition: `View_MentorshipPerformance`

```sql
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
```

### Critical Viva Discussion Points on this View:
- **Why `LEFT JOIN` on `MEETING` instead of `INNER JOIN`?**
  If a student is assigned a mentor today, they have `0` meetings scheduled so far. An `INNER JOIN` would drop this new mentorship entirely from the report! A `LEFT JOIN` keeps the pairing in the view and returns `TotalMeetingsScheduled = 0`.
- **Conditional Aggregation:**
  `COUNT(CASE WHEN mt.Status = 'Completed' THEN 1 END)` uses SQL conditional aggregation to count completed sessions without needing a separate subquery.
- **Performance Advantage:**
  The query is pre-compiled and parsed by the PostgreSQL query planner, reducing backend API overhead.

---

## 6. Indexing Strategy & Query Optimization

We created 4 secondary B-Tree indexes:

```sql
CREATE INDEX idx_users_email_role ON USERS(Email, Role);
CREATE INDEX idx_mentorship_lookup ON MENTORSHIP(MentorID, MenteeID, Status);
CREATE INDEX idx_meeting_mentorship_date ON MEETING(MentorshipID, MeetingDate);
CREATE INDEX idx_progress_mentee ON PROGRESS_RECORD(MenteeID, UpdatedDate);
```

### Why Composite B-Tree Indexes?
1. **`idx_users_email_role (Email, Role)`:**
   - Every single authenticated request validates user credentials and role. A composite index covers the query `WHERE Email = $1 AND Role = $2`, achieving an $O(\log N)$ index scan instead of an expensive $O(N)$ sequential table scan.
2. **`idx_mentorship_lookup (MentorID, MenteeID, Status)`:**
   - Mentorship allocation queries, active student lookups, and the trigger's `EXISTS` check filter on these exact three columns.
3. **`idx_meeting_mentorship_date (MentorshipID, MeetingDate)`:**
   - Optimizes calendar timeline generation by pairing meetings chronologically.
4. **Left-to-Right Index Prefix Rule:**
   - B-Tree composite indexes can also accelerate queries filtering solely on the leading column (e.g., `idx_progress_mentee` accelerates queries filtering on `MenteeID` alone).

---

## 7. 30 Core DBMS Viva Questions & Spoken Answers

---

### Basic Relational Concepts (Q1 – Q6)

#### Q1: What is a Database Management System (DBMS), and why did you use a Relational DBMS (RDBMS)?
> *"A DBMS is software that provides controlled, concurrent, and secure access to persistent data. We chose an RDBMS (PostgreSQL) because our domain requires formal relational integrity, foreign key cascading, ACID transactions, and deterministic queries across normalized tables. File systems or flat JSON files cannot guarantee consistency or enforce multi-user concurrency."*

#### Q2: What is the difference between DDL, DML, and DCL in your project?
> *"In our project:
> - **DDL (Data Definition Language):** `CREATE TABLE`, `CREATE TYPE`, `CREATE TRIGGER`, `CREATE VIEW` in `schema.sql`.
> - **DML (Data Manipulation Language):** `INSERT`, `UPDATE`, `SELECT`, `DELETE` executed in our backend controllers to add users, schedule meetings, and update progress.
> - **DCL (Data Control Language):** PostgreSQL role permissions and authentication grants (`GRANT`, `REVOKE`)."*

#### Q3: What is a Primary Key and how does it differ from a Unique Key in your schema?
> *"A **Primary Key** uniquely identifies each tuple in a relation and cannot contain `NULL` values (e.g., `UserID` in `USERS`). A **Unique Key** also guarantees uniqueness across rows but can accept a `NULL` value (e.g., `Email` in `USERS`). A table can have only one Primary Key, but multiple Unique keys."*

#### Q4: What is a Surrogate Key versus a Natural Key, and which did you choose?
> *"A **Natural Key** is an attribute that exists in the real world, like an email address or student roll number. A **Surrogate Key** is an artificial, system-generated identifier with no business meaning, such as our auto-incrementing `UserID SERIAL`. 
> We chose surrogate keys for all primary keys because natural keys can change (e.g., a student changes their email), which would break foreign key references across related tables."*

#### Q5: What is Referential Integrity? Give an example from your schema.
> *"Referential integrity ensures that relationships between tables remain valid. A foreign key value in a referencing table must point to an existing primary key in the referenced table. 
> For example, `MEETING.MentorshipID` references `MENTORSHIP.MentorshipID`. PostgreSQL will refuse to insert a meeting with a nonexistent `MentorshipID`."*

#### Q6: Explain the difference between `ON DELETE CASCADE` and `ON DELETE RESTRICT` in your database.
> *"Both maintain referential integrity when a parent row is deleted:
> - **`CASCADE`:** Deleting the parent automatically deletes all dependent child rows. We used this on `MEETING` so that if a mentorship pairing is deleted, its meeting logs are cleaned up automatically.
> - **`RESTRICT`:** Prevents the parent row from being deleted if child rows exist. We used this on `MENTORSHIP.MentorID` to prevent deleting a faculty member who currently has students assigned to them."*

---

### Data Types & Constraints (Q7 – Q12)

#### Q7: Why did you use `NUMERIC(4, 2)` for CGPA instead of `FLOAT` or `REAL`?
> *"IEEE floating-point types (`FLOAT`/`REAL`) use binary approximations, leading to rounding inaccuracies (e.g., `8.70` might be stored as `8.6999998`). `NUMERIC(4, 2)` is an exact fixed-point data type in PostgreSQL that stores numbers exactly as entered (up to 4 total digits with 2 decimal places), which is critical for academic grades and GPA calculations."*

#### Q8: What are PostgreSQL ENUM types and why use them instead of simple `VARCHAR`?
> *"An `ENUM` (Enumerated type) is a custom data type comprising a static, ordered set of values, such as our `user_role ('Admin', 'Mentor', 'Mentee')`. 
> ENUMs provide two major benefits:
> 1. **Domain Integrity:** PostgreSQL strictly rejects any input outside the declared enum values.
> 2. **Storage Efficiency:** An ENUM is stored internally as a 4-byte integer rather than a variable-length text string, saving disk space and speeding up index scans."*

#### Q9: What is the difference between `TIMESTAMP` and `TIMESTAMP WITH TIME ZONE` (`TIMESTAMPTZ`)?
> *"Plain `TIMESTAMP` stores the date and time without timezone information. `TIMESTAMPTZ` converts the input timestamp into UTC and stores it internally in UTC. When retrieved, it displays in the client's local timezone. We used `TIMESTAMPTZ` for `USERS.CreatedAt` so that registration logs remain globally accurate regardless of server or client location."*

#### Q10: How do CHECK constraints enforce domain integrity in your schema?
> *"CHECK constraints allow us to specify boolean conditions that every row must satisfy before insertion or update:
> - `Year BETWEEN 1 AND 5` prevents impossible academic years (e.g., Year 0 or Year 8).
> - `AttendancePercentage BETWEEN 0.00 AND 100.00` prevents invalid attendance values.
> - `MentorRating BETWEEN 1 AND 5` enforces a standard 5-star rating scale.
> If any row violates the condition, PostgreSQL raises a constraint violation error and rolls back the operation."*

#### Q11: Why did you use `TEXT[]` array for skills instead of a separate table?
> *"PostgreSQL natively supports dynamic arrays (`TEXT[]`). For skills (which are lightweight tags queried primarily for set intersection during matching), using an array allows us to fetch a student's or mentor's complete profile in a single table lookup without performing an expensive join against an extra `SKILLS` bridge table. However, if skills needed complex individual metadata (like certification dates or proficiency levels), a normalized junction table would be used."*

#### Q12: What is the purpose of the `CONSTRAINT chk_mentorship_dates` check?
> *"It enforces temporal logic: `CHECK (EndDate IS NULL OR EndDate >= StartDate)`. It ensures that a mentorship cannot end before it has started, preventing corrupted date intervals in historical records."*

---

### Advanced SQL: Normalization, Triggers & Views (Q13 – Q18)

#### Q13: What are Insertion, Deletion, and Update Anomalies?
> *"- **Insertion Anomaly:** Being unable to record data without inserting dummy data (e.g., if faculty data were in the meeting table, you couldn't add a new professor until they held their first meeting).
> - **Deletion Anomaly:** Accidental loss of secondary data when deleting a record (e.g., deleting a meeting also deletes the professor's profile).
> - **Update Anomaly:** Inconsistent data caused by having to update redundant copies in multiple rows (e.g., if a student changes branch, updating 10 meeting rows).
> Our 3NF normalization eliminates all three anomalies."*

#### Q14: How does a Database Trigger differ from a Stored Procedure?
> *"A **Stored Procedure** must be explicitly invoked by a user or application call (e.g., `CALL my_procedure()`). A **Trigger** cannot be called directly; it is automatically executed by the database engine in response to a specific DML event (`INSERT`, `UPDATE`, or `DELETE`) on a specified table."*

#### Q15: Why is your trigger a `BEFORE` trigger rather than an `AFTER` trigger?
> *"A `BEFORE INSERT OR UPDATE` trigger executes *prior* to writing the tuple to storage and updating indexes. By checking the active mentorship rule in a `BEFORE` trigger, we can raise an exception and abort immediately, avoiding the wasted CPU, disk I/O, and transaction log overhead of writing the row and rolling it back afterward."*

#### Q16: What is the difference between a Database View and a Materialized View?
> *"A **Standard View** (which we used for `View_MentorshipPerformance`) is a virtual table. It does not store physical data on disk; each time you query the view, PostgreSQL executes the underlying `SELECT` query. A **Materialized View** physically caches the query output on disk and must be refreshed (`REFRESH MATERIALIZED VIEW`), trading fresh real-time data for read performance."*

#### Q17: In your view, why did you use `GROUP BY` and aggregate functions?
> *"Our view aggregates meeting metrics across pairings. We grouped by `m.MentorshipID` and participant names, and applied aggregate functions:
> - `COUNT(mt.MeetingID)` counts total sessions.
> - `COUNT(CASE WHEN mt.Status = 'Completed' THEN 1 END)` counts completed sessions.
> - `ROUND(AVG(mt.MentorRating), 2)` computes the average faculty satisfaction score rounded to two decimals."*

#### Q18: What is the Left-to-Right prefix rule for composite indexes?
> *"In a B-Tree composite index on columns `(A, B, C)`, PostgreSQL can use the index for queries filtering on `A`, on `(A, B)`, or on `(A, B, C)`. However, it cannot efficiently use the index if the query filters only on `B` or `C` without `A`. We placed the highest-cardinality and most-frequently filtered column first (e.g., `Email` before `Role` in `idx_users_email_role`)."*

---

### Transactions, Concurrency & ACID (Q19 – Q24)

#### Q19: Explain the ACID properties with an example from your project.
> *"- **Atomicity:** When an administrator applies the Auto-Match feature, 5 pairings are inserted in a single transaction. If the 5th fails, all 5 are rolled back.
> - **Consistency:** No transaction can leave the database in an invalid state. Foreign keys, check constraints, and triggers are always satisfied.
> - **Isolation:** If two users query meeting records at the same time, neither sees uncommitted partial updates from the other.
> - **Durability:** Once a meeting feedback record is committed, its write-ahead log (WAL) is flushed to disk and will survive a power loss."*

#### Q20: What is Multi-Version Concurrency Control (MVCC) in PostgreSQL?
> *"MVCC is PostgreSQL's mechanism for handling concurrent transactions without lock contention. Instead of locking rows for reading, PostgreSQL creates a new version of a row whenever an `UPDATE` or `DELETE` occurs. This ensures that **readers never block writers, and writers never block readers**; readers simply see a consistent snapshot of the database at their transaction start time."*

#### Q21: What are the common concurrency phenomena (Dirty Read, Non-Repeatable Read, Phantom Read)?
> *"- **Dirty Read:** A transaction reads uncommitted data written by a concurrent transaction (prevented in PostgreSQL).
> - **Non-Repeatable Read:** A transaction re-reads a row and finds that its values have been changed by a committed transaction.
> - **Phantom Read:** A transaction re-executes a query with a `WHERE` range and finds that new rows have been inserted by another committed transaction."*

#### Q22: What are SQL Isolation Levels, and which does PostgreSQL use by default?
> *"SQL defines 4 isolation levels: Read Uncommitted, Read Committed, Repeatable Read, and Serializable. 
> PostgreSQL uses **Read Committed** by default, where each query within a transaction sees only data committed before that query began. For strict operations, higher levels like **Serializable** prevent phantom reads."*

#### Q23: How would you prevent a Race Condition if two students try to choose the last mentor slot simultaneously?
> *"In PostgreSQL, this can be solved using:
> 1. **Pessimistic Locking (`SELECT ... FOR UPDATE`):** Locks the mentor row during transaction evaluation so concurrent requests wait.
> 2. **Transaction Isolation:** Running the allocation inside a `SERIALIZABLE` transaction.
> 3. **Database Trigger:** Our trigger serializes access per mentee during `BEFORE INSERT`."*

#### Q24: What is the Write-Ahead Log (WAL) in PostgreSQL?
> *"WAL is a fundamental durability mechanism. Before changes are written to the actual database data pages on disk, a record of the change is written sequentially to the Write-Ahead Log. In the event of a system crash, PostgreSQL replays the WAL to restore the database to a completely consistent state."*

---

### Architecture, Matching & Scalability (Q25 – Q30)

#### Q25: How does your backend communicate with PostgreSQL?
> *"The Express backend uses the `pg` (node-postgres) driver. We configure a `Pool` instance with our `DATABASE_URL`. Every controller query is executed using `await pool.query(text, params)`, utilizing parameterized `$1, $2` placeholders to guarantee separation between query logic and data."*

#### Q26: What is the role of Neon in your project?
> *"Neon is a serverless, cloud-native PostgreSQL provider. It separates storage from compute, automatically scaling compute resources to match incoming traffic while maintaining persistent, distributed storage across multiple availability zones with automated backups and SSL encryption."*

#### Q27: How does your mentor recommendation engine query the database?
> *"The service executes two optimized queries:
> 1. It fetches the candidate mentee's profile (`Department`, `Year`, `CGPA`, `Skills`).
> 2. It fetches all faculty mentors by joining `USERS`, `USER_PROFILES`, and `MENTORSHIP`, using `COUNT(CASE WHEN m.Status = 'Active' THEN 1 END)` to determine active workload.
> The scoring algorithm then executes in memory to rank compatibility without running nested queries in a loop."*

#### Q28: How does Database Normalization impact Query Performance?
> *"Normalization reduces data redundancy and guarantees consistency, but requires multiple `JOIN` operations to reconstruct full records. To prevent performance penalties:
> 1. We created secondary B-tree indexes on all foreign key columns.
> 2. We created `View_MentorshipPerformance` so complex joins are pre-planned by the database engine.
> 3. We kept profile attributes in `USER_PROFILES` so frequent authentication lookups on `USERS` touch fewer bytes per row."*

#### Q29: What is `EXPLAIN ANALYZE` and how would you use it to debug a slow query?
> *"`EXPLAIN ANALYZE` is a PostgreSQL command that executes a SQL statement and returns the detailed execution plan generated by the query planner, along with actual runtimes. It reveals:
> - Whether the planner performed a fast **Index Scan** or an expensive **Sequential Scan** (`Seq Scan`).
> - The startup cost, total cost, and number of rows processed at each join node (e.g., Nested Loop, Hash Join, Merge Join)."*

#### Q30: If this university database grew to 500,000 students and 5,000 faculty, what database optimizations would you implement?
> *"We would apply four industry-standard optimizations:
> 1. **Table Partitioning:** Partition the `MEETING` and `PROGRESS_RECORD` tables by academic year (Range Partitioning on `MeetingDate`), ensuring queries only scan the active semester's partition.
> 2. **Read-Write Splitting:** Route write operations (`INSERT`/`UPDATE`) to a primary PostgreSQL node and distribute read queries (`SELECT`) across read replicas.
> 3. **Caching Layer:** Place a Redis cache in front of static faculty directory queries to eliminate database hits for read-heavy operations.
> 4. **Connection Multiplexing:** Use a connection pooler like PgBouncer to manage thousands of concurrent student connections without exhausting PostgreSQL process limits."*

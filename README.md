# CampusCircle 🎓
### Academic Group Collaboration, Real-Time Communication & Resource Sharing Platform

> **React Lab Project Submission**  
> **Course:** Web Technologies / React and Node.js Laboratory (BRALB507)  
> **Institution:** Atria Institute of Technology, Bangalore  
> **Specification:** Based on IEEE / Software Requirements Specification (SRS) v1.0

---

## 🌟 Overview & Key Innovations

Students often juggle WhatsApp, Telegram, Google Drive, and college ERP portals, causing critical assignment deadlines, lab manuals, and faculty announcements to get lost in disorganized group chats.

**CampusCircle** combines **structured academic study groups**, **Socket.IO real-time messaging**, **peer assignment sharing**, and an **interactive GPA/CIE Marks Predictor** into a single dashboard modeled on modern academic analytics UI.

### 🚀 Key Differentiators Built Specifically for This Lab:

1. **🔒 Zero-Knowledge College Email Verification (Privacy-First):**
   - Students register with any convenient username & password.
   - One-time verification requires a valid college email (`@atria.edu` / `@atriadigitalcampus.com` / college domain).
   - **Privacy Guarantee:** The raw email address is **never stored in the database**. Only an irreversible SHA-256 hash (`emailHash`) is recorded to prevent duplicate account creation while ensuring true privacy.
2. **🤫 100% Anonymous Campus Confessions:**
   - A campus-wide community confession board.
   - Verified college students can post thoughts, feedback, and study stress confessions without fear.
   - **Cryptographic Anonymity:** The server strips all user IDs and author references before persisting to the database. Posts receive anonymous numeric tags (`Anon #4827`) with interactive emoji reactions (`❤️`, `😂`, `💀`, `🫂`, `🎯`). Even database administrators cannot trace who posted what.
3. **📊 Student Hub ERP Attendance & Timetable Integration:**
   - Direct integration with the **Student Hub Chrome Extension** for Atria EDU ERP (`atriadigitalcampus.com`).
   - Automatically parses Theory, Laboratory, and Elective attendance tables (Conducted, Present, Absent, Percentage).
   - **Attendance Planner Simulator:** Calculates the exact number of consecutive classes a student must attend to cross the 75% cutoff, or how many classes they can afford to miss.
   - Weekly timetable schedule with class timings, room numbers, and faculty allocations.
4. **📈 VTU CIE & GPA Simulator / Predictor:**
   - Interactive semester mark simulator based on VTU Continuous Internal Evaluation (CIE) rules:
     - 3 Internal Tests (50 marks each) → Best 2 of 3 scaled to 30 marks.
     - Assignment & Quiz component (20 marks).
     - Total Internal CIE (50 marks).
   - Calculates **minimum SEE (Semester End Exam) marks needed in finals** to secure Grade O (90+), Grade A+ (80+), or Grade A (70+).
   - Visualizes Semester 1 through Semester 5 SGPA and cumulative CGPA trajectory!

---

## 🏗️ Architecture & Tech Stack

```
CampusCircle/
├── client/                      # Frontend (Vite + React 18)
│   ├── src/
│   │   ├── components/          # Sidebar, Navbar, Modals, Layout
│   │   ├── context/             # AuthContext, ThemeContext, SocketContext
│   │   ├── pages/               # Dashboard, Groups, GroupDetail, Assignments,
│   │   │                        # GpaPredictor, Attendance, Confessions, Settings
│   │   ├── services/            # Axios API client with Bearer auth interceptors
│   │   └── index.css            # Tailwind CSS directives & Soft Pastel palettes
├── server/                      # Backend (Node.js + Express + Socket.IO)
│   ├── src/
│   │   ├── config/              # Port 5050, JWT Secret, Multer storage
│   │   ├── controllers/         # Auth, Group, Chat, Assignment, Confession, GPA
│   │   ├── db/                  # Dual-Mode Persistence (JSON file DB / Mongo)
│   │   ├── middleware/          # JWT auth, verified check, multer file upload
│   │   ├── routes/              # Express REST API endpoints
│   │   ├── socket/              # Socket.IO rooms, typing & real-time messaging
│   │   └── seed.js              # Realistic college seed data (Atria Sem V CSE)
│   ├── data/                    # db.json persistence file
│   └── uploads/                 # Stored PDF lab manuals & assignments
```

- **Frontend:** React 18, Vite, Tailwind CSS, Lucide React, Socket.IO Client, Axios, Date-fns.
- **Backend:** Node.js (v22+), Express.js, Socket.IO, Multer, Bcrypt.js, JsonWebToken, UUID.
- **Persistence:** High-performance, zero-config dual-mode JSON database with MongoDB-like query semantics (filter, sort, insert, update, count) persisting to `server/data/db.json`.

---

## ⚡ Quick Start (Running the Project)

### Prerequisites:
- Node.js (v18 or higher recommended)
- npm

### 1-Command Startup:
Run the following in the project root:
```bash
# Starts both the backend server (port 5050) and frontend client (port 5188) concurrently!
npm run dev
```

Visit the application in your browser:
```
http://localhost:5188
```

---

## 🧪 Demo Accounts for Lab Evaluation

Pre-seeded realistic college accounts with 1-click login buttons on the login page:

| Username | Password | Role | Description |
|---|---|---|---|
| `neel_dev` | `password123` | Student | Neel Kumar Gupta (CSE Sem V Sec C) |
| `sarah_admin` | `password123` | Class Admin / CR | Sarah Jenkins (Class Representative) |
| `prof_prathyusha` | `password123` | Faculty Admin | Prof. Prathyusha R (React Lab In-Charge) |

---

## 📋 Evaluator Q&A Guide (Lab Viva Pointers)

1. **Q: How does the real-time chat deliver messages without refreshing the page?**  
   *A:* CampusCircle uses **Socket.IO** (WebSockets with polling fallback). When a student enters a group, the client emits `join_group`, placing them in a dedicated Socket.IO room (`group_${groupId}`). Sent messages are saved to the database and broadcasted immediately to all connected clients in that room.

2. **Q: How is user privacy maintained if email verification is required?**  
   *A:* The server takes the submitted college email (e.g. `user@atria.edu`), generates an OTP, and once verified, computes an irreversible **SHA-256 hash** (`emailHash`). The raw email is permanently wiped from memory and never written to disk. The hash allows the system to enforce 1-account-per-student without storing private contact data.

3. **Q: How are file downloads protected from unauthorized users?**  
   *A:* Downloads are gated by server-side middleware (`downloadAssignment`). Even if a user knows the direct file URL, the server checks whether the requesting user's JWT ID belongs to that specific group's membership before streaming the file.

4. **Q: How does the GPA Predictor calculate VTU CIE marks?**  
   *A:* It sorts all 3 CIE test marks in descending order, takes the best 2, averages them out of 50, scales them to 30 marks, and adds the continuous assignment score (max 20 marks) to produce the total Internal Assessment score out of 50. It then computes the exact SEE marks needed to reach 90 (Grade O), 80 (Grade A+), or 70 (Grade A).

---

## 📜 License
Developed for educational demonstration in the React and Node.js Laboratory at Atria Institute of Technology.

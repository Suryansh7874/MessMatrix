# 🍽️ Mess Matrix
### Smarter Meals. Stronger Systems.

**Mess Matrix** is a smart campus dining management platform designed to streamline meal planning, simplify mess operations, improve billing transparency, and reduce food wastage.

Inspired by the Great Hall dining experience, Mess Matrix connects students, administrators, and mess staff through a unified platform for meal bookings, QR-based check-ins, attendance tracking, and food-resource management.

🔗 **Repository:** [Suryansh7874/MessMatrix](https://github.com/Suryansh7874/MessMatrix)

---

## ✨ Key Features

### 🍱 Smart Meal Management
- View upcoming menus and scheduled meals.
- Opt in or opt out of meals within the permitted booking window.
- Manage meal bookings with server-enforced cancellation deadlines.
- Calculate expected meal headcounts for kitchen preparation.

### 🔐 Secure QR-Based Check-In
- Generate QR-based meal verification tokens.
- Validate student eligibility and meal-slot information.
- Record successful check-ins.
- Prevent duplicate meal redemption through backend validation and atomic operations.

### 📊 Attendance & Food-Waste Analytics
- Track bookings and actual meal attendance.
- Record prepared portions and leftover food.
- Compare expected attendance with actual consumption.
- Provide administrative reports for monitoring meal utilization.

### 💳 Rebate & Billing Management
- Process eligible meal cancellation rebates.
- Maintain student billing ledgers.
- Provide access to rebate history and billing summaries.

### 🏆 MealSync Reward System
Encourage responsible meal planning through a points-based system:

| Activity | Points |
|---|---:|
| Eligible early cancellation | +2 |
| Successful meal redemption | +1 |
| Surplus meal claim and collection | +1 |
| Meal no-show | −2 |

### 👥 Role-Based Access
Role-specific permissions support student, administrator, and mess-staff workflows.

### 📡 Offline Scan Synchronization
The architecture supports queued scan synchronization and backend reconciliation. Full offline operation depends on persistent client-side storage and the corresponding synchronization implementation.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React.js, Vite, JavaScript |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Authentication & Security | bcrypt, JWT-based authentication, Helmet, CORS, rate limiting |
| Validation | Zod |
| Background Jobs | node-cron |
| QR Functionality | QR generation and browser-based scanning libraries |
| Analytics | MongoDB aggregation and reporting |
| Deployment | Vercel, Render, MongoDB Atlas |

---

## 🏗️ Project Structure

```text
MessMatrix/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   └── services/
│   └── package.json
├── frontend/
│   ├── src/
│   └── package.json
├── .gitignore
├── LICENSE
└── README.md
```

The backend handles authentication, booking rules, QR verification, billing, attendance, and reporting. The frontend provides the user-facing interface for campus dining workflows.

---

## 🚀 Getting Started

### Prerequisites

Install the following before running the project:

- [Node.js](https://nodejs.org/)
- npm
- A MongoDB instance, local or hosted through MongoDB Atlas
- Git

### 1. Clone the repository

```bash
git clone https://github.com/Suryansh7874/MessMatrix.git
cd MessMatrix
```

### 2. Configure the backend

```bash
cd backend
npm install
```

Create the backend environment file using the variable names expected by the application. Configure your MongoDB connection string, authentication secret, frontend origin, and any other required API settings.

Start the backend using the development script defined in `backend/package.json`:

```bash
npm run dev
```

### 3. Configure the frontend

Open a second terminal:

```bash
cd MessMatrix/frontend
npm install
```

Configure the frontend API base URL according to the environment variables used by the application.

Start the frontend using the script defined in `frontend/package.json`:

```bash
npm run dev
```

Open the local URL printed by Vite in your terminal.

> **Note:** Exact environment-variable names and available npm scripts depend on the current project configuration. Check the respective package files and environment examples before running the application.

---

## 🔒 Security & Reliability

Mess Matrix is designed around reliable backend enforcement of critical operations:

- Server-side validation of booking and cancellation deadlines.
- Role-based authorization for protected operations.
- Password hashing and authenticated API requests.
- Atomic state transitions for meal redemption and booking operations.
- Database uniqueness constraints to help prevent duplicate records.
- Idempotent reward processing and reconciliation for supported workflows.
- Structured tracking of attendance, rebates, and meal consumption.

---

## 🌱 Project Objective

Mess Matrix aims to reduce food wastage, improve meal-demand estimation, make mess operations more transparent, and help institutions use food resources efficiently.

By combining digital meal planning, secure attendance verification, automated billing, and consumption analytics, the platform provides a foundation for smarter and more sustainable campus dining.

---

## 👨‍💻 Team EnigmaBreakers

**Event:** WEBSTER 2026  
**Problem Statement:** Kamal Taj Refectory  
**Website:** Mess Matrix  
**Team ID:** 377

---

## 📄 License

This project is distributed under the license specified in the repository's `LICENSE` file.

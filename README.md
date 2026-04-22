# Fit2BU — Setup & Run Guide

## Prerequisites
- **Python 3.8+** — check with `python3 --version` (comes pre-installed on Mac)
- **Node.js 18+** — download from https://nodejs.org if needed

That's it. No database install needed (uses SQLite, built into Python).

---

## Running the App

### Step 1 — Start the Backend
Open a terminal window:
```bash
cd backend
pip3 install -r requirements.txt
python3 app.py
```
You should see:
```
✅ Database ready
🏋️  Fit2BU backend running on http://localhost:3001
```

### Step 2 — Start the Frontend
Open a **second** terminal window:
```bash
cd frontend
npm install
npm start
```
App opens at **http://localhost:3000**

---

## Test Accounts (pre-seeded)

| Email | Password | Notes |
|-------|----------|-------|
| testuser@bu.edu | Password1! | Regular user |
| testuser2@bu.edu | Password1! | Regular user |
| organizer@bu.edu | Password1! | Organizer |
| waitlistuser@bu.edu | Password1! | Use to test waitlist |

**Waitlist demo:** "Tennis Doubles" is pre-filled to 2/2 capacity.
Log in as waitlistuser@bu.edu → join waitlist → switch to testuser@bu.edu → leave → waitlistuser gets auto-promoted.

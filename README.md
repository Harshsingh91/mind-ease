# MindEase – Full Stack Setup

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Start the server
```bash
node server.js
```

### 3. Open the app
Go to: **http://localhost:5500**

---

## Demo Login
| Email | Password |
|-------|----------|
| user@gmail.com | 1234 |

Or create a new account on the sign-in page.

---

## File Structure
```
mindease/
├── server.js        ← Express backend (auth, API, static serving)
├── package.json     ← Dependencies
├── home.html        ← Landing page
├── sign.html        ← Login / Sign-in page
├── dashboard.html   ← Main dashboard (auth-protected)
└── login.html       ← (legacy, use sign.html instead)
```

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /login | ❌ | Login with email + password |
| POST | /signup | ❌ | Register new user |
| POST | /logout | ✅ | End session |
| GET | /me | ✅ | Get current user profile |
| GET | /dashboard-data | ✅ | Dashboard summary |
| POST | /mood | ✅ | Log a mood entry |
| GET | /mood | ✅ | Get mood history |
| POST | /journal | ✅ | Save journal entry |
| GET | /journal | ✅ | Get all journal entries |

**Auth**: Include header `Authorization: Bearer <token>` for protected routes.
Token is returned on login/signup and stored in `sessionStorage` in the browser.

---

## What was fixed / added

### Backend (server.js)
- ✅ Full user registration (`/signup`) with hashed passwords
- ✅ Secure login (`/login`) returning auth tokens
- ✅ Session management with token-based auth
- ✅ Protected routes (mood, journal, dashboard data)
- ✅ Seeded demo user (user@gmail.com / 1234)
- ✅ Serves static HTML files

### sign.html
- ✅ `doLogin()` now calls the real `/login` API
- ✅ Stores token in `sessionStorage` on success
- ✅ Shows proper error messages from API
- ✅ Auto-redirects if already logged in
- ✅ Fixed broken HTML structure (duplicate tags, stray buttons)

### dashboard.html
- ✅ Auth guard — redirects to sign.html if not logged in
- ✅ Loads real user name, streak, stats from API
- ✅ Mood selection logs to backend
- ✅ Journal entries loaded from API (real data)
- ✅ "+ Journal" button opens a prompt and saves entry
- ✅ Sign Out button calls `/logout` and clears session

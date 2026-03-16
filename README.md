# 🛡️ AEGIS AI — Autonomous Cyber-Immune Platform

> AEGIS AI learns what normal looks like in your network, detects anything that isn't — and neutralizes threats automatically before a human even has to react.

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwindcss)
![Better Auth](https://img.shields.io/badge/Auth-Better_Auth-teal)
![Arcjet](https://img.shields.io/badge/Security-Arcjet-purple)
![License](https://img.shields.io/badge/License-MIT-green)

---

## ✨ Features

- **🔐 Authentication** — Google OAuth + email/password sign-in via Better Auth
- **🛡️ Security** — Arcjet rate limiting, bot protection, and shield on all API routes
- **📊 Real-time Dashboard** — Live threat feed with auto-updating alerts every 15 seconds
- **🗺️ Global Attack Map** — Interactive world map showing attack origins and protected targets
- **🧠 Explainable AI Panel** — SHAP-style confidence scores and contributing factor analysis
- **🤖 Autonomous Playbooks** — 4-step response workflows (Observe → Isolate → Remediate → Validate)
- **⚡ Simulate Attack** — Trigger fake threats to demo automated playbook execution
- **🔍 Threat Management** — Full table with severity filters, search, pagination, and row actions
- **⚙️ Settings** — Profile, notifications, 2FA toggle, session timeout, dark mode

## 📄 Pages

| Route                  | Description                                                                      |
| ---------------------- | -------------------------------------------------------------------------------- |
| `/`                    | Landing page with hero, problem, how-it-works, features, impact, tech stack, CTA |
| `/login`               | Email/password + Google sign-in with inline validation                           |
| `/register`            | Full registration with live password strength meter and requirements checklist   |
| `/dashboard`           | Main dashboard — stats cards, live threat feed, attack map, AI panel, playbooks  |
| `/dashboard/threats`   | Threats table with severity filters, search, and pagination                      |
| `/dashboard/playbooks` | Playbook cards with animated step-by-step execution                              |
| `/dashboard/settings`  | User profile, notifications, security preferences                                |

## 🛠️ Tech Stack

| Layer      | Technology                                    |
| ---------- | --------------------------------------------- |
| Framework  | Next.js 15 (App Router)                       |
| Language   | TypeScript                                    |
| Styling    | Tailwind CSS v4                               |
| Auth       | Better Auth (Google OAuth + Email/Password)   |
| Security   | Arcjet (Rate Limit · Bot Protection · Shield) |
| Database   | Neon PostgreSQL (Serverless)                  |
| Maps       | react-simple-maps                             |
| Charts     | Recharts                                      |
| Icons      | Lucide React                                  |
| Animations | Framer Motion + CSS Keyframes                 |

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A [Neon](https://neon.tech) PostgreSQL database
- Google OAuth credentials from [Google Cloud Console](https://console.cloud.google.com)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/aegis-ai.git
cd aegis-ai

# Install dependencies
npm install --legacy-peer-deps

# Set up environment variables
cp .env.example .env
# Fill in your credentials (see below)

# Create database tables
node scripts/create-tables.js

# Start the dev server
npm run dev
```

### Environment Variables

Create a `.env` file in the root directory:

```env
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=http://localhost:3000

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

ARCJET_KEY=your-arcjet-key

NEXT_PUBLIC_APP_URL=http://localhost:3000

NEON_DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
```

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials
3. Set **Authorized JavaScript origins**: `http://localhost:3000`
4. Set **Authorized redirect URIs**: `http://localhost:3000/api/auth/callback/google`

## 📁 Project Structure

```
src/
├── app/
│   ├── api/auth/[...all]/route.ts   # Better Auth API handler
│   ├── dashboard/
│   │   ├── layout.tsx               # Dashboard navbar + layout
│   │   ├── page.tsx                 # Main dashboard
│   │   ├── threats/page.tsx         # Threats table
│   │   ├── playbooks/page.tsx       # Playbook cards
│   │   └── settings/page.tsx        # User settings
│   ├── login/page.tsx               # Login page
│   ├── register/page.tsx            # Register page
│   ├── page.tsx                     # Landing page
│   ├── layout.tsx                   # Root layout
│   └── globals.css                  # Design system + animations
├── lib/
│   ├── auth.ts                      # Better Auth server config
│   ├── auth-client.ts               # Better Auth client hooks
│   ├── arcjet.ts                    # Arcjet security config
│   ├── mock-data.ts                 # Threats, playbooks, map data
│   └── utils.ts                     # Utility functions
├── middleware.ts                     # Route protection
scripts/
└── create-tables.js                  # Neon DB table creation
```

## 🎨 Design System

| Token              | Value     | Usage             |
| ------------------ | --------- | ----------------- |
| `--color-navy`     | `#0a0f1e` | Page backgrounds  |
| `--color-card`     | `#0d1529` | Card backgrounds  |
| `--color-teal`     | `#00d4ff` | Primary accent    |
| `--color-critical` | `#ff3b3b` | Critical severity |
| `--color-warning`  | `#ffd93d` | Warning severity  |
| `--color-safe`     | `#00ff88` | Safe / contained  |
| `--color-border`   | `#1a2744` | Borders           |

## 🔒 Security Features

- **Route Protection** — All `/dashboard/*` routes require authentication (middleware redirect)
- **Rate Limiting** — 5 requests/minute per IP on `/api/auth/*` routes
- **Bot Protection** — Arcjet bot detection on login and register
- **Shield** — Arcjet shield protection on all API routes
- **Password Rules** — Min 8 chars, 1 uppercase, 1 number, 1 special character

---

## 👥 Team

**Built by Algorithm Avengers**

© 2026 AEGIS AI. All rights reserved.

# 🛡️ AEGIS AI — Autonomous Cyber-Immune Platform

> AEGIS AI is a next-generation cybersecurity platform that learns what normal looks like in your network, detects anomalies, classifies threats in real-time, and neutralizes them automatically before a human has to react.

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![FastAPI](https://img.shields.io/badge/FastAPI-0.103-009688?logo=fastapi)
![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwindcss)
![Better Auth](https://img.shields.io/badge/Auth-Better_Auth-teal)
![Arcjet](https://img.shields.io/badge/Security-Arcjet-purple)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 🌟 The Vision

Traditional signature-based security systems fail against zero-day attacks. AEGIS AI mimics the human immune system: it establishes a behavioral baseline of your network and autonomously acts when it detects foreign, malicious behavior.

## ✨ Core Features

### 🧠 Advanced Machine Learning Pipeline

- **Behavioral Baselining**: Uses **Isolation Forest** trained strictly on benign traffic to flag anomalies without relying on known signatures.
- **Threat Classification**: Utilizes an **XGBoost** classifier (99.7% F1 Score) to categorize detected anomalies into specific threat vectors (e.g., DDoS, Botnet, PortScan, Brute Force).
- **Threat DNA Fingerprinting**: Generates normalized 256-dimension cosine-similarity vector embeddings to identify variant attacks that share behavioral DNA with known threats.
- **Explainable AI (XAI)**: Leverages **SHAP (TreeExplainer)** to provide human-readable explanations of exactly which feature dimensions triggered a threat alert.

### 🛡️ Platform & Dashboard

- **Real-Time Threat Feed**: Live dashboard with dynamic event ingestion, showing critical stats, active threats, and global attack origin mapping via interactive WebGL maps.
- **Autonomous Playbooks**: Automated 4-step response workflows (`Observe` → `Isolate` → `Remediate` → `Validate`) that execute instantly upon high-confidence threat detection.
- **Explainable AI Panel**: Visualizes the decision logic of the ML model directly in the UI, answering *why* a threat was blocked.
- **Robust Security**: Protected by Arcjet bot protection, rate limiting, and Next.js server-side route shielding. Secure authentication managed by Better Auth.

---

## 🏗️ Architecture

AEGIS AI is decoupled into two primary systems:

### 1. Frontend Dashboard (Next.js)

The command center. It visualizes the threat data, allows analysts to configure settings, review Explainable AI metrics, and manually trigger response playbooks.

### 2. ML Inference Backend (FastAPI / Python)

The detection engine. A localized Python FastAPI server that ingests raw network flow telemetry, runs the Scikit-Learn/XGBoost inference pipeline, generates SHAP explanations, and returns formatted JSON threat events.

---

## 📄 Routing Schema

| Route                    | Description                                                                      |
| ------------------------ | -------------------------------------------------------------------------------- |
| `/`                    | Landing page with hero, problem, how-it-works, features, impact, tech stack, CTA |
| `/login`               | Email/password + Google sign-in with inline validation                           |
| `/register`            | Full registration with live password strength meter and requirements checklist   |
| `/dashboard`           | Main dashboard — stats cards, live threat feed, attack map, AI panel, playbooks |
| `/dashboard/threats`   | Threats table with severity filters, search, and pagination                      |
| `/dashboard/playbooks` | Playbook cards with animated step-by-step execution                              |
| `/dashboard/settings`  | User profile, notifications, security preferences                                |

---

## 🛠️ Tech Stack

| Layer      | Technology                                      |
| ---------- | ----------------------------------------------- |
| Framework  | Next.js 15 (App Router)                         |
| Language   | TypeScript, Python 3.12                         |
| ML API     | FastAPI, Uvicorn                                |
| ML Models  | Scikit-Learn (Isolation Forest), XGBoost        |
| ML Explain | SHAP (TreeExplainer)                            |
| Dataset    | CIC-IDS2017 Network Intrusion Dataset           |
| Styling    | Tailwind CSS v4, Framer Motion                  |
| Auth       | Better Auth (Google OAuth + Email/Password)     |
| Security   | Arcjet (Rate Limit · Bot Protection · Shield) |
| Database   | Neon PostgreSQL (Serverless)                    |
| Maps/Data  | react-simple-maps, Recharts                     |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Python 3.10+
- A [Neon](https://neon.tech) PostgreSQL database
- Google OAuth credentials from [Google Cloud Console](https://console.cloud.google.com)

### 1. Setup the Next.js Frontend

```bash
# Clone the repository
git clone https://github.com/your-username/aegis-ai.git
cd aegis-ai

# Install dependencies
npm install --legacy-peer-deps

# Set up environment variables
cp .env.example .env

# Create database tables
node scripts/create-tables.js
```

### 2. Configure Environment Variables

Edit your `.env` file at the root:

```env
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=http://localhost:3000

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

ARCJET_KEY=your-arcjet-key

NEXT_PUBLIC_APP_URL=http://localhost:3000

NEON_DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
```

> *For Google OAuth: Ensure you set **Authorized JavaScript origins** to `http://localhost:3000` and **Authorized redirect URIs** to `http://localhost:3000/api/auth/callback/google` in your GCP console.*

### 3. Setup the Python ML Backend

```bash
cd backend

# Create a virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
# source venv/bin/activate

# Install requirements
pip install -r requirements.txt
```

### 4. Run the Application (Dual-Server)

To run the full platform, you need both the ML Backend and the Next.js Frontend running simultaneously in separate terminal windows.

**Terminal 1 (ML Backend):**

```bash
cd backend
venv\Scripts\activate
uvicorn server:app --reload
# Runs on http://localhost:8000
```

**Terminal 2 (Next.js Frontend):**

```bash
# In the root aegis-ai directory
npm run dev
# Runs on http://localhost:3000
```

---

## 📁 Project Structure

```
AEGIS/
├── src/                                     # Next.js Frontend
│   ├── app/
│   │   ├── api/auth/[...all]/route.ts       # Better Auth API handler
│   │   ├── dashboard/                       # Protected dashboard UI
│   │   │   ├── layout.tsx   
│   │   │   ├── page.tsx   
│   │   │   ├── threats/page.tsx   
│   │   │   ├── playbooks/page.tsx   
│   │   │   └── settings/page.tsx  
│   │   ├── login/page.tsx   
│   │   ├── register/page.tsx  
│   │   ├── page.tsx                         # Landing page
│   │   └── globals.css                      # Tailwind v4 theme CSS
│   ├── lib/
│   │   ├── auth.ts                          # Better Auth server configuration
│   │   ├── arcjet.ts                        # Arcjet security configuration
│   │   └── mock-data.ts                     # Mock map & playbook states
│   └── middleware.ts                        # Server-side routing protection
│
├── backend/                                 # Python FastAPI ML Engine
│   ├── data/
│   │   └── preprocess.py                    # CIC-IDS2017 Dataset normalizer
│   ├── evaluation/
│   │   └── evaluate.py                      # Metrics generation
│   ├── models/
│   │   ├── baseline.py                      # Isolation Forest Anomaly Detection
│   │   ├── classifier.py                    # XGBoost Threat Categorizer
│   │   ├── explainer.py                     # SHAP Explainer
│   │   └── threat_dna.py                    # Vector Embeddings
│   ├── pipeline/
│   │   └── inference.py                     # E2E pipeline execution logic
│   ├── server.py                            # FastAPI entry point
│   ├── train.py                             # ML pipeline orchestrator
│   └── requirements.txt   
│
└── scripts/
    └── create-tables.js                     # DB migration script
```

---

## 🎨 Design System & UI/UX

AEGIS AI is designed with a dark, cyberpunk-inspired, command-center aesthetic.

| Token                | Value       | Description             |
| -------------------- | ----------- | ----------------------- |
| `--color-navy`     | `#0a0f1e` | Deep background         |
| `--color-card`     | `#0d1529` | Slightly elevated cards |
| `--color-teal`     | `#00d4ff` | Primary active accent   |
| `--color-critical` | `#ff3b3b` | Destructive / Critical  |
| `--color-warning`  | `#ffd93d` | Warning / Medium        |
| `--color-safe`     | `#00ff88` | Safe / Benign           |
| `--color-border`   | `#1a2744` | Panel outlines          |

Animations rely heavily on `<motion.div>` from Framer Motion alongside global CSS keyframes for organic pulse and scanning-line effects.

---

## 🔒 Security Posture

- **Strict Route Segregation**: Entire `/dashboard` sub-tree is blocked by middleware unless a valid Better Auth JWT is present.
- **Arcjet Bot Detection**: Actively runs on the `/login` and `/register` layers to prevent credential stuffing and scripted attacks.
- **API Shielding**: Arcjet WAF protects against SQLi, XSS, and overly massive payloads on NextJS endpoints.
- **Database Architecture**: Connects remotely to Neon serverless DB via secure connection pooling, storing no session data in the ML sub-system.

---

## 👥 Team

**Built by Algorithm Avengers**

© 2026 AEGIS AI. All rights reserved.

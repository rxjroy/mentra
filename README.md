# Mentra — AI-Powered Mock Interview & Hiring Preparation Platform

Mentra is an intelligent, full-stack AI mock interview platform built with **Next.js 15**, **TypeScript**, **Tailwind CSS**, and **Multi-Provider LLM Orchestration (Groq Llama 3.3 + Google Gemini)**. It replicates real-world technical and behavioral interview loops with adaptive questioning, multi-dimensional scoring, real-time voice synthesis, and actionable post-interview analytics.

---

## Key Features

- **Multi-Role & Custom JD Parsing**: Paste any job description or select curated roles (Full-Stack, Backend, Frontend, DevOps, ML/AI, Product Management) with automated company and culture extraction.
- **Adaptive AI Interviewer**: Dynamically calibrates question difficulty, probes shallow responses with contextual follow-ups, and detects non-answers/refusals.
- **Real-Time Voice & Speech Engine**: Native browser Web Speech recognition with hands-free audio synthesis and deduplication locks.
- **Multi-Model LLM Gateway**: Ultra-low latency inference powered by Groq LLaMA 3.3 70B Versatile with automatic fallback to Google Gemini 2.5 Flash.
- **Deep Analytics & Readiness Score**: Detailed breakdowns across Technical Mastery, Behavioral Competence, Communication Clarity, and Consistency, coupled with topic-by-topic recommendations.
- **Resume-Tailored Questions**: Upload PDF resumes to cross-reference candidate history against job requirements for personalized interview loops.
- **Enterprise-Grade Security**: 
  - Token bucket rate-limiting across 17 API routes.
  - Multi-tenant data isolation and JWT-based session security.
  - Server-side input sanitization, XSS defense, and prompt-injection neutralization.
  - Production error masking and structured audit logging.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 15 (App Router, Server Components & Route Handlers) |
| **Language** | TypeScript |
| **Styling & UI** | Tailwind CSS, Lucide Icons, Canvas 2D Visualizers, Custom Shaders |
| **Database & ORM** | PostgreSQL / SQLite with Prisma ORM |
| **AI Inference** | Groq SDK (`llama-3.3-70b-versatile`), Google Generative AI (`gemini-2.5-flash`) |
| **Authentication** | Custom Secure JWT Auth, Google OAuth, GitHub OAuth |
| **Email & OTP** | Nodemailer with secure SMTP transport |

---

## Getting Started

### 1. Prerequisites
- Node.js 18.17+ or Node.js 20+
- npm / pnpm / yarn

### 2. Clone the Repository
```bash
git clone https://github.com/rxjroy/mentra.git
cd mentra
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
Copy `.env.example` to `.env.local` and provide your API keys:
```bash
cp .env.example .env.local
```

Fill in the required keys:
```env
# AI Providers
GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEY=your_gemini_api_key

# Security & Auth
JWT_SECRET=your_jwt_secret_at_least_32_chars

# Database (PostgreSQL or local SQLite for development)
DATABASE_URL=postgresql://user:password@localhost:5432/mentra
```

### 5. Initialize Database
```bash
npx prisma generate
npx prisma db push
```

### 6. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure

```
mentra/
├── app/                  # Next.js App Router pages and API routes
│   ├── api/              # Rate-limited backend endpoints (auth, interview, evaluate, feedback)
│   ├── dashboard/        # Candidate dashboard & past sessions
│   ├── interview/        # Real-time interview loop & voice UI
│   ├── results/          # Score reports & performance breakdown
│   └── page.tsx          # Landing page & neural gateway flow
├── components/           # Reusable UI components & custom widgets
├── lib/
│   ├── ai/               # AI provider orchestrator, scoring engine, prompts
│   ├── db/               # Prisma client & data models
│   ├── security/         # Rate limiter, input sanitization, error handlers
│   └── auth.ts           # Token verification & session management
├── prisma/               # Prisma schema & migrations
└── public/               # Static assets & audio effects
```

---

## License

This project is licensed under the [MIT License](LICENSE).

# WealthWise AI — Project Summary

## What It Does

WealthWise AI is a financial decision-making platform that creates a **Digital Twin** — a living, breathing virtual replica of a user's entire financial life. Unlike traditional budgeting apps that only show what you *already spent*, WealthWise AI lets you **simulate what will happen before you spend**.

Users can ask real questions like *"What if I buy a Rs. 2 lakh car?"* or *"What if my salary drops by 30%?"* and receive instant, AI-generated projections showing the exact impact on their savings, emergency fund, health score, and risk level — all calculated from their actual financial data.

The platform features five proprietary AI-powered analysis modules:

- **Ripple Engine** — visualizes the cascading downstream effects of any single financial decision across 1, 6, and 12+ month horizons
- **Parallel Futures** — simulates three alternate futures (buy now, wait, or skip) side-by-side so users can compare outcomes before committing
- **Financial GPS** — plots a step-by-step navigational route from the user's current financial position to their stated goal, recalculating as data changes
- **Time Machine** — rewinds a past financial decision and projects what the user's finances would look like today had they chosen differently
- **Stress Test Radar** — automatically detects vulnerabilities in the user's financial health (low emergency fund, high debt-to-income, category overspending) and assigns severity levels with actionable fixes

An always-available **AI Coach** (powered by Google Gemini with real-time streaming responses) provides personalized financial advice in English, Urdu, and Roman Urdu — referencing the user's actual numbers, never generic tips.

## Who It's For

WealthWise AI is built for the **120 million+ Pakistanis** who have no access to professional financial advisory services. The platform specifically targets:

- **Young professionals (20-35)** making their first major financial decisions — car loans, rent vs. buy, investment choices — without any data-driven guidance
- **Middle-class families** managing tight household budgets where a single wrong decision can have cascading consequences
- **Students and freelancers** with irregular income patterns who need scenario planning more than static budgets
- **Anyone** who has ever asked *"Can I afford this?"* and wanted a real answer based on their real money

The platform is designed ground-up for Pakistan — supporting PKR currency, local banking infrastructure (HBL, UBL, Meezan Bank, EasyPaisa, JazzCash), culturally relevant advice, and full bilingual (English + Urdu) accessibility.

## What We Built

### Architecture
A full-stack web application built with **Next.js 16.3.3** (App Router), **React 19**, and **TypeScript 5**, deployed serverlessly on **Vercel**. The backend runs on **Turso** (distributed SQLite cloud database) with **20 API endpoints** handling authentication, financial calculations, AI interactions, and data management.

### Financial Engine
A custom-built **1,200+ line financial calculation engine** (`financial-engine.ts`) that computes:
- Real-time financial health scores (0-100) across 8 weighted factors
- Liquid balance, emergency reserve, and net worth calculations
- Category-wise spending analysis with trend detection
- Safe-to-spend limits (daily, weekly, monthly)
- Simulation projections with before/after impact analysis
- Goal feasibility scoring with alternative plan generation

### AI Integration
Google Gemini AI integration with a **dual-model fallback architecture**:
- Primary: `gemini-3.8-flash` for all AI features
- Automatic fallback to `gemini-3.5-flash-lite` on 503 errors
- **Streaming responses** via `generateContentStream` for real-time typewriter-effect text display
- Native PDF/image analysis for bank statement parsing (no external libraries)

### Security
Enterprise-grade security stack:
- Cloudflare Turnstile CAPTCHA on all authentication forms
- bcrypt password hashing (10 salt rounds)
- JWT tokens with 7-day expiry in httpOnly cookies
- OTP-based email verification with 10-minute expiry
- Google OAuth via Supabase (no credentials stored in application)

### Key Metrics
| Metric | Value |
|--------|-------|
| Source Files | 95 |
| Lines of Code | ~20,000 |
| API Endpoints | 20 |
| AI Modules | 5 proprietary + 1 streaming coach |
| UI Components | 15 |
| Languages | English + Urdu |
| Database Tables | 7 |
| Pages/Routes | 37 |
| Deployment | Vercel (serverless, global CDN) |

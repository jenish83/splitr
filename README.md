# Splitr 💸

A modern, full-stack expense-sharing app (a Splitwise alternative). Create groups, split bills equally / by percentage / by exact amounts, settle up with a debt-simplifying algorithm, and get AI-powered spending insights and automated payment reminders.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?logo=react)
![Convex](https://img.shields.io/badge/Convex-Backend-orange)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

- **Group Expenses** – organize costs for roommates, trips, or events.
- **Smart Settlements** – minimizes the number of payments needed to settle debts.
- **Multiple Split Types** – split equally, by percentage, or by exact amount.
- **Expense Analytics** – charts and insights into shared spending (Recharts).
- **AI Spending Insights** – powered by Google Gemini.
- **Automated Payment Reminders** – scheduled background jobs via Inngest + email via Resend.
- **Real-time Updates** – live data powered by Convex.
- **Authentication** – secure sign-in/sign-up with Clerk.

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router), React 19 |
| Backend / DB | Convex |
| Auth | Clerk |
| Background jobs | Inngest |
| AI | Google Gemini (`@google/generative-ai`) |
| Email | Resend |
| UI | Tailwind CSS v4, shadcn/ui, Radix UI, lucide-react |
| Forms / Validation | react-hook-form, Zod |
| Charts | Recharts |

## 📦 Prerequisites

- Node.js 18.18+ (Node 20+ recommended)
- A [Convex](https://convex.dev) account
- A [Clerk](https://clerk.com) account
- A [Resend](https://resend.com) account
- A [Google AI Studio](https://aistudio.google.com) API key
- An [Inngest](https://inngest.com) account (for production background jobs)

## 🚀 Getting Started (Local)

1. **Clone & install**

```bash
git clone https://github.com/<your-username>/splitr.git
cd splitr
npm install
```

2. **Set up environment variables** – create a `.env.local` file (see below).

3. **Start Convex** (in one terminal):

```bash
npx convex dev
```

4. **Start the Next.js dev server** (in another terminal):

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 🔑 Environment Variables

Create `.env.local` with the following:

```bash
# Convex
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
CONVEX_DEPLOYMENT=dev:your-deployment

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
CLERK_JWT_ISSUER_DOMAIN=https://your-clerk-subdomain.clerk.accounts.dev

# Google Gemini (AI insights)
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash   # optional

# Resend (email)
RESEND_API_KEY=re_xxx
RESEND_FROM_EMAIL=Splitr <onboarding@resend.dev>   # optional
RESEND_DEV_REDIRECT_TO=you@example.com             # optional, dev only

# Inngest (production background jobs)
INNGEST_SIGNING_KEY=signkey-xxx
INNGEST_EVENT_KEY=xxx
```

> Variables prefixed `NEXT_PUBLIC_` are exposed to the browser.
> `CLERK_JWT_ISSUER_DOMAIN` must also be set in your Convex deployment’s environment variables (Convex dashboard → Settings → Environment Variables) so the Clerk JWT provider works.

## 📁 Project Structure

```
app/
  (auth)/         # Clerk sign-in / sign-up routes
  (main)/         # Dashboard, expenses, groups, contacts, settlements
  api/inngest/    # Inngest serve endpoint
convex/           # Schema, queries, mutations, email, seed
lib/              # Inngest functions, currencies, categories, utils
components/       # Shared UI components
```

## 📜 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Next.js dev server |
| `npx convex dev` | Run Convex locally |
| `npx inngest-cli@latest dev -u http://localhost:3000/api/inngest` | Start inngest server on localhost |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | Run ESLint |
| `npx convex deploy` | Deploy Convex to production |

## 📄 License

MIT
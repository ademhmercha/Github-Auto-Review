# GitHub AutoReview Agent

An AI-powered code audit tool that analyzes any public GitHub repository using 4 specialized agents running in sequence. Built with React + Vite + Tailwind CSS, deployable on Vercel — no backend required.

## Features

- **4 AI agents** run in sequence to produce a full audit report
- **100% free** — powered by Groq API (no credit card required)
- **No backend** — all API calls run directly in the browser
- **Instant deploy** on Vercel

## How it works

```
GitHub Repo URL
      │
      ▼
┌─────────────────┐
│  Explorer Agent │  → Fetches repo structure & key files via GitHub API
└────────┬────────┘
         │
         ▼
┌──────────────────────┐
│  Code Reviewer Agent │  → Finds bugs, warnings, and improvements (Llama 3.3 70B)
└────────┬─────────────┘
         │
         ▼
┌─────────────┐
│   Doc Agent │  → Checks README quality, generates one if missing
└──────┬──────┘
       │
       ▼
┌────────────────┐
│ Reporter Agent │  → Quality score /10, summary, top 3 priorities
└────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS |
| AI Model | Llama 3.3 70B via Groq API |
| Repo Data | GitHub REST API (no auth needed) |
| Deployment | Vercel |

## Getting Started

### Prerequisites

- Node.js 18+
- A free Groq API key from [console.groq.com/keys](https://console.groq.com/keys)

### Installation

```bash
git clone https://github.com/ademhmercha/Github-Auto-Review.git
cd Github-Auto-Review
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Usage

1. Get a free API key from [console.groq.com/keys](https://console.groq.com/keys) — no credit card required
2. Paste your Groq API key and a public GitHub repo URL
3. Click **Analyze Repository**
4. Watch the 4 agents run and view the full report

## Project Structure

```
src/
├── agents/
│   ├── explorerAgent.js    # GitHub API — maps repo structure & reads key files
│   ├── reviewerAgent.js    # Groq AI — returns JSON array of code issues
│   ├── docAgent.js         # Groq AI — generates README if missing/incomplete
│   └── reporterAgent.js    # Groq AI — score, summary, top priorities
├── orchestrator/
│   └── orchestrator.js     # Runs agents in sequence with progress callbacks
├── components/
│   ├── InputForm.jsx        # Screen 1: API key + repo URL input
│   └── ResultsView.jsx      # Screen 2: live agent status + full results
├── lib/
│   └── groq.js             # Fetch wrapper for Groq API calls
└── App.jsx                 # Root component, manages screen state
```

## Deployment

The project includes a `vercel.json` pre-configured for Vite:

```bash
npm run build
vercel
```

Or connect the GitHub repo directly in the [Vercel dashboard](https://vercel.com/new) for automatic deployments on every push.

## Groq Free Tier Limits

| Limit | Value |
|-------|-------|
| Requests / minute | 30 req/min |
| Tokens / minute | 6,000 tokens/min |
| Requests / day | 14,400 req/day |

Each full analysis uses 3 API calls — well within free tier limits for student use.

## License

MIT

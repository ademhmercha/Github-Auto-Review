# GitHub AutoReview Agent

An AI-powered code audit tool that analyzes any public GitHub repository using 5 specialized agents running in sequence. Built with React + Vite + Tailwind CSS, deployable on Vercel — no backend required.

## Features

- **5 AI agents** run in sequence to produce a full audit report
- **100% free** — powered by Groq API (no credit card required)
- **No backend** — all API calls run directly in the browser
- **Export to PDF** — download the full report in one click
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
│  Code Reviewer Agent │  → Finds bugs, warnings, and improvements
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
└───────┬────────┘
        │
        ▼
┌────────────────┐
│ Refactor Agent │  → Before/after code transformation suggestions
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
4. Watch the 5 agents run and view the full report
5. Click **Export PDF** to download the report

## Project Structure

```
src/
├── agents/
│   ├── explorerAgent.js    # GitHub API — maps repo structure & reads key files
│   ├── reviewerAgent.js    # Groq AI — returns JSON array of code issues
│   ├── docAgent.js         # Groq AI — generates README if missing/incomplete
│   ├── reporterAgent.js    # Groq AI — score, summary, top priorities
│   └── refactorAgent.js    # Groq AI — before/after code transformation suggestions
├── orchestrator/
│   └── orchestrator.js     # Runs agents in sequence with progress callbacks
├── components/
│   ├── InputForm.jsx        # Screen 1: API key + repo URL input
│   └── ResultsView.jsx      # Screen 2: live agent status + full results + PDF export
├── lib/
│   └── groq.js             # Fetch wrapper for Groq API calls
└── App.jsx                 # Root component, manages screen state
```

## Agent Details

### 1. Explorer Agent
Fetches the repo file tree via GitHub REST API (no auth required). Reads up to 5 key source files (`package.json`, `README.md`, entry points). Detects framework and language automatically.

### 2. Code Reviewer Agent
Sends the key files to Llama 3.3 70B and gets back a structured list of issues, each with a severity level (`critical`, `warning`, `info`), the affected file, and a description.

### 3. Doc Agent
Checks if the README exists and has meaningful content (≥ 100 characters). If not, generates a complete README with title, description, installation, usage, and tech stack sections. If the README exists, displays it in the report.

### 4. Reporter Agent
Synthesizes all previous outputs into a final audit report: a quality score out of 10, a 2–3 sentence summary, and a prioritized list of the top 3 things to fix.

### 5. Refactor Agent
Analyzes the code and suggests up to 4 concrete refactoring transformations. Each suggestion shows a **before** and **after** code snippet, the affected file, and the reason for the change.

## Export to PDF

Once the analysis is complete, click the **Export PDF** button in the top-right corner. The browser print dialog opens — select **"Save as PDF"**. The PDF is clean and print-optimized: white background, dark text, navigation elements hidden.

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

Each full analysis uses 4 API calls (Reviewer + Doc + Reporter + Refactor) — well within free tier limits for student use.

## License

MIT

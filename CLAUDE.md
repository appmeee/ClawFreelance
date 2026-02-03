# ClawFreelance

Decentralized freelancing platform where AI agents are first-class workers. Agents browse tasks, claim bounties, submit PRs, and earn crypto rewards—building verifiable reputation along the way. Built for the OpenClaw ecosystem, secured by design, open source forever.

**Tagline:** "Where AI agents find work and build reputation"

## Architecture Overview

**Agent-first marketplace.** AI agents autonomously discover, claim, and complete work from open source projects, bounties, and direct task postings. Agents are first-class citizens—they find work, build reputation, and get paid in cryptocurrency.

### Key Actors

- **Agents** - OpenClaw agents (local or cloud-hosted) that perform work
- **Project Owners** - Humans or organizations posting tasks/bounties
- **The Platform** - Central registry for discovery, task aggregation, and reputation tracking

## Project Structure

```
ClawFreelance/
├── src/
│   ├── app/                  # Next.js 16 App Router pages
│   │   ├── api/              # API routes (discover, health, tasks, agents)
│   │   ├── agents/           # Agent directory page
│   │   ├── bounties/         # Bounties listing page
│   │   ├── docs/             # Documentation pages
│   │   ├── leaderboard/      # Top agents ranking
│   │   ├── register-agent/   # Agent registration form
│   │   ├── post-task/        # Task creation form
│   │   ├── tasks/            # Task listing and details
│   │   └── (legal pages)     # privacy, terms, license, security, etc.
│   ├── components/
│   │   ├── icons/            # Centralized icon library
│   │   ├── layout/           # Header, Footer
│   │   └── home/             # Landing page sections
│   ├── db/                   # Drizzle ORM schema
│   └── lib/                  # Utilities (security, validation)
├── docs/
│   └── plans/                # Design documents
└── public/                   # Static assets
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router), React 19 |
| Styling | Tailwind CSS 4 |
| Database | PostgreSQL via Supabase |
| ORM | Drizzle ORM |
| Validation | Zod |
| Testing | Vitest |
| Package Manager | Bun |
| Hosting | Vercel |
| License | GNU AGPL v3 |

## Key Features

### Agent Discovery API

Agents can programmatically discover the platform via `/api/v1/discover`:
- Platform info and version
- All available endpoints
- Supported capabilities
- Authentication methods
- CLI installation instructions

### Security Hardening

> **Critical Priority:** Security is non-negotiable. Other OpenClaw ecosystem projects have faced vulnerability attacks.

- API key hashing with SHA-256
- Timing-safe comparison for auth
- Rate limiting per API key
- Input validation via Zod
- Audit logging for all actions
- Dependency scanning with Trivy

### Reputation System

| Signal | Description |
|--------|-------------|
| Tasks completed | Successful deliveries |
| Verification method | PR merged > manual approval |
| Task difficulty | Harder tasks = more rep |
| Time to completion | Tracked but not weighted heavily |
| Disputes/failures | Negative impact on reputation |

## API Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | /api/v1/discover | Platform discovery for agents | No |
| GET | /api/health | Health check | No |
| GET | /api/v1/tasks | List tasks with filters | No |
| POST | /api/v1/tasks | Create a task | Yes |
| GET | /api/v1/tasks/{id} | Task details | No |
| POST | /api/v1/tasks/{id}/claim | Claim a task | Yes |
| POST | /api/v1/tasks/{id}/submit | Submit work | Yes |
| POST | /api/v1/agents/register | Register agent | No |
| GET | /api/v1/agents/{id} | Agent details | No |
| GET | /api/v1/agents/{id}/reputation | Reputation history | No |

## Common Commands

**IMPORTANT: Always use `bun` commands, never `pnpm` or `npm`. This project uses Bun as the package manager.**

```bash
bun dev                      # Run dev server
bun build                    # Production build
bun test                     # Run Vitest tests
bun test:run                 # Run tests once (no watch)
bun lint                     # ESLint
bun install                  # Install dependencies
```

### Database (Drizzle)

```bash
bun db:generate              # Generate migrations
bun db:push                  # Push schema to database
bun db:studio                # Open Drizzle Studio
```

## Key Files

| File | Purpose |
|------|---------|
| `src/db/schema.ts` | Drizzle ORM database schema |
| `src/lib/security.ts` | Rate limiting, API keys, sanitization |
| `src/app/api/discover/route.ts` | Agent discovery endpoint |
| `src/app/api/tasks/route.ts` | Task CRUD API |
| `src/app/api/agents/register/route.ts` | Agent registration |
| `src/components/icons/index.tsx` | Centralized icon library |
| `docs/plans/2025-02-01-clawfreelance-design.md` | Full design document |

## Git Rules

**Workflow for code changes:**
1. Create feature branch (`feature/`, `fix/`, `chore/`, `refactor/`)
2. Make changes
3. Run tests: `bun test`
4. Create PR

**Commit messages:**
- Use imperative mood, concise messages
- Do NOT add `Co-Authored-By` lines unless explicitly requested
- Use `[skip ci]` for docs-only changes

**Branch protection:**
- Do NOT commit directly to main
- Do NOT force push to main

## Sensitive Data Rules

**NEVER commit:**
- API keys, tokens, passwords
- Database credentials
- IP addresses, server hostnames

**NEVER display in output:**
- Private keys, API keys, tokens, passwords
- Database connection strings with credentials
- Any content from `.env.local` or environment files
- Mask or omit sensitive values when showing file contents

Keep all sensitive info in environment variables. `.env.local` is gitignored.

## Code Style

- TypeScript strict mode always
- Prefer functional patterns over classes
- Use early returns to reduce nesting
- Meaningful variable names over comments
- No `any` types - use `unknown` with type guards
- Keep functions small and focused

## Design System

### Colors (CSS Variables)

- `--accent-cyan`: #00F5D4 (primary actions, links)
- `--accent-amber`: #FFB800 (rewards, highlights)
- `--bg-primary`: #0A0A0F (page background)
- `--bg-card`: #12121A (card backgrounds)
- `--status-success`: #10B981 (success states)
- `--status-error`: #EF4444 (error states)

### Typography

- **Display:** Plus Jakarta Sans
- **Mono:** JetBrains Mono

## Parallel Development Workflow

### Git Worktrees for Task Isolation

Use git worktrees to work on multiple independent tasks in parallel without branch conflicts:

```bash
# Create worktree for a feature
git worktree add ../clawfreelance-feature-name feature/feature-name

# List active worktrees
git worktree list

# Remove worktree when done
git worktree remove ../clawfreelance-feature-name
```

### Spawning Parallel Agents

When working on multiple unrelated issues:

1. **Identify independent tasks** - Tasks that don't touch the same files
2. **Create worktrees** - One per task to avoid conflicts
3. **Spawn agents in parallel** - Use Task tool with multiple invocations in single message
4. **Review and merge** - Each task creates its own PR

**Example independent task groups:**
- API changes (backend) vs UI changes (frontend)
- Different page implementations
- Test coverage vs documentation
- i18n translations vs database migrations

**Avoid parallel work on:**
- Tasks touching the same components
- Dependent features (A requires B to be done first)
- Schema changes that affect multiple areas

### Agent Best Practices

- Always specify the worktree path when spawning agents
- Use `run_in_background: true` for long-running tasks
- Check agent output files for progress
- Coordinate merges to avoid conflicts

## Skills and Agents

- Always use relevant skills when available
- Run parallel agents when tasks are independent
- Use `frontend-design` skill for UI work
- Create new skills for specialized tasks

## After /compact

When context is compacted:
1. Read `CLAUDE.md` to restore project rules
2. Reference design doc for architecture decisions

## Troubleshooting

### Port 3000 in use

```bash
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill
```

### Type errors

```bash
bun run build  # Will show all type errors
```

### Database issues

```bash
bun db:push    # Sync schema with database
```

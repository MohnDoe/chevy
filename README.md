# Chevy

> A Discord bot companion for [Hevy](https://hevy.app) — link your fitness account, share workouts, and bring gym motivation to your server.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-24+-green)](https://nodejs.org)
[![Discord.js](https://img.shields.io/badge/discord.js-14.23.2-blue)](https://discord.js.org)

## Features

- **🔗 Account Linking** — Link your Hevy fitness profile to your Discord account through a secure verification flow.
- **🏋️ Workout Sharing** — View, browse, and share your workouts directly in Discord with rich embeds showing exercises, sets, volume, and personal records.
- **📢 Auto-Share** — Server admins configure a channel where verified members' latest workouts are automatically posted when they complete them.
- **🔒 Private Profile Support** — Members with private Hevy profiles can still participate via a follow-and-verify flow that sends instructions through DMs.
- **📊 Analytics** — Usage tracked via PostHog for understanding feature adoption and bot health.

## Architecture

```
chevy/
├── apps/
│   ├── bot/                    # Discord bot (CommandKit framework)
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── commands/   # Slash commands (hevy, workout, auto-share, server)
│   │   │   │   ├── events/     # Discord gateway events (ready, guildCreate, guildDelete)
│   │   │   │   └── tasks/      # Scheduled tasks (autoShare, verification)
│   │   │   ├── config/         # Task schedules, verification config, live activity
│   │   │   └── features/       # Feature modules
│   │   │       ├── autoShare/  # Auto-share logic, embeds, types
│   │   │       ├── core/       # User & server management, utilities
│   │   │       ├── discord/    # Discord interaction helpers, error handling
│   │   │       ├── hevy/       # Hevy API client, parsing, verification flow
│   │   │       ├── workout/    # Workout embeds, formatting, sharing
│   │   │       └── liveActivity/ # Discord live activity webhooks
│   │   └── tasks.db            # SQLite task queue (BullMQ driver)
│   └── react-admin/            # In-progress admin dashboard
├── packages/
│   └── database/               # Shared Prisma schema & client (@repo/db)
│       ├── prisma/
│       │   ├── schema.prisma   # Database schema
│       │   └── migrations/     # Migration history
│       └── src/
│           ├── client.ts       # Prisma client instance
│           └── index.ts        # Re-exports (client + generated types)
├── .github/workflows/          # CI/CD pipelines
│   ├── deploy.yml              # Production Docker build
│   ├── deploy-staging.yml      # Staging deployment
│   └── preview.yml             # PR preview (Neon DB branch + Docker image)
├── compose.prod.yml            # Docker Compose for production
├── compose.staging.yml         # Docker Compose for staging
├── compose.local.yml           # Docker Compose for local dev
├── Dockerfile.bot              # Multi-stage Docker build for the bot
├── turbo.json                  # Turborepo configuration
└── package.json                # Root workspace manifest
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Runtime** | Node.js 24, TypeScript |
| **Monorepo** | npm workspaces + Turborepo |
| **Discord** | discord.js v14, CommandKit |
| **Database** | PostgreSQL (Neon), Prisma ORM |
| **Task Queue** | BullMQ (SQLite driver, Redis available) |
| **Caching** | @commandkit/cache (in-memory, tag-based) |
| **Analytics** | PostHog (@commandkit/analytics) |
| **Deployment** | Docker, Docker Hub, GitHub Actions |
| **Preview DBs** | Neon (branch-per-PR) |

## Getting Started

### Prerequisites

- Node.js 24+
- PostgreSQL database (or use Neon's free tier)
- A [Discord Bot](https://discordjs.guide/preparations/setting-up-a-bot-application.html) with the required intents
- A [Hevy API](https://docs.hevyapp.com) auth token
- (Optional) PostHog project for analytics

### Installation

```bash
# Clone the repository
git clone https://github.com/<your-org>/chevy.git
cd chevy

# Install dependencies
npm install
```

### Environment Setup

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

| Variable | Description |
|----------|-------------|
| `DISCORD_TOKEN` | Your Discord bot token |
| `BOT_ON_HEVY_AUTH_TOKEN` | Hevy API auth token for the bot account |
| `DATABASE_URL` | PostgreSQL connection string (without pooler) |
| `DIRECT_URL` | PostgreSQL direct connection string |
| `POSTHOG_API_KEY` | PostHog API key (optional) |
| `POSTHOG_HOST` | PostHog host URL (optional) |
| `CHEVY_LIVE_ACTIVITY_WEBHOOK_URL` | Discord webhook for live activity (optional) |
| `CHEVY_AUTO_SHARE_TASK_SCHEDULE` | Cron schedule for auto-share task |
| `CHEVY_VERIFICATION_TASK_SCHEDULE` | Cron schedule for verification task |
| `CHEVY_VERIFICATION_CODE_LENGTH` | Length of verification codes (default: 6) |
| `CHEVY_VERIFICATION_WORKOUT_SHORT_ID` | Short ID of the verification workout on Hevy |

### Database Setup

```bash
# Generate Prisma client
npm run generate

# Run migrations (development)
npm run db:migrate:dev

# Or push schema directly (no migration history)
npm run db:push

# Seed the database
npm run db:seed
```

### Development

```bash
# Start all packages in development mode
npm run dev

# Start only the bot
npm run bot:dev
```

### Building

```bash
# Build all packages
npm run build
```

## Commands

### User Commands

| Command | Description |
|---------|-------------|
| `/hevy link <username>` | Link your Hevy account to Discord |
| `/hevy unlink` | Unlink your Hevy account |
| `/workout latest` | Share your most recent workout |
| `/workout recent` | Browse and share from your recent workouts |
| `/workout url <url>` | Share a workout from a Hevy URL |
| `/auto-share enable here` | Enable auto-share on this server |
| `/auto-share disable here` | Disable auto-share on this server |
| `/auto-share status` | View your auto-share status across servers |

### Server Admin Commands

| Command | Description |
|---------|-------------|
| `/server auto-share configure` | Configure auto-share channel and format |
| `/server auto-share info` | View auto-share configuration and stats |

### Verification Flow

1. User runs `/hevy link <hevy-username>`
2. Bot generates a unique verification code
3. User posts the code as a comment on a specific Hevy workout
4. Background task detects the comment and verifies the account
5. Bot sends a confirmation DM (or instructions for private profiles)

## Auto-Share

Server admins can enable auto-share to automatically post members' workouts to a designated channel. The flow:

1. Admin runs `/server auto-share configure` to pick a channel and format (compact, standard, or line)
2. Verified members run `/auto-share enable here` to opt in
3. The auto-share task polls Hevy for each member's latest workout every N minutes
4. New workouts are posted to the configured channel with rich workout cards

Workout cards display:
- Workout name and duration
- Total volume (kg) and set count
- Personal records achieved
- Exercise list with sets, reps, and weight
- Exercise notes and superset indicators
- Link back to the Hevy workout

## Task System

Chevy uses CommandKit's task system (backed by BullMQ) for scheduled operations:

- **`autoShare`** — Polls verified users' latest workouts and auto-shares them to configured servers
- **`verification`** — Checks pending verifications against Hevy workout comments and processes them

Tasks are stored in `tasks.db` (SQLite by default). Redis support is available via BullMQ for production-scale deployments.

## Deployment

### Docker

```bash
# Build the image
docker build -f Dockerfile.bot -t mohndoe/chevy-bot:latest .

# Run with Docker Compose
docker compose -f compose.prod.yml up -d
```

### CI/CD

- **`main` branch** → Builds and pushes `mohndoe/chevy-bot:latest` to Docker Hub
- **Pull requests** → Creates a Neon DB branch, runs migrations, builds a preview Docker image (`mohndoe/chevy-bot:pr-<number>-<branch>`)
- **Staging** → Separate deployment pipeline

### Environments

| Environment | Docker Compose | Description |
|-------------|---------------|-------------|
| Local | `compose.local.yml` | Local development with Redis |
| Staging | `compose.staging.yml` | Staging deployment |
| Production | `compose.prod.yml` | Production deployment |

## Database Schema

```
User ──┬── HevyVerification (1:1)
       ├── Shares (1:N)
       └── Workouts (1:N)

Server ──┬── ServerAutoShareConfig (1:1)
         └── UserAutoShareConfig (1:N) ← composite key (userId, guildId)

Workout ── Shares (1:N)

Share ── Workout (N:1)
        └── User? (N:1, nullable for bot shares)
```

### Key Models

- **User** — Discord identity with linked Hevy verification
- **HevyVerification** — Verification state, Hevy username, profile privacy flag
- **Workout** — Cached Hevy workout data (id, shortId, createdAt)
- **Server** — Discord guild with auto-share configuration
- **ServerAutoShareConfig** — Server-level auto-share settings (enabled, channel, format)
- **UserAutoShareConfig** — Per-user auto-share opt-in per server
- **Share** — Record of each workout share (command or auto), with format and reason

## Privacy & Terms

See [PRIVACY.md](./PRIVACY.md) and [TERMS.md](./TERMS.md) for full policies.

Chevy collects only:
- Discord User ID
- Hevy username (after linking)
- Command usage logs

No message content is read or stored. Data deletion requests can be sent to chevy@doe.cool.

## License

[MIT](./LICENSE) — Copyright (c) 2025 MohnDoe

# Contributing Guide

> Auto-generated from package.json and .env.local.example

## Development Workflow

### Prerequisites

- Node.js 20+
- npm
- Supabase CLI (installed via devDependencies)
- Playwright (for E2E testing)

### Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy environment variables:
   ```bash
   cp .env.local.example .env.local
   ```
4. Configure environment variables (see [Environment Setup](#environment-setup))
5. Start the development server:
   ```bash
   npm run dev
   ```

## Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `next dev` | Start Next.js development server with hot reload |
| `build` | `next build` | Create production build |
| `start` | `next start` | Start production server |
| `lint` | `eslint` | Run ESLint for code quality checks |
| `test:e2e` | `playwright test` | Run end-to-end tests in headless mode |
| `test:e2e:ui` | `playwright test --ui` | Run E2E tests with Playwright UI mode |
| `test:e2e:headed` | `playwright test --headed` | Run E2E tests in headed browser mode |
| `test:e2e:debug` | `playwright test --debug` | Run E2E tests in debug mode |
| `test:e2e:report` | `playwright show-report` | View the last E2E test report |

## Environment Setup

### Required Environment Variables

#### Supabase
| Variable | Type | Description |
|----------|------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret | Supabase service role key for server-side operations |

#### LINE LIFF
| Variable | Type | Description |
|----------|------|-------------|
| `NEXT_PUBLIC_LIFF_ID` | Public | LINE LIFF application ID |
| `LINE_CHANNEL_ID` | Secret | LINE channel ID for OAuth |
| `LINE_CHANNEL_SECRET` | Secret | LINE channel secret for OAuth |

#### Stripe
| Variable | Type | Description |
|----------|------|-------------|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Public | Stripe publishable key for client-side |
| `STRIPE_SECRET_KEY` | Secret | Stripe secret key for server-side |
| `STRIPE_WEBHOOK_SECRET` | Secret | Stripe webhook signing secret |
| `STRIPE_PRICE_ID` | Secret | Stripe subscription price ID |

#### App Configuration
| Variable | Type | Description |
|----------|------|-------------|
| `NEXT_PUBLIC_APP_URL` | Public | Application base URL (e.g., `http://localhost:3000`) |

## Testing Procedures

### End-to-End Testing

This project uses Playwright for E2E testing.

#### Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI mode (interactive)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Debug mode
npm run test:e2e:debug
```

#### Viewing Reports

```bash
npm run test:e2e:report
```

### Linting

```bash
npm run lint
```

## Tech Stack

- **Framework**: Next.js 15.5.9
- **React**: 19.1.0
- **Database**: Supabase
- **Payments**: Stripe
- **Auth**: LINE LIFF
- **Styling**: Tailwind CSS 4
- **State Management**: Zustand
- **Animation**: Framer Motion
- **Testing**: Playwright

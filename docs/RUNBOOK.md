# Operations Runbook

> Auto-generated from package.json and .env.local.example

## Deployment Procedures

### Prerequisites

- All environment variables configured in production environment
- Supabase project set up with migrations applied
- Stripe webhooks configured for production URL
- LINE LIFF app configured with production callback URL

### Build & Deploy

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Verify build success**
   - Check for TypeScript errors
   - Check for ESLint errors: `npm run lint`

3. **Deploy to hosting platform**
   - Vercel (recommended for Next.js)
   - Or any Node.js hosting with `npm run start`

### Environment Configuration

Ensure all production environment variables are set:

| Variable | Where Used | Critical |
|----------|-----------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Client & Server | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Yes |
| `NEXT_PUBLIC_LIFF_ID` | Client | Yes |
| `LINE_CHANNEL_ID` | Server | Yes |
| `LINE_CHANNEL_SECRET` | Server | Yes |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Client | Yes |
| `STRIPE_SECRET_KEY` | Server | Yes |
| `STRIPE_WEBHOOK_SECRET` | Server | Yes |
| `STRIPE_PRICE_ID` | Server | Yes |
| `NEXT_PUBLIC_APP_URL` | Client & Server | Yes |

### Post-Deployment Verification

1. Verify LINE login flow works
2. Verify Stripe checkout creates sessions
3. Verify Stripe webhooks are received
4. Check Supabase connection

## Monitoring and Alerts

### Key Endpoints to Monitor

| Endpoint | Purpose | Expected Response |
|----------|---------|-------------------|
| `/` | Homepage | 200 OK |
| `/api/auth/line` | LINE OAuth initiation | 302 Redirect |
| `/api/auth/callback` | OAuth callback | 302 Redirect |
| `/api/stripe/create-checkout` | Checkout session | 200 JSON |
| `/api/webhooks/stripe` | Stripe webhooks | 200 OK |

### External Service Health

- **Supabase**: Check dashboard for database health
- **Stripe**: Monitor webhook delivery in Stripe dashboard
- **LINE**: Check LIFF app status in LINE Developers console

### Log Locations

- **Vercel**: Vercel dashboard > Project > Logs
- **Supabase**: Supabase dashboard > Logs
- **Stripe**: Stripe dashboard > Developers > Webhooks

## Common Issues and Fixes

### Authentication Issues

#### LINE Login Fails
- **Symptom**: Redirect loop or error on callback
- **Check**:
  - `LINE_CHANNEL_ID` and `LINE_CHANNEL_SECRET` are correct
  - Callback URL in LINE console matches `NEXT_PUBLIC_APP_URL/api/auth/callback`
  - LIFF ID is correct

#### Session Not Persisting
- **Symptom**: User logged out after navigation
- **Check**:
  - Supabase cookies are being set correctly
  - `NEXT_PUBLIC_SUPABASE_URL` and keys are correct

### Payment Issues

#### Stripe Checkout Not Creating
- **Symptom**: 500 error on checkout
- **Check**:
  - `STRIPE_SECRET_KEY` is valid
  - `STRIPE_PRICE_ID` exists and is active

#### Webhooks Not Processing
- **Symptom**: Payments succeed but app doesn't update
- **Check**:
  - `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard
  - Webhook endpoint is publicly accessible
  - Webhook events are enabled in Stripe

### Database Issues

#### Supabase Connection Errors
- **Symptom**: 500 errors on API routes
- **Check**:
  - `NEXT_PUBLIC_SUPABASE_URL` is correct
  - `SUPABASE_SERVICE_ROLE_KEY` has correct permissions
  - Database is not paused (free tier)

## Rollback Procedures

### Quick Rollback

1. **Vercel**: Use instant rollback to previous deployment
   ```
   Vercel Dashboard > Deployments > Previous > Promote to Production
   ```

2. **Other platforms**: Redeploy previous git commit
   ```bash
   git revert HEAD
   git push origin main
   ```

### Database Rollback

⚠️ **Caution**: Database rollbacks may cause data loss

1. Check Supabase migration history
2. If needed, apply reverse migration
3. Coordinate with application rollback

### Environment Variable Changes

If rolling back due to env var issues:
1. Revert to known-good values
2. Redeploy application (env vars require new deployment)

## Maintenance Tasks

### Regular Checks

- [ ] Review Stripe webhook delivery success rate
- [ ] Check Supabase database usage
- [ ] Monitor error rates in logs
- [ ] Verify SSL certificates are valid

### Supabase Maintenance

```bash
# Check migration status
npx supabase migration list

# Apply pending migrations
npx supabase db push
```

### Dependency Updates

```bash
# Check for updates
npm outdated

# Update dependencies
npm update

# Run tests after updates
npm run test:e2e
```

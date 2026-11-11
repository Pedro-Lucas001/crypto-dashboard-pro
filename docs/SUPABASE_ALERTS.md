# CryptoOps — Supabase persistent alerts

## Deployment status

This PR contains application, database and worker implementation only. Nothing
has been deployed to a hosted Supabase database. The only connected project is
**Planeta-Lanches**; do not apply these files to it. Create a dedicated CryptoOps
Supabase project first.

## Architecture

1. React/Vite authenticates with Supabase Auth email/password REST endpoints.
   Browser requests use only the public publishable key plus user access token.
2. Favorites and alerts persist in Postgres. RLS isolates records by auth.uid();
   column-level grants prevent user clients from forging alert triggers.
3. Supabase Cron (pg_cron) calls the server-only Edge Function through pg_net.
   A secret stored in Supabase Vault authenticates the request.
4. The worker checks CoinGecko market prices every minute. A successful
   threshold match changes a one-shot alert from active to inactive; a
   database trigger inserts the notification in the *same transaction*.
5. Inbox notifications persist even with the dashboard closed. Optional Resend
   email is opted in per alert; send attempts are recorded and retried with
   an idempotency key based on the notification UUID.

Operational limits: the worker scans up to 1,000 active alerts per invocation,
chunks market API requests in groups of 50 coin IDs and retries up to 40 emails
per invocation. At larger scale, add cursor-based job partitioning. Market
data, email delivery and scheduling are subject to provider availability.

## 1 — Provision and configure Supabase

Create a NEW project named CryptoOps. Enable the Email provider in Supabase Auth
and configure redirect URLs, email confirmations and production SMTP.

In the React app directory, copy .env.example to .env.local, and set:

    VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
    VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLIC_PUBLISHABLE_KEY

Never put privileged keys in VITE_ variables or in GitHub.

## 2 — Database migration

Apply this committed migration to the CryptoOps project:

    supabase/migrations/20261111160000_cryptoops_alerts.sql

It creates crypto_favorites, price_alerts and price_notifications with RLS,
per-user policies, restricted write grants, indexes and the atomic server-side
notification trigger. The migration is intentionally not applied remotely.

Verify all three new public tables have RLS enabled:

    select tablename, rowsecurity
    from pg_tables where schemaname = 'public'
    and tablename in ('crypto_favorites','price_alerts','price_notifications');

Confirm rowsecurity is true for all. Use two test accounts to verify cross-user
reads/writes fail and clients cannot insert notifications or update triggered_at.

If the project's Data API has been disabled for public tables, configure it in
the dashboard. Table privileges and RLS are both required.

## 3 — Deploy the worker

Deploy the local function at:

    supabase/functions/crypto-price-worker/index.ts

Function name: crypto-price-worker. The config in supabase/config.toml sets
verify_jwt = false because the endpoint uses a separate machine-to-machine
secret. The worker enforces POST and validates Authorization itself.

Configure these Edge Function secrets on the NEW project:

    CRYPTOOPS_CRON_SECRET=<random-32-byte-or-longer-secret>
    SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
    SUPABASE_SERVICE_ROLE_KEY=<server-side-service-role-key>

Generate a long random secret locally, for example using openssl rand -hex 32.
Hosted Supabase may supply the URL and service-role key automatically; verify.

Optional email delivery requires a verified domain and these extra secrets:

    RESEND_API_KEY=<secret-from-Resend>
    CRYPTOOPS_FROM_EMAIL=alerts@your-verified-domain.example

Without Resend configuration, users still receive durable in-app notifications.
Opted-in email deliveries remain pending until the provider is configured.

## 4 — Enable the scheduled job

In the NEW CryptoOps project enable the pg_cron and pg_net database extensions.
In the SQL Editor, store your values in Supabase Vault:

    select vault.create_secret(
      'https://YOUR_PROJECT_REF.supabase.co', 'cryptoops_project_url');
    select vault.create_secret(
      'SAME_RANDOM_SECRET_AS_CRYPTOOPS_CRON_SECRET', 'cryptoops_cron_secret');

Then schedule one POST per minute. Never commit the actual secret values:

    select cron.schedule(
      'cryptoops-check-prices',
      '* * * * *',
      $cron$
      select net.http_post(
        url := (select decrypted_secret
          from vault.decrypted_secrets
          where name = 'cryptoops_project_url')
          || '/functions/v1/crypto-price-worker',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || (
            select decrypted_secret from vault.decrypted_secrets
            where name = 'cryptoops_cron_secret'
          )
        ),
        body := '{}'::jsonb
      );
      $cron$
    );

Check job status in the Cron dashboard, cron.job_run_details and Edge Function
logs. To stop alert checks:

    select cron.unschedule('cryptoops-check-prices');

**Do not execute these SQL commands in Planeta-Lanches.**

## 5 — Validate locally

From the application subdirectory:

    cd crypto-dashboard-pro
    npm ci
    npm run lint
    npm run build
    npm run dev

Review and test the end-to-end workflow:

- Sign up, confirm email (if required) and sign in.
- Favorite a coin, refresh the page and verify it persists.
- Create alert thresholds above and below a displayed market price.
- Reopen the browser to verify favorites, alert settings and account state.
- Use a second account to check RLS isolation.
- Start the scheduled worker with a test threshold already crossed. Check
  that one matching alert is inactive and exactly one inbox event exists.
- Run the worker again: no duplicate notification should be inserted.
- If email configured, verify delivery state and Resend logs.
- Mark notifications as read, pause/reactivate/delete alerts, then sign out.
- Review Supabase Security Advisor notices before releasing.

Price polling occurs on the server even while the browser is closed only after
the worker, Vault secrets and Cron job are deployed and activated. The in-app
inbox refreshes while the user has the account view open (about every 45 s).
No Web Push implementation is included. Prices are indicative; this software
does not place trades or guarantee execution at a threshold.

Browser session handling uses documented Supabase Auth and PostgREST HTTP APIs
without a new npm dependency, preserving the project's existing lockfile.
Consider switching to the official supabase-js SDK and adding MFA before
public production launch.

## Documentation

- https://supabase.com/docs/guides/auth/quickstarts/react
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/functions/schedule-functions
- https://supabase.com/docs/guides/functions/auth
- https://supabase.com/docs/guides/functions/examples/send-emails
- https://resend.com/docs/dashboard/emails/idempotency-keys

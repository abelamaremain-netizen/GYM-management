# Oxygen Gym management

## Run locally

1. Install Node.js 20 or newer.
2. Run `npm install` and then `npm run dev`.
3. Open the local URL printed by Next.js. Without Supabase keys, the app runs in demo mode and stores changes in this browser.

## Connect Supabase PostgreSQL

1. Create a Supabase project.
2. Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from the project API settings.
3. Run `supabase/schema.sql` in the Supabase SQL editor. It creates the PostgreSQL tables used by the app.
4. Restart the Next.js dev server.

Member registration, trainers, payments, attendance, and workout plans connect to Supabase. Membership packages and CSV reports use the app's configured plans and report views.

## Production security

The starter SQL policy grants the public anon key access to tables so this single-location demo can connect without a login screen. Do not use these policies with real member or payment records. Add Supabase Auth and role-aware RLS policies before production. Never expose a Supabase service-role key in a `NEXT_PUBLIC_` variable.
# Good Human Branding

Erin Maxson's portfolio and umbrella site for Confluence Creative Co., The Little Wild Library, Every Pet Matters, and Desk Pets — the "national park" design.

## What's here

- `index.html`: the home page (no build step)
- `contact.html`: the "trail register" contact page, served at `/contact`
- `contact.js`: sends contact form messages to Supabase. Until Supabase is set up, it opens the visitor's email app with the message filled in
- `config.js`: Supabase project URL and anon key (empty until Supabase is connected)
- `supabase/contact_messages.sql`: creates the `contact_messages` table (visitors can submit messages but can't read them)
- `favicon.svg`: the rubber duck browser-tab icon
- `vercel.json`: Vercel settings (clean URLs, basic security headers)

## Deploying on Vercel

1. In Vercel, choose **Add New → Project** and import this GitHub repo.
2. Framework preset: **Other**. Leave the build command and output directory empty.
3. Deploy. Every push to `main` redeploys automatically.

## Supabase (contact form)

1. Create a Supabase project.
2. In **SQL Editor**, run `supabase/contact_messages.sql`.
3. From **Project Settings → API**, copy the project URL and the `anon` public key into `config.js`, then push.
4. New messages show up in **Table Editor → contact_messages**.

## Editing

The design lives in Claude Design ("Good Human Branding Website", artboard "Home page · national park"). Changes made there get re-exported into `index.html`.

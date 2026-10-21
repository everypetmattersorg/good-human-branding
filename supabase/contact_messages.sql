-- Contact form ("trail register") messages for the Good Human Branding site.
-- Run once in Supabase: SQL Editor → New query → paste → Run.

create table if not exists public.contact_messages (
  id           bigint generated always as identity primary key,
  created_at   timestamptz not null default now(),
  name         text not null check (char_length(name) between 1 and 200),
  email        text not null check (char_length(email) between 3 and 320 and email like '%@%'),
  organization text check (organization is null or char_length(organization) <= 200),
  topic        text check (topic is null or char_length(topic) <= 100),
  message      text not null check (char_length(message) between 1 and 5000),
  page         text check (page is null or char_length(page) <= 200)
);

alter table public.contact_messages enable row level security;

-- Visitors (anon) may submit messages, but can never read, edit, or delete them.
drop policy if exists "anyone can submit a contact message" on public.contact_messages;
create policy "anyone can submit a contact message"
  on public.contact_messages
  for insert
  to anon
  with check (true);

grant insert on public.contact_messages to anon;
revoke select, update, delete on public.contact_messages from anon;

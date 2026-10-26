-- Email Erin about every new trail register message.
-- Already applied to the confluence-creative-co Supabase project.
-- Needs the notify-contact-message Edge Function and a RESEND_API_KEY secret.

create extension if not exists pg_net with schema extensions;

alter table public.contact_messages add column if not exists notified_at timestamptz;

create or replace function public.notify_contact_message()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform net.http_post(
    url := 'https://dwwzwgzodwddgfomdzyn.supabase.co/functions/v1/notify-contact-message',
    body := jsonb_build_object('id', new.id),
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  return new;
exception when others then
  -- never block a visitor's message because the email step failed
  raise warning 'notify_contact_message failed: %', sqlerrm;
  return new;
end;
$$;

revoke all on function public.notify_contact_message() from public, anon, authenticated;

drop trigger if exists contact_messages_notify on public.contact_messages;
create trigger contact_messages_notify
  after insert on public.contact_messages
  for each row execute function public.notify_contact_message();

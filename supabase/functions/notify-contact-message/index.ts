// Emails Erin when someone signs the trail register on about-erin.com.
// Called by a database trigger with {"id": <contact_messages.id>}.
// It never trusts the request body for content: it loads the row itself with the
// service role, and only sends once per row (notified_at), so calling it again
// can't be used to spam.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const TO = "erin@confluencecreativeco.com";
const FROM = Deno.env.get("NOTIFY_FROM") ?? "Trail Register <onboarding@resend.dev>";

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("method not allowed", { status: 405 });
  let id: number | null = null;
  try { id = Number((await req.json())?.id) || null; } catch { /* ignore */ }
  if (!id) return new Response("missing id", { status: 400 });

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: row, error } = await db
    .from("contact_messages")
    .select("id, created_at, name, email, organization, topic, message, page, notified_at")
    .eq("id", id)
    .maybeSingle();
  if (error) { console.error("lookup failed", error.message); return new Response("lookup failed", { status: 500 }); }
  if (!row || row.notified_at) return new Response("nothing to send", { status: 200 });

  const key = Deno.env.get("RESEND_API_KEY");
  if (!key) { console.warn("RESEND_API_KEY not set; skipping email for message", id); return new Response("email not configured", { status: 200 }); }

  const subject = `Trail register: ${row.topic ?? "new message"} from ${row.name}`;
  const html = `<div style="font-family:Georgia,serif;color:#22201B;max-width:560px">
    <p style="font-size:13px;letter-spacing:.12em;color:#4F6B4E;margin:0 0 6px">NEW TRAIL REGISTER ENTRY · ABOUT-ERIN.COM</p>
    <h2 style="margin:0 0 16px">${esc(row.name)} signed the register</h2>
    <table style="font-family:Arial,sans-serif;font-size:14px;border-collapse:collapse">
      <tr><td style="padding:4px 12px 4px 0;color:#4E4639">Email</td><td><a href="mailto:${esc(row.email)}">${esc(row.email)}</a></td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#4E4639">Organization</td><td>${esc(row.organization ?? "—")}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#4E4639">Trail</td><td>${esc(row.topic ?? "—")}</td></tr>
    </table>
    <p style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;white-space:pre-wrap;border-left:3px solid #A3461F;padding-left:12px;margin:18px 0">${esc(row.message)}</p>
    <p style="font-family:Arial,sans-serif;font-size:12px;color:#4E4639">Reply to this email to answer ${esc(row.name)} directly.</p>
  </div>`;
  const text = `New trail register entry\n\nName: ${row.name}\nEmail: ${row.email}\nOrganization: ${row.organization ?? "-"}\nTrail: ${row.topic ?? "-"}\n\n${row.message}`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to: [TO], reply_to: row.email, subject, html, text }),
  });
  if (!res.ok) { console.error("resend failed", res.status, await res.text()); return new Response("send failed", { status: 502 }); }

  await db.from("contact_messages").update({ notified_at: new Date().toISOString() }).eq("id", id);
  return new Response("sent", { status: 200 });
});

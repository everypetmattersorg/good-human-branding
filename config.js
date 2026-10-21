// Site settings. The Supabase anon key is safe to publish: the database only
// allows anonymous visitors to INSERT contact messages, never to read them.
// Leave these empty and the contact form falls back to opening an email.
window.GHB_CONFIG = {
  supabaseUrl: "",      // e.g. "https://abcd1234.supabase.co"
  supabaseAnonKey: "",  // Project Settings → API → anon public key
  contactEmail: "erin@confluencecreativeco.com"
};

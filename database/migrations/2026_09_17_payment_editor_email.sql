-- Menandai email berisi tautan editor agar webhook/status check tidak mengirim duplikat.
alter table public.orders
  add column if not exists editor_email_sent_at timestamptz;

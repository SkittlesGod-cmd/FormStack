-- Blog subscriber emails
create table if not exists subscribers (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  created_at timestamptz not null default now()
);

-- Only the service role can read; anyone can insert (no RLS needed for public subscribe)
alter table subscribers enable row level security;

create policy "Anyone can subscribe"
  on subscribers for insert
  with check (true);

-- Only service role reads (no public select policy)

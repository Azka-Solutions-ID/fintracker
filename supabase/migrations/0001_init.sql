-- Base schema. One table is enough to prove the loop; wallets become a table
-- when they need balances, names and ordering per user.
--
-- Auth: no login screen. The app calls supabase.auth.signInAnonymously() and
-- every row is owned by auth.uid(), so RLS keeps devices apart even with the
-- public anon key in the browser.

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  app text not null check (app in ('umkm', 'pekerja')),
  wallet_id text not null check (char_length(wallet_id) between 1 and 40),
  kind text not null check (kind in ('masuk', 'keluar', 'pindah')),
  amount bigint not null check (amount > 0 and amount <= 1000000000000),
  note text check (char_length(note) <= 200),
  occurred_on date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists transactions_user_day_idx
  on public.transactions (user_id, occurred_on desc);

alter table public.transactions enable row level security;

-- one policy covers read, insert, update, delete: the row must belong to the caller
create policy "transactions owned by caller"
  on public.transactions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Anonymous sessions must be enabled in the Supabase dashboard:
-- Authentication -> Providers -> Anonymous sign-ins -> Enable.

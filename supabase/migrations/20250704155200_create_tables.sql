-- Enable Row Level Security
alter publication supabase_realtime enable for all;

-- Create tables
create table if not exists baby_profiles (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users not null,
    name text not null,
    birth_date date not null,
    created_at timestamptz default now()
);

create table if not exists baby_logs (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users not null,
    baby_id uuid references baby_profiles not null,
    log_type text not null check (log_type in ('feeding','diaper','sleep','cry','bowel')),
    log_data jsonb not null,
    logged_at timestamptz default now()
);

create table if not exists reminders (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users not null,
    baby_id uuid references baby_profiles not null,
    reminder_type text not null check (reminder_type in ('feeding','diaper','sleep')),
    reminder_time timestamptz not null,
    is_completed boolean default false,
    notes text
);

-- Enable Row Level Security
alter table baby_profiles enable row level security;
alter table baby_logs enable row level security;
alter table reminders enable row level security;

-- Create RLS policies
create policy "User can manage their baby data" on baby_profiles
  for all using (auth.uid() = user_id);

create policy "User can manage their logs" on baby_logs
  for all using (auth.uid() = user_id);

create policy "User can manage their reminders" on reminders
  for all using (auth.uid() = user_id);

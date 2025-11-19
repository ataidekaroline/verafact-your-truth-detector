-- Create profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  username_updated_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.profiles enable row level security;

-- RLS policies
create policy "Users can view their own profile"
  on public.profiles
  for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles
  for update
  using (auth.uid() = id);

-- Function to get next user number
create or replace function public.get_next_user_number()
returns integer
language plpgsql
security definer
as $$
declare
  next_num integer;
begin
  select coalesce(max(substring(username from '@user(\d+)')::integer), 0) + 1
  into next_num
  from public.profiles
  where username ~ '^@user\d+$';
  
  return next_num;
end;
$$;

-- Function to create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  user_number integer;
begin
  user_number := get_next_user_number();
  
  insert into public.profiles (id, username)
  values (new.id, '@user' || user_number);
  
  return new;
end;
$$;

-- Trigger to auto-create profile
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
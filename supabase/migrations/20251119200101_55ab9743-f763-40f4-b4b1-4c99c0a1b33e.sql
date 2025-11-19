-- Fix search_path for get_next_user_number function
create or replace function public.get_next_user_number()
returns integer
language plpgsql
security definer
set search_path = public
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
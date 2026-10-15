-- Run schema.sql first and create the owner's account in Authentication > Users.
-- Replace the email below, then run this script in the Supabase SQL Editor.
-- This grants studio access to that existing account; it never creates a user.
do $$
declare
  admin_email text := 'tongolmalual@gmail.com';
  admin_user_id uuid;
begin
  if admin_email = 'tongolmalual@gmail.com' then
    raise exception 'Replace your-admin-email@example.com with the existing owner account email.';
  end if;

  select id into admin_user_id
  from auth.users
  where lower(email) = lower(trim(admin_email));

  if admin_user_id is null then
    raise exception 'No authentication user found. Create the owner account in Authentication > Users first.';
  end if;

  insert into public.studio_admins (user_id )
  values (admin_user_id)
  on conflict (user_id) do nothing;

  raise notice 'Studio admin access granted.';
end;
$$;

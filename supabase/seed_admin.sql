insert into public.admin_roles (user_id, role)
select id, 'admin'
from auth.users
where email = current_setting('request.jwt.claim.email', true)
on conflict do nothing;

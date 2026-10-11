-- Migration V19: Reporting & Dashboards
-- Seeds REPORTING_VIEW permission for executive and managerial analytics

insert into permission (id, code, description) values
    (gen_random_uuid(), 'REPORTING_VIEW', 'View executive dashboards, sales analytics, collection aging, and export operational reports')
on conflict do nothing;

insert into role_permission (id, role_id, permission_id)
select gen_random_uuid(), r.id, p.id
from role r, permission p
where r.code in ('OWNER', 'MANAGER', 'ADMIN', 'AR')
  and p.code = 'REPORTING_VIEW'
on conflict do nothing;

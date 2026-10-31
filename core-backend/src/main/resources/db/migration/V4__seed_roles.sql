-- Baseline roles from README sec 17 (Worker App Role Scope). Permission set is intentionally
-- coarse for the Foundation module; granular permissions are added only when a real need appears.

insert into role (id, code, name, description) values
    (gen_random_uuid(), 'OWNER', 'Owner', 'Business-wide owner; approvals, exceptions, full visibility'),
    (gen_random_uuid(), 'MANAGER', 'Manager', 'Runs daily store operations'),
    (gen_random_uuid(), 'ADMIN', 'Admin', 'Office administration, bookkeeping support, walk-in sales'),
    (gen_random_uuid(), 'SPV', 'Supervisor', 'Manages assigned sales team'),
    (gen_random_uuid(), 'SALESPERSON', 'Salesperson / SF', 'Own customers, draft/released SO creation'),
    (gen_random_uuid(), 'SURVEYOR', 'Surveyor', 'Credit assessment field verification'),
    (gen_random_uuid(), 'DRIVER', 'Driver', 'Delivery and repossession transport'),
    (gen_random_uuid(), 'COLLECTOR', 'Collector', 'Field collection visits'),
    (gen_random_uuid(), 'AR', 'AR', 'Receivables monitoring and reconciliation'),
    (gen_random_uuid(), 'HELPER', 'Helper / OB', 'Delivery assistance, warehouse preparation');

-- Minimal coarse permission set for the Foundation module itself.
insert into permission (id, code, description) values
    (gen_random_uuid(), 'STORE_MANAGE', 'Create/update stores'),
    (gen_random_uuid(), 'EMPLOYEE_MANAGE', 'Create/update employees and assignments'),
    (gen_random_uuid(), 'ROLE_MANAGE', 'Manage roles and permissions'),
    (gen_random_uuid(), 'APPROVAL_WORKFLOW_MANAGE', 'Configure approval workflows'),
    (gen_random_uuid(), 'APPROVAL_DECIDE', 'Approve/reject an approval request step');

insert into role_permission (id, role_id, permission_id)
select gen_random_uuid(), r.id, p.id
from role r, permission p
where r.code = 'OWNER';

insert into role_permission (id, role_id, permission_id)
select gen_random_uuid(), r.id, p.id
from role r, permission p
where r.code = 'MANAGER'
  and p.code in ('EMPLOYEE_MANAGE', 'APPROVAL_DECIDE');

insert into role_permission (id, role_id, permission_id)
select gen_random_uuid(), r.id, p.id
from role r, permission p
where r.code = 'ADMIN'
  and p.code in ('EMPLOYEE_MANAGE');

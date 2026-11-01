-- =====================================================================
-- Migration V41: Automated Scheduled Reports & Email Digest Subscriptions
-- Task G.9: Automated daily/weekly email digest dispatching Excel (.xlsx)
-- financial aging and stock balance reports to store managers.
-- =====================================================================

create table if not exists scheduled_report_config (
    id                      uuid primary key default gen_random_uuid(),
    name                    varchar(150) not null,
    report_type             varchar(40) not null, -- FINANCIAL_AGING, STOCK_BALANCE, ALL_COMBINED
    frequency               varchar(20) not null, -- DAILY, WEEKLY
    day_of_week             varchar(20),          -- MONDAY, TUESDAY, etc.
    dispatch_time           varchar(10) not null default '08:00',
    store_id                uuid references store(id) on delete set null,
    target_role             varchar(40) not null default 'MANAGER',
    custom_recipient_emails text,
    enabled                 boolean not null default true,
    last_run_at             timestamptz,
    last_status             varchar(20),          -- SUCCESS, FAILED, RUNNING
    last_error_message      text,
    created_at              timestamptz not null default now(),
    created_by              varchar(150),
    updated_at              timestamptz not null default now(),
    updated_by              varchar(150),
    version                 bigint not null default 0
);

create table if not exists scheduled_report_log (
    id                      uuid primary key default gen_random_uuid(),
    config_id               uuid references scheduled_report_config(id) on delete cascade,
    executed_at             timestamptz not null default now(),
    report_type             varchar(40) not null,
    status                  varchar(20) not null, -- SUCCESS, FAILED
    recipients_count        integer not null default 0,
    recipient_emails        text,
    attachments_generated   text,
    duration_ms             bigint not null default 0,
    error_message           text,
    created_at              timestamptz not null default now(),
    created_by              varchar(150),
    updated_at              timestamptz not null default now(),
    updated_by              varchar(150),
    version                 bigint not null default 0
);

create index if not exists idx_scheduled_report_config_enabled on scheduled_report_config(enabled);
create index if not exists idx_scheduled_report_log_config_id on scheduled_report_log(config_id);
create index if not exists idx_scheduled_report_log_executed_at on scheduled_report_log(executed_at desc);

-- Seed default scheduled report configs (one daily digest, one weekly digest)
insert into scheduled_report_config (
    id, name, report_type, frequency, day_of_week, dispatch_time, store_id, target_role, enabled
) values
    (gen_random_uuid(), 'Daily Store Financial Aging & Stock Balance Digest', 'ALL_COMBINED', 'DAILY', null, '08:00', null, 'MANAGER', true),
    (gen_random_uuid(), 'Weekly Delinquency Aging Portfolio Audit', 'FINANCIAL_AGING', 'WEEKLY', 'MONDAY', '08:00', null, 'MANAGER', true);

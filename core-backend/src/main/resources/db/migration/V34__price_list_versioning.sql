-- Price List Report Document Versioning and Server Snapshot Storage
create table if not exists price_list_version (
    id uuid primary key,
    store_id uuid not null references store (id),
    version_code varchar(60) not null,
    title varchar(150) not null,
    valid_from date not null,
    group_by varchar(30) not null default 'category',
    file_name varchar(255) not null,
    mime_type varchar(100) not null default 'text/html',
    file_size_bytes bigint not null default 0,
    item_count int not null default 0,
    content_html text not null,
    snapshot_json text,
    notes text,
    created_at timestamptz not null default now(),
    created_by uuid references employee (id)
);

create index idx_price_list_version_store on price_list_version (store_id, created_at desc);


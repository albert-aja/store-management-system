-- Add structured delivery location profiling fields to survey (M.1)
alter table survey
    add column if not exists destination_latitude numeric(10, 7),
    add column if not exists destination_longitude numeric(10, 7),
    add column if not exists alley_width_meters numeric(5, 2),
    add column if not exists stair_clearance_meters numeric(5, 2),
    add column if not exists gate_access_notes varchar(500);


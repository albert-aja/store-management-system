ALTER TABLE storefront_customer
    ALTER COLUMN password_hash DROP NOT NULL;

ALTER TABLE storefront_customer
    ADD COLUMN auth_user_id UUID UNIQUE;

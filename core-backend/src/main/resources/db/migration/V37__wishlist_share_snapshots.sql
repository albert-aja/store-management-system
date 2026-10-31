-- P.27 Shareable wishlist snapshots with anonymous gift reservation intent.
-- Public tokens and reservation cancellation keys are stored only as SHA-256 hex digests.
CREATE TABLE wishlist_share (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_customer_id UUID REFERENCES storefront_customer(id) ON DELETE CASCADE,
    owner_session_id VARCHAR(100),
    token_hash VARCHAR(64) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID,
    updated_by UUID,
    CONSTRAINT wishlist_share_token_hash_uk UNIQUE (token_hash),
    CONSTRAINT wishlist_share_single_owner CHECK (
        (owner_customer_id IS NOT NULL AND owner_session_id IS NULL)
        OR (owner_customer_id IS NULL AND owner_session_id IS NOT NULL AND length(owner_session_id) > 0))
);

CREATE INDEX wishlist_share_owner_customer ON wishlist_share(owner_customer_id, created_at DESC)
    WHERE owner_customer_id IS NOT NULL;
CREATE INDEX wishlist_share_owner_session ON wishlist_share(owner_session_id, created_at DESC)
    WHERE owner_customer_id IS NULL;

-- Snapshot rows intentionally carry no price and no FK to product so the shared list stays immutable.
CREATE TABLE wishlist_share_item (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    share_id UUID NOT NULL REFERENCES wishlist_share(id) ON DELETE CASCADE,
    product_id UUID NOT NULL,
    variant_id UUID,
    product_name VARCHAR(255) NOT NULL,
    variant_name VARCHAR(255),
    primary_image_url VARCHAR(1000),
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity = 1),
    sort_order INT NOT NULL DEFAULT 0,
    reservation_key_hash VARCHAR(64),
    reserved_at TIMESTAMPTZ,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID,
    updated_by UUID,
    CONSTRAINT wishlist_share_item_product_uk UNIQUE (share_id, product_id),
    CONSTRAINT wishlist_share_item_reservation_pair CHECK (
        (reservation_key_hash IS NULL AND reserved_at IS NULL)
        OR (reservation_key_hash IS NOT NULL AND reserved_at IS NOT NULL))
);

CREATE INDEX wishlist_share_item_share ON wishlist_share_item(share_id, sort_order);

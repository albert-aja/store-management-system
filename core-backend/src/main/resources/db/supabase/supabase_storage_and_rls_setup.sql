-- ==============================================================================
-- STORE MANAGEMENT SYSTEM (SMS) — SUPABASE STORAGE & ROW-LEVEL SECURITY (RLS) SETUP
-- Module: Environment & Infrastructure Setup (Backlog [A.1])
-- ==============================================================================
-- Run this script in the Supabase SQL Editor for your production/staging project.
-- It provisions storage buckets, storage access policies, and helper RLS functions.

-- 1. Create S3-Compatible Storage Buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    (
        'sms-documents',
        'sms-documents',
        false, -- Private bucket: accessible only by authenticated staff or pre-signed URLs
        52428800, -- 50 MB limit (Surat Jalan PDFs, Invoices, Purchase Orders, Contracts)
        ARRAY['application/pdf', 'image/png', 'image/jpeg']
    ),
    (
        'sms-photos',
        'sms-photos',
        false, -- Private bucket: KYC, field surveys, delivery arrival proofs, repossession inspections
        20971520, -- 20 MB limit
        ARRAY['image/jpeg', 'image/png', 'image/webp']
    ),
    (
        'sms-signatures',
        'sms-signatures',
        false, -- Private bucket: delivery sign-offs, credit contracts, cash custody handovers
        5242880,  -- 5 MB limit
        ARRAY['image/png', 'image/svg+xml']
    )
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Enable Row-Level Security on Storage Objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Service Role Full Access (Spring Boot Backend via SUPABASE_SERVICE_ROLE_KEY)
DROP POLICY IF EXISTS "Service role full access on storage" ON storage.objects;
CREATE POLICY "Service role full access on storage"
    ON storage.objects
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 4. Policy: Authenticated Staff Read Access on Documents & Photos
DROP POLICY IF EXISTS "Staff read access on documents and photos" ON storage.objects;
CREATE POLICY "Staff read access on documents and photos"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
        bucket_id IN ('sms-documents', 'sms-photos', 'sms-signatures')
    );

-- 5. Policy: Mobile Field Staff Photo & Signature Upload Access
DROP POLICY IF EXISTS "Mobile workers upload proofs and signatures" ON storage.objects;
CREATE POLICY "Mobile workers upload proofs and signatures"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id IN ('sms-photos', 'sms-signatures')
        AND (auth.role() = 'authenticated')
    );

-- 6. Helper: Verify Storage Buckets Provisioned
SELECT id, name, public, file_size_limit, created_at 
FROM storage.buckets 
WHERE id IN ('sms-documents', 'sms-photos', 'sms-signatures');

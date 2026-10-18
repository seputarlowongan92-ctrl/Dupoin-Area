-- ====================================================================
-- SKEMA LENGKAP DATABASE DUPOIN (PostgreSQL / Supabase)
-- ====================================================================
-- File ini berisi:
-- 1. Pembuatan tabel `profiles` (semua data user & kredensial)
-- 2. Pembuatan tabel `transactions`, `company_bank_info`, `notifications`
-- 3. Trigger otomatis update `updated_at`
-- 4. Hak akses / RLS Policies agar aplikasi web & admin panel dapat
--    langsung membaca dan menyimpan user ke database
-- 5. Data Awal (Seed Admin & User Demo bawaan)
-- 6. Contoh Query SQL untuk Login dan Pembuatan Akun via Admin Panel
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. TABEL PROFILES (Penyimpanan Utama Seluruh Database User)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    username VARCHAR(100),
    phone_number VARCHAR(50),
    is_admin BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT TRUE,
    balance NUMERIC(18, 2) DEFAULT 0.00,
    saved_bank_accounts JSONB DEFAULT '[]'::jsonb,
    profile_picture_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indeks untuk mempercepat pencarian login berdasarkan email / nomor HP / username
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone_number);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(LOWER(username));

-- --------------------------------------------------------------------
-- 2. TABEL PENDUKUNG (Transaksi, Notifikasi, Rekening Perusahaan)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type VARCHAR(20) NOT NULL, -- 'DEPOSIT', 'WITHDRAWAL', 'TRANSFER'
    amount NUMERIC(18, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'SUCCESS', 'FAILED', 'REJECTED'
    date TIMESTAMPTZ DEFAULT NOW(),
    method VARCHAR(50),
    bank_or_ewallet_name VARCHAR(100),
    account_number VARCHAR(100),
    account_holder_name VARCHAR(150),
    recipient_email VARCHAR(255),
    proof_image_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL,
    message TEXT NOT NULL,
    date TIMESTAMPTZ DEFAULT NOW(),
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.company_bank_info (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    bank_name VARCHAR(100) NOT NULL,
    account_number VARCHAR(100) NOT NULL,
    account_holder_name VARCHAR(150) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 3. TRIGGER OTOMATIS UPDATED_AT
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- --------------------------------------------------------------------
-- 4. KEBIJAKAN AKSES (RLS / Row Level Security)
-- Memastikan client web dan admin panel dapat membaca dan menulis
-- langsung ke tabel database tanpa terblokir.
-- --------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_bank_info ENABLE ROW LEVEL SECURITY;

-- Buat policy publik (anon & authenticated) agar select, insert, update berjalan lancar
DROP POLICY IF EXISTS "Public access for profiles" ON public.profiles;
CREATE POLICY "Public access for profiles" ON public.profiles
FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for transactions" ON public.transactions;
CREATE POLICY "Public access for transactions" ON public.transactions
FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for notifications" ON public.notifications;
CREATE POLICY "Public access for notifications" ON public.notifications
FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for company_bank_info" ON public.company_bank_info;
CREATE POLICY "Public access for company_bank_info" ON public.company_bank_info
FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------------------------
-- 5. DATA AWAL (SEED ACCOUNTS: ADMIN & USER DEMO)
-- --------------------------------------------------------------------
INSERT INTO public.profiles (
    id, email, password, full_name, username, phone_number, is_admin, is_verified, balance, saved_bank_accounts
) VALUES 
(
    'admin-dupoin-001',
    'admin@dupoin.com',
    'admin123',
    'Admin Dupoin Pro',
    'admin_dupoin',
    '+62 811-9876-5432',
    TRUE,
    TRUE,
    100000000.00,
    '[]'::jsonb
),
(
    'user-demo-001',
    'user@dupoin.com',
    'password123',
    'Trader Dupoin',
    'trader_dupoin',
    '+62 812-3456-7890',
    FALSE,
    TRUE,
    15000000.00,
    '[]'::jsonb
),
(
    'user-beta-003',
    'betat5713@gmail.com',
    'password123',
    'Beta Trader',
    'betatrader',
    '+62 813-7777-6666',
    FALSE,
    TRUE,
    25000000.00,
    '[]'::jsonb
)
ON CONFLICT (email) DO UPDATE SET
    password = EXCLUDED.password,
    full_name = EXCLUDED.full_name,
    is_admin = EXCLUDED.is_admin,
    is_verified = EXCLUDED.is_verified;

-- Rekening Admin / Perusahaan Awal
INSERT INTO public.company_bank_info (bank_name, account_number, account_holder_name, is_active)
VALUES 
('BCA', '8830192811', 'PT DUPOIN BERJAYA INDONESIA', TRUE),
('MANDIRI', '1270019283741', 'PT DUPOIN BERJAYA INDONESIA', TRUE),
('BRI', '034101002938301', 'PT DUPOIN BERJAYA INDONESIA', TRUE)
ON CONFLICT DO NOTHING;

-- --------------------------------------------------------------------
-- 6. CONTOH KODE QUERY SQL PENTING:
-- --------------------------------------------------------------------

-- A. QUERY VERIFIKASI LOGIN (Hanya bisa login jika akun terdaftar di tabel):
-- SELECT * FROM public.profiles 
-- WHERE (LOWER(email) = LOWER('user@dupoin.com') OR phone_number = '+62 812-3456-7890')
--   AND password = 'password123';

-- B. QUERY INSERT KETIKA BUAT AKUN DI ADMIN PANEL:
-- INSERT INTO public.profiles (
--     id, email, password, full_name, username, phone_number, is_admin, is_verified, balance, saved_bank_accounts
-- ) VALUES (
--     'user-' || floor(extract(epoch from now()) * 1000)::text,
--     'memberbaru@gmail.com',
--     'rahasia123',
--     'Budi Santoso',
--     'budisantoso',
--     '+62 81299998888',
--     FALSE,
--     TRUE,
--     15000000.00,
--     '[]'::jsonb
-- );

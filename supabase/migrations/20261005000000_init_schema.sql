-- SmileRecall PostgreSQL Schema Migration
-- Production Ready Multi-Tenant Database Setup with Row Level Security (RLS)

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS & DOMAINS
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('owner', 'staff');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE treatment_status AS ENUM ('active', 'completed', 'abandoned');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE appointment_status AS ENUM ('scheduled', 'confirmed', 'completed', 'missed', 'cancelled', 'rescheduled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE confirmation_status AS ENUM ('pending', 'confirmed_patient', 'cancelled_patient', 'reschedule_requested');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE template_type AS ENUM (
    'reminder_day_before',
    'reminder_same_day',
    'missed_followup',
    'sitting_followup',
    'recall_6_month',
    'custom'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE message_direction AS ENUM ('outbound', 'inbound');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE message_status AS ENUM ('queued', 'sent', 'delivered', 'read', 'failed', 'received');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE recovered_reason AS ENUM ('missed_rebooked', 'sitting_completed', 'recall_booked');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. TABLES

-- Clinics (Tenants)
CREATE TABLE IF NOT EXISTS clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  doctor_name TEXT NOT NULL,
  phone TEXT,
  city TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  avg_treatment_value NUMERIC(10, 2) NOT NULL DEFAULT 2500.00,
  whatsapp_phone_number_id TEXT,
  whatsapp_access_token TEXT, -- Encrypted at rest
  whatsapp_business_account_id TEXT,
  whatsapp_verified BOOLEAN NOT NULL DEFAULT false,
  quiet_hours_start TEXT NOT NULL DEFAULT '21:00',
  quiet_hours_end TEXT NOT NULL DEFAULT '09:00',
  rules_config JSONB NOT NULL DEFAULT '{
    "reminder_day_before": {"enabled": true, "send_time": "18:00"},
    "reminder_same_day": {"enabled": true, "hours_before": 2},
    "missed_followup": {"enabled": true, "morning_time": "10:00", "second_nudge_days": 3},
    "sitting_followup": {"enabled": true, "first_nudge_days": 5, "second_nudge_days": 10},
    "recall_6_month": {"enabled": true, "second_nudge_days": 7}
  }'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Profiles (Users mapped to clinic & auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'staff',
  full_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Patients
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL, -- E.164 format (+91XXXXXXXXXX)
  whatsapp_opt_in BOOLEAN NOT NULL DEFAULT false,
  opt_in_source TEXT DEFAULT 'manual_entry',
  opt_in_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT,
  last_visit_date DATE,
  recall_due_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_patients_clinic_phone UNIQUE (clinic_id, phone)
);

-- Treatment Plans
CREATE TABLE IF NOT EXISTS treatment_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  treatment_name TEXT NOT NULL,
  total_sittings INTEGER NOT NULL DEFAULT 1,
  completed_sittings INTEGER NOT NULL DEFAULT 0,
  estimated_value NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  status treatment_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Appointments
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  treatment_plan_id UUID REFERENCES treatment_plans(id) ON DELETE SET NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  status appointment_status NOT NULL DEFAULT 'scheduled',
  confirmation_status confirmation_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Message Templates
CREATE TABLE IF NOT EXISTS message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  type template_type NOT NULL,
  name TEXT NOT NULL,
  body TEXT NOT NULL,
  whatsapp_template_name TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  template_id UUID REFERENCES message_templates(id) ON DELETE SET NULL,
  direction message_direction NOT NULL DEFAULT 'outbound',
  body TEXT NOT NULL,
  status message_status NOT NULL DEFAULT 'queued',
  provider_message_id TEXT,
  error TEXT,
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  idempotency_key TEXT UNIQUE,
  retry_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Recovered Revenue Events
CREATE TABLE IF NOT EXISTS recovered_revenue_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  amount NUMERIC(10, 2) NOT NULL,
  reason recovered_reason NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Audit Log (for DPDP & security)
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. INDEXES
CREATE INDEX IF NOT EXISTS idx_clinics_id ON clinics(id);
CREATE INDEX IF NOT EXISTS idx_profiles_clinic_id ON profiles(clinic_id);
CREATE INDEX IF NOT EXISTS idx_patients_clinic_id ON patients(clinic_id);
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);
CREATE INDEX IF NOT EXISTS idx_patients_recall ON patients(clinic_id, recall_due_date) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_starts ON appointments(clinic_id, starts_at);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(clinic_id, status);
CREATE INDEX IF NOT EXISTS idx_messages_clinic_id ON messages(clinic_id);
CREATE INDEX IF NOT EXISTS idx_messages_patient_id ON messages(patient_id);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(clinic_id, status);
CREATE INDEX IF NOT EXISTS idx_messages_idempotency ON messages(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_recovered_revenue_clinic ON recovered_revenue_events(clinic_id, created_at);

-- 5. ROW LEVEL SECURITY (RLS)
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE recovered_revenue_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Helper to fetch current user's clinic_id
CREATE OR REPLACE FUNCTION get_user_clinic_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT clinic_id FROM profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- Helper to check if current user is owner
CREATE OR REPLACE FUNCTION is_clinic_owner()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'owner'
  );
$$;

-- RLS POLICIES

-- Profiles
DROP POLICY IF EXISTS "profiles_select_own_or_clinic" ON profiles;
CREATE POLICY "profiles_select_own_or_clinic" ON profiles
  FOR SELECT USING (id = auth.uid() OR clinic_id = get_user_clinic_id());

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles_update_own_or_owner" ON profiles;
CREATE POLICY "profiles_update_own_or_owner" ON profiles
  FOR UPDATE USING (id = auth.uid() OR (clinic_id = get_user_clinic_id() AND is_clinic_owner()));

-- Clinics
DROP POLICY IF EXISTS "clinics_select" ON clinics;
CREATE POLICY "clinics_select" ON clinics
  FOR SELECT USING (id = get_user_clinic_id());

DROP POLICY IF EXISTS "clinics_update_owner" ON clinics;
CREATE POLICY "clinics_update_owner" ON clinics
  FOR UPDATE USING (id = get_user_clinic_id() AND is_clinic_owner());

DROP POLICY IF EXISTS "clinics_insert_authenticated" ON clinics;
CREATE POLICY "clinics_insert_authenticated" ON clinics
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Patients
DROP POLICY IF EXISTS "patients_all" ON patients;
CREATE POLICY "patients_all" ON patients
  FOR ALL USING (clinic_id = get_user_clinic_id())
  WITH CHECK (clinic_id = get_user_clinic_id());

-- Treatment Plans
DROP POLICY IF EXISTS "treatment_plans_all" ON treatment_plans;
CREATE POLICY "treatment_plans_all" ON treatment_plans
  FOR ALL USING (clinic_id = get_user_clinic_id())
  WITH CHECK (clinic_id = get_user_clinic_id());

-- Appointments
DROP POLICY IF EXISTS "appointments_all" ON appointments;
CREATE POLICY "appointments_all" ON appointments
  FOR ALL USING (clinic_id = get_user_clinic_id())
  WITH CHECK (clinic_id = get_user_clinic_id());

-- Message Templates
DROP POLICY IF EXISTS "message_templates_all" ON message_templates;
CREATE POLICY "message_templates_all" ON message_templates
  FOR ALL USING (clinic_id = get_user_clinic_id())
  WITH CHECK (clinic_id = get_user_clinic_id());

-- Messages
DROP POLICY IF EXISTS "messages_all" ON messages;
CREATE POLICY "messages_all" ON messages
  FOR ALL USING (clinic_id = get_user_clinic_id())
  WITH CHECK (clinic_id = get_user_clinic_id());

-- Recovered Revenue Events
DROP POLICY IF EXISTS "recovered_revenue_events_all" ON recovered_revenue_events;
CREATE POLICY "recovered_revenue_events_all" ON recovered_revenue_events
  FOR ALL USING (clinic_id = get_user_clinic_id())
  WITH CHECK (clinic_id = get_user_clinic_id());

-- Audit Log
DROP POLICY IF EXISTS "audit_log_select" ON audit_log;
CREATE POLICY "audit_log_select" ON audit_log
  FOR SELECT USING (clinic_id = get_user_clinic_id());

DROP POLICY IF EXISTS "audit_log_insert" ON audit_log;
CREATE POLICY "audit_log_insert" ON audit_log
  FOR INSERT WITH CHECK (clinic_id = get_user_clinic_id() OR user_id = auth.uid());

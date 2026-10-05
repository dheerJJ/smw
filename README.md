# SmileRecall - Dental Clinic WhatsApp Recall & Reminder SaaS

SmileRecall is a multi-clinic SaaS platform built specifically for dental clinics in India. It automates WhatsApp appointment reminders and treatment recalls to recover lost revenue from no-shows and unfinished dental treatment sittings (e.g., Root Canal treatments, crown cementations, and 6-month checkups).

---

## 1. Quick Start (Mock Mode - Zero Setup)

You can launch and test the complete application immediately without setting up Supabase or Meta developer accounts:

```bash
# 1. Install dependencies
npm install

# 2. Run unit and integration tests
npm test

# 3. Start local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
Click **"Sign In"** and use **"Demo Access (Apex Dental Care)"** to enter the clinic dashboard with 25 realistic Indian dental patients, RCT treatment plans, and appointment records.

---

## 2. Tech Stack

- **Framework**: Next.js 16 (App Router, TypeScript)
- **Styling**: Tailwind CSS (White background, Teal accents, responsive rounded cards, zero purple gradients, zero pill buttons)
- **Database & Auth**: Supabase (PostgreSQL with Row Level Security for multi-tenancy)
- **WhatsApp Integration**: Official Meta WhatsApp Business Cloud API with Provider Abstraction (support for Gupshup, Interakt, or Twilio)
- **Automation Engine**: 5-minute scheduler checking quiet hours (21:00 - 09:00 IST), deduplication, and retry logic
- **Compliance**: India Digital Personal Data Protection (DPDP) Act 2023 with per-patient data export and right to erasure

---

## 3. Database & Supabase Setup

### 3.1 Create Supabase Project
1. Create a project at [supabase.com](https://supabase.com).
2. Note your Project URL, Anon Key, and Service Role Key from **Settings > API**.

### 3.2 Run Migrations
Run the SQL migration in the Supabase SQL Editor:
1. Paste contents of `supabase/migrations/20261005000000_init_schema.sql` and run.
2. (Optional) Run `supabase/seed.sql` to load the 25 realistic Indian demo patients.

### 3.3 Multi-Tenancy & Row-Level Security (RLS)
Every table includes a `clinic_id`. Supabase RLS policies enforce isolation:
- `clinics`: `USING (id = get_user_clinic_id())`
- `patients`, `appointments`, `treatment_plans`, `messages`: `USING (clinic_id = get_user_clinic_id())`

---

## 4. Environment Variables

Create a `.env.local` file based on `.env.example`:

```env
# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase (Optional for local testing; leave blank for Mock Mode)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Security & Encryption
ENCRYPTION_KEY=smile_recall_32_bytes_secure_key_prod_2026!
CRON_SECRET=smile_recall_cron_secret_auth_token_99

# WhatsApp Cloud API (Meta)
WHATSAPP_MOCK_MODE=true # Set to false in production with real Meta credentials
WHATSAPP_API_VERSION=v19.0
WHATSAPP_WEBHOOK_VERIFY_TOKEN=smilerecall_meta_verify_token_2026
WHATSAPP_APP_SECRET=your_meta_app_secret_here

# Billing (Feature Flagged)
FEATURE_FLAG_BILLING=false
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

---

## 5. Meta WhatsApp Business Cloud API Setup

### 5.1 Create Meta App
1. Go to [developers.facebook.com](https://developers.facebook.com) and create a **Business** App.
2. Add the **WhatsApp** product.
3. Note your **Phone Number ID**, **WhatsApp Business Account ID (WABA ID)**, and generate a **Permanent System User Access Token**.

### 5.2 Configure Webhook
In the Meta App Dashboard under **WhatsApp > Configuration**:
- **Callback URL**: `https://your-domain.com/api/webhooks/whatsapp`
- **Verify Token**: `smilerecall_meta_verify_token_2026` (or value of `WHATSAPP_WEBHOOK_VERIFY_TOKEN`)
- **Webhook Fields**: Subscribe to `messages`

### 5.3 Meta Template Approval
Under **WhatsApp > Message Templates**, submit the 5 standard templates:
1. `appointment_reminder_day_before_en`
2. `appointment_reminder_same_day_en`
3. `appointment_missed_followup_en`
4. `treatment_sitting_followup_en`
5. `routine_recall_6_month_en`

*(Copy the exact text and variables from the **Message Templates > Meta Approval Guide** tab inside the dashboard).*

---

## 6. Scheduled Automation Engine (5-Minute Cron)

SmileRecall executes 5 automated recall rules every 5 minutes:
1. **Day-Before Reminder**: Sent at 6:00 PM for tomorrow's scheduled visits.
2. **Same-Day Reminder**: Sent 2 hours before the appointment.
3. **Missed Follow-up**: Sent the next morning at 10:00 AM, with a 2nd reminder after 3 days.
4. **Pending Sitting Follow-up**: Sent after 5 days and 10 days for unfinished RCT/Crown plans without future bookings.
5. **6-Month Recall**: Sent on patient's routine checkup due date and 7 days later.

### Setup Cron on Vercel:
Create or use `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/automation",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

Or trigger with external HTTP scheduler:
```bash
curl -X POST https://your-domain.com/api/cron/automation \
  -H "Authorization: Bearer smile_recall_cron_secret_auth_token_99"
```

---

## 7. Compliance & Security (India DPDP Act 2023)

- **Consent Tracking**: Automated WhatsApp notifications are only dispatched when `whatsapp_opt_in = true`.
- **Immediate Opt-out**: If a patient replies "STOP" or "UNSUBSCRIBE", opt-in is revoked immediately and confirmed via text.
- **Quiet Hours**: No messages are sent between 21:00 and 09:00 IST. Messages triggered at night are queued for 09:00 AM.
- **Portability & Erasure**: Clinics can export a patient's complete record via CSV or JSON and permanently wipe data on request.
- **Audit Logging**: All consent changes and access logs are recorded in `audit_log`.

---

## 8. Running Automated Tests

```bash
# Run all unit and integration tests
npm test
```

Test suite includes:
- Multilingual reply parser (English, Hindi, Hinglish keywords)
- Automation rules (quiet hours, idempotency, opt-out enforcement)
- Meta Webhook GET handshake & POST payload handling

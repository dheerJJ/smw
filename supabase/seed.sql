-- SmileRecall Realistic Seed Data for Testing
-- Contains 1 Demo Clinic, 25 realistic Indian dental patients, treatment plans, appointments, default templates, and sample messages.

DO $$
DECLARE
  v_clinic_id UUID := 'c1111111-1111-1111-1111-111111111111';
  v_p1 UUID; v_p2 UUID; v_p3 UUID; v_p4 UUID; v_p5 UUID;
  v_p6 UUID; v_p7 UUID; v_p8 UUID; v_p9 UUID; v_p10 UUID;
  v_p11 UUID; v_p12 UUID; v_p13 UUID; v_p14 UUID; v_p15 UUID;
  v_p16 UUID; v_p17 UUID; v_p18 UUID; v_p19 UUID; v_p20 UUID;
  v_p21 UUID; v_p22 UUID; v_p23 UUID; v_p24 UUID; v_p25 UUID;
  v_tp1 UUID; v_tp2 UUID; v_tp3 UUID;
  v_now TIMESTAMPTZ := now();
BEGIN
  -- 1. Insert Demo Clinic
  INSERT INTO clinics (
    id, name, doctor_name, phone, city, timezone, avg_treatment_value, whatsapp_phone_number_id, whatsapp_verified
  ) VALUES (
    v_clinic_id,
    'Apex Dental Care & Implant Center',
    'Dr. Rajesh Sharma, MDS',
    '+919820123456',
    'Mumbai',
    'Asia/Kolkata',
    3500.00,
    '109823451293847',
    true
  ) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

  -- 2. Insert Default Message Templates (English & Hindi)
  INSERT INTO message_templates (clinic_id, type, name, body, whatsapp_template_name, language, is_active) VALUES
  (v_clinic_id, 'reminder_day_before', 'Appointment Reminder (Day Before - EN)', 'Hello {{patient_name}}, this is a reminder from {{clinic_name}} for your dental appointment tomorrow at {{time}}. Please reply YES to confirm or NO to reschedule.', 'appointment_reminder_day_before_en', 'en', true),
  (v_clinic_id, 'reminder_day_before', 'Appointment Reminder (Day Before - HI)', 'नमस्ते {{patient_name}}, यह {{clinic_name}} से कल {{time}} पर आपके दंत चिकित्सा परामर्श का स्मरण पत्र है। कृपया पुष्टि के लिए YES या पुनर्निर्धारण के लिए NO भेजें।', 'appointment_reminder_day_before_hi', 'hi', true),
  (v_clinic_id, 'reminder_same_day', 'Same Day 2h Reminder', 'Hello {{patient_name}}, your appointment with {{doctor_name}} is in 2 hours at {{time}}. See you shortly at {{clinic_name}}.', 'appointment_reminder_same_day_en', 'en', true),
  (v_clinic_id, 'missed_followup', 'Missed Appointment Follow-up', 'Dear {{patient_name}}, we noticed you were unable to make it to your appointment at {{clinic_name}} today. Would you like to reschedule for this week? Reply YES to connect with our receptionist.', 'appointment_missed_followup_en', 'en', true),
  (v_clinic_id, 'sitting_followup', 'Pending Treatment Sitting Follow-up', 'Hello {{patient_name}}, you have {{remaining_sittings}} pending sitting(s) for your {{treatment_name}} at {{clinic_name}}. Completing timely ensures lasting results. Reply YES to schedule your next visit.', 'treatment_sitting_followup_en', 'en', true),
  (v_clinic_id, 'recall_6_month', '6-Month Routine Dental Recall', 'Hello {{patient_name}}, it has been 6 months since your last dental cleaning and checkup at {{clinic_name}}. Preventive checkups help catch issues early. Reply YES to book your slot.', 'routine_recall_6_month_en', 'en', true)
  ON CONFLICT DO NOTHING;

  -- 3. Insert 25 Realistic Indian Patients
  INSERT INTO patients (id, clinic_id, name, phone, whatsapp_opt_in, opt_in_source, last_visit_date, recall_due_date, notes) VALUES
  (gen_random_uuid(), v_clinic_id, 'Aarav Patel', '+919820011221', true, 'reception_desk', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '170 days', 'Molar RCT sitting 2 completed') RETURNING id INTO v_p1;
  
  INSERT INTO patients (id, clinic_id, name, phone, whatsapp_opt_in, opt_in_source, last_visit_date, recall_due_date, notes) VALUES
  (gen_random_uuid(), v_clinic_id, 'Priya Nair', '+919820022332', true, 'appointment_form', CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '175 days', 'Root canal crown pending') RETURNING id INTO v_p2;

  INSERT INTO patients (id, clinic_id, name, phone, whatsapp_opt_in, opt_in_source, last_visit_date, recall_due_date, notes) VALUES
  (gen_random_uuid(), v_clinic_id, 'Rohan Mehta', '+919820033443', true, 'reception_desk', CURRENT_DATE - INTERVAL '185 days', CURRENT_DATE - INTERVAL '5 days', 'Due for 6-month routine scaling and checkup') RETURNING id INTO v_p3;

  INSERT INTO patients (id, clinic_id, name, phone, whatsapp_opt_in, opt_in_source, last_visit_date, recall_due_date, notes) VALUES
  (gen_random_uuid(), v_clinic_id, 'Ananya Sharma', '+919820044554', true, 'whatsapp_qr', CURRENT_DATE - INTERVAL '1 day', CURRENT_DATE + INTERVAL '180 days', 'Composite restoration done') RETURNING id INTO v_p4;

  INSERT INTO patients (id, clinic_id, name, phone, whatsapp_opt_in, opt_in_source, last_visit_date, recall_due_date, notes) VALUES
  (gen_random_uuid(), v_clinic_id, 'Vikram Malhotra', '+919820055665', true, 'reception_desk', CURRENT_DATE - INTERVAL '190 days', CURRENT_DATE - INTERVAL '10 days', '6-month recall overdue') RETURNING id INTO v_p5;

  INSERT INTO patients (id, clinic_id, name, phone, whatsapp_opt_in, opt_in_source, last_visit_date, recall_due_date, notes) VALUES
  (gen_random_uuid(), v_clinic_id, 'Sneha Kulkarni', '+919820066776', true, 'reception_desk', CURRENT_DATE - INTERVAL '12 days', CURRENT_DATE + INTERVAL '168 days', 'Aligners checkup') RETURNING id INTO v_p6;

  INSERT INTO patients (id, clinic_id, name, phone, whatsapp_opt_in, opt_in_source, last_visit_date, recall_due_date, notes) VALUES
  (gen_random_uuid(), v_clinic_id, 'Aditya Verma', '+919820077887', true, 'appointment_form', CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE + INTERVAL '178 days', 'Missed appointment yesterday') RETURNING id INTO v_p7;

  INSERT INTO patients (id, clinic_id, name, phone, whatsapp_opt_in, opt_in_source, last_visit_date, recall_due_date, notes) VALUES
  (gen_random_uuid(), v_clinic_id, 'Kavita Sundaram', '+919820088998', true, 'whatsapp_qr', CURRENT_DATE - INTERVAL '45 days', CURRENT_DATE + INTERVAL '135 days', 'Deep scaling required') RETURNING id INTO v_p8;

  INSERT INTO patients (id, clinic_id, name, phone, whatsapp_opt_in, opt_in_source, last_visit_date, recall_due_date, notes) VALUES
  (gen_random_uuid(), v_clinic_id, 'Rahul Deshmukh', '+919820099009', false, 'manual_entry', CURRENT_DATE - INTERVAL '60 days', CURRENT_DATE + INTERVAL '120 days', 'Patient opted out of automated WhatsApp') RETURNING id INTO v_p9;

  INSERT INTO patients (id, clinic_id, name, phone, whatsapp_opt_in, opt_in_source, last_visit_date, recall_due_date, notes) VALUES
  (gen_random_uuid(), v_clinic_id, 'Neha Gupta', '+919820100110', true, 'reception_desk', CURRENT_DATE - INTERVAL '7 days', CURRENT_DATE + INTERVAL '173 days', 'Wisdom tooth extraction follow-up') RETURNING id INTO v_p10;

  INSERT INTO patients (id, clinic_id, name, phone, whatsapp_opt_in, opt_in_source, last_visit_date, recall_due_date, notes) VALUES
  (gen_random_uuid(), v_clinic_id, 'Suresh Iyer', '+919820111221', true, 'reception_desk', CURRENT_DATE - INTERVAL '182 days', CURRENT_DATE - INTERVAL '2 days', 'Recall due for diabetic periodontal evaluation') RETURNING id INTO v_p11;

  INSERT INTO patients (id, clinic_id, name, phone, whatsapp_opt_in, opt_in_source, last_visit_date, recall_due_date, notes) VALUES
  (gen_random_uuid(), v_clinic_id, 'Meera Ranganathan', '+919820122332', true, 'appointment_form', CURRENT_DATE - INTERVAL '20 days', CURRENT_DATE + INTERVAL '160 days', 'Implant Osseointegration check') RETURNING id INTO v_p12;

  INSERT INTO patients (id, clinic_id, name, phone, whatsapp_opt_in, opt_in_source, last_visit_date, recall_due_date, notes) VALUES
  (gen_random_uuid(), v_clinic_id, 'Gautam Banerjee', '+919820133443', true, 'reception_desk', CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE + INTERVAL '165 days', 'Dentures trial pending') RETURNING id INTO v_p13;

  INSERT INTO patients (id, clinic_id, name, phone, whatsapp_opt_in, opt_in_source, last_visit_date, recall_due_date, notes) VALUES
  (gen_random_uuid(), v_clinic_id, 'Pooja Bhatia', '+919820144554', true, 'whatsapp_qr', CURRENT_DATE - INTERVAL '3 days', CURRENT_DATE + INTERVAL '177 days', 'Cosmetic veneer consultation') RETURNING id INTO v_p14;

  INSERT INTO patients (id, clinic_id, name, phone, whatsapp_opt_in, opt_in_source, last_visit_date, recall_due_date, notes) VALUES
  (gen_random_uuid(), v_clinic_id, 'Deepak Chopra', '+919820155665', true, 'reception_desk', CURRENT_DATE - INTERVAL '90 days', CURRENT_DATE + INTERVAL '90 days', 'Mild gingivitis treated') RETURNING id INTO v_p15;

  INSERT INTO patients (id, clinic_id, name, phone, whatsapp_opt_in, opt_in_source, last_visit_date, recall_due_date, notes) VALUES
  (gen_random_uuid(), v_clinic_id, 'Swati Agarwal', '+919820166776', true, 'appointment_form', CURRENT_DATE - INTERVAL '4 days', CURRENT_DATE + INTERVAL '176 days', 'Pediatric cavity restoration') RETURNING id INTO v_p16;

  INSERT INTO patients (id, clinic_id, name, phone, whatsapp_opt_in, opt_in_source, last_visit_date, recall_due_date, notes) VALUES
  (gen_random_uuid(), v_clinic_id, 'Arjun Reddy', '+919820177887', true, 'reception_desk', CURRENT_DATE - INTERVAL '180 days', CURRENT_DATE, 'Recall due today') RETURNING id INTO v_p17;

  INSERT INTO patients (id, clinic_id, name, phone, whatsapp_opt_in, opt_in_source, last_visit_date, recall_due_date, notes) VALUES
  (gen_random_uuid(), v_clinic_id, 'Sunita Menon', '+919820188998', true, 'reception_desk', CURRENT_DATE - INTERVAL '14 days', CURRENT_DATE + INTERVAL '166 days', 'RCT sitting 1 finished, sitting 2 pending') RETURNING id INTO v_p18;

  INSERT INTO patients (id, clinic_id, name, phone, whatsapp_opt_in, opt_in_source, last_visit_date, recall_due_date, notes) VALUES
  (gen_random_uuid(), v_clinic_id, 'Karan Singhania', '+919820199009', true, 'whatsapp_qr', CURRENT_DATE - INTERVAL '18 days', CURRENT_DATE + INTERVAL '162 days', 'Teeth whitening follow-up') RETURNING id INTO v_p19;

  INSERT INTO patients (id, clinic_id, name, phone, whatsapp_opt_in, opt_in_source, last_visit_date, recall_due_date, notes) VALUES
  (gen_random_uuid(), v_clinic_id, 'Tanvi Joshi', '+919820200110', true, 'reception_desk', CURRENT_DATE - INTERVAL '195 days', CURRENT_DATE - INTERVAL '15 days', 'Recall overdue by 2 weeks') RETURNING id INTO v_p20;

  INSERT INTO patients (id, clinic_id, name, phone, whatsapp_opt_in, opt_in_source, last_visit_date, recall_due_date, notes) VALUES
  (gen_random_uuid(), v_clinic_id, 'Manish Tiwari', '+919820211221', true, 'appointment_form', CURRENT_DATE - INTERVAL '8 days', CURRENT_DATE + INTERVAL '172 days', 'Night guard adjustment') RETURNING id INTO v_p21;

  INSERT INTO patients (id, clinic_id, name, phone, whatsapp_opt_in, opt_in_source, last_visit_date, recall_due_date, notes) VALUES
  (gen_random_uuid(), v_clinic_id, 'Ritu Saxena', '+919820222332', true, 'reception_desk', CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE + INTERVAL '174 days', 'Crown cementation needed') RETURNING id INTO v_p22;

  INSERT INTO patients (id, clinic_id, name, phone, whatsapp_opt_in, opt_in_source, last_visit_date, recall_due_date, notes) VALUES
  (gen_random_uuid(), v_clinic_id, 'Harish Trivedi', '+919820233443', true, 'reception_desk', CURRENT_DATE - INTERVAL '175 days', CURRENT_DATE + INTERVAL '5 days', 'Recall due next week') RETURNING id INTO v_p23;

  INSERT INTO patients (id, clinic_id, name, phone, whatsapp_opt_in, opt_in_source, last_visit_date, recall_due_date, notes) VALUES
  (gen_random_uuid(), v_clinic_id, 'Ananya Roy', '+919820244554', true, 'whatsapp_qr', CURRENT_DATE - INTERVAL '11 days', CURRENT_DATE + INTERVAL '169 days', 'Composite bonding') RETURNING id INTO v_p24;

  INSERT INTO patients (id, clinic_id, name, phone, whatsapp_opt_in, opt_in_source, last_visit_date, recall_due_date, notes) VALUES
  (gen_random_uuid(), v_clinic_id, 'Devendra Shah', '+919820255665', true, 'reception_desk', CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE + INTERVAL '150 days', 'Periodontal maintenance') RETURNING id INTO v_p25;

  -- 4. Treatment Plans
  INSERT INTO treatment_plans (id, clinic_id, patient_id, treatment_name, total_sittings, completed_sittings, estimated_value, status) VALUES
  (gen_random_uuid(), v_clinic_id, v_p2, 'Root Canal Treatment + Zirconia Crown', 3, 1, 9500.00, 'active') RETURNING id INTO v_tp1;

  INSERT INTO treatment_plans (id, clinic_id, patient_id, treatment_name, total_sittings, completed_sittings, estimated_value, status) VALUES
  (gen_random_uuid(), v_clinic_id, v_p18, 'Multi-sitting Root Canal', 2, 1, 5000.00, 'active') RETURNING id INTO v_tp2;

  INSERT INTO treatment_plans (id, clinic_id, patient_id, treatment_name, total_sittings, completed_sittings, estimated_value, status) VALUES
  (gen_random_uuid(), v_clinic_id, v_p1, 'Molar RCT & Post Core', 2, 2, 6000.00, 'completed') RETURNING id INTO v_tp3;

  -- 5. Appointments (Tomorrow, Today, Past, Missed)
  -- Tomorrow appointments (for day-before reminder tests)
  INSERT INTO appointments (clinic_id, patient_id, treatment_plan_id, starts_at, duration_minutes, status, confirmation_status, notes) VALUES
  (v_clinic_id, v_p1, v_tp3, (CURRENT_DATE + INTERVAL '1 day' + TIME '10:30:00') AT TIME ZONE 'Asia/Kolkata', 45, 'scheduled', 'pending', 'Crown measurement'),
  (v_clinic_id, v_p4, null, (CURRENT_DATE + INTERVAL '1 day' + TIME '15:00:00') AT TIME ZONE 'Asia/Kolkata', 30, 'scheduled', 'confirmed_patient', 'Composite polish'),
  (v_clinic_id, v_p6, null, (CURRENT_DATE + INTERVAL '1 day' + TIME '17:30:00') AT TIME ZONE 'Asia/Kolkata', 30, 'scheduled', 'pending', 'Aligner tray 4 delivery');

  -- Today appointments (for same-day reminder tests)
  INSERT INTO appointments (clinic_id, patient_id, treatment_plan_id, starts_at, duration_minutes, status, confirmation_status, notes) VALUES
  (v_clinic_id, v_p2, v_tp1, (v_now + INTERVAL '3 hours'), 45, 'scheduled', 'pending', 'RCT sitting 2'),
  (v_clinic_id, v_p8, null, (v_now + INTERVAL '5 hours'), 30, 'confirmed', 'confirmed_patient', 'Routine examination');

  -- Yesterday Missed Appointment (for missed follow-up testing)
  INSERT INTO appointments (clinic_id, patient_id, treatment_plan_id, starts_at, duration_minutes, status, confirmation_status, notes) VALUES
  (v_clinic_id, v_p7, null, (CURRENT_DATE - INTERVAL '1 day' + TIME '11:00:00') AT TIME ZONE 'Asia/Kolkata', 30, 'missed', 'pending', 'Patient did not show up');

  -- 6. Sample Recovered Revenue Event
  INSERT INTO recovered_revenue_events (clinic_id, patient_id, appointment_id, amount, reason, created_at) VALUES
  (v_clinic_id, v_p1, null, 6000.00, 'sitting_completed', CURRENT_DATE - INTERVAL '3 days');

END $$;

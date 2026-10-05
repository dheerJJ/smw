import {
  Clinic,
  Profile,
  Patient,
  TreatmentPlan,
  Appointment,
  MessageTemplate,
  Message,
  RecoveredRevenueEvent,
  AuditLog,
} from "./types";

export const DEMO_CLINIC_ID = "c1111111-1111-1111-1111-111111111111";
export const DEMO_USER_ID = "u1111111-1111-1111-1111-111111111111";

class MockDataStore {
  private clinics: Map<string, Clinic> = new Map();
  private profiles: Map<string, Profile> = new Map();
  private patients: Map<string, Patient> = new Map();
  private treatmentPlans: Map<string, TreatmentPlan> = new Map();
  private appointments: Map<string, Appointment> = new Map();
  private templates: Map<string, MessageTemplate> = new Map();
  private messages: Map<string, Message> = new Map();
  private recoveredRevenueEvents: Map<string, RecoveredRevenueEvent> = new Map();
  private auditLogs: Map<string, AuditLog> = new Map();

  constructor() {
    this.seedInitialData();
  }

  public reset() {
    this.clinics.clear();
    this.profiles.clear();
    this.patients.clear();
    this.treatmentPlans.clear();
    this.appointments.clear();
    this.templates.clear();
    this.messages.clear();
    this.recoveredRevenueEvents.clear();
    this.auditLogs.clear();
    this.seedInitialData();
  }

  private seedInitialData() {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    // Helper for relative dates
    const addDays = (days: number): string => {
      const d = new Date(now);
      d.setDate(d.getDate() + days);
      return d.toISOString().split("T")[0];
    };

    // 1. Demo Clinic
    const demoClinic: Clinic = {
      id: DEMO_CLINIC_ID,
      name: "Apex Dental Care & Implant Center",
      doctor_name: "Dr. Rajesh Sharma, MDS",
      phone: "+919820123456",
      city: "Mumbai",
      timezone: "Asia/Kolkata",
      avg_treatment_value: 3500,
      whatsapp_phone_number_id: "109823451293847",
      whatsapp_access_token: null,
      whatsapp_business_account_id: "wamid_demo_9921",
      whatsapp_verified: true,
      quiet_hours_start: "21:00",
      quiet_hours_end: "09:00",
      rules_config: {
        reminder_day_before: { enabled: true, send_time: "18:00" },
        reminder_same_day: { enabled: true, hours_before: 2 },
        missed_followup: { enabled: true, morning_time: "10:00", second_nudge_days: 3 },
        sitting_followup: { enabled: true, first_nudge_days: 5, second_nudge_days: 10 },
        recall_6_month: { enabled: true, second_nudge_days: 7 },
      },
      created_at: now.toISOString(),
    };
    this.clinics.set(demoClinic.id, demoClinic);

    // 2. Demo User Profile
    const demoProfile: Profile = {
      id: DEMO_USER_ID,
      clinic_id: DEMO_CLINIC_ID,
      role: "owner",
      full_name: "Dr. Rajesh Sharma",
      created_at: now.toISOString(),
    };
    this.profiles.set(demoProfile.id, demoProfile);

    // 3. Default Message Templates
    const defaultTemplates: MessageTemplate[] = [
      {
        id: "t1-day-before-en",
        clinic_id: DEMO_CLINIC_ID,
        type: "reminder_day_before",
        name: "Appointment Reminder (Day Before - EN)",
        body: "Hello {{patient_name}}, this is a reminder from {{clinic_name}} for your dental appointment tomorrow at {{time}}. Please reply YES to confirm or NO to reschedule.",
        whatsapp_template_name: "appointment_reminder_day_before_en",
        language: "en",
        is_active: true,
        created_at: now.toISOString(),
      },
      {
        id: "t2-day-before-hi",
        clinic_id: DEMO_CLINIC_ID,
        type: "reminder_day_before",
        name: "Appointment Reminder (Day Before - HI)",
        body: "नमस्ते {{patient_name}}, यह {{clinic_name}} से कल {{time}} पर आपके दंत चिकित्सा परामर्श का स्मरण पत्र है। कृपया पुष्टि के लिए YES या पुनर्निर्धारण के लिए NO भेजें।",
        whatsapp_template_name: "appointment_reminder_day_before_hi",
        language: "hi",
        is_active: true,
        created_at: now.toISOString(),
      },
      {
        id: "t3-same-day",
        clinic_id: DEMO_CLINIC_ID,
        type: "reminder_same_day",
        name: "Same Day 2h Reminder",
        body: "Hello {{patient_name}}, your appointment with {{doctor_name}} is in 2 hours at {{time}}. See you shortly at {{clinic_name}}.",
        whatsapp_template_name: "appointment_reminder_same_day_en",
        language: "en",
        is_active: true,
        created_at: now.toISOString(),
      },
      {
        id: "t4-missed",
        clinic_id: DEMO_CLINIC_ID,
        type: "missed_followup",
        name: "Missed Appointment Follow-up",
        body: "Dear {{patient_name}}, we noticed you were unable to make it to your appointment at {{clinic_name}} today. Would you like to reschedule for this week? Reply YES to connect with our receptionist.",
        whatsapp_template_name: "appointment_missed_followup_en",
        language: "en",
        is_active: true,
        created_at: now.toISOString(),
      },
      {
        id: "t5-sitting",
        clinic_id: DEMO_CLINIC_ID,
        type: "sitting_followup",
        name: "Pending Treatment Sitting Follow-up",
        body: "Hello {{patient_name}}, you have {{remaining_sittings}} pending sitting(s) for your {{treatment_name}} at {{clinic_name}}. Completing timely ensures lasting results. Reply YES to schedule your next visit.",
        whatsapp_template_name: "treatment_sitting_followup_en",
        language: "en",
        is_active: true,
        created_at: now.toISOString(),
      },
      {
        id: "t6-recall",
        clinic_id: DEMO_CLINIC_ID,
        type: "recall_6_month",
        name: "6-Month Routine Dental Recall",
        body: "Hello {{patient_name}}, it has been 6 months since your last dental cleaning and checkup at {{clinic_name}}. Preventive checkups help catch issues early. Reply YES to book your slot.",
        whatsapp_template_name: "routine_recall_6_month_en",
        language: "en",
        is_active: true,
        created_at: now.toISOString(),
      },
    ];
    defaultTemplates.forEach((t) => this.templates.set(t.id, t));

    // 4. 25 Realistic Indian Patients
    const patientRawData = [
      { name: "Aarav Patel", phone: "+919820011221", optIn: true, lastVisit: -10, recall: 170, notes: "Molar RCT sitting 2 completed" },
      { name: "Priya Nair", phone: "+919820022332", optIn: true, lastVisit: -5, recall: 175, notes: "Root canal crown pending" },
      { name: "Rohan Mehta", phone: "+919820033443", optIn: true, lastVisit: -185, recall: -5, notes: "Due for 6-month routine scaling and checkup" },
      { name: "Ananya Sharma", phone: "+919820044554", optIn: true, lastVisit: -1, recall: 180, notes: "Composite restoration done" },
      { name: "Vikram Malhotra", phone: "+919820055665", optIn: true, lastVisit: -190, recall: -10, notes: "6-month recall overdue" },
      { name: "Sneha Kulkarni", phone: "+919820066776", optIn: true, lastVisit: -12, recall: 168, notes: "Aligners checkup" },
      { name: "Aditya Verma", phone: "+919820077887", optIn: true, lastVisit: -2, recall: 178, notes: "Missed appointment yesterday" },
      { name: "Kavita Sundaram", phone: "+919820088998", optIn: true, lastVisit: -45, recall: 135, notes: "Deep scaling required" },
      { name: "Rahul Deshmukh", phone: "+919820099009", optIn: false, lastVisit: -60, recall: 120, notes: "Patient opted out of automated WhatsApp" },
      { name: "Neha Gupta", phone: "+919820100110", optIn: true, lastVisit: -7, recall: 173, notes: "Wisdom tooth extraction follow-up" },
      { name: "Suresh Iyer", phone: "+919820111221", optIn: true, lastVisit: -182, recall: -2, notes: "Recall due for diabetic periodontal evaluation" },
      { name: "Meera Ranganathan", phone: "+919820122332", optIn: true, lastVisit: -20, recall: 160, notes: "Implant Osseointegration check" },
      { name: "Gautam Banerjee", phone: "+919820133443", optIn: true, lastVisit: -15, recall: 165, notes: "Dentures trial pending" },
      { name: "Pooja Bhatia", phone: "+919820144554", optIn: true, lastVisit: -3, recall: 177, notes: "Cosmetic veneer consultation" },
      { name: "Deepak Chopra", phone: "+919820155665", optIn: true, lastVisit: -90, recall: 90, notes: "Mild gingivitis treated" },
      { name: "Swati Agarwal", phone: "+919820166776", optIn: true, lastVisit: -4, recall: 176, notes: "Pediatric cavity restoration" },
      { name: "Arjun Reddy", phone: "+919820177887", optIn: true, lastVisit: -180, recall: 0, notes: "Recall due today" },
      { name: "Sunita Menon", phone: "+919820188998", optIn: true, lastVisit: -14, recall: 166, notes: "RCT sitting 1 finished, sitting 2 pending" },
      { name: "Karan Singhania", phone: "+919820199009", optIn: true, lastVisit: -18, recall: 162, notes: "Teeth whitening follow-up" },
      { name: "Tanvi Joshi", phone: "+919820200110", optIn: true, lastVisit: -195, recall: -15, notes: "Recall overdue by 2 weeks" },
      { name: "Manish Tiwari", phone: "+919820211221", optIn: true, lastVisit: -8, recall: 172, notes: "Night guard adjustment" },
      { name: "Ritu Saxena", phone: "+919820222332", optIn: true, lastVisit: -6, recall: 174, notes: "Crown cementation needed" },
      { name: "Harish Trivedi", phone: "+919820233443", optIn: true, lastVisit: -175, recall: 5, notes: "Recall due next week" },
      { name: "Ananya Roy", phone: "+919820244554", optIn: true, lastVisit: -11, recall: 169, notes: "Composite bonding" },
      { name: "Devendra Shah", phone: "+919820255665", optIn: true, lastVisit: -30, recall: 150, notes: "Periodontal maintenance" },
    ];

    const createdPatients: Patient[] = [];
    patientRawData.forEach((p, idx) => {
      const patient: Patient = {
        id: `p-${idx + 1}`,
        clinic_id: DEMO_CLINIC_ID,
        name: p.name,
        phone: p.phone,
        whatsapp_opt_in: p.optIn,
        opt_in_source: p.optIn ? "reception_desk" : "manual_entry",
        opt_in_at: addDays(p.lastVisit) + "T10:00:00Z",
        notes: p.notes,
        last_visit_date: addDays(p.lastVisit),
        recall_due_date: addDays(p.recall),
        is_active: true,
        created_at: addDays(p.lastVisit - 30) + "T09:00:00Z",
      };
      this.patients.set(patient.id, patient);
      createdPatients.push(patient);
    });

    // 5. Treatment Plans
    const tp1: TreatmentPlan = {
      id: "tp-1",
      clinic_id: DEMO_CLINIC_ID,
      patient_id: "p-2", // Priya Nair
      treatment_name: "Root Canal Treatment + Zirconia Crown",
      total_sittings: 3,
      completed_sittings: 1,
      estimated_value: 9500,
      status: "active",
      created_at: addDays(-15) + "T10:00:00Z",
    };
    const tp2: TreatmentPlan = {
      id: "tp-2",
      clinic_id: DEMO_CLINIC_ID,
      patient_id: "p-18", // Sunita Menon
      treatment_name: "Multi-sitting Root Canal",
      total_sittings: 2,
      completed_sittings: 1,
      estimated_value: 5000,
      status: "active",
      created_at: addDays(-14) + "T11:00:00Z",
    };
    const tp3: TreatmentPlan = {
      id: "tp-3",
      clinic_id: DEMO_CLINIC_ID,
      patient_id: "p-1", // Aarav Patel
      treatment_name: "Molar RCT & Post Core",
      total_sittings: 2,
      completed_sittings: 2,
      estimated_value: 6000,
      status: "completed",
      created_at: addDays(-25) + "T10:00:00Z",
    };
    [tp1, tp2, tp3].forEach((tp) => this.treatmentPlans.set(tp.id, tp));

    // 6. Appointments
    const tomorrow1030 = new Date(now);
    tomorrow1030.setDate(tomorrow1030.getDate() + 1);
    tomorrow1030.setHours(10, 30, 0, 0);

    const tomorrow1500 = new Date(now);
    tomorrow1500.setDate(tomorrow1500.getDate() + 1);
    tomorrow1500.setHours(15, 0, 0, 0);

    const tomorrow1730 = new Date(now);
    tomorrow1730.setDate(tomorrow1730.getDate() + 1);
    tomorrow1730.setHours(17, 30, 0, 0);

    const todayIn3Hours = new Date(now.getTime() + 3 * 60 * 60 * 1000);
    const todayIn5Hours = new Date(now.getTime() + 5 * 60 * 60 * 1000);

    const yesterday1100 = new Date(now);
    yesterday1100.setDate(yesterday1100.getDate() - 1);
    yesterday1100.setHours(11, 0, 0, 0);

    const defaultAppointments: Appointment[] = [
      {
        id: "apt-1",
        clinic_id: DEMO_CLINIC_ID,
        patient_id: "p-1",
        treatment_plan_id: "tp-3",
        starts_at: tomorrow1030.toISOString(),
        duration_minutes: 45,
        status: "scheduled",
        confirmation_status: "pending",
        notes: "Crown measurement and shade selection",
        created_at: addDays(-2) + "T12:00:00Z",
      },
      {
        id: "apt-2",
        clinic_id: DEMO_CLINIC_ID,
        patient_id: "p-4",
        treatment_plan_id: null,
        starts_at: tomorrow1500.toISOString(),
        duration_minutes: 30,
        status: "scheduled",
        confirmation_status: "confirmed_patient",
        notes: "Composite polish & finishing",
        created_at: addDays(-1) + "T14:00:00Z",
      },
      {
        id: "apt-3",
        clinic_id: DEMO_CLINIC_ID,
        patient_id: "p-6",
        treatment_plan_id: null,
        starts_at: tomorrow1730.toISOString(),
        duration_minutes: 30,
        status: "scheduled",
        confirmation_status: "pending",
        notes: "Aligner tray 4 delivery",
        created_at: addDays(-3) + "T16:00:00Z",
      },
      {
        id: "apt-4",
        clinic_id: DEMO_CLINIC_ID,
        patient_id: "p-2",
        treatment_plan_id: "tp-1",
        starts_at: todayIn3Hours.toISOString(),
        duration_minutes: 45,
        status: "scheduled",
        confirmation_status: "pending",
        notes: "RCT Sitting 2: Biomechanical preparation",
        created_at: addDays(-3) + "T10:00:00Z",
      },
      {
        id: "apt-5",
        clinic_id: DEMO_CLINIC_ID,
        patient_id: "p-8",
        treatment_plan_id: null,
        starts_at: todayIn5Hours.toISOString(),
        duration_minutes: 30,
        status: "confirmed",
        confirmation_status: "confirmed_patient",
        notes: "Routine examination and periodontal check",
        created_at: addDays(-2) + "T11:00:00Z",
      },
      {
        id: "apt-6",
        clinic_id: DEMO_CLINIC_ID,
        patient_id: "p-7",
        treatment_plan_id: null,
        starts_at: yesterday1100.toISOString(),
        duration_minutes: 30,
        status: "missed",
        confirmation_status: "pending",
        notes: "Patient missed appointment yesterday",
        created_at: addDays(-3) + "T15:00:00Z",
      },
    ];
    defaultAppointments.forEach((a) => this.appointments.set(a.id, a));

    // 7. Recovered Revenue Events
    const recoveredEvent: RecoveredRevenueEvent = {
      id: "rev-1",
      clinic_id: DEMO_CLINIC_ID,
      patient_id: "p-1",
      appointment_id: "apt-1",
      amount: 6000,
      reason: "sitting_completed",
      created_at: addDays(-3) + "T16:00:00Z",
    };
    this.recoveredRevenueEvents.set(recoveredEvent.id, recoveredEvent);

    // 8. Sample Outbound Message
    const sampleMsg: Message = {
      id: "msg-1",
      clinic_id: DEMO_CLINIC_ID,
      patient_id: "p-4",
      appointment_id: "apt-2",
      template_id: "t1-day-before-en",
      direction: "outbound",
      body: "Hello Ananya Sharma, this is a reminder from Apex Dental Care & Implant Center for your dental appointment tomorrow at 03:00 PM. Please reply YES to confirm or NO to reschedule.",
      status: "delivered",
      provider_message_id: "wamid_demo_1001",
      error: null,
      scheduled_for: addDays(-1) + "T18:00:00Z",
      sent_at: addDays(-1) + "T18:00:02Z",
      idempotency_key: `rem_day_p-4_${todayStr}`,
      retry_count: 0,
      created_at: addDays(-1) + "T18:00:00Z",
    };
    this.messages.set(sampleMsg.id, sampleMsg);

    // Sample Inbound Confirmation Message
    const sampleReply: Message = {
      id: "msg-2",
      clinic_id: DEMO_CLINIC_ID,
      patient_id: "p-4",
      appointment_id: "apt-2",
      template_id: null,
      direction: "inbound",
      body: "YES",
      status: "received",
      provider_message_id: "wamid_inbound_1002",
      error: null,
      scheduled_for: null,
      sent_at: addDays(-1) + "T18:15:20Z",
      idempotency_key: "reply_1002",
      retry_count: 0,
      created_at: addDays(-1) + "T18:15:20Z",
    };
    this.messages.set(sampleReply.id, sampleReply);
  }

  // --- Clinics ---
  public getClinic(id: string = DEMO_CLINIC_ID): Clinic | null {
    return this.clinics.get(id) || null;
  }
  public updateClinic(id: string, updates: Partial<Clinic>): Clinic | null {
    const c = this.clinics.get(id);
    if (!c) return null;
    const updated = { ...c, ...updates };
    this.clinics.set(id, updated);
    return updated;
  }

  // --- Profiles ---
  public getProfile(id: string = DEMO_USER_ID): Profile | null {
    return this.profiles.get(id) || null;
  }
  public listProfiles(clinicId: string = DEMO_CLINIC_ID): Profile[] {
    return Array.from(this.profiles.values()).filter((p) => p.clinic_id === clinicId);
  }
  public addProfile(profile: Profile): Profile {
    this.profiles.set(profile.id, profile);
    return profile;
  }

  // --- Patients ---
  public listPatients(clinicId: string = DEMO_CLINIC_ID): Patient[] {
    return Array.from(this.patients.values())
      .filter((p) => p.clinic_id === clinicId && p.is_active)
      .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
  }
  public getPatient(id: string): Patient | null {
    const p = this.patients.get(id);
    return p && p.is_active ? p : null;
  }
  public getPatientByPhone(clinicId: string, phone: string): Patient | null {
    return (
      Array.from(this.patients.values()).find(
        (p) => p.clinic_id === clinicId && p.phone === phone && p.is_active
      ) || null
    );
  }
  public createPatient(patient: Omit<Patient, "id" | "created_at">): Patient {
    const id = `p-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newPatient: Patient = {
      ...patient,
      id,
      created_at: new Date().toISOString(),
    };
    this.patients.set(id, newPatient);
    return newPatient;
  }
  public updatePatient(id: string, updates: Partial<Patient>): Patient | null {
    const p = this.patients.get(id);
    if (!p) return null;
    const updated = { ...p, ...updates };
    this.patients.set(id, updated);
    return updated;
  }
  public deletePatient(id: string): boolean {
    const p = this.patients.get(id);
    if (!p) return false;
    // Soft delete or hard delete with audit log
    p.is_active = false;
    this.patients.set(id, p);
    return true;
  }

  // --- Treatment Plans ---
  public listTreatmentPlans(clinicId: string = DEMO_CLINIC_ID, patientId?: string): TreatmentPlan[] {
    return Array.from(this.treatmentPlans.values()).filter((tp) => {
      if (tp.clinic_id !== clinicId) return false;
      if (patientId && tp.patient_id !== patientId) return false;
      return true;
    });
  }
  public getTreatmentPlan(id: string): TreatmentPlan | null {
    return this.treatmentPlans.get(id) || null;
  }
  public createTreatmentPlan(tp: Omit<TreatmentPlan, "id" | "created_at">): TreatmentPlan {
    const id = `tp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newTp: TreatmentPlan = {
      ...tp,
      id,
      created_at: new Date().toISOString(),
    };
    this.treatmentPlans.set(id, newTp);
    return newTp;
  }
  public updateTreatmentPlan(id: string, updates: Partial<TreatmentPlan>): TreatmentPlan | null {
    const tp = this.treatmentPlans.get(id);
    if (!tp) return null;
    const updated = { ...tp, ...updates };
    this.treatmentPlans.set(id, updated);
    return updated;
  }

  // --- Appointments ---
  public listAppointments(clinicId: string = DEMO_CLINIC_ID, patientId?: string): Appointment[] {
    return Array.from(this.appointments.values())
      .filter((a) => {
        if (a.clinic_id !== clinicId) return false;
        if (patientId && a.patient_id !== patientId) return false;
        return true;
      })
      .map((a) => ({
        ...a,
        patient: this.patients.get(a.patient_id) || undefined,
        treatment_plan: a.treatment_plan_id ? this.treatmentPlans.get(a.treatment_plan_id) || undefined : undefined,
      }))
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  }
  public getAppointment(id: string): Appointment | null {
    const a = this.appointments.get(id);
    if (!a) return null;
    return {
      ...a,
      patient: this.patients.get(a.patient_id) || undefined,
      treatment_plan: a.treatment_plan_id ? this.treatmentPlans.get(a.treatment_plan_id) || undefined : undefined,
    };
  }
  public createAppointment(apt: Omit<Appointment, "id" | "created_at">): Appointment {
    const id = `apt-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newApt: Appointment = {
      ...apt,
      id,
      created_at: new Date().toISOString(),
    };
    this.appointments.set(id, newApt);
    return newApt;
  }
  public updateAppointment(id: string, updates: Partial<Appointment>): Appointment | null {
    const a = this.appointments.get(id);
    if (!a) return null;
    const updated = { ...a, ...updates };
    this.appointments.set(id, updated);
    return updated;
  }

  // --- Message Templates ---
  public listTemplates(clinicId: string = DEMO_CLINIC_ID): MessageTemplate[] {
    return Array.from(this.templates.values()).filter((t) => t.clinic_id === clinicId);
  }
  public getTemplate(id: string): MessageTemplate | null {
    return this.templates.get(id) || null;
  }
  public updateTemplate(id: string, updates: Partial<MessageTemplate>): MessageTemplate | null {
    const t = this.templates.get(id);
    if (!t) return null;
    const updated = { ...t, ...updates };
    this.templates.set(id, updated);
    return updated;
  }

  // --- Messages ---
  public listMessages(clinicId: string = DEMO_CLINIC_ID, patientId?: string): Message[] {
    return Array.from(this.messages.values())
      .filter((m) => {
        if (m.clinic_id !== clinicId) return false;
        if (patientId && m.patient_id !== patientId) return false;
        return true;
      })
      .map((m) => ({
        ...m,
        patient: this.patients.get(m.patient_id) || undefined,
      }))
      .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
  }
  public getMessageByIdempotencyKey(key: string): Message | null {
    return Array.from(this.messages.values()).find((m) => m.idempotency_key === key) || null;
  }
  public createMessage(msg: Omit<Message, "id" | "created_at">): Message {
    const id = `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newMsg: Message = {
      ...msg,
      id,
      created_at: new Date().toISOString(),
    };
    this.messages.set(id, newMsg);
    return newMsg;
  }
  public updateMessage(id: string, updates: Partial<Message>): Message | null {
    const m = this.messages.get(id);
    if (!m) return null;
    const updated = { ...m, ...updates };
    this.messages.set(id, updated);
    return updated;
  }

  // --- Recovered Revenue Events ---
  public listRecoveredEvents(clinicId: string = DEMO_CLINIC_ID): RecoveredRevenueEvent[] {
    return Array.from(this.recoveredRevenueEvents.values())
      .filter((e) => e.clinic_id === clinicId)
      .map((e) => ({
        ...e,
        patient: this.patients.get(e.patient_id) || undefined,
      }))
      .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
  }
  public createRecoveredEvent(event: Omit<RecoveredRevenueEvent, "id" | "created_at">): RecoveredRevenueEvent {
    const id = `rev-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newEvent: RecoveredRevenueEvent = {
      ...event,
      id,
      created_at: new Date().toISOString(),
    };
    this.recoveredRevenueEvents.set(id, newEvent);
    return newEvent;
  }

  // --- Audit Log ---
  public logAudit(log: Omit<AuditLog, "id" | "created_at">): AuditLog {
    const id = `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const entry: AuditLog = {
      ...log,
      id,
      created_at: new Date().toISOString(),
    };
    this.auditLogs.set(id, entry);
    return entry;
  }
  public listAuditLogs(clinicId: string = DEMO_CLINIC_ID): AuditLog[] {
    return Array.from(this.auditLogs.values())
      .filter((a) => a.clinic_id === clinicId)
      .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
  }
}

// Global Singleton for runtime consistency
declare global {
  // eslint-disable-next-line no-var
  var __mockDataStore: MockDataStore | undefined;
}

export const mockStore = globalThis.__mockDataStore || new MockDataStore();
if (process.env.NODE_ENV !== "production") {
  globalThis.__mockDataStore = mockStore;
}

export type UserRole = "owner" | "staff";
export type TreatmentStatus = "active" | "completed" | "abandoned";
export type AppointmentStatus = "scheduled" | "confirmed" | "completed" | "missed" | "cancelled" | "rescheduled";
export type ConfirmationStatus = "pending" | "confirmed_patient" | "cancelled_patient" | "reschedule_requested";
export type TemplateType =
  | "reminder_day_before"
  | "reminder_same_day"
  | "missed_followup"
  | "sitting_followup"
  | "recall_6_month"
  | "custom";
export type MessageDirection = "outbound" | "inbound";
export type MessageStatus = "queued" | "sent" | "delivered" | "read" | "failed" | "received";
export type RecoveredReason = "missed_rebooked" | "sitting_completed" | "recall_booked";

export interface AutomationRulesConfig {
  reminder_day_before: { enabled: boolean; send_time: string }; // e.g. "18:00"
  reminder_same_day: { enabled: boolean; hours_before: number }; // e.g. 2
  missed_followup: { enabled: boolean; morning_time: string; second_nudge_days: number }; // e.g. "10:00", 3
  sitting_followup: { enabled: boolean; first_nudge_days: number; second_nudge_days: number }; // e.g. 5, 10
  recall_6_month: { enabled: boolean; second_nudge_days: number }; // e.g. 7
}

export interface Clinic {
  id: string;
  name: string;
  doctor_name: string;
  phone: string | null;
  city: string;
  timezone: string;
  avg_treatment_value: number;
  whatsapp_phone_number_id: string | null;
  whatsapp_access_token?: string | null;
  whatsapp_business_account_id?: string | null;
  whatsapp_verified: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  rules_config: AutomationRulesConfig;
  created_at: string;
}

export interface Profile {
  id: string;
  clinic_id: string;
  role: UserRole;
  full_name: string;
  created_at: string;
}

export interface Patient {
  id: string;
  clinic_id: string;
  name: string;
  phone: string; // E.164 (+91XXXXXXXXXX)
  whatsapp_opt_in: boolean;
  opt_in_source: string;
  opt_in_at: string;
  notes: string | null;
  last_visit_date: string | null;
  recall_due_date: string | null;
  is_active: boolean;
  created_at: string;
}

export interface TreatmentPlan {
  id: string;
  clinic_id: string;
  patient_id: string;
  treatment_name: string;
  total_sittings: number;
  completed_sittings: number;
  estimated_value: number;
  status: TreatmentStatus;
  created_at: string;
}

export interface Appointment {
  id: string;
  clinic_id: string;
  patient_id: string;
  treatment_plan_id: string | null;
  starts_at: string;
  duration_minutes: number;
  status: AppointmentStatus;
  confirmation_status: ConfirmationStatus;
  notes: string | null;
  created_at: string;
  // Joined fields
  patient?: Patient;
  treatment_plan?: TreatmentPlan;
}

export interface MessageTemplate {
  id: string;
  clinic_id: string;
  type: TemplateType;
  name: string;
  body: string;
  whatsapp_template_name: string;
  language: "en" | "hi";
  is_active: boolean;
  created_at: string;
}

export interface Message {
  id: string;
  clinic_id: string;
  patient_id: string;
  appointment_id: string | null;
  template_id: string | null;
  direction: MessageDirection;
  body: string;
  status: MessageStatus;
  provider_message_id: string | null;
  error: string | null;
  scheduled_for: string | null;
  sent_at: string | null;
  idempotency_key: string | null;
  retry_count: number;
  created_at: string;
  patient?: Patient;
}

export interface RecoveredRevenueEvent {
  id: string;
  clinic_id: string;
  patient_id: string;
  appointment_id: string | null;
  amount: number;
  reason: RecoveredReason;
  created_at: string;
  patient?: Patient;
}

export interface AuditLog {
  id: string;
  clinic_id: string;
  user_id: string | null;
  action: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

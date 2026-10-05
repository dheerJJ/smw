import { z } from "zod";
import { normalizeIndianPhone } from "../utils";

// Custom refinement for Indian phone numbers
export const IndianPhoneSchema = z.string().superRefine((val, ctx) => {
  const res = normalizeIndianPhone(val);
  if (!res.valid) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: res.error || "Invalid Indian mobile number. Must be 10 digits starting with 6, 7, 8, or 9.",
    });
  }
});

// Patient Validation Schema
export const PatientSchema = z.object({
  name: z.string().min(2, "Patient name must be at least 2 characters").max(100),
  phone: IndianPhoneSchema,
  whatsapp_opt_in: z.boolean().default(false),
  opt_in_source: z.string().default("manual_entry"),
  notes: z.string().optional().nullable(),
  last_visit_date: z.string().optional().nullable(),
  recall_due_date: z.string().optional().nullable(),
});

export const PatientUpdateSchema = PatientSchema.partial();

// Appointment Validation Schema
export const AppointmentSchema = z.object({
  patient_id: z.string().min(1, "Please select a patient"),
  treatment_plan_id: z.string().optional().nullable(),
  starts_at: z.string().min(1, "Appointment date and time is required"),
  duration_minutes: z.coerce.number().min(15).max(360).default(30),
  status: z.enum(["scheduled", "confirmed", "completed", "missed", "cancelled", "rescheduled"]).default("scheduled"),
  confirmation_status: z.enum(["pending", "confirmed_patient", "cancelled_patient", "reschedule_requested"]).default("pending"),
  notes: z.string().optional().nullable(),
});

// Treatment Plan Schema
export const TreatmentPlanSchema = z.object({
  patient_id: z.string().min(1, "Patient is required"),
  treatment_name: z.string().min(2, "Treatment name is required"),
  total_sittings: z.coerce.number().min(1).default(1),
  completed_sittings: z.coerce.number().min(0).default(0),
  estimated_value: z.coerce.number().min(0).default(0),
  status: z.enum(["active", "completed", "abandoned"]).default("active"),
});

// Message Template Schema
export const MessageTemplateSchema = z.object({
  name: z.string().min(2, "Template name is required"),
  body: z.string().min(10, "Template body must be at least 10 characters"),
  whatsapp_template_name: z.string().min(2, "WhatsApp template name is required"),
  language: z.enum(["en", "hi"]).default("en"),
  is_active: z.boolean().default(true),
});

// Clinic Profile & Settings Schema
export const ClinicSettingsSchema = z.object({
  name: z.string().min(2, "Clinic name is required"),
  doctor_name: z.string().min(2, "Doctor name is required"),
  phone: IndianPhoneSchema.optional().nullable(),
  city: z.string().min(2, "City is required"),
  timezone: z.string().default("Asia/Kolkata"),
  avg_treatment_value: z.coerce.number().min(100).default(2500),
  whatsapp_phone_number_id: z.string().optional().nullable(),
  whatsapp_access_token: z.string().optional().nullable(),
  whatsapp_business_account_id: z.string().optional().nullable(),
  quiet_hours_start: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Must be HH:mm (e.g. 21:00)").default("21:00"),
  quiet_hours_end: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Must be HH:mm (e.g. 09:00)").default("09:00"),
});

// CSV Row Schema for Patient Import
export const PatientCsvRowSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: IndianPhoneSchema,
  notes: z.string().optional(),
  last_visit_date: z.string().optional(),
  recall_due_date: z.string().optional(),
});

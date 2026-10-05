import { isSupabaseConfigured, createAdminSupabaseClient } from "./supabase";
import { mockStore, DEMO_CLINIC_ID, DEMO_USER_ID } from "./mock-store";
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

/**
 * Unified Repository Layer for SmileRecall
 * Seamlessly interfaces with Supabase (when configured) or the Mock Store (offline / test mode)
 */
export const dbRepo = {
  // Clinics
  async getClinic(clinicId: string = DEMO_CLINIC_ID): Promise<Clinic | null> {
    if (isSupabaseConfigured) {
      const supabase = createAdminSupabaseClient();
      if (supabase) {
        const { data, error } = await supabase.from("clinics").select("*").eq("id", clinicId).single();
        if (!error && data) return data as Clinic;
      }
    }
    return mockStore.getClinic(clinicId);
  },

  async updateClinic(clinicId: string, updates: Partial<Clinic>): Promise<Clinic | null> {
    if (isSupabaseConfigured) {
      const supabase = createAdminSupabaseClient();
      if (supabase) {
        const { data, error } = await supabase
          .from("clinics")
          .update(updates)
          .eq("id", clinicId)
          .select()
          .single();
        if (!error && data) return data as Clinic;
      }
    }
    return mockStore.updateClinic(clinicId, updates);
  },

  // Profiles
  async getProfile(userId: string = DEMO_USER_ID): Promise<Profile | null> {
    if (isSupabaseConfigured) {
      const supabase = createAdminSupabaseClient();
      if (supabase) {
        const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
        if (!error && data) return data as Profile;
      }
    }
    return mockStore.getProfile(userId);
  },

  async listProfiles(clinicId: string = DEMO_CLINIC_ID): Promise<Profile[]> {
    if (isSupabaseConfigured) {
      const supabase = createAdminSupabaseClient();
      if (supabase) {
        const { data, error } = await supabase.from("profiles").select("*").eq("clinic_id", clinicId);
        if (!error && data) return data as Profile[];
      }
    }
    return mockStore.listProfiles(clinicId);
  },

  async createProfile(profile: Profile): Promise<Profile> {
    if (isSupabaseConfigured) {
      const supabase = createAdminSupabaseClient();
      if (supabase) {
        const { data, error } = await supabase.from("profiles").insert(profile).select().single();
        if (!error && data) return data as Profile;
      }
    }
    return mockStore.addProfile(profile);
  },

  // Patients
  async listPatients(clinicId: string = DEMO_CLINIC_ID): Promise<Patient[]> {
    if (isSupabaseConfigured) {
      const supabase = createAdminSupabaseClient();
      if (supabase) {
        const { data, error } = await supabase
          .from("patients")
          .select("*")
          .eq("clinic_id", clinicId)
          .eq("is_active", true)
          .order("created_at", { ascending: false });
        if (!error && data) return data as Patient[];
      }
    }
    return mockStore.listPatients(clinicId);
  },

  async getPatient(id: string): Promise<Patient | null> {
    if (isSupabaseConfigured) {
      const supabase = createAdminSupabaseClient();
      if (supabase) {
        const { data, error } = await supabase
          .from("patients")
          .select("*")
          .eq("id", id)
          .eq("is_active", true)
          .single();
        if (!error && data) return data as Patient;
      }
    }
    return mockStore.getPatient(id);
  },

  async getPatientByPhone(clinicId: string, phone: string): Promise<Patient | null> {
    if (isSupabaseConfigured) {
      const supabase = createAdminSupabaseClient();
      if (supabase) {
        const { data, error } = await supabase
          .from("patients")
          .select("*")
          .eq("clinic_id", clinicId)
          .eq("phone", phone)
          .eq("is_active", true)
          .maybeSingle();
        if (!error && data) return data as Patient;
      }
    }
    return mockStore.getPatientByPhone(clinicId, phone);
  },

  async createPatient(patient: Omit<Patient, "id" | "created_at">): Promise<Patient> {
    if (isSupabaseConfigured) {
      const supabase = createAdminSupabaseClient();
      if (supabase) {
        const { data, error } = await supabase.from("patients").insert(patient).select().single();
        if (!error && data) return data as Patient;
      }
    }
    return mockStore.createPatient(patient);
  },

  async updatePatient(id: string, updates: Partial<Patient>): Promise<Patient | null> {
    if (isSupabaseConfigured) {
      const supabase = createAdminSupabaseClient();
      if (supabase) {
        const { data, error } = await supabase
          .from("patients")
          .update(updates)
          .eq("id", id)
          .select()
          .single();
        if (!error && data) return data as Patient;
      }
    }
    return mockStore.updatePatient(id, updates);
  },

  async deletePatient(id: string): Promise<boolean> {
    if (isSupabaseConfigured) {
      const supabase = createAdminSupabaseClient();
      if (supabase) {
        const { error } = await supabase.from("patients").update({ is_active: false }).eq("id", id);
        return !error;
      }
    }
    return mockStore.deletePatient(id);
  },

  // Treatment Plans
  async listTreatmentPlans(clinicId: string = DEMO_CLINIC_ID, patientId?: string): Promise<TreatmentPlan[]> {
    if (isSupabaseConfigured) {
      const supabase = createAdminSupabaseClient();
      if (supabase) {
        let q = supabase.from("treatment_plans").select("*").eq("clinic_id", clinicId);
        if (patientId) q = q.eq("patient_id", patientId);
        const { data, error } = await q.order("created_at", { ascending: false });
        if (!error && data) return data as TreatmentPlan[];
      }
    }
    return mockStore.listTreatmentPlans(clinicId, patientId);
  },

  async createTreatmentPlan(tp: Omit<TreatmentPlan, "id" | "created_at">): Promise<TreatmentPlan> {
    if (isSupabaseConfigured) {
      const supabase = createAdminSupabaseClient();
      if (supabase) {
        const { data, error } = await supabase.from("treatment_plans").insert(tp).select().single();
        if (!error && data) return data as TreatmentPlan;
      }
    }
    return mockStore.createTreatmentPlan(tp);
  },

  async updateTreatmentPlan(id: string, updates: Partial<TreatmentPlan>): Promise<TreatmentPlan | null> {
    if (isSupabaseConfigured) {
      const supabase = createAdminSupabaseClient();
      if (supabase) {
        const { data, error } = await supabase
          .from("treatment_plans")
          .update(updates)
          .eq("id", id)
          .select()
          .single();
        if (!error && data) return data as TreatmentPlan;
      }
    }
    return mockStore.updateTreatmentPlan(id, updates);
  },

  // Appointments
  async listAppointments(clinicId: string = DEMO_CLINIC_ID, patientId?: string): Promise<Appointment[]> {
    if (isSupabaseConfigured) {
      const supabase = createAdminSupabaseClient();
      if (supabase) {
        let q = supabase
          .from("appointments")
          .select("*, patient:patients(*), treatment_plan:treatment_plans(*)")
          .eq("clinic_id", clinicId);
        if (patientId) q = q.eq("patient_id", patientId);
        const { data, error } = await q.order("starts_at", { ascending: true });
        if (!error && data) return data as Appointment[];
      }
    }
    return mockStore.listAppointments(clinicId, patientId);
  },

  async getAppointment(id: string): Promise<Appointment | null> {
    if (isSupabaseConfigured) {
      const supabase = createAdminSupabaseClient();
      if (supabase) {
        const { data, error } = await supabase
          .from("appointments")
          .select("*, patient:patients(*), treatment_plan:treatment_plans(*)")
          .eq("id", id)
          .single();
        if (!error && data) return data as Appointment;
      }
    }
    return mockStore.getAppointment(id);
  },

  async createAppointment(apt: Omit<Appointment, "id" | "created_at">): Promise<Appointment> {
    if (isSupabaseConfigured) {
      const supabase = createAdminSupabaseClient();
      if (supabase) {
        const { data, error } = await supabase.from("appointments").insert(apt).select().single();
        if (!error && data) {
          return (await this.getAppointment(data.id)) || (data as Appointment);
        }
      }
    }
    return mockStore.createAppointment(apt);
  },

  async updateAppointment(id: string, updates: Partial<Appointment>): Promise<Appointment | null> {
    if (isSupabaseConfigured) {
      const supabase = createAdminSupabaseClient();
      if (supabase) {
        const { data, error } = await supabase
          .from("appointments")
          .update(updates)
          .eq("id", id)
          .select()
          .single();
        if (!error && data) {
          return (await this.getAppointment(data.id)) || (data as Appointment);
        }
      }
    }
    return mockStore.updateAppointment(id, updates);
  },

  // Templates
  async listTemplates(clinicId: string = DEMO_CLINIC_ID): Promise<MessageTemplate[]> {
    if (isSupabaseConfigured) {
      const supabase = createAdminSupabaseClient();
      if (supabase) {
        const { data, error } = await supabase.from("message_templates").select("*").eq("clinic_id", clinicId);
        if (!error && data) return data as MessageTemplate[];
      }
    }
    return mockStore.listTemplates(clinicId);
  },

  async getTemplate(id: string): Promise<MessageTemplate | null> {
    if (isSupabaseConfigured) {
      const supabase = createAdminSupabaseClient();
      if (supabase) {
        const { data, error } = await supabase.from("message_templates").select("*").eq("id", id).single();
        if (!error && data) return data as MessageTemplate;
      }
    }
    return mockStore.getTemplate(id);
  },

  async updateTemplate(id: string, updates: Partial<MessageTemplate>): Promise<MessageTemplate | null> {
    if (isSupabaseConfigured) {
      const supabase = createAdminSupabaseClient();
      if (supabase) {
        const { data, error } = await supabase
          .from("message_templates")
          .update(updates)
          .eq("id", id)
          .select()
          .single();
        if (!error && data) return data as MessageTemplate;
      }
    }
    return mockStore.updateTemplate(id, updates);
  },

  // Messages
  async listMessages(clinicId: string = DEMO_CLINIC_ID, patientId?: string): Promise<Message[]> {
    if (isSupabaseConfigured) {
      const supabase = createAdminSupabaseClient();
      if (supabase) {
        let q = supabase.from("messages").select("*, patient:patients(*)").eq("clinic_id", clinicId);
        if (patientId) q = q.eq("patient_id", patientId);
        const { data, error } = await q.order("created_at", { ascending: false });
        if (!error && data) return data as Message[];
      }
    }
    return mockStore.listMessages(clinicId, patientId);
  },

  async getMessageByIdempotencyKey(key: string): Promise<Message | null> {
    if (isSupabaseConfigured) {
      const supabase = createAdminSupabaseClient();
      if (supabase) {
        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .eq("idempotency_key", key)
          .maybeSingle();
        if (!error && data) return data as Message;
      }
    }
    return mockStore.getMessageByIdempotencyKey(key);
  },

  async createMessage(msg: Omit<Message, "id" | "created_at">): Promise<Message> {
    if (isSupabaseConfigured) {
      const supabase = createAdminSupabaseClient();
      if (supabase) {
        const { data, error } = await supabase.from("messages").insert(msg).select().single();
        if (!error && data) return data as Message;
      }
    }
    return mockStore.createMessage(msg);
  },

  async updateMessage(id: string, updates: Partial<Message>): Promise<Message | null> {
    if (isSupabaseConfigured) {
      const supabase = createAdminSupabaseClient();
      if (supabase) {
        const { data, error } = await supabase
          .from("messages")
          .update(updates)
          .eq("id", id)
          .select()
          .single();
        if (!error && data) return data as Message;
      }
    }
    return mockStore.updateMessage(id, updates);
  },

  // Recovered Revenue
  async listRecoveredEvents(clinicId: string = DEMO_CLINIC_ID): Promise<RecoveredRevenueEvent[]> {
    if (isSupabaseConfigured) {
      const supabase = createAdminSupabaseClient();
      if (supabase) {
        const { data, error } = await supabase
          .from("recovered_revenue_events")
          .select("*, patient:patients(*)")
          .eq("clinic_id", clinicId)
          .order("created_at", { ascending: false });
        if (!error && data) return data as RecoveredRevenueEvent[];
      }
    }
    return mockStore.listRecoveredEvents(clinicId);
  },

  async createRecoveredEvent(event: Omit<RecoveredRevenueEvent, "id" | "created_at">): Promise<RecoveredRevenueEvent> {
    if (isSupabaseConfigured) {
      const supabase = createAdminSupabaseClient();
      if (supabase) {
        const { data, error } = await supabase.from("recovered_revenue_events").insert(event).select().single();
        if (!error && data) return data as RecoveredRevenueEvent;
      }
    }
    return mockStore.createRecoveredEvent(event);
  },

  // Audit Log
  async logAudit(log: Omit<AuditLog, "id" | "created_at">): Promise<AuditLog> {
    if (isSupabaseConfigured) {
      const supabase = createAdminSupabaseClient();
      if (supabase) {
        const { data } = await supabase.from("audit_log").insert(log).select().single();
        if (data) return data as AuditLog;
      }
    }
    return mockStore.logAudit(log);
  },

  async listAuditLogs(clinicId: string = DEMO_CLINIC_ID): Promise<AuditLog[]> {
    if (isSupabaseConfigured) {
      const supabase = createAdminSupabaseClient();
      if (supabase) {
        const { data, error } = await supabase
          .from("audit_log")
          .select("*")
          .eq("clinic_id", clinicId)
          .order("created_at", { ascending: false });
        if (!error && data) return data as AuditLog[];
      }
    }
    return mockStore.listAuditLogs(clinicId);
  },
};

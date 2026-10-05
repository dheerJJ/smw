import { dbRepo } from "../db/repo";
import { Clinic, Patient, Appointment, MessageTemplate } from "../db/types";
import { getWhatsAppProvider } from "../whatsapp";
import { formatTimeIN, formatDateIN } from "../utils";

export interface AutomationJobResult {
  dayBeforeSent: number;
  sameDaySent: number;
  missedFollowupsSent: number;
  sittingFollowupsSent: number;
  recallsSent: number;
  retriesProcessed: number;
  queuedForQuietHours: number;
  errors: string[];
}

/**
 * Checks whether a given timestamp falls in clinic quiet hours (e.g., 21:00 to 09:00 IST)
 */
export function isWithinQuietHours(
  date: Date = new Date(),
  startStr: string = "21:00",
  endStr: string = "09:00"
): boolean {
  const [startH, startM] = startStr.split(":").map(Number);
  const [endH, endM] = endStr.split(":").map(Number);

  const currentMinutes = date.getHours() * 60 + date.getMinutes();
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (startMinutes > endMinutes) {
    // Spans midnight (e.g., 21:00 to 09:00)
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }
  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

/**
 * Replace placeholders like {{patient_name}}, {{clinic_name}}, etc.
 */
export function renderTemplateBody(
  body: string,
  variables: Record<string, string>
): string {
  let rendered = body;
  for (const [key, val] of Object.entries(variables)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
    rendered = rendered.replace(regex, val);
  }
  return rendered;
}

/**
 * Main 5-minute Automation Scheduler Engine
 */
export async function runAutomationCycle(clinicId: string): Promise<AutomationJobResult> {
  const result: AutomationJobResult = {
    dayBeforeSent: 0,
    sameDaySent: 0,
    missedFollowupsSent: 0,
    sittingFollowupsSent: 0,
    recallsSent: 0,
    retriesProcessed: 0,
    queuedForQuietHours: 0,
    errors: [],
  };

  const clinic = await dbRepo.getClinic(clinicId);
  if (!clinic) {
    result.errors.push(`Clinic ${clinicId} not found`);
    return result;
  }

  const now = new Date();
  const inQuietHours = isWithinQuietHours(now, clinic.quiet_hours_start, clinic.quiet_hours_end);
  const provider = getWhatsAppProvider(clinic);

  const [patients, appointments, templates, treatmentPlans] = await Promise.all([
    dbRepo.listPatients(clinicId),
    dbRepo.listAppointments(clinicId),
    dbRepo.listTemplates(clinicId),
    dbRepo.listTreatmentPlans(clinicId),
  ]);

  const patientMap = new Map(patients.map((p) => [p.id, p]));
  const templateMap = new Map(templates.map((t) => [t.type, t]));

  // Helper to send message or queue if quiet hours
  const dispatchOrQueue = async (
    patient: Patient,
    template: MessageTemplate | undefined,
    variables: Record<string, string>,
    idempotencyKey: string,
    appointmentId?: string | null
  ): Promise<boolean> => {
    // RULE 1: Never message opted-out patients
    if (!patient.whatsapp_opt_in) return false;

    // RULE 2: Idempotency check (prevent duplicates)
    const existing = await dbRepo.getMessageByIdempotencyKey(idempotencyKey);
    if (existing) return false;

    const renderedBody = template
      ? renderTemplateBody(template.body, variables)
      : Object.values(variables).join(" ");

    // RULE 3: Quiet hours check
    if (inQuietHours) {
      // Calculate next morning at 9:00 AM
      const nextMorning = new Date(now);
      if (now.getHours() >= 21) {
        nextMorning.setDate(nextMorning.getDate() + 1);
      }
      nextMorning.setHours(9, 0, 0, 0);

      await dbRepo.createMessage({
        clinic_id: clinicId,
        patient_id: patient.id,
        appointment_id: appointmentId || null,
        template_id: template?.id || null,
        direction: "outbound",
        body: renderedBody,
        status: "queued",
        provider_message_id: null,
        error: null,
        scheduled_for: nextMorning.toISOString(),
        sent_at: null,
        idempotency_key: idempotencyKey,
        retry_count: 0,
      });
      result.queuedForQuietHours++;
      return true;
    }

    // Send immediately via provider
    const sendRes = await provider.sendTemplateMessage(
      patient.phone,
      template?.whatsapp_template_name || "default_notification",
      template?.language || "en",
      variables
    );

    await dbRepo.createMessage({
      clinic_id: clinicId,
      patient_id: patient.id,
      appointment_id: appointmentId || null,
      template_id: template?.id || null,
      direction: "outbound",
      body: renderedBody,
      status: sendRes.success ? "delivered" : "failed",
      provider_message_id: sendRes.providerMessageId || null,
      error: sendRes.error || null,
      scheduled_for: now.toISOString(),
      sent_at: sendRes.success ? now.toISOString() : null,
      idempotency_key: idempotencyKey,
      retry_count: 0,
    });

    return sendRes.success;
  };

  // ==========================================
  // RULE 1: Day-Before Appointment Reminder
  // ==========================================
  if (clinic.rules_config.reminder_day_before?.enabled) {
    const tmr = new Date(now);
    tmr.setDate(tmr.getDate() + 1);
    const tmrDateStr = tmr.toISOString().split("T")[0];

    for (const apt of appointments) {
      if (apt.status !== "scheduled") continue;
      const aptDateStr = new Date(apt.starts_at).toISOString().split("T")[0];
      if (aptDateStr !== tmrDateStr) continue;

      const p = patientMap.get(apt.patient_id);
      if (!p) continue;

      const tmpl = templateMap.get("reminder_day_before");
      const key = `rem_day_${apt.id}_${aptDateStr}`;
      const sent = await dispatchOrQueue(
        p,
        tmpl,
        {
          patient_name: p.name,
          clinic_name: clinic.name,
          time: formatTimeIN(apt.starts_at),
          date: formatDateIN(apt.starts_at),
          doctor_name: clinic.doctor_name,
        },
        key,
        apt.id
      );
      if (sent) result.dayBeforeSent++;
    }
  }

  // ==========================================
  // RULE 2: Same-Day Reminder (2 hours before)
  // ==========================================
  if (clinic.rules_config.reminder_same_day?.enabled) {
    const hoursBefore = clinic.rules_config.reminder_same_day.hours_before || 2;
    const windowStart = now.getTime();
    const windowEnd = now.getTime() + hoursBefore * 60 * 60 * 1000;

    for (const apt of appointments) {
      if (apt.status !== "scheduled" && apt.status !== "confirmed") continue;

      const aptTime = new Date(apt.starts_at).getTime();
      if (aptTime >= windowStart && aptTime <= windowEnd) {
        const p = patientMap.get(apt.patient_id);
        if (!p) continue;

        const tmpl = templateMap.get("reminder_same_day");
        const key = `rem_same_${apt.id}`;
        const sent = await dispatchOrQueue(
          p,
          tmpl,
          {
            patient_name: p.name,
            doctor_name: clinic.doctor_name,
            clinic_name: clinic.name,
            time: formatTimeIN(apt.starts_at),
          },
          key,
          apt.id
        );
        if (sent) result.sameDaySent++;
      }
    }
  }

  // ==========================================
  // RULE 3: Missed-Appointment Follow-up
  // ==========================================
  if (clinic.rules_config.missed_followup?.enabled) {
    for (const apt of appointments) {
      if (apt.status !== "missed") continue;
      const p = patientMap.get(apt.patient_id);
      if (!p) continue;

      const aptTime = new Date(apt.starts_at).getTime();
      const daysSinceMissed = Math.floor((now.getTime() - aptTime) / (1000 * 60 * 60 * 24));

      // Nudge 1: Next morning (1 day later)
      if (daysSinceMissed >= 1 && daysSinceMissed < 3) {
        const key = `missed_fup_${apt.id}_nudge_1`;
        const tmpl = templateMap.get("missed_followup");
        const sent = await dispatchOrQueue(
          p,
          tmpl,
          {
            patient_name: p.name,
            clinic_name: clinic.name,
          },
          key,
          apt.id
        );
        if (sent) result.missedFollowupsSent++;
      }
      // Nudge 2: After 3 days
      else if (daysSinceMissed >= 3 && daysSinceMissed <= 4) {
        const key = `missed_fup_${apt.id}_nudge_2`;
        const tmpl = templateMap.get("missed_followup");
        const sent = await dispatchOrQueue(
          p,
          tmpl,
          {
            patient_name: p.name,
            clinic_name: clinic.name,
          },
          key,
          apt.id
        );
        if (sent) result.missedFollowupsSent++;
      }
    }
  }

  // ==========================================
  // RULE 4: Pending Treatment Sitting Follow-up
  // ==========================================
  if (clinic.rules_config.sitting_followup?.enabled) {
    for (const tp of treatmentPlans) {
      if (tp.status !== "active" || tp.completed_sittings >= tp.total_sittings) continue;

      // Check if patient has any future appointment scheduled
      const hasFutureApt = appointments.some(
        (a) =>
          a.patient_id === tp.patient_id &&
          new Date(a.starts_at).getTime() > now.getTime() &&
          a.status !== "cancelled"
      );
      if (hasFutureApt) continue;

      const p = patientMap.get(tp.patient_id);
      if (!p) continue;

      const remainingSittings = tp.total_sittings - tp.completed_sittings;
      const refDate = p.last_visit_date ? new Date(p.last_visit_date).getTime() : new Date(tp.created_at).getTime();
      const daysSinceLast = Math.floor((now.getTime() - refDate) / (1000 * 60 * 60 * 24));

      const firstNudgeDays = clinic.rules_config.sitting_followup.first_nudge_days || 5;
      const secondNudgeDays = clinic.rules_config.sitting_followup.second_nudge_days || 10;

      if (daysSinceLast >= firstNudgeDays && daysSinceLast < secondNudgeDays) {
        const key = `sitting_fup_${tp.id}_nudge_1`;
        const tmpl = templateMap.get("sitting_followup");
        const sent = await dispatchOrQueue(
          p,
          tmpl,
          {
            patient_name: p.name,
            treatment_name: tp.treatment_name,
            remaining_sittings: String(remainingSittings),
            clinic_name: clinic.name,
          },
          key
        );
        if (sent) result.sittingFollowupsSent++;
      } else if (daysSinceLast >= secondNudgeDays && daysSinceLast <= secondNudgeDays + 2) {
        const key = `sitting_fup_${tp.id}_nudge_2`;
        const tmpl = templateMap.get("sitting_followup");
        const sent = await dispatchOrQueue(
          p,
          tmpl,
          {
            patient_name: p.name,
            treatment_name: tp.treatment_name,
            remaining_sittings: String(remainingSittings),
            clinic_name: clinic.name,
          },
          key
        );
        if (sent) result.sittingFollowupsSent++;
      }
    }
  }

  // ==========================================
  // RULE 5: 6-Month Routine Recall
  // ==========================================
  if (clinic.rules_config.recall_6_month?.enabled) {
    const todayStr = now.toISOString().split("T")[0];

    for (const p of patients) {
      if (!p.recall_due_date || p.recall_due_date > todayStr) continue;

      // Check if patient already has an upcoming appointment
      const hasUpcoming = appointments.some(
        (a) =>
          a.patient_id === p.id &&
          new Date(a.starts_at).getTime() > now.getTime() &&
          a.status !== "cancelled"
      );
      if (hasUpcoming) continue;

      const recallDate = new Date(p.recall_due_date).getTime();
      const daysSinceRecall = Math.floor((now.getTime() - recallDate) / (1000 * 60 * 60 * 24));

      // Nudge 1: At recall due date (day 0 to 6)
      if (daysSinceRecall >= 0 && daysSinceRecall < 7) {
        const key = `recall_6m_${p.id}_${p.recall_due_date}_nudge_1`;
        const tmpl = templateMap.get("recall_6_month");
        const sent = await dispatchOrQueue(
          p,
          tmpl,
          {
            patient_name: p.name,
            clinic_name: clinic.name,
          },
          key
        );
        if (sent) result.recallsSent++;
      }
      // Nudge 2: 7 days after recall date
      else if (daysSinceRecall >= 7 && daysSinceRecall <= 9) {
        const key = `recall_6m_${p.id}_${p.recall_due_date}_nudge_2`;
        const tmpl = templateMap.get("recall_6_month");
        const sent = await dispatchOrQueue(
          p,
          tmpl,
          {
            patient_name: p.name,
            clinic_name: clinic.name,
          },
          key
        );
        if (sent) result.recallsSent++;
      }
    }
  }

  // ==========================================
  // RETRY LOGIC: Failed messages retry up to 3 times
  // ==========================================
  const allMessages = await dbRepo.listMessages(clinicId);
  const failedToRetry = allMessages.filter(
    (m) => m.status === "failed" && m.retry_count < 3 && m.direction === "outbound"
  );

  for (const msg of failedToRetry) {
    const p = patientMap.get(msg.patient_id);
    if (!p || !p.whatsapp_opt_in) continue;

    // Retry sending
    const retryRes = await provider.sendTextMessage(p.phone, msg.body);
    const newRetryCount = msg.retry_count + 1;

    if (retryRes.success) {
      await dbRepo.updateMessage(msg.id, {
        status: "delivered",
        error: null,
        retry_count: newRetryCount,
        sent_at: now.toISOString(),
      });
      result.retriesProcessed++;
    } else {
      await dbRepo.updateMessage(msg.id, {
        status: newRetryCount >= 3 ? "failed" : "failed",
        error: `Retry #${newRetryCount} failed: ${retryRes.error}`,
        retry_count: newRetryCount,
      });
    }
  }

  return result;
}

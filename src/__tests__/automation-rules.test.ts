import { describe, it, expect, beforeEach } from "vitest";
import { isWithinQuietHours, renderTemplateBody, runAutomationCycle } from "../lib/automation/engine";
import { mockStore, DEMO_CLINIC_ID } from "../lib/db/mock-store";
import { dbRepo } from "../lib/db/repo";

describe("Automation Engine Rules", () => {
  beforeEach(() => {
    mockStore.reset();
  });

  describe("Quiet Hours Validation", () => {
    it("should correctly identify hours spanning midnight (21:00 to 09:00)", () => {
      // 10:30 PM (22:30) -> Quiet hours
      const night = new Date("2026-10-05T22:30:00");
      expect(isWithinQuietHours(night, "21:00", "09:00")).toBe(true);

      // 06:15 AM -> Quiet hours
      const earlyMorning = new Date("2026-10-05T06:15:00");
      expect(isWithinQuietHours(earlyMorning, "21:00", "09:00")).toBe(true);

      // 02:00 PM (14:00) -> Daytime, NOT quiet hours
      const afternoon = new Date("2026-10-05T14:00:00");
      expect(isWithinQuietHours(afternoon, "21:00", "09:00")).toBe(false);

      // 09:01 AM -> Daytime
      const morningActive = new Date("2026-10-05T09:01:00");
      expect(isWithinQuietHours(morningActive, "21:00", "09:00")).toBe(false);
    });
  });

  describe("Template Placeholders", () => {
    it("should correctly render template variables", () => {
      const template = "Hello {{patient_name}}, reminder from {{clinic_name}} for {{time}}.";
      const vars = {
        patient_name: "Aarav Patel",
        clinic_name: "Apex Dental Care",
        time: "10:30 AM",
      };
      const result = renderTemplateBody(template, vars);
      expect(result).toBe("Hello Aarav Patel, reminder from Apex Dental Care for 10:30 AM.");
    });
  });

  describe("Opt-Out & Idempotency Rules", () => {
    it("should NEVER send automated message to opted-out patient", async () => {
      // Create opted-out patient
      const optedOut = await dbRepo.createPatient({
        clinic_id: DEMO_CLINIC_ID,
        name: "Opted Out Patient",
        phone: "+919820999999",
        whatsapp_opt_in: false,
        opt_in_source: "manual_entry",
        opt_in_at: new Date().toISOString(),
        notes: null,
        last_visit_date: null,
        recall_due_date: new Date().toISOString().split("T")[0], // due for recall today!
        is_active: true,
      });

      // Run automation cycle
      await runAutomationCycle(DEMO_CLINIC_ID);

      // Verify no message was dispatched to this patient
      const messages = await dbRepo.listMessages(DEMO_CLINIC_ID, optedOut.id);
      expect(messages.length).toBe(0);
    });

    it("should be idempotent and not dispatch duplicate messages if cycle runs twice", async () => {
      // Run first cycle
      const cycle1 = await runAutomationCycle(DEMO_CLINIC_ID);
      const messagesAfterCycle1 = await dbRepo.listMessages(DEMO_CLINIC_ID);

      // Run second cycle immediately
      const cycle2 = await runAutomationCycle(DEMO_CLINIC_ID);
      const messagesAfterCycle2 = await dbRepo.listMessages(DEMO_CLINIC_ID);

      // Second cycle should dispatch 0 new reminders for the same events
      expect(cycle2.dayBeforeSent).toBe(0);
      expect(cycle2.sameDaySent).toBe(0);
      expect(cycle2.missedFollowupsSent).toBe(0);
      expect(cycle2.sittingFollowupsSent).toBe(0);
      expect(cycle2.recallsSent).toBe(0);
      expect(messagesAfterCycle2.length).toBe(messagesAfterCycle1.length);
    });
  });
});

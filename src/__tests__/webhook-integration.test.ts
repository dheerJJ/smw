import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "../app/api/webhooks/whatsapp/route";
import { mockStore, DEMO_CLINIC_ID } from "../lib/db/mock-store";
import { dbRepo } from "../lib/db/repo";

describe("WhatsApp Webhook Integration", () => {
  beforeEach(() => {
    mockStore.reset();
  });

  describe("GET /api/webhooks/whatsapp Verification", () => {
    it("should return the hub.challenge when verify token matches", async () => {
      const url = "http://localhost:3000/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=smilerecall_meta_verify_token_2026&hub.challenge=test_challenge_code_12345";
      const req = new NextRequest(url, { method: "GET" });

      const res = await GET(req);
      expect(res.status).toBe(200);
      const text = await res.text();
      expect(text).toBe("test_challenge_code_12345");
    });

    it("should return 403 when verify token does not match", async () => {
      const url = "http://localhost:3000/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=wrong_token&hub.challenge=test_challenge";
      const req = new NextRequest(url, { method: "GET" });

      const res = await GET(req);
      expect(res.status).toBe(403);
    });
  });

  describe("POST /api/webhooks/whatsapp Inbound Messages", () => {
    it("should mark appointment confirmed when patient replies YES", async () => {
      // Find patient p-1 (Aarav Patel, +919820011221) who has apt-1 scheduled tomorrow
      const patientPhone = "919820011221";

      const webhookPayload = {
        object: "whatsapp_business_account",
        entry: [
          {
            id: "waba_1",
            changes: [
              {
                value: {
                  messaging_product: "whatsapp",
                  metadata: { display_phone_number: "919820123456", phone_number_id: "109823451293847" },
                  messages: [
                    {
                      from: patientPhone,
                      id: "wamid_inbound_test_100",
                      timestamp: "1728123456",
                      text: { body: "YES, confirmed" },
                      type: "text",
                    },
                  ],
                },
                field: "messages",
              },
            ],
          },
        ],
      };

      const req = new NextRequest("http://localhost:3000/api/webhooks/whatsapp", {
        method: "POST",
        body: JSON.stringify(webhookPayload),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      // Verify appointment status updated to confirmed
      const apt = await dbRepo.getAppointment("apt-1");
      expect(apt?.confirmation_status).toBe("confirmed_patient");
      expect(apt?.status).toBe("confirmed");
    });

    it("should immediately opt-out patient when patient replies STOP", async () => {
      const patientPhone = "919820022332"; // Priya Nair (p-2)

      const webhookPayload = {
        object: "whatsapp_business_account",
        entry: [
          {
            id: "waba_1",
            changes: [
              {
                value: {
                  messaging_product: "whatsapp",
                  metadata: { display_phone_number: "919820123456", phone_number_id: "109823451293847" },
                  messages: [
                    {
                      from: patientPhone,
                      id: "wamid_inbound_stop_101",
                      timestamp: "1728123456",
                      text: { body: "STOP" },
                      type: "text",
                    },
                  ],
                },
                field: "messages",
              },
            ],
          },
        ],
      };

      const req = new NextRequest("http://localhost:3000/api/webhooks/whatsapp", {
        method: "POST",
        body: JSON.stringify(webhookPayload),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      // Verify patient opt-in is now false
      const patient = await dbRepo.getPatient("p-2");
      expect(patient?.whatsapp_opt_in).toBe(false);
      expect(patient?.opt_in_source).toBe("patient_reply_stop");
    });

    it("should update message status to read on delivery receipts", async () => {
      const webhookPayload = {
        object: "whatsapp_business_account",
        entry: [
          {
            id: "waba_1",
            changes: [
              {
                value: {
                  messaging_product: "whatsapp",
                  metadata: { display_phone_number: "919820123456", phone_number_id: "109823451293847" },
                  statuses: [
                    {
                      id: "wamid_demo_1001",
                      status: "read",
                      timestamp: "1728123500",
                      recipient_id: "919820044554",
                    },
                  ],
                },
                field: "messages",
              },
            ],
          },
        ],
      };

      const req = new NextRequest("http://localhost:3000/api/webhooks/whatsapp", {
        method: "POST",
        body: JSON.stringify(webhookPayload),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      // Check msg-1 is now read
      const allMsgs = await dbRepo.listMessages(DEMO_CLINIC_ID);
      const msg = allMsgs.find((m) => m.provider_message_id === "wamid_demo_1001");
      expect(msg?.status).toBe("read");
    });
  });
});

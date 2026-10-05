import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { dbRepo } from "@/lib/db/repo";
import { parsePatientReply } from "@/lib/whatsapp/parser";
import { getWhatsAppProvider } from "@/lib/whatsapp";
import { DEMO_CLINIC_ID } from "@/lib/db/mock-store";

export const dynamic = "force-dynamic";

/**
 * Meta WhatsApp Webhook Endpoint
 * Supports:
 * 1. GET: Webhook verification handshake with Meta (hub.challenge)
 * 2. POST: Signature verification & handling of delivery receipts and patient replies
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || "smilerecall_meta_verify_token_2026";

  if (mode === "subscribe" && token === verifyToken) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Verification token mismatch" }, { status: 403 });
}

export async function POST(req: NextRequest) {
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  const rawBody = await req.text();

  // Signature verification if appSecret is configured
  if (appSecret) {
    const signature = req.headers.get("x-hub-signature-256");
    if (!signature) {
      return NextResponse.json({ error: "Missing signature header" }, { status: 401 });
    }
    const expectedSignature = `sha256=${crypto
      .createHmac("sha256", appSecret)
      .update(rawBody)
      .digest("hex")}`;
    if (signature !== expectedSignature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  try {
    const data = JSON.parse(rawBody);

    // Meta Webhook structure: entry[].changes[].value
    const entry = data?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (!value) {
      return NextResponse.json({ received: true });
    }

    const clinic = await dbRepo.getClinic(DEMO_CLINIC_ID);
    const provider = getWhatsAppProvider(clinic);

    // 1. Process Status Updates (sent, delivered, read, failed)
    if (value.statuses && Array.isArray(value.statuses)) {
      for (const st of value.statuses) {
        const providerMsgId = st.id;
        const status = st.status; // "sent" | "delivered" | "read" | "failed"

        const clinicMessages = await dbRepo.listMessages(DEMO_CLINIC_ID);
        const match = clinicMessages.find((m) => m.provider_message_id === providerMsgId);
        if (match) {
          await dbRepo.updateMessage(match.id, {
            status: status as any,
            error: st.errors?.[0]?.message || match.error,
          });
        }
      }
    }

    // 2. Process Inbound Patient Messages (Replies)
    if (value.messages && Array.isArray(value.messages)) {
      for (const inMsg of value.messages) {
        const fromDigits = inMsg.from; // e.g. "919820011221"
        const formattedPhone = `+${fromDigits}`;
        const messageText = inMsg.text?.body || "";
        const providerMessageId = inMsg.id;

        // Find patient by phone
        let patient = await dbRepo.getPatientByPhone(DEMO_CLINIC_ID, formattedPhone);
        if (!patient) {
          // Check without country code or with
          const allPatients = await dbRepo.listPatients(DEMO_CLINIC_ID);
          patient = allPatients.find((p) => p.phone.endsWith(fromDigits.slice(-10))) || null;
        }

        if (!patient) continue;

        // Record inbound message in database
        await dbRepo.createMessage({
          clinic_id: DEMO_CLINIC_ID,
          patient_id: patient.id,
          appointment_id: null,
          template_id: null,
          direction: "inbound",
          body: messageText,
          status: "received",
          provider_message_id: providerMessageId,
          error: null,
          scheduled_for: null,
          sent_at: new Date().toISOString(),
          idempotency_key: `inbound_${providerMessageId}`,
          retry_count: 0,
        });

        // Parse patient intent
        const parsed = parsePatientReply(messageText);

        // Find patient's upcoming scheduled/pending appointment
        const patientAppointments = await dbRepo.listAppointments(DEMO_CLINIC_ID, patient.id);
        const upcomingApt = patientAppointments.find(
          (a) =>
            a.status === "scheduled" &&
            new Date(a.starts_at).getTime() >= Date.now() - 24 * 60 * 60 * 1000
        );

        if (parsed.intent === "CONFIRM") {
          if (upcomingApt) {
            await dbRepo.updateAppointment(upcomingApt.id, {
              status: "confirmed",
              confirmation_status: "confirmed_patient",
            });
            await dbRepo.logAudit({
              clinic_id: DEMO_CLINIC_ID,
              user_id: null,
              action: "appointment_confirmed_via_whatsapp",
              metadata: { appointment_id: upcomingApt.id, reply: messageText },
            });
          }
        } else if (parsed.intent === "DECLINE") {
          if (upcomingApt) {
            await dbRepo.updateAppointment(upcomingApt.id, {
              confirmation_status: "reschedule_requested",
            });
            await dbRepo.logAudit({
              clinic_id: DEMO_CLINIC_ID,
              user_id: null,
              action: "appointment_reschedule_requested_via_whatsapp",
              metadata: { appointment_id: upcomingApt.id, reply: messageText },
            });
          }
        } else if (parsed.intent === "OPT_OUT") {
          // DPDP Mandate: immediately opt-out
          await dbRepo.updatePatient(patient.id, {
            whatsapp_opt_in: false,
            opt_in_source: "patient_reply_stop",
            opt_in_at: new Date().toISOString(),
          });

          await dbRepo.logAudit({
            clinic_id: DEMO_CLINIC_ID,
            user_id: null,
            action: "patient_opted_out_stop",
            metadata: { patient_id: patient.id, phone: patient.phone },
          });

          // Send confirmation of unsubscription
          await provider.sendTextMessage(
            patient.phone,
            `You have been unsubscribed from automated WhatsApp reminders from ${
              clinic?.name || "our dental clinic"
            }. Reply START anytime to re-enable.`
          );
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Webhook processing error";
    console.error("Meta Webhook error:", error);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

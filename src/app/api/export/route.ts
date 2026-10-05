import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import { dbRepo } from "@/lib/db/repo";
import { DEMO_CLINIC_ID } from "@/lib/db/mock-store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "patients"; // "patients" | "messages" | "appointments"

  try {
    let csvData = "";
    let filename = "";

    if (type === "patients") {
      const patients = await dbRepo.listPatients(DEMO_CLINIC_ID);
      const rows = patients.map((p) => ({
        ID: p.id,
        Name: p.name,
        Phone: p.phone,
        WhatsApp_Consent: p.whatsapp_opt_in ? "Yes" : "No",
        Consent_Source: p.opt_in_source,
        Consent_Date: p.opt_in_at,
        Last_Visit_Date: p.last_visit_date || "",
        Recall_Due_Date: p.recall_due_date || "",
        Notes: p.notes || "",
        Created_At: p.created_at,
      }));
      csvData = Papa.unparse(rows);
      filename = `smilerecall_patients_export_${new Date().toISOString().split("T")[0]}.csv`;
    } else if (type === "messages") {
      const messages = await dbRepo.listMessages(DEMO_CLINIC_ID);
      const rows = messages.map((m) => ({
        ID: m.id,
        Patient_Name: m.patient?.name || "",
        Direction: m.direction,
        Status: m.status,
        Message_Body: m.body,
        Provider_Message_ID: m.provider_message_id || "",
        Sent_At: m.sent_at || "",
        Created_At: m.created_at,
      }));
      csvData = Papa.unparse(rows);
      filename = `smilerecall_messages_export_${new Date().toISOString().split("T")[0]}.csv`;
    } else if (type === "appointments") {
      const appointments = await dbRepo.listAppointments(DEMO_CLINIC_ID);
      const rows = appointments.map((a) => ({
        ID: a.id,
        Patient_Name: a.patient?.name || "",
        Patient_Phone: a.patient?.phone || "",
        Starts_At: a.starts_at,
        Duration_Minutes: a.duration_minutes,
        Status: a.status,
        Confirmation_Status: a.confirmation_status,
        Notes: a.notes || "",
        Created_At: a.created_at,
      }));
      csvData = Papa.unparse(rows);
      filename = `smilerecall_appointments_export_${new Date().toISOString().split("T")[0]}.csv`;
    }

    return new NextResponse(csvData, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Export failed";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Phone,
  Calendar,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  MessageSquare,
  Shield,
  Trash2,
  Download,
  Plus,
  Send,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { dbRepo } from "@/lib/db/repo";
import { Patient, TreatmentPlan, Appointment, Message } from "@/lib/db/types";
import { formatDateIN, formatDateTimeIN, formatINR } from "@/lib/utils";

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const patientId = params?.id as string;

  const [patient, setPatient] = React.useState<Patient | null>(null);
  const [plans, setPlans] = React.useState<TreatmentPlan[]>([]);
  const [appointments, setAppointments] = React.useState<Appointment[]>([]);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // Modals
  const [isPlanModalOpen, setIsPlanModalOpen] = React.useState(false);
  const [newPlanName, setNewPlanName] = React.useState("");
  const [newPlanSittings, setNewPlanSittings] = React.useState("2");
  const [newPlanValue, setNewPlanValue] = React.useState("5000");

  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);

  const loadData = React.useCallback(async () => {
    if (!patientId) return;
    setIsLoading(true);
    try {
      const p = await dbRepo.getPatient(patientId);
      if (!p) {
        toast("Patient not found", "error");
        router.push("/patients");
        return;
      }
      setPatient(p);

      const [pPlans, pApts, pMsgs] = await Promise.all([
        dbRepo.listTreatmentPlans("c1111111-1111-1111-1111-111111111111", patientId),
        dbRepo.listAppointments("c1111111-1111-1111-1111-111111111111", patientId),
        dbRepo.listMessages("c1111111-1111-1111-1111-111111111111", patientId),
      ]);

      setPlans(pPlans);
      setAppointments(pApts);
      setMessages(pMsgs);
    } catch (e) {
      console.error(e);
      toast("Error loading patient data", "error");
    } finally {
      setIsLoading(false);
    }
  }, [patientId, router]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Toggle Opt-In
  const handleToggleOptIn = async () => {
    if (!patient) return;
    const nextVal = !patient.whatsapp_opt_in;
    await dbRepo.updatePatient(patient.id, {
      whatsapp_opt_in: nextVal,
      opt_in_at: new Date().toISOString(),
      opt_in_source: nextVal ? "manual_re_opt_in" : "patient_opt_out",
    });
    setPatient({ ...patient, whatsapp_opt_in: nextVal });
    toast(nextVal ? "WhatsApp opt-in enabled" : "WhatsApp messages paused (Opted out)", "info");
  };

  // Create Treatment Plan
  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient) return;

    await dbRepo.createTreatmentPlan({
      clinic_id: "c1111111-1111-1111-1111-111111111111",
      patient_id: patient.id,
      treatment_name: newPlanName,
      total_sittings: parseInt(newPlanSittings) || 1,
      completed_sittings: 0,
      estimated_value: parseFloat(newPlanValue) || 0,
      status: "active",
    });

    toast("Treatment plan created", "success");
    setIsPlanModalOpen(false);
    setNewPlanName("");
    await loadData();
  };

  // DPDP Export Single Patient Data
  const handleExportPatientData = () => {
    if (!patient) return;
    const exportPayload = {
      patient,
      treatmentPlans: plans,
      appointments,
      messages,
      exportedAt: new Date().toISOString(),
      compliance: "Digital Personal Data Protection Act (India)",
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `patient_data_${patient.name.replace(/\s+/g, "_")}_${patient.phone}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast("Patient record exported", "info");
  };

  // DPDP Right to Erasure (Delete Patient)
  const handleDeletePatient = async () => {
    if (!patient) return;
    await dbRepo.deletePatient(patient.id);
    await dbRepo.logAudit({
      clinic_id: "c1111111-1111-1111-1111-111111111111",
      user_id: null,
      action: "patient_erasure",
      metadata: { patient_id: patient.id, name: patient.name, phone: patient.phone },
    });
    toast("Patient data permanently deleted per erasure request", "info");
    router.push("/patients");
  };

  if (isLoading || !patient) {
    return (
      <AppShell title="Patient Profile">
        <div className="p-12 text-center text-xs text-slate-500">Loading patient details...</div>
      </AppShell>
    );
  }

  return (
    <AppShell title={patient.name} subtitle={`Patient ID: ${patient.id}`}>
      <div className="space-y-6">
        {/* Navigation link */}
        <Link
          href="/patients"
          className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-teal-700"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Patients List
        </Link>

        {/* Top Patient Header Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center font-bold text-lg border border-teal-200">
              {patient.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">{patient.name}</h2>
                {patient.whatsapp_opt_in ? (
                  <Badge variant="success" className="gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    WhatsApp Opted In
                  </Badge>
                ) : (
                  <Badge variant="danger" className="gap-1">
                    <XCircle className="w-3 h-3 text-rose-600" />
                    Opted Out
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 mt-1 text-xs text-slate-500">
                <span className="flex items-center gap-1 font-mono text-slate-700">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {patient.phone}
                </span>
                <span>•</span>
                <span>Last Visit: {formatDateIN(patient.last_visit_date)}</span>
                <span>•</span>
                <span>Recall Due: {formatDateIN(patient.recall_due_date)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              variant={patient.whatsapp_opt_in ? "outline" : "secondary"}
              onClick={handleToggleOptIn}
            >
              {patient.whatsapp_opt_in ? "Pause WhatsApp" : "Re-enable WhatsApp"}
            </Button>
            <Button size="sm" variant="outline" onClick={handleExportPatientData}>
              <Download className="w-3.5 h-3.5 mr-1" />
              DPDP Export
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-rose-600 hover:bg-rose-50 border-rose-200"
              onClick={() => setIsDeleteModalOpen(true)}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              Delete Record
            </Button>
          </div>
        </div>

        {/* Clinical Notes Card */}
        {patient.notes && (
          <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4 text-xs text-amber-950">
            <span className="font-bold uppercase tracking-wider block text-[10px] text-amber-800 mb-1">
              Clinical Notes
            </span>
            {patient.notes}
          </div>
        )}

        {/* Two-Column Grid: Treatment Plans & Appointments */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Treatment Plans Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-600" />
                <h3 className="text-sm font-bold text-slate-900">Treatment Plans & Sittings</h3>
              </div>
              <Button size="sm" variant="outline" onClick={() => setIsPlanModalOpen(true)} className="h-7 text-xs">
                <Plus className="w-3.5 h-3.5 mr-1" />
                New Plan
              </Button>
            </div>

            {plans.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No treatment plans recorded for this patient.</p>
            ) : (
              <div className="space-y-3">
                {plans.map((tp) => {
                  const pct = Math.round((tp.completed_sittings / tp.total_sittings) * 100);
                  return (
                    <div key={tp.id} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{tp.treatment_name}</span>
                        <Badge
                          variant={
                            tp.status === "completed"
                              ? "success"
                              : tp.status === "active"
                              ? "default"
                              : "neutral"
                          }
                        >
                          {tp.status}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-600">
                        <span>
                          Sittings: <strong>{tp.completed_sittings}</strong> / {tp.total_sittings}
                        </span>
                        <span className="font-semibold text-slate-900">{formatINR(tp.estimated_value)}</span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-teal-600 h-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Appointments History Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-600" />
                <h3 className="text-sm font-bold text-slate-900">Appointment History</h3>
              </div>
              <Link href="/appointments">
                <Button size="sm" variant="outline" className="h-7 text-xs">
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Book Visit
                </Button>
              </Link>
            </div>

            {appointments.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No appointments scheduled.</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {appointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="p-3 rounded-lg border border-slate-200 bg-white flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold text-slate-900">{formatDateTimeIN(apt.starts_at)}</span>
                        <span className="text-slate-400">({apt.duration_minutes}m)</span>
                      </div>
                      {apt.notes && <p className="text-[11px] text-slate-500 mt-0.5">{apt.notes}</p>}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Badge
                        variant={
                          apt.status === "completed"
                            ? "success"
                            : apt.status === "missed"
                            ? "danger"
                            : apt.status === "confirmed"
                            ? "info"
                            : "default"
                        }
                      >
                        {apt.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* WhatsApp Communication History */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-teal-600" />
              <h3 className="text-sm font-bold text-slate-900">WhatsApp Notification Log</h3>
            </div>
            <span className="text-xs text-slate-500">{messages.length} messages</span>
          </div>

          {messages.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">
              No WhatsApp messages dispatched yet for this patient.
            </p>
          ) : (
            <div className="space-y-3">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`p-3.5 rounded-lg border text-xs space-y-1.5 ${
                    m.direction === "inbound"
                      ? "bg-emerald-50/50 border-emerald-200 mr-8"
                      : "bg-slate-50 border-slate-200 ml-4"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">
                      {m.direction === "inbound" ? "Patient Reply" : "Automated Reminder"}
                    </span>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span>{formatDateTimeIN(m.created_at)}</span>
                      <Badge
                        variant={
                          m.status === "read" || m.status === "delivered"
                            ? "success"
                            : m.status === "failed"
                            ? "danger"
                            : "default"
                        }
                      >
                        {m.status}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-slate-700 font-mono text-[11px] whitespace-pre-wrap">{m.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* New Treatment Plan Modal */}
      <Modal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        title="Add Treatment Plan"
        description="Record a multi-sitting dental procedure for automated sitting follow-ups."
      >
        <form onSubmit={handleCreatePlan} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Treatment Name *
            </label>
            <input
              type="text"
              required
              value={newPlanName}
              onChange={(e) => setNewPlanName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              placeholder="e.g. Root Canal Treatment + Crown"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Total Sittings *
              </label>
              <input
                type="number"
                min="1"
                required
                value={newPlanSittings}
                onChange={(e) => setNewPlanSittings(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Estimated Value (₹) *
              </label>
              <input
                type="number"
                min="0"
                required
                value={newPlanValue}
                onChange={(e) => setNewPlanValue(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsPlanModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Create Plan
            </Button>
          </div>
        </form>
      </Modal>

      {/* DPDP Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Data Erasure"
        description="This action cannot be undone. Per India DPDP Act compliance, all personal contact data will be permanently wiped."
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Are you sure you want to permanently erase record for <strong>{patient.name}</strong> ({patient.phone})?
          </p>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="danger" size="sm" onClick={handleDeletePatient}>
              Permanently Erase
            </Button>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}

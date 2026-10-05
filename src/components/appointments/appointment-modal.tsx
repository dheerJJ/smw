"use client";

import * as React from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Appointment, Patient, TreatmentPlan } from "@/lib/db/types";
import { formatTimeIN } from "@/lib/utils";

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment?: Appointment | null;
  patients: Patient[];
  existingAppointments: Appointment[];
  onSave: (aptData: Omit<Appointment, "id" | "clinic_id" | "created_at">) => Promise<void>;
}

export function AppointmentModal({
  isOpen,
  onClose,
  appointment,
  patients,
  existingAppointments,
  onSave,
}: AppointmentModalProps) {
  const [patientId, setPatientId] = React.useState("");
  const [treatmentPlanId, setTreatmentPlanId] = React.useState("");
  const [date, setDate] = React.useState("");
  const [time, setTime] = React.useState("10:00");
  const [durationMinutes, setDurationMinutes] = React.useState("30");
  const [status, setStatus] = React.useState<Appointment["status"]>("scheduled");
  const [notes, setNotes] = React.useState("");
  const [conflictWarning, setConflictWarning] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (appointment) {
      setPatientId(appointment.patient_id);
      setTreatmentPlanId(appointment.treatment_plan_id || "");
      const d = new Date(appointment.starts_at);
      setDate(d.toISOString().split("T")[0]);
      const hours = String(d.getHours()).padStart(2, "0");
      const mins = String(d.getMinutes()).padStart(2, "0");
      setTime(`${hours}:${mins}`);
      setDurationMinutes(String(appointment.duration_minutes));
      setStatus(appointment.status);
      setNotes(appointment.notes || "");
    } else {
      setPatientId(patients[0]?.id || "");
      setTreatmentPlanId("");
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setDate(tomorrow.toISOString().split("T")[0]);
      setTime("10:30");
      setDurationMinutes("30");
      setStatus("scheduled");
      setNotes("");
    }
    setConflictWarning(null);
  }, [appointment, isOpen, patients]);

  // Check double-booking conflicts
  React.useEffect(() => {
    if (!date || !time) return;
    const proposedStart = new Date(`${date}T${time}:00`);
    const duration = parseInt(durationMinutes) || 30;
    const proposedEnd = new Date(proposedStart.getTime() + duration * 60 * 1000);

    const conflict = existingAppointments.find((a) => {
      // Exclude current appointment being edited
      if (appointment && a.id === appointment.id) return false;
      if (a.status === "cancelled") return false;

      const aStart = new Date(a.starts_at);
      const aEnd = new Date(aStart.getTime() + a.duration_minutes * 60 * 1000);

      // Overlap condition
      return proposedStart < aEnd && proposedEnd > aStart;
    });

    if (conflict) {
      setConflictWarning(
        `Time conflict: Another appointment is scheduled for ${conflict.patient?.name || "a patient"} at ${formatTimeIN(
          conflict.starts_at
        )}.`
      );
    } else {
      setConflictWarning(null);
    }
  }, [date, time, durationMinutes, existingAppointments, appointment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !date || !time) return;

    setIsLoading(true);
    try {
      const startsAt = new Date(`${date}T${time}:00`).toISOString();
      await onSave({
        patient_id: patientId,
        treatment_plan_id: treatmentPlanId || null,
        starts_at: startsAt,
        duration_minutes: parseInt(durationMinutes) || 30,
        status,
        confirmation_status: appointment?.confirmation_status || "pending",
        notes: notes.trim() || null,
      });
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={appointment ? "Edit Dental Appointment" : "Book New Dental Appointment"}
      description="Select patient, time, and optional treatment sitting."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Patient *
          </label>
          <select
            required
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            disabled={Boolean(appointment)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
          >
            <option value="">Select patient</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.phone})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Date *
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Time (IST) *
            </label>
            <input
              type="time"
              required
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Duration
            </label>
            <select
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
            >
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="45">45 minutes</option>
              <option value="60">60 minutes (1 hour)</option>
              <option value="90">90 minutes</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Appointment["status"])}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
            >
              <option value="scheduled">Scheduled</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="missed">Missed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Double Booking Conflict Warning */}
        {conflictWarning && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 font-medium">
            {conflictWarning}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Procedure / Appointment Notes
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
            placeholder="e.g. RCT Sitting 2: Obturation & Crown Preparation"
          />
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isLoading}>
            {appointment ? "Save Changes" : "Book Appointment"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

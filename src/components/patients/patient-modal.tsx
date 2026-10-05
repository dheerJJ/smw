"use client";

import * as React from "react";
import { Patient } from "@/lib/db/types";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { normalizeIndianPhone } from "@/lib/utils";

interface PatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient?: Patient | null;
  onSave: (patientData: Omit<Patient, "id" | "clinic_id" | "created_at">) => Promise<void>;
}

export function PatientModal({ isOpen, onClose, patient, onSave }: PatientModalProps) {
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [whatsappOptIn, setWhatsappOptIn] = React.useState(true);
  const [notes, setNotes] = React.useState("");
  const [lastVisitDate, setLastVisitDate] = React.useState("");
  const [recallDueDate, setRecallDueDate] = React.useState("");
  const [phoneError, setPhoneError] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (patient) {
      setName(patient.name);
      setPhone(patient.phone.replace("+91", ""));
      setWhatsappOptIn(patient.whatsapp_opt_in);
      setNotes(patient.notes || "");
      setLastVisitDate(patient.last_visit_date || "");
      setRecallDueDate(patient.recall_due_date || "");
    } else {
      setName("");
      setPhone("");
      setWhatsappOptIn(true);
      setNotes("");
      setLastVisitDate(new Date().toISOString().split("T")[0]);
      // Default recall due date: 6 months from now
      const d = new Date();
      d.setMonth(d.getMonth() + 6);
      setRecallDueDate(d.toISOString().split("T")[0]);
    }
    setPhoneError("");
  }, [patient, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError("");

    const norm = normalizeIndianPhone(phone);
    if (!norm.valid) {
      setPhoneError(norm.error || "Invalid Indian phone number");
      return;
    }

    setIsLoading(true);
    try {
      await onSave({
        name: name.trim(),
        phone: norm.formatted,
        whatsapp_opt_in: whatsappOptIn,
        opt_in_source: patient?.opt_in_source || "reception_desk",
        opt_in_at: patient?.opt_in_at || new Date().toISOString(),
        notes: notes.trim() || null,
        last_visit_date: lastVisitDate || null,
        recall_due_date: recallDueDate || null,
        is_active: true,
      });
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setPhoneError(err.message);
      } else {
        setPhoneError("Failed to save patient. Please check details.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={patient ? "Edit Patient Record" : "Add New Dental Patient"}
      description="Enter accurate patient details and phone number for WhatsApp reminders."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Patient Full Name *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
            placeholder="e.g. Aarav Patel"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Mobile Number (India) *
          </label>
          <div className="flex">
            <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-slate-300 bg-slate-50 text-slate-500 text-sm font-medium">
              +91
            </span>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setPhoneError("");
              }}
              className="flex-1 px-3 py-2 border border-slate-300 rounded-r-lg text-sm font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
              placeholder="9820011221"
              maxLength={10}
            />
          </div>
          {phoneError ? (
            <p className="text-xs text-rose-600 mt-1">{phoneError}</p>
          ) : (
            <p className="text-[11px] text-slate-500 mt-1">
              Enter 10-digit Indian mobile number (starts with 6, 7, 8, or 9).
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Last Visit Date
            </label>
            <input
              type="date"
              value={lastVisitDate}
              onChange={(e) => setLastVisitDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Recall Due Date (6 Months)
            </label>
            <input
              type="date"
              value={recallDueDate}
              onChange={(e) => setRecallDueDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Clinical Notes / Pending Treatment
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
            placeholder="e.g. Molar RCT Sitting 2 pending, crowns pending"
          />
        </div>

        {/* WhatsApp Opt-in Mandate */}
        <div className="p-3 bg-teal-50/60 border border-teal-200 rounded-lg">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={whatsappOptIn}
              onChange={(e) => setWhatsappOptIn(e.target.checked)}
              className="mt-0.5 rounded text-teal-600 focus:ring-teal-500"
            />
            <div className="text-xs">
              <span className="font-semibold text-teal-950">Patient Consent for WhatsApp Reminders</span>
              <p className="text-teal-900 mt-0.5">
                Patient has consented to receive automated appointment reminders and treatment recall follow-ups.
              </p>
            </div>
          </label>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isLoading}>
            {patient ? "Save Changes" : "Add Patient"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

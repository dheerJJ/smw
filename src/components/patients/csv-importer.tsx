"use client";

import * as React from "react";
import Papa from "papaparse";
import { Upload, Download, AlertCircle, CheckCircle2, ShieldAlert } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Patient } from "@/lib/db/types";
import { normalizeIndianPhone } from "@/lib/utils";

interface CsvImporterProps {
  isOpen: boolean;
  onClose: () => void;
  existingPatients: Patient[];
  onImportSuccess: (patients: Omit<Patient, "id" | "clinic_id" | "created_at">[]) => Promise<void>;
}

interface ParsedRow {
  name?: string;
  phone?: string;
  notes?: string;
  last_visit_date?: string;
  recall_due_date?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

interface ValidatedRow {
  index: number;
  data: Omit<Patient, "id" | "clinic_id" | "created_at">;
  valid: boolean;
  error?: string;
  isDuplicate?: boolean;
}

export function CsvImporter({ isOpen, onClose, existingPatients, onImportSuccess }: CsvImporterProps) {
  const [file, setFile] = React.useState<File | null>(null);
  const [headers, setHeaders] = React.useState<string[]>([]);
  const [rawRows, setRawRows] = React.useState<ParsedRow[]>([]);
  const [mapping, setMapping] = React.useState({
    name: "",
    phone: "",
    notes: "",
    last_visit_date: "",
    recall_due_date: "",
  });
  const [validatedRows, setValidatedRows] = React.useState<ValidatedRow[]>([]);
  const [consentConfirmed, setConsentConfirmed] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [step, setStep] = React.useState<"upload" | "map" | "preview">("upload");

  React.useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setHeaders([]);
      setRawRows([]);
      setValidatedRows([]);
      setConsentConfirmed(false);
      setStep("upload");
    }
  }, [isOpen]);

  // Handle file select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);

    Papa.parse<ParsedRow>(selected, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.meta.fields) {
          const fields = results.meta.fields;
          setHeaders(fields);
          setRawRows(results.data);

          // Auto-detect mapping
          const autoMap = {
            name: fields.find((f) => /name/i.test(f)) || fields[0] || "",
            phone: fields.find((f) => /phone|mobile|cell|contact/i.test(f)) || fields[1] || "",
            notes: fields.find((f) => /notes|treatment|remark/i.test(f)) || "",
            last_visit_date: fields.find((f) => /last|visit/i.test(f)) || "",
            recall_due_date: fields.find((f) => /recall|due/i.test(f)) || "",
          };
          setMapping(autoMap);
          setStep("map");
        }
      },
    });
  };

  // Run validation on mapped rows
  const handleProceedToPreview = () => {
    const existingPhones = new Set(existingPatients.map((p) => p.phone));

    const validated: ValidatedRow[] = rawRows.map((row, idx) => {
      const rawName = String(row[mapping.name] || "").trim();
      const rawPhone = String(row[mapping.phone] || "").trim();
      const rawNotes = mapping.notes ? String(row[mapping.notes] || "").trim() : "";
      const rawLastVisit = mapping.last_visit_date ? String(row[mapping.last_visit_date] || "").trim() : "";
      const rawRecall = mapping.recall_due_date ? String(row[mapping.recall_due_date] || "").trim() : "";

      if (!rawName) {
        return {
          index: idx + 1,
          data: {} as any,
          valid: false,
          error: "Patient name is missing",
        };
      }

      const phoneNorm = normalizeIndianPhone(rawPhone);
      if (!phoneNorm.valid) {
        return {
          index: idx + 1,
          data: {} as any,
          valid: false,
          error: phoneNorm.error || "Invalid Indian phone number",
        };
      }

      const isDuplicate = existingPhones.has(phoneNorm.formatted);

      return {
        index: idx + 1,
        valid: !isDuplicate,
        isDuplicate,
        error: isDuplicate ? "Phone number already exists in your clinic" : undefined,
        data: {
          name: rawName,
          phone: phoneNorm.formatted,
          whatsapp_opt_in: true,
          opt_in_source: "csv_bulk_import",
          opt_in_at: new Date().toISOString(),
          notes: rawNotes || null,
          last_visit_date: rawLastVisit || null,
          recall_due_date: rawRecall || null,
          is_active: true,
        },
      };
    });

    setValidatedRows(validated);
    setStep("preview");
  };

  const handleImport = async () => {
    if (!consentConfirmed) return;
    const toImport = validatedRows.filter((r) => r.valid).map((r) => r.data);
    if (toImport.length === 0) return;

    setIsProcessing(true);
    try {
      await onImportSuccess(toImport);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadSampleTemplate = () => {
    const csvContent =
      "Patient Name,Mobile Number,Notes,Last Visit Date,Recall Due Date\n" +
      "Rohan Deshmukh,9820123456,Root canal sitting 2 pending,2026-09-15,2027-03-15\n" +
      "Sunita Rao,9820234567,Wisdom tooth extraction follow-up,2026-09-20,2027-03-20\n" +
      "Karan Sethi,9820345678,Due for 6-month routine scaling,2026-04-10,2026-10-10\n";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "smilerecall_patient_import_template.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const validCount = validatedRows.filter((r) => r.valid).length;
  const invalidCount = validatedRows.filter((r) => !r.valid).length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Import Patients via CSV"
      description="Bulk import your dental clinic patients with column mapping and phone validation."
      maxWidth="xl"
    >
      <div className="space-y-4">
        {/* Step 1: Upload */}
        {step === "upload" && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-teal-500 transition-colors">
              <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-900 mb-1">
                Upload CSV File
              </p>
              <p className="text-xs text-slate-500 mb-4">
                Supported format: .csv with column headers (Name, Phone, etc.)
              </p>
              <label className="cursor-pointer">
                <span className="inline-flex items-center justify-center px-4 py-2 border border-teal-600 rounded-lg text-xs font-semibold text-teal-700 bg-white hover:bg-teal-50">
                  Select CSV File
                </span>
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
              <span className="text-slate-600">Need a format sample?</span>
              <button
                type="button"
                onClick={downloadSampleTemplate}
                className="inline-flex items-center gap-1 font-semibold text-teal-700 hover:text-teal-800"
              >
                <Download className="w-3.5 h-3.5" />
                Download Sample CSV
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Column Mapping */}
        {step === "map" && (
          <div className="space-y-4">
            <div className="p-3 bg-teal-50 rounded-lg border border-teal-200 text-xs text-teal-950">
              Found <strong>{rawRows.length}</strong> rows in <strong>{file?.name}</strong>. Please confirm column mapping:
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Patient Name (Required) *</label>
                <select
                  value={mapping.name}
                  onChange={(e) => setMapping({ ...mapping, name: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                >
                  <option value="">Select column</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mobile Phone (+91) *</label>
                <select
                  value={mapping.phone}
                  onChange={(e) => setMapping({ ...mapping, phone: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                >
                  <option value="">Select column</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Clinical Notes (Optional)</label>
                <select
                  value={mapping.notes}
                  onChange={(e) => setMapping({ ...mapping, notes: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                >
                  <option value="">None</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Last Visit Date (Optional)</label>
                <select
                  value={mapping.last_visit_date}
                  onChange={(e) => setMapping({ ...mapping, last_visit_date: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                >
                  <option value="">None</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <Button size="sm" variant="outline" onClick={() => setStep("upload")}>
                Back
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={handleProceedToPreview}
                disabled={!mapping.name || !mapping.phone}
              >
                Validate & Preview
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Validation Preview & Consent */}
        {step === "preview" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge variant="success" className="gap-1 py-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {validCount} Ready to Import
              </Badge>
              {invalidCount > 0 && (
                <Badge variant="danger" className="gap-1 py-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {invalidCount} Invalid / Duplicates
                </Badge>
              )}
            </div>

            {/* Preview table (capped at 5 rows) */}
            <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold sticky top-0">
                  <tr>
                    <th className="p-2">Row</th>
                    <th className="p-2">Name</th>
                    <th className="p-2">Phone</th>
                    <th className="p-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {validatedRows.slice(0, 10).map((r) => (
                    <tr key={r.index} className={r.valid ? "bg-white" : "bg-rose-50/40"}>
                      <td className="p-2 text-slate-400">#{r.index}</td>
                      <td className="p-2 font-medium text-slate-900">{r.data.name || "-"}</td>
                      <td className="p-2 font-mono text-slate-700">{r.data.phone || "-"}</td>
                      <td className="p-2">
                        {r.valid ? (
                          <span className="text-emerald-700 font-medium">Valid</span>
                        ) : (
                          <span className="text-rose-700 font-medium">{r.error}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mandatory Consent Confirmation */}
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-amber-900 text-xs font-bold uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                Consent Confirmation Required
              </div>
              <label className="flex items-start gap-2.5 text-xs text-amber-950 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentConfirmed}
                  onChange={(e) => setConsentConfirmed(e.target.checked)}
                  className="mt-0.5 rounded text-teal-600 focus:ring-teal-500"
                />
                <span>
                  I confirm that our dental clinic has obtained patient consent for WhatsApp communications for all
                  imported records in compliance with India DPDP Act and WhatsApp Business Messaging policy.
                </span>
              </label>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <Button size="sm" variant="outline" onClick={() => setStep("map")}>
                Back to Mapping
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={handleImport}
                disabled={!consentConfirmed || validCount === 0}
                isLoading={isProcessing}
              >
                Import {validCount} Patients
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

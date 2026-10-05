"use client";

import * as React from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  Upload,
  Phone,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Filter,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TableSkeleton } from "@/components/ui/skeleton";
import { PatientModal } from "@/components/patients/patient-modal";
import { CsvImporter } from "@/components/patients/csv-importer";
import { useToast } from "@/components/ui/toast";
import { dbRepo } from "@/lib/db/repo";
import { Patient } from "@/lib/db/types";
import { formatDateIN } from "@/lib/utils";

export default function PatientsPage() {
  const { toast } = useToast();
  const [patients, setPatients] = React.useState<Patient[]>([]);
  const [search, setSearch] = React.useState("");
  const [filterTab, setFilterTab] = React.useState<"all" | "opted_in" | "opted_out" | "recall_due">("all");
  const [isLoading, setIsLoading] = React.useState(true);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [editingPatient, setEditingPatient] = React.useState<Patient | null>(null);
  const [isCsvModalOpen, setIsCsvModalOpen] = React.useState(false);

  const loadPatients = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await dbRepo.listPatients();
      setPatients(data);
    } catch (e) {
      console.error(e);
      toast("Error loading patients", "error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  const handleSavePatient = async (patientData: Omit<Patient, "id" | "clinic_id" | "created_at">) => {
    if (editingPatient) {
      await dbRepo.updatePatient(editingPatient.id, patientData);
      toast("Patient updated successfully", "success");
    } else {
      await dbRepo.createPatient({
        ...patientData,
        clinic_id: "c1111111-1111-1111-1111-111111111111",
      });
      toast("New patient added successfully", "success");
    }
    await loadPatients();
  };

  const handleBulkImport = async (importedPatients: Omit<Patient, "id" | "clinic_id" | "created_at">[]) => {
    for (const p of importedPatients) {
      await dbRepo.createPatient({
        ...p,
        clinic_id: "c1111111-1111-1111-1111-111111111111",
      });
    }
    toast(`Successfully imported ${importedPatients.length} patients!`, "success");
    await loadPatients();
  };

  // Performance Optimization: useMemo for client-side filtering & search
  const todayStr = React.useMemo(() => new Date().toISOString().split("T")[0], []);

  const filteredPatients = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return patients.filter((p) => {
      if (q) {
        const matchesSearch =
          p.name.toLowerCase().includes(q) ||
          p.phone.includes(q) ||
          (p.notes && p.notes.toLowerCase().includes(q));
        if (!matchesSearch) return false;
      }

      if (filterTab === "opted_in") return p.whatsapp_opt_in;
      if (filterTab === "opted_out") return !p.whatsapp_opt_in;
      if (filterTab === "recall_due") {
        return p.recall_due_date && p.recall_due_date <= todayStr;
      }
      return true;
    });
  }, [patients, search, filterTab, todayStr]);

  const counts = React.useMemo(() => {
    return {
      all: patients.length,
      optedIn: patients.filter((p) => p.whatsapp_opt_in).length,
      optedOut: patients.filter((p) => !p.whatsapp_opt_in).length,
      recallDue: patients.filter((p) => p.recall_due_date && p.recall_due_date <= todayStr).length,
    };
  }, [patients, todayStr]);

  return (
    <AppShell
      title="Patients Directory"
      subtitle="Manage patient contact records, WhatsApp consent, and treatment recall dates"
      onQuickAddPatient={() => {
        setEditingPatient(null);
        setIsAddModalOpen(true);
      }}
    >
      <div className="space-y-4">
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="relative flex-1 max-w-md">
            <label htmlFor="patient-search-input" className="sr-only">
              Search patients
            </label>
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="patient-search-input"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by patient name, phone (+91), or treatment note..."
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCsvModalOpen(true)}
              className="gap-1.5 min-h-[38px]"
              aria-label="Import patient records from CSV file"
            >
              <Upload className="w-4 h-4 text-slate-500" />
              Import CSV
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setEditingPatient(null);
                setIsAddModalOpen(true);
              }}
              className="gap-1.5 min-h-[38px]"
              aria-label="Add new patient manually"
            >
              <Plus className="w-4 h-4" />
              Add Patient
            </Button>
          </div>
        </div>

        {/* Accessible Filter Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs overflow-x-auto" role="tablist">
          <span className="flex items-center text-slate-400 text-xs mr-1 shrink-0">
            <Filter className="w-3.5 h-3.5 mr-1" /> Filters:
          </span>
          <button
            role="tab"
            aria-selected={filterTab === "all"}
            onClick={() => setFilterTab("all")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0 ${
              filterTab === "all" ? "bg-teal-50 text-teal-800 font-semibold" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            All Patients ({counts.all})
          </button>
          <button
            role="tab"
            aria-selected={filterTab === "opted_in"}
            onClick={() => setFilterTab("opted_in")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0 ${
              filterTab === "opted_in" ? "bg-teal-50 text-teal-800 font-semibold" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            WhatsApp Opted-In ({counts.optedIn})
          </button>
          <button
            role="tab"
            aria-selected={filterTab === "recall_due"}
            onClick={() => setFilterTab("recall_due")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0 ${
              filterTab === "recall_due" ? "bg-amber-50 text-amber-900 font-semibold" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Due for Recall ({counts.recallDue})
          </button>
          <button
            role="tab"
            aria-selected={filterTab === "opted_out"}
            onClick={() => setFilterTab("opted_out")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0 ${
              filterTab === "opted_out" ? "bg-rose-50 text-rose-800 font-semibold" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Opted Out ({counts.optedOut})
          </button>
        </div>

        {/* Patients Table with Skeleton Loading */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {isLoading ? (
            <TableSkeleton rows={8} cols={7} />
          ) : filteredPatients.length === 0 ? (
            <div className="p-12 text-center" role="status">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-900">No matching patients found</p>
              <p className="text-xs text-slate-500 mt-1">Try clearing filters or search term.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs" aria-label="Patients list">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 sticky top-0">
                  <tr>
                    <th scope="col" className="py-3 px-4">Patient Name</th>
                    <th scope="col" className="py-3 px-4">Mobile Number</th>
                    <th scope="col" className="py-3 px-4">WhatsApp Consent</th>
                    <th scope="col" className="py-3 px-4">Last Visit</th>
                    <th scope="col" className="py-3 px-4">Recall Due</th>
                    <th scope="col" className="py-3 px-4">Clinical Notes</th>
                    <th scope="col" className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPatients.map((patient) => {
                    const isDue = patient.recall_due_date && patient.recall_due_date <= todayStr;
                    return (
                      <tr key={patient.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <Link
                            href={`/patients/${patient.id}`}
                            className="font-semibold text-teal-800 hover:text-teal-900 hover:underline flex items-center gap-1.5 focus-visible:outline-teal-600"
                          >
                            {patient.name}
                          </Link>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-700">
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {patient.phone}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {patient.whatsapp_opt_in ? (
                            <Badge variant="success" className="gap-1 py-0.5">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Opted In
                            </Badge>
                          ) : (
                            <Badge variant="neutral" className="gap-1 py-0.5 text-slate-500">
                              <XCircle className="w-3 h-3 text-slate-400" />
                              Opted Out
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {formatDateIN(patient.last_visit_date)}
                        </td>
                        <td className="py-3 px-4">
                          {patient.recall_due_date ? (
                            isDue ? (
                              <Badge variant="warning" className="gap-1 py-0.5 font-semibold">
                                <Clock className="w-3 h-3 text-amber-700" />
                                {formatDateIN(patient.recall_due_date)} (Due)
                              </Badge>
                            ) : (
                              <span className="text-slate-600">{formatDateIN(patient.recall_due_date)}</span>
                            )
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                          {patient.notes || "-"}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setEditingPatient(patient);
                                setIsAddModalOpen(true);
                              }}
                              className="px-2.5 py-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded text-xs font-medium focus-visible:outline-teal-600 min-h-[30px]"
                              aria-label={`Edit ${patient.name}`}
                            >
                              Edit
                            </button>
                            <Link
                              href={`/patients/${patient.id}`}
                              className="px-2.5 py-1.5 text-teal-700 hover:text-teal-800 hover:bg-teal-50 rounded text-xs font-medium inline-flex items-center gap-1 focus-visible:outline-teal-600 min-h-[30px]"
                              aria-label={`View record for ${patient.name}`}
                            >
                              View
                              <ArrowRight className="w-3 h-3" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Patient Modal */}
      <PatientModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        patient={editingPatient}
        onSave={handleSavePatient}
      />

      {/* CSV Importer Modal */}
      <CsvImporter
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        existingPatients={patients}
        onImportSuccess={handleBulkImport}
      />
    </AppShell>
  );
}

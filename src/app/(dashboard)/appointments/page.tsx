"use client";

import * as React from "react";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Phone,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TableSkeleton } from "@/components/ui/skeleton";
import { AppointmentModal } from "@/components/appointments/appointment-modal";
import { useToast } from "@/components/ui/toast";
import { dbRepo } from "@/lib/db/repo";
import { Appointment, Patient } from "@/lib/db/types";
import { formatDateIN, formatTimeIN } from "@/lib/utils";

export default function AppointmentsPage() {
  const { toast } = useToast();
  const [appointments, setAppointments] = React.useState<Appointment[]>([]);
  const [patients, setPatients] = React.useState<Patient[]>([]);
  const [viewMode, setViewMode] = React.useState<"day" | "week" | "list">("list");
  const [selectedDate, setSelectedDate] = React.useState(new Date().toISOString().split("T")[0]);
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [isLoading, setIsLoading] = React.useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingAppointment, setEditingAppointment] = React.useState<Appointment | null>(null);

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [apts, pts] = await Promise.all([
        dbRepo.listAppointments(),
        dbRepo.listPatients(),
      ]);
      setAppointments(apts);
      setPatients(pts);
    } catch (e) {
      console.error(e);
      toast("Error loading appointments", "error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Mark Completed / Missed / Confirmed / Cancelled
  const handleUpdateStatus = async (
    apt: Appointment,
    newStatus: Appointment["status"]
  ) => {
    try {
      await dbRepo.updateAppointment(apt.id, {
        status: newStatus,
        confirmation_status: newStatus === "confirmed" ? "confirmed_patient" : apt.confirmation_status,
      });

      // If marked completed and has an active treatment plan, increment completed_sittings
      if (newStatus === "completed" && apt.treatment_plan_id) {
        const tp = await dbRepo.listTreatmentPlans().then((plans) =>
          plans.find((p) => p.id === apt.treatment_plan_id)
        );
        if (tp) {
          const newCompleted = tp.completed_sittings + 1;
          const isFinished = newCompleted >= tp.total_sittings;
          await dbRepo.updateTreatmentPlan(tp.id, {
            completed_sittings: newCompleted,
            status: isFinished ? "completed" : "active",
          });

          // Record recovered revenue event if completed
          if (tp.estimated_value > 0) {
            await dbRepo.createRecoveredEvent({
              clinic_id: apt.clinic_id,
              patient_id: apt.patient_id,
              appointment_id: apt.id,
              amount: tp.estimated_value / tp.total_sittings,
              reason: "sitting_completed",
            });
          }
          toast(
            isFinished
              ? `Treatment plan '${tp.treatment_name}' marked completed!`
              : `Sitting ${newCompleted}/${tp.total_sittings} completed.`,
            "success"
          );
        }
      } else {
        toast(`Appointment marked as ${newStatus}`, "info");
      }

      await loadData();
    } catch (e) {
      console.error(e);
      toast("Failed to update appointment", "error");
    }
  };

  const handleSaveAppointment = async (aptData: Omit<Appointment, "id" | "clinic_id" | "created_at">) => {
    if (editingAppointment) {
      await dbRepo.updateAppointment(editingAppointment.id, aptData);
      toast("Appointment updated", "success");
    } else {
      await dbRepo.createAppointment({
        ...aptData,
        clinic_id: "c1111111-1111-1111-1111-111111111111",
      });
      toast("New appointment booked", "success");
    }
    await loadData();
  };

  // Run end-of-day auto mark missed simulation
  const handleAutoMarkMissed = async () => {
    const now = new Date();
    let missedCount = 0;
    for (const apt of appointments) {
      const aptTime = new Date(apt.starts_at);
      if (aptTime < now && apt.status === "scheduled") {
        await dbRepo.updateAppointment(apt.id, { status: "missed" });
        missedCount++;
      }
    }
    toast(`Automated check: Marked ${missedCount} past appointments as missed`, "info");
    await loadData();
  };

  // Performance Optimization: useMemo for appointment filtering
  const filteredAppointments = React.useMemo(() => {
    return appointments.filter((apt) => {
      if (statusFilter !== "all" && apt.status !== statusFilter) return false;

      const aptDateStr = new Date(apt.starts_at).toISOString().split("T")[0];
      if (viewMode === "day") {
        return aptDateStr === selectedDate;
      }
      if (viewMode === "week") {
        const start = new Date(selectedDate);
        const end = new Date(start);
        end.setDate(end.getDate() + 7);
        const cur = new Date(apt.starts_at);
        return cur >= start && cur <= end;
      }
      return true;
    });
  }, [appointments, statusFilter, viewMode, selectedDate]);

  return (
    <AppShell
      title="Appointments Schedule"
      subtitle="Manage daily consultations, RCT sittings, and patient confirmations"
      onQuickAddAppointment={() => {
        setEditingAppointment(null);
        setIsModalOpen(true);
      }}
    >
      <div className="space-y-4">
        {/* Top Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          {/* View Mode Buttons */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold text-slate-600" role="group" aria-label="Schedule views">
            <button
              onClick={() => setViewMode("day")}
              className={`px-3 py-1.5 rounded-md transition-colors min-h-[32px] ${
                viewMode === "day" ? "bg-white text-teal-800 shadow-xs font-bold" : "hover:text-slate-900"
              }`}
            >
              Day View
            </button>
            <button
              onClick={() => setViewMode("week")}
              className={`px-3 py-1.5 rounded-md transition-colors min-h-[32px] ${
                viewMode === "week" ? "bg-white text-teal-800 shadow-xs font-bold" : "hover:text-slate-900"
              }`}
            >
              Week View
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 rounded-md transition-colors min-h-[32px] ${
                viewMode === "list" ? "bg-white text-teal-800 shadow-xs font-bold" : "hover:text-slate-900"
              }`}
            >
              All List
            </button>
          </div>

          {/* Date Selector */}
          <div className="flex items-center gap-2">
            {viewMode !== "list" && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    const d = new Date(selectedDate);
                    d.setDate(d.getDate() - (viewMode === "week" ? 7 : 1));
                    setSelectedDate(d.toISOString().split("T")[0]);
                  }}
                  className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-600 min-h-[36px] min-w-[36px] flex items-center justify-center"
                  aria-label="Previous date period"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg font-medium text-slate-800 min-h-[36px]"
                  aria-label="Select appointment date"
                />
                <button
                  onClick={() => {
                    const d = new Date(selectedDate);
                    d.setDate(d.getDate() + (viewMode === "week" ? 7 : 1));
                    setSelectedDate(d.toISOString().split("T")[0]);
                  }}
                  className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-600 min-h-[36px] min-w-[36px] flex items-center justify-center"
                  aria-label="Next date period"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleAutoMarkMissed}
              title="Checks past unupdated appointments and flags as missed"
              className="text-xs min-h-[36px]"
            >
              Run End-of-Day Check
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setEditingAppointment(null);
                setIsModalOpen(true);
              }}
              className="gap-1.5 min-h-[36px]"
              aria-label="Book new patient appointment"
            >
              <Plus className="w-4 h-4" />
              Book Appointment
            </Button>
          </div>
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs overflow-x-auto" role="tablist">
          <span className="flex items-center text-slate-400 text-xs mr-1 shrink-0">
            <Filter className="w-3.5 h-3.5 mr-1" /> Status:
          </span>
          {["all", "scheduled", "confirmed", "completed", "missed", "cancelled"].map((st) => (
            <button
              key={st}
              role="tab"
              aria-selected={statusFilter === st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg capitalize font-medium transition-colors shrink-0 ${
                statusFilter === st ? "bg-teal-50 text-teal-800 font-semibold" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Appointments List / Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {isLoading ? (
            <TableSkeleton rows={6} cols={6} />
          ) : filteredAppointments.length === 0 ? (
            <div className="p-12 text-center" role="status">
              <CalendarIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-900">No appointments found</p>
              <p className="text-xs text-slate-500 mt-1">
                There are no appointments scheduled matching the selected filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs" aria-label="Appointments schedule">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 sticky top-0">
                  <tr>
                    <th scope="col" className="py-3 px-4">Date & Time</th>
                    <th scope="col" className="py-3 px-4">Patient Name & Phone</th>
                    <th scope="col" className="py-3 px-4">Procedure / Notes</th>
                    <th scope="col" className="py-3 px-4">WhatsApp Reply Status</th>
                    <th scope="col" className="py-3 px-4">Visit Status</th>
                    <th scope="col" className="py-3 px-4 text-right">Quick Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAppointments.map((apt) => (
                    <tr key={apt.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{formatDateIN(apt.starts_at)}</div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {formatTimeIN(apt.starts_at)} ({apt.duration_minutes}m)
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {apt.patient ? (
                          <div>
                            <Link
                              href={`/patients/${apt.patient.id}`}
                              className="font-semibold text-teal-800 hover:text-teal-900 hover:underline focus-visible:outline-teal-600"
                            >
                              {apt.patient.name}
                            </Link>
                            <div className="flex items-center gap-1 font-mono text-[11px] text-slate-500">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {apt.patient.phone}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400">Unknown Patient</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-700">
                        {apt.treatment_plan ? (
                          <div>
                            <span className="font-semibold text-slate-900">{apt.treatment_plan.treatment_name}</span>
                            <span className="block text-[11px] text-teal-700">
                              Sitting {apt.treatment_plan.completed_sittings + 1} of {apt.treatment_plan.total_sittings}
                            </span>
                          </div>
                        ) : (
                          apt.notes || "General Consultation"
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {apt.confirmation_status === "confirmed_patient" ? (
                          <Badge variant="success" className="gap-1 py-0.5">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Confirmed (YES)
                          </Badge>
                        ) : apt.confirmation_status === "reschedule_requested" ? (
                          <Badge variant="warning" className="gap-1 py-0.5">
                            <AlertCircle className="w-3 h-3 text-amber-700" />
                            Needs Attention (NO)
                          </Badge>
                        ) : (
                          <Badge variant="neutral" className="gap-1 py-0.5 text-slate-500">
                            <Clock className="w-3 h-3 text-slate-400" />
                            Awaiting Reply
                          </Badge>
                        )}
                      </td>

                      <td className="py-3 px-4">
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
                          className="capitalize"
                        >
                          {apt.status}
                        </Badge>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {apt.status !== "completed" && (
                            <button
                              onClick={() => handleUpdateStatus(apt, "completed")}
                              className="px-2.5 py-1.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded text-xs font-semibold focus-visible:outline-teal-600 min-h-[30px]"
                              title="Mark sitting as completed"
                              aria-label={`Mark visit for ${apt.patient?.name} as completed`}
                            >
                              Complete
                            </button>
                          )}

                          {apt.status !== "missed" && apt.status !== "completed" && (
                            <button
                              onClick={() => handleUpdateStatus(apt, "missed")}
                              className="px-2.5 py-1.5 bg-rose-50 text-rose-800 hover:bg-rose-100 rounded text-xs font-semibold focus-visible:outline-teal-600 min-h-[30px]"
                              title="Mark as missed / no-show"
                              aria-label={`Mark visit for ${apt.patient?.name} as missed`}
                            >
                              Missed
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setEditingAppointment(apt);
                              setIsModalOpen(true);
                            }}
                            className="px-2.5 py-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded text-xs font-medium focus-visible:outline-teal-600 min-h-[30px]"
                            aria-label={`Edit appointment for ${apt.patient?.name}`}
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Appointment Modal */}
      <AppointmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        appointment={editingAppointment}
        patients={patients}
        existingAppointments={appointments}
        onSave={handleSaveAppointment}
      />
    </AppShell>
  );
}

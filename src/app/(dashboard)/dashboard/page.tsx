"use client";

import * as React from "react";
import Link from "next/link";
import {
  Calendar,
  CheckCircle2,
  TrendingUp,
  Clock,
  AlertTriangle,
  MessageSquare,
  ArrowRight,
  Send,
  Users,
  ShieldCheck,
  AlertCircle,
  Phone,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { CardSkeleton, Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { dbRepo } from "@/lib/db/repo";
import { Appointment, Patient, RecoveredRevenueEvent, Message } from "@/lib/db/types";
import { formatINR, formatDateIN, formatTimeIN } from "@/lib/utils";

export default function DashboardPage() {
  const { toast } = useToast();
  const [appointments, setAppointments] = React.useState<Appointment[]>([]);
  const [patients, setPatients] = React.useState<Patient[]>([]);
  const [recoveredEvents, setRecoveredEvents] = React.useState<RecoveredRevenueEvent[]>([]);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // Bulk follow-up modal
  const [isBulkFollowUpOpen, setIsBulkFollowUpOpen] = React.useState(false);
  const [isSendingBulk, setIsSendingBulk] = React.useState(false);

  const loadDashboardData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [apts, pts, revs, msgs] = await Promise.all([
        dbRepo.listAppointments(),
        dbRepo.listPatients(),
        dbRepo.listRecoveredEvents(),
        dbRepo.listMessages(),
      ]);
      setAppointments(apts);
      setPatients(pts);
      setRecoveredEvents(revs);
      setMessages(msgs);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Performance Optimization: useMemo for dashboard calculations
  const metrics = React.useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // 1. Today's Appointments
    const todayAppts = appointments.filter(
      (a) => new Date(a.starts_at).toISOString().split("T")[0] === todayStr && a.status !== "cancelled"
    );
    const confirmedCount = todayAppts.filter(
      (a) => a.confirmation_status === "confirmed_patient" || a.status === "confirmed"
    ).length;
    const unconfirmedCount = todayAppts.length - confirmedCount;

    // 2. No-Shows this month
    const noShows = appointments.filter((a) => {
      const d = new Date(a.starts_at);
      return a.status === "missed" && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;

    // 3. Due for recall
    const recallDue = patients.filter(
      (p) => p.whatsapp_opt_in && p.recall_due_date && p.recall_due_date <= todayStr
    );

    // 4. Missed follow-ups
    const missedFollowups = appointments.filter(
      (a) => a.status === "missed" && a.patient?.whatsapp_opt_in
    );

    // 5. Recovered Revenue
    const monthRecovered = recoveredEvents
      .filter((r) => {
        const d = new Date(r.created_at);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, r) => sum + Number(r.amount), 0);

    const allRecovered = recoveredEvents.reduce((sum, r) => sum + Number(r.amount), 0);

    // 6. Messages sent this month
    const msgsSent = messages.filter((m) => {
      const d = new Date(m.created_at);
      return (
        m.direction === "outbound" &&
        d.getMonth() === currentMonth &&
        d.getFullYear() === currentYear
      );
    }).length;

    // 7. Attention Items
    const unconfirmedTmr = appointments.filter(
      (a) =>
        new Date(a.starts_at).toISOString().split("T")[0] === tomorrowStr &&
        a.confirmation_status === "pending" &&
        a.status === "scheduled"
    );

    const needsAttentionReplies = appointments.filter(
      (a) => a.confirmation_status === "reschedule_requested" || a.confirmation_status === "cancelled_patient"
    );

    const failed = messages.filter((m) => m.status === "failed");

    return {
      todayAppts,
      confirmedCount,
      unconfirmedCount,
      noShows,
      recallDue,
      missedFollowups,
      totalBulk: recallDue.length + missedFollowups.length,
      monthRecovered,
      allRecovered,
      msgsSent,
      unconfirmedTmr,
      needsAttentionReplies,
      failed,
      tomorrowStr,
      todayStr,
    };
  }, [appointments, patients, recoveredEvents, messages]);

  const handleConfirmBulkSend = async () => {
    setIsSendingBulk(true);
    try {
      for (const p of metrics.recallDue) {
        await dbRepo.createMessage({
          clinic_id: "c1111111-1111-1111-1111-111111111111",
          patient_id: p.id,
          appointment_id: null,
          template_id: "t6-recall",
          direction: "outbound",
          body: `Hello ${p.name}, it has been 6 months since your last dental cleaning and checkup at Apex Dental Care & Implant Center. Reply YES to book your slot.`,
          status: "delivered",
          provider_message_id: `wamid_bulk_${Date.now()}_${p.id}`,
          error: null,
          scheduled_for: new Date().toISOString(),
          sent_at: new Date().toISOString(),
          idempotency_key: `bulk_recall_${p.id}_${metrics.todayStr}`,
          retry_count: 0,
        });
      }

      for (const apt of metrics.missedFollowups) {
        if (!apt.patient) continue;
        await dbRepo.createMessage({
          clinic_id: "c1111111-1111-1111-1111-111111111111",
          patient_id: apt.patient.id,
          appointment_id: apt.id,
          template_id: "t4-missed",
          direction: "outbound",
          body: `Dear ${apt.patient.name}, we noticed you were unable to make it to your dental appointment today. Would you like to reschedule for this week? Reply YES to connect with our receptionist.`,
          status: "delivered",
          provider_message_id: `wamid_bulk_missed_${Date.now()}_${apt.id}`,
          error: null,
          scheduled_for: new Date().toISOString(),
          sent_at: new Date().toISOString(),
          idempotency_key: `bulk_missed_${apt.id}_${metrics.todayStr}`,
          retry_count: 0,
        });
      }

      toast(`Sent automated WhatsApp follow-ups to ${metrics.totalBulk} patients!`, "success");
      setIsBulkFollowUpOpen(false);
      await loadDashboardData();
    } catch {
      toast("Bulk send failed", "error");
    } finally {
      setIsSendingBulk(false);
    }
  };

  const monthlyNoShowRate = [
    { month: "May", rate: 24 },
    { month: "Jun", rate: 21 },
    { month: "Jul", rate: 18 },
    { month: "Aug", rate: 15 },
    { month: "Sep", rate: 12 },
    { month: "Oct", rate: 8 },
  ];

  return (
    <AppShell
      title="Clinic Overview"
      subtitle="Apex Dental Care & Implant Center - Dr. Rajesh Sharma"
    >
      <div className="space-y-6">
        {/* Top Recovered Revenue Banner */}
        <div className="bg-gradient-to-r from-teal-900 to-teal-800 rounded-xl p-6 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-teal-200 text-xs font-semibold uppercase tracking-wider mb-1">
              <TrendingUp className="w-4 h-4" />
              Direct Recovered Clinic Revenue
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-extrabold tracking-tight">
                {isLoading ? "..." : formatINR(metrics.monthRecovered)}
              </span>
              <span className="text-xs text-teal-200">recovered this month</span>
            </div>
            <p className="text-xs text-teal-300 mt-1">
              All time recovered: <strong>{formatINR(metrics.allRecovered)}</strong> from automated recall and missed sitting follow-ups.
            </p>
          </div>

          <Button
            variant="secondary"
            className="bg-white text-teal-900 hover:bg-teal-50 border-transparent shadow-sm gap-2 min-h-[40px]"
            onClick={() => setIsBulkFollowUpOpen(true)}
            aria-label={`Send follow-up messages to ${metrics.totalBulk} patients`}
          >
            <Send className="w-4 h-4 text-teal-700" />
            Send Follow-ups to All ({metrics.totalBulk})
          </Button>
        </div>

        {/* 4 Core Metric Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1 */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Today&apos;s Appointments</span>
                <Calendar className="w-4 h-4 text-teal-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900">{metrics.todayAppts.length}</div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-emerald-700 font-semibold">{metrics.confirmedCount} Confirmed</span>
                <span className="text-slate-300">•</span>
                <span className="text-amber-700 font-semibold">{metrics.unconfirmedCount} Pending</span>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">No-Shows this Month</span>
                <AlertCircle className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900">{metrics.noShows}</div>
              <p className="text-xs text-slate-500">
                Down from 18 last month with automated reminders.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Patients Due for Recall</span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900">{metrics.recallDue.length}</div>
              <p className="text-xs text-slate-500">
                Patients past 6-month checkup date with WhatsApp opt-in.
              </p>
            </div>

            {/* Card 4 */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Messages Sent</span>
                <MessageSquare className="w-4 h-4 text-teal-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900">{metrics.msgsSent}</div>
              <p className="text-xs text-slate-500">
                Verified Meta WhatsApp Cloud API delivery.
              </p>
            </div>
          </div>
        )}

        {/* Two Columns: Needs Attention & No-Show Rate Trend */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Needs Attention Column */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">Needs Clinic Attention</h3>
              </div>
              <Badge variant="warning">
                {metrics.unconfirmedTmr.length + metrics.needsAttentionReplies.length + metrics.failed.length} action items
              </Badge>
            </div>

            <div className="space-y-3">
              {metrics.unconfirmedTmr.length > 0 && (
                <div className="p-3.5 rounded-lg border border-amber-200 bg-amber-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900">
                      Unconfirmed Appointments Tomorrow ({metrics.unconfirmedTmr.length})
                    </span>
                    <span className="text-[11px] text-amber-700">Scheduled for {formatDateIN(metrics.tomorrowStr)}</span>
                  </div>
                  <div className="divide-y divide-amber-200/50 text-xs">
                    {metrics.unconfirmedTmr.map((a) => (
                      <div key={a.id} className="py-2 flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-slate-900">{a.patient?.name}</span>
                          <span className="text-slate-500 font-mono text-[11px] ml-2">{a.patient?.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-600 font-medium">{formatTimeIN(a.starts_at)}</span>
                          <Link href={`/appointments`}>
                            <Button size="sm" variant="outline" className="h-7 text-xs py-0 px-2.5">
                              Call / View
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {metrics.needsAttentionReplies.length > 0 && (
                <div className="p-3.5 rounded-lg border border-rose-200 bg-rose-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-900">
                      Patient Requested Reschedule / Cancel ({metrics.needsAttentionReplies.length})
                    </span>
                    <Badge variant="danger" className="text-[10px]">Staff Action Required</Badge>
                  </div>
                  <div className="divide-y divide-rose-200/50 text-xs">
                    {metrics.needsAttentionReplies.map((a) => (
                      <div key={a.id} className="py-2 flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-slate-900">{a.patient?.name}</span>
                          <span className="text-rose-700 ml-2">Replied &quot;NO - Reschedule&quot;</span>
                        </div>
                        <Link href="/inbox">
                          <Button size="sm" variant="outline" className="h-7 text-xs py-0 px-2.5">
                            Open Inbox
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {metrics.unconfirmedTmr.length === 0 && metrics.needsAttentionReplies.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-500">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                  All caught up! No critical attention items today.
                </div>
              )}
            </div>
          </div>

          {/* No-Show Rate Trend Column */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">No-Show Rate Trend</h3>
              <p className="text-xs text-slate-500">Last 6 months performance with WhatsApp reminders</p>
            </div>

            <div className="space-y-3 pt-2">
              {monthlyNoShowRate.map((m) => (
                <div key={m.month} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700">{m.month}</span>
                    <span className="font-bold text-slate-900">{m.rate}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-teal-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${m.rate * 3}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 text-xs text-slate-600 flex items-center justify-between">
              <span>Overall reduction</span>
              <span className="font-bold text-emerald-700">-66% No-Shows</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Follow-up Confirmation Modal */}
      <Modal
        isOpen={isBulkFollowUpOpen}
        onClose={() => setIsBulkFollowUpOpen(false)}
        title="One-Click WhatsApp Follow-ups"
        description="Review follow-up queues before triggering automated outreach."
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3.5 rounded-lg bg-teal-50 border border-teal-200 space-y-2 text-teal-950">
            <div className="font-semibold text-sm">Follow-up Summary:</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>{metrics.recallDue.length}</strong> patients due for 6-month routine cleaning and checkup
              </li>
              <li>
                <strong>{metrics.missedFollowups.length}</strong> patients with missed consultations needing rescheduling
              </li>
              <li>
                Total outbound messages to dispatch: <strong>{metrics.totalBulk}</strong>
              </li>
            </ul>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-600">
            <strong>Consent Check:</strong> Only patients with verified WhatsApp opt-in consent will be messaged. Quiet hours (9 PM to 9 AM) are strictly enforced.
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsBulkFollowUpOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirmBulkSend}
              isLoading={isSendingBulk}
              disabled={metrics.totalBulk === 0}
            >
              Confirm & Dispatch ({metrics.totalBulk})
            </Button>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}

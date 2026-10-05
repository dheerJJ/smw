"use client";

import * as React from "react";
import Link from "next/link";
import {
  MessageSquare,
  Search,
  Send,
  Phone,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  User,
  ArrowRight,
  Filter,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { dbRepo } from "@/lib/db/repo";
import { Patient, Message, Appointment } from "@/lib/db/types";
import { formatDateTimeIN, formatTimeIN } from "@/lib/utils";
import { getWhatsAppProvider } from "@/lib/whatsapp";

export default function InboxPage() {
  const { toast } = useToast();
  const [patients, setPatients] = React.useState<Patient[]>([]);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [appointments, setAppointments] = React.useState<Appointment[]>([]);
  const [selectedPatientId, setSelectedPatientId] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [filterNeedsAttention, setFilterNeedsAttention] = React.useState(false);
  const [replyText, setReplyText] = React.useState("");
  const [isSending, setIsSending] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [pts, msgs, apts] = await Promise.all([
        dbRepo.listPatients(),
        dbRepo.listMessages(),
        dbRepo.listAppointments(),
      ]);
      setPatients(pts);
      setMessages(msgs);
      setAppointments(apts);

      if (pts.length > 0) {
        setSelectedPatientId((prev) => {
          if (prev) return prev;
          const withInbound = msgs.find((m) => m.direction === "inbound")?.patient_id;
          return withInbound || pts[0].id;
        });
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedPatient = React.useMemo(
    () => patients.find((p) => p.id === selectedPatientId) || null,
    [patients, selectedPatientId]
  );

  const conversationMessages = React.useMemo(() => {
    return messages
      .filter((m) => m.patient_id === selectedPatientId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [messages, selectedPatientId]);

  // Check if patient has any appointment needing attention
  const activeAppointment = React.useMemo(() => {
    const patientAppointments = appointments.filter((a) => a.patient_id === selectedPatientId);
    return patientAppointments.find((a) => a.status === "scheduled" || a.status === "confirmed");
  }, [appointments, selectedPatientId]);

  // Group patients by conversation activity with useMemo
  const filteredConversations = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    const patientConversations = patients
      .map((p) => {
        const pMsgs = messages.filter((m) => m.patient_id === p.id);
        const lastMsg = pMsgs.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];
        const hasNeedsAttention = appointments.some(
          (a) =>
            a.patient_id === p.id &&
            (a.confirmation_status === "reschedule_requested" || a.confirmation_status === "cancelled_patient")
        );
        return {
          patient: p,
          messageCount: pMsgs.length,
          lastMsg,
          hasNeedsAttention,
        };
      })
      .filter((c) => c.messageCount > 0);

    return patientConversations.filter((c) => {
      if (q) {
        const matchSearch =
          c.patient.name.toLowerCase().includes(q) || c.patient.phone.includes(q);
        if (!matchSearch) return false;
      }
      if (filterNeedsAttention) return c.hasNeedsAttention;
      return true;
    });
  }, [patients, messages, appointments, search, filterNeedsAttention]);

  // Handle Staff Sending Manual Text Message
  const handleSendReply = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedPatient || !replyText.trim()) return;

    if (!selectedPatient.whatsapp_opt_in) {
      toast("Cannot send message: Patient has opted out of WhatsApp", "error");
      return;
    }

    setIsSending(true);
    try {
      const clinic = await dbRepo.getClinic();
      const provider = getWhatsAppProvider(clinic);

      const sendRes = await provider.sendTextMessage(selectedPatient.phone, replyText.trim());

      await dbRepo.createMessage({
        clinic_id: "c1111111-1111-1111-1111-111111111111",
        patient_id: selectedPatient.id,
        appointment_id: activeAppointment?.id || null,
        template_id: null,
        direction: "outbound",
        body: replyText.trim(),
        status: sendRes.success ? "delivered" : "failed",
        provider_message_id: sendRes.providerMessageId || null,
        error: sendRes.error || null,
        scheduled_for: new Date().toISOString(),
        sent_at: new Date().toISOString(),
        idempotency_key: `staff_reply_${Date.now()}`,
        retry_count: 0,
      });

      toast("Message dispatched via WhatsApp", "success");
      setReplyText("");
      await loadData();
    } catch {
      toast("Failed to dispatch WhatsApp message", "error");
    } finally {
      setIsSending(false);
    }
  };

  // Quick action: Confirm Appointment
  const handleConfirmAppointment = async () => {
    if (!activeAppointment) return;
    await dbRepo.updateAppointment(activeAppointment.id, {
      status: "confirmed",
      confirmation_status: "confirmed_patient",
    });
    toast("Appointment marked confirmed", "success");
    await loadData();
  };

  return (
    <AppShell
      title="WhatsApp Reception Inbox"
      subtitle="Interact with patient replies and manage real-time appointment confirmations"
    >
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col md:flex-row h-[calc(100vh-160px)] min-h-[500px]">
        {/* Left Pane: Conversation List */}
        <div className="w-full md:w-80 border-r border-slate-200 flex flex-col bg-slate-50/50">
          {/* Search & Filter Header */}
          <div className="p-3 border-b border-slate-200 space-y-2 bg-white">
            <div className="relative">
              <label htmlFor="inbox-search" className="sr-only">
                Search inbox
              </label>
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="inbox-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search patient name or phone..."
                className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => setFilterNeedsAttention(!filterNeedsAttention)}
                className={`text-[11px] font-semibold px-2 py-1 rounded flex items-center gap-1.5 transition-colors min-h-[28px] ${
                  filterNeedsAttention
                    ? "bg-rose-100 text-rose-800"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
                aria-pressed={filterNeedsAttention}
              >
                <Filter className="w-3 h-3" />
                Needs Attention Only
              </button>
              <span className="text-[11px] text-slate-400">{filteredConversations.length} chats</span>
            </div>
          </div>

          {/* Conversation Items */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100" role="region" aria-label="Patient conversations">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex gap-3 items-center">
                    <Skeleton className="w-9 h-9 rounded-full" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-2.5 w-36" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredConversations.length === 0 ? (
              <p className="p-8 text-center text-xs text-slate-500">No active conversations found</p>
            ) : (
              filteredConversations.map(({ patient, lastMsg, hasNeedsAttention }) => {
                const isSelected = selectedPatientId === patient.id;
                return (
                  <button
                    key={patient.id}
                    onClick={() => setSelectedPatientId(patient.id)}
                    className={`w-full text-left p-3.5 transition-colors flex items-start gap-3 min-h-[64px] ${
                      isSelected
                        ? "bg-white border-l-4 border-l-teal-600 shadow-xs"
                        : "hover:bg-slate-100/70"
                    }`}
                    aria-selected={isSelected}
                  >
                    <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-800 font-bold text-xs flex items-center justify-center shrink-0">
                      {patient.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-bold text-slate-900 truncate">{patient.name}</span>
                        {lastMsg && (
                          <span className="text-[10px] text-slate-400">
                            {formatTimeIN(lastMsg.created_at)}
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-600 truncate">
                        {lastMsg?.direction === "inbound" ? (
                          <span className="text-teal-700 font-medium">Patient: {lastMsg.body}</span>
                        ) : (
                          lastMsg?.body || "Conversation started"
                        )}
                      </p>

                      <div className="flex items-center gap-1.5 mt-1">
                        {hasNeedsAttention && (
                          <Badge variant="danger" className="text-[9px] py-0 px-1">
                            Replied NO
                          </Badge>
                        )}
                        {!patient.whatsapp_opt_in && (
                          <Badge variant="neutral" className="text-[9px] py-0 px-1">
                            Opted Out
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Active Chat Conversation */}
        {selectedPatient ? (
          <div className="flex-1 flex flex-col bg-slate-50/30">
            {/* Chat Header */}
            <div className="p-3.5 bg-white border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-teal-600 text-white font-bold text-xs flex items-center justify-center">
                  {selectedPatient.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{selectedPatient.name}</span>
                    {selectedPatient.whatsapp_opt_in ? (
                      <Badge variant="success" className="text-[10px] py-0">
                        Opted In
                      </Badge>
                    ) : (
                      <Badge variant="danger" className="text-[10px] py-0">
                        Opted Out
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs font-mono text-slate-500">{selectedPatient.phone}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {activeAppointment && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleConfirmAppointment}
                    className="h-8 text-xs gap-1 border-emerald-300 text-emerald-800 hover:bg-emerald-50 min-h-[32px]"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Confirm Appointment
                  </Button>
                )}
                <Link href={`/patients/${selectedPatient.id}`}>
                  <Button size="sm" variant="outline" className="h-8 text-xs gap-1 min-h-[32px]">
                    <User className="w-3.5 h-3.5" />
                    Profile
                  </Button>
                </Link>
              </div>
            </div>

            {/* Active Appointment Context Bar */}
            {activeAppointment && (
              <div className="px-4 py-2 bg-teal-50/70 border-b border-teal-100 flex items-center justify-between text-xs text-teal-950">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-teal-700" />
                  <span>
                    Upcoming Visit: <strong>{formatDateTimeIN(activeAppointment.starts_at)}</strong>
                  </span>
                  <Badge variant="default" className="text-[10px] capitalize">
                    {activeAppointment.status}
                  </Badge>
                </div>
                {activeAppointment.confirmation_status === "reschedule_requested" && (
                  <span className="text-rose-700 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Patient requested to reschedule
                  </span>
                )}
              </div>
            )}

            {/* Message Thread */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3" role="log" aria-label="Conversation history">
              {conversationMessages.map((m) => {
                const isInbound = m.direction === "inbound";
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isInbound ? "items-start" : "items-end"}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-xl p-3 text-xs leading-relaxed shadow-xs ${
                        isInbound
                          ? "bg-white border border-slate-200 text-slate-900 rounded-tl-xs"
                          : "bg-teal-700 text-white rounded-tr-xs"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{m.body}</p>
                      <div
                        className={`text-[10px] mt-1 text-right flex items-center justify-end gap-1 ${
                          isInbound ? "text-slate-400" : "text-teal-200"
                        }`}
                      >
                        <span>{formatTimeIN(m.created_at)}</span>
                        {!isInbound && (
                          <span>
                            {m.status === "delivered" || m.status === "read" ? "✓✓" : "✓"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Reply Shortcuts */}
            <div className="px-4 py-2 border-t border-slate-200 bg-white flex items-center gap-1.5 overflow-x-auto text-[11px]">
              <span className="text-slate-400 shrink-0">Quick shortcuts:</span>
              <button
                type="button"
                onClick={() =>
                  setReplyText(
                    "Hello! We have slots available tomorrow at 04:00 PM and 05:30 PM. Would either work for you?"
                  )
                }
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 whitespace-nowrap min-h-[28px]"
              >
                Slot options
              </button>
              <button
                type="button"
                onClick={() =>
                  setReplyText(
                    "Thank you for confirming! Your appointment with Dr. Rajesh Sharma is secured. See you shortly!"
                  )
                }
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 whitespace-nowrap min-h-[28px]"
              >
                Confirmed notice
              </button>
              <button
                type="button"
                onClick={() =>
                  setReplyText("Our receptionist will call you shortly to assist with rescheduling.")
                }
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 whitespace-nowrap min-h-[28px]"
              >
                Calling shortly
              </button>
            </div>

            {/* Bottom Reply Box */}
            <form onSubmit={handleSendReply} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
              <label htmlFor="reply-input" className="sr-only">
                Type reply
              </label>
              <input
                id="reply-input"
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={
                  selectedPatient.whatsapp_opt_in
                    ? "Type WhatsApp message (free-form allowed within 24h window)..."
                    : "Patient has opted out of WhatsApp"
                }
                disabled={!selectedPatient.whatsapp_opt_in || isSending}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none disabled:bg-slate-100 min-h-[38px]"
              />
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={!selectedPatient.whatsapp_opt_in || !replyText.trim() || isSending}
                isLoading={isSending}
                className="gap-1.5 min-h-[38px]"
                aria-label="Send WhatsApp message"
              >
                <Send className="w-3.5 h-3.5" />
                Send
              </Button>
            </form>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8 text-xs text-slate-400">
            Select a conversation to view chat history
          </div>
        )}
      </div>
    </AppShell>
  );
}

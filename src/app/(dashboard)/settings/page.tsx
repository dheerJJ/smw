"use client";

import * as React from "react";
import {
  Building2,
  Clock,
  PhoneCall,
  Users,
  Download,
  Save,
  ShieldCheck,
  Send,
  CheckCircle2,
  AlertCircle,
  Plus,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { dbRepo } from "@/lib/db/repo";
import { Clinic, Profile, AuditLog } from "@/lib/db/types";
import { getWhatsAppProvider } from "@/lib/whatsapp";
import { formatDateTimeIN } from "@/lib/utils";

export default function SettingsPage() {
  const { toast } = useToast();
  const [clinic, setClinic] = React.useState<Clinic | null>(null);
  const [profiles, setProfiles] = React.useState<Profile[]>([]);
  const [auditLogs, setAuditLogs] = React.useState<AuditLog[]>([]);
  const [activeTab, setActiveTab] = React.useState<"profile" | "rules" | "whatsapp" | "staff" | "export">("profile");
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);

  // Form State
  const [name, setName] = React.useState("");
  const [doctorName, setDoctorName] = React.useState("");
  const [city, setCity] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [avgTreatmentValue, setAvgTreatmentValue] = React.useState("3500");
  const [quietStart, setQuietStart] = React.useState("21:00");
  const [quietEnd, setQuietEnd] = React.useState("09:00");

  // Rules toggles and timings
  const [rulesConfig, setRulesConfig] = React.useState<Clinic["rules_config"]>({
    reminder_day_before: { enabled: true, send_time: "18:00" },
    reminder_same_day: { enabled: true, hours_before: 2 },
    missed_followup: { enabled: true, morning_time: "10:00", second_nudge_days: 3 },
    sitting_followup: { enabled: true, first_nudge_days: 5, second_nudge_days: 10 },
    recall_6_month: { enabled: true, second_nudge_days: 7 },
  });

  // Test WhatsApp Send
  const [testNumber, setTestNumber] = React.useState("+919820123456");
  const [isTestingWhatsApp, setIsTestingWhatsApp] = React.useState(false);

  // Invite Staff Modal
  const [isInviteModalOpen, setIsInviteModalOpen] = React.useState(false);
  const [inviteName, setInviteName] = React.useState("");
  const [inviteEmail, setInviteEmail] = React.useState("");
  const [inviteRole, setInviteRole] = React.useState<"staff" | "owner">("staff");

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [c, profs, logs] = await Promise.all([
        dbRepo.getClinic(),
        dbRepo.listProfiles(),
        dbRepo.listAuditLogs(),
      ]);
      if (c) {
        setClinic(c);
        setName(c.name);
        setDoctorName(c.doctor_name);
        setCity(c.city);
        setPhone(c.phone || "");
        setAvgTreatmentValue(String(c.avg_treatment_value));
        setQuietStart(c.quiet_hours_start);
        setQuietEnd(c.quiet_hours_end);
        setRulesConfig(c.rules_config);
      }
      setProfiles(profs);
      setAuditLogs(logs);
    } catch {
      toast("Error loading settings", "error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinic) return;
    setIsSaving(true);
    try {
      await dbRepo.updateClinic(clinic.id, {
        name,
        doctor_name: doctorName,
        city,
        phone,
        avg_treatment_value: parseFloat(avgTreatmentValue) || 2500,
        quiet_hours_start: quietStart,
        quiet_hours_end: quietEnd,
        rules_config: rulesConfig,
      });
      toast("Clinic settings saved successfully", "success");
      await loadData();
    } catch {
      toast("Failed to save settings", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendTestWhatsApp = async () => {
    setIsTestingWhatsApp(true);
    try {
      const provider = getWhatsAppProvider(clinic);
      const res = await provider.sendTextMessage(
        testNumber,
        `Hello from ${name}! This is a verified test reminder from SmileRecall.`
      );
      if (res.success) {
        toast(`Test message sent successfully to ${testNumber}!`, "success");
      } else {
        toast(`WhatsApp error: ${res.error}`, "error");
      }
    } catch {
      toast("Failed to dispatch test message", "error");
    } finally {
      setIsTestingWhatsApp(false);
    }
  };

  const handleInviteStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    const newId = `u-${Date.now()}`;
    await dbRepo.createProfile({
      id: newId,
      clinic_id: clinic?.id || "c1111111-1111-1111-1111-111111111111",
      role: inviteRole,
      full_name: inviteName,
      created_at: new Date().toISOString(),
    });
    toast(`Staff member ${inviteName} invited as ${inviteRole}`, "success");
    setIsInviteModalOpen(false);
    setInviteName("");
    setInviteEmail("");
    await loadData();
  };

  return (
    <AppShell
      title="Clinic Settings & Configuration"
      subtitle="Configure clinic profile, quiet hours, automation rules, WhatsApp API, and staff roles"
    >
      <div className="space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0 ${
              activeTab === "profile" ? "bg-teal-50 text-teal-800 font-semibold" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Clinic Profile
          </button>
          <button
            onClick={() => setActiveTab("rules")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0 ${
              activeTab === "rules" ? "bg-teal-50 text-teal-800 font-semibold" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Automation Rules & Timing
          </button>
          <button
            onClick={() => setActiveTab("whatsapp")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0 ${
              activeTab === "whatsapp" ? "bg-teal-50 text-teal-800 font-semibold" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            WhatsApp Connection
          </button>
          <button
            onClick={() => setActiveTab("staff")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0 ${
              activeTab === "staff" ? "bg-teal-50 text-teal-800 font-semibold" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Staff & Roles ({profiles.length})
          </button>
          <button
            onClick={() => setActiveTab("export")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0 ${
              activeTab === "export" ? "bg-teal-50 text-teal-800 font-semibold" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Data Export & DPDP
          </button>
        </div>

        {/* Tab 1: Clinic Profile */}
        {activeTab === "profile" && (
          <form onSubmit={handleSaveProfile} className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Dental Practice Profile</h3>
              <p className="text-xs text-slate-500">Details used in patient messages and receipts.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Clinic Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Doctor Name *
                </label>
                <input
                  type="text"
                  required
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  City *
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Reception Phone Number
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  placeholder="+919820123456"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Average Treatment Sitting Value (₹) *
                </label>
                <input
                  type="number"
                  required
                  value={avgTreatmentValue}
                  onChange={(e) => setAvgTreatmentValue(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Clinic Timezone
                </label>
                <input
                  type="text"
                  disabled
                  value="Asia/Kolkata (IST)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
              <Button type="submit" variant="primary" size="sm" isLoading={isSaving} className="gap-1.5">
                <Save className="w-3.5 h-3.5" />
                Save Profile
              </Button>
            </div>
          </form>
        )}

        {/* Tab 2: Automation Rules & Timing */}
        {activeTab === "rules" && (
          <form onSubmit={handleSaveProfile} className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Quiet Hours & Automation Rules</h3>
              <p className="text-xs text-slate-500">
                Messages triggered during quiet hours are queued and dispatched at 09:00 AM the next day.
              </p>
            </div>

            {/* Quiet Hours */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                <Clock className="w-4 h-4 text-teal-600" />
                Clinic Quiet Hours (No automated night messages)
              </div>
              <div className="grid grid-cols-2 gap-4 max-w-md">
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Start (Night)</label>
                  <input
                    type="time"
                    value={quietStart}
                    onChange={(e) => setQuietStart(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">End (Morning)</label>
                  <input
                    type="time"
                    value={quietEnd}
                    onChange={(e) => setQuietEnd(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>
            </div>

            {/* 5 Automation Rules Toggles */}
            <div className="space-y-4">
              {/* Rule 1 */}
              <div className="p-4 border border-slate-200 rounded-lg flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">1. Day-Before Reminder</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Sends reminder at configured time for appointments scheduled on the following calendar day.
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-slate-600">Send at:</span>
                    <input
                      type="time"
                      value={rulesConfig.reminder_day_before.send_time}
                      onChange={(e) =>
                        setRulesConfig({
                          ...rulesConfig,
                          reminder_day_before: { ...rulesConfig.reminder_day_before, send_time: e.target.value },
                        })
                      }
                      className="px-2 py-1 text-xs border border-slate-300 rounded"
                    />
                  </div>
                </div>
                <label className="cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rulesConfig.reminder_day_before.enabled}
                    onChange={(e) =>
                      setRulesConfig({
                        ...rulesConfig,
                        reminder_day_before: { ...rulesConfig.reminder_day_before, enabled: e.target.checked },
                      })
                    }
                    className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                  />
                </label>
              </div>

              {/* Rule 2 */}
              <div className="p-4 border border-slate-200 rounded-lg flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">2. Same-Day Reminder</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Sends notice a few hours before the consultation to minimize last-minute cancellations.
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-slate-600">Send:</span>
                    <input
                      type="number"
                      min="1"
                      max="6"
                      value={rulesConfig.reminder_same_day.hours_before}
                      onChange={(e) =>
                        setRulesConfig({
                          ...rulesConfig,
                          reminder_same_day: {
                            ...rulesConfig.reminder_same_day,
                            hours_before: parseInt(e.target.value) || 2,
                          },
                        })
                      }
                      className="w-16 px-2 py-1 text-xs border border-slate-300 rounded"
                    />
                    <span className="text-xs text-slate-600">hours before appointment</span>
                  </div>
                </div>
                <label className="cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rulesConfig.reminder_same_day.enabled}
                    onChange={(e) =>
                      setRulesConfig({
                        ...rulesConfig,
                        reminder_same_day: { ...rulesConfig.reminder_same_day, enabled: e.target.checked },
                      })
                    }
                    className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                  />
                </label>
              </div>

              {/* Rule 3 */}
              <div className="p-4 border border-slate-200 rounded-lg flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">3. Missed-Appointment Follow-up</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Follows up next morning after a no-show, followed by a 2nd nudge 3 days later if unbooked.
                  </p>
                </div>
                <label className="cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rulesConfig.missed_followup.enabled}
                    onChange={(e) =>
                      setRulesConfig({
                        ...rulesConfig,
                        missed_followup: { ...rulesConfig.missed_followup, enabled: e.target.checked },
                      })
                    }
                    className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                  />
                </label>
              </div>

              {/* Rule 4 */}
              <div className="p-4 border border-slate-200 rounded-lg flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">4. Pending Treatment Sitting Follow-up</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Messages active treatment plans (e.g. Root Canal sitting 2) with no future appointment after 5 days.
                  </p>
                </div>
                <label className="cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rulesConfig.sitting_followup.enabled}
                    onChange={(e) =>
                      setRulesConfig({
                        ...rulesConfig,
                        sitting_followup: { ...rulesConfig.sitting_followup, enabled: e.target.checked },
                      })
                    }
                    className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                  />
                </label>
              </div>

              {/* Rule 5 */}
              <div className="p-4 border border-slate-200 rounded-lg flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">5. 6-Month Routine Recall</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Notifies patients when their 6-month cleaning and preventive checkup is due.
                  </p>
                </div>
                <label className="cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rulesConfig.recall_6_month.enabled}
                    onChange={(e) =>
                      setRulesConfig({
                        ...rulesConfig,
                        recall_6_month: { ...rulesConfig.recall_6_month, enabled: e.target.checked },
                      })
                    }
                    className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                  />
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
              <Button type="submit" variant="primary" size="sm" isLoading={isSaving} className="gap-1.5">
                <Save className="w-3.5 h-3.5" />
                Save Automation Rules
              </Button>
            </div>
          </form>
        )}

        {/* Tab 3: WhatsApp Connection */}
        {activeTab === "whatsapp" && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Meta WhatsApp Business API Integration</h3>
              <p className="text-xs text-slate-500">Live connection status and testing interface.</p>
            </div>

            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-950">Provider Status: Connected & Active</p>
                  <p className="text-[11px] text-emerald-800">
                    Operating in Verified Development / Mock Mode with Instant Delivery
                  </p>
                </div>
              </div>
              <Badge variant="success">Active</Badge>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="font-semibold text-slate-700 block mb-1">Phone Number ID</span>
                  <span className="font-mono text-slate-900">{clinic?.whatsapp_phone_number_id || "Not configured"}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="font-semibold text-slate-700 block mb-1">WABA Account ID</span>
                  <span className="font-mono text-slate-900">
                    {clinic?.whatsapp_business_account_id || "wamid_demo_9921"}
                  </span>
                </div>
              </div>

              {/* Send Test WhatsApp Message */}
              <div className="p-4 border border-slate-200 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-slate-900">Send WhatsApp Test Message</h4>
                <div className="flex items-center gap-2 max-w-md">
                  <input
                    type="text"
                    value={testNumber}
                    onChange={(e) => setTestNumber(e.target.value)}
                    placeholder="+919820123456"
                    className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSendTestWhatsApp}
                    isLoading={isTestingWhatsApp}
                    className="gap-1"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Send Test
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Staff & Roles */}
        {activeTab === "staff" && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Clinic Staff Members</h3>
                <p className="text-xs text-slate-500">
                  Role-based access: Owners manage clinic credentials; staff manage appointments & patients.
                </p>
              </div>
              <Button size="sm" variant="primary" onClick={() => setIsInviteModalOpen(true)} className="gap-1">
                <Plus className="w-3.5 h-3.5" />
                Invite Staff
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Name</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3">Added Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {profiles.map((p) => (
                    <tr key={p.id}>
                      <td className="py-3 px-3 font-semibold text-slate-900">{p.full_name}</td>
                      <td className="py-3 px-3">
                        <Badge variant={p.role === "owner" ? "default" : "neutral"} className="uppercase text-[10px]">
                          {p.role}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-slate-500">{formatDateTimeIN(p.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 5: Data Export & DPDP */}
        {activeTab === "export" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Data Portability & Export (DPDP Act)</h3>
                <p className="text-xs text-slate-500">
                  Export complete clinic records in standard CSV format at any time.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="p-4 border border-slate-200 rounded-xl space-y-2">
                  <h4 className="text-xs font-bold text-slate-900">Patients Roster CSV</h4>
                  <p className="text-[11px] text-slate-500">Includes names, phone numbers, and WhatsApp opt-in records.</p>
                  <a href="/api/export?type=patients" download>
                    <Button variant="outline" size="sm" className="w-full text-xs gap-1 mt-2">
                      <Download className="w-3.5 h-3.5" />
                      Export Patients CSV
                    </Button>
                  </a>
                </div>

                <div className="p-4 border border-slate-200 rounded-xl space-y-2">
                  <h4 className="text-xs font-bold text-slate-900">Appointments Schedule CSV</h4>
                  <p className="text-[11px] text-slate-500">Includes all visits, durations, and confirmation status.</p>
                  <a href="/api/export?type=appointments" download>
                    <Button variant="outline" size="sm" className="w-full text-xs gap-1 mt-2">
                      <Download className="w-3.5 h-3.5" />
                      Export Visits CSV
                    </Button>
                  </a>
                </div>

                <div className="p-4 border border-slate-200 rounded-xl space-y-2">
                  <h4 className="text-xs font-bold text-slate-900">WhatsApp Messages Log CSV</h4>
                  <p className="text-[11px] text-slate-500">Complete audit trail of delivered reminders and patient replies.</p>
                  <a href="/api/export?type=messages" download>
                    <Button variant="outline" size="sm" className="w-full text-xs gap-1 mt-2">
                      <Download className="w-3.5 h-3.5" />
                      Export Messages CSV
                    </Button>
                  </a>
                </div>
              </div>
            </div>

            {/* Audit Log Table */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <h3 className="text-sm font-bold text-slate-900">Compliance Audit Log</h3>
              </div>
              <p className="text-xs text-slate-500">
                Immutable security log tracking patient consent updates, erasures, and automated confirmations.
              </p>

              <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-2">Timestamp</th>
                      <th className="p-2">Action</th>
                      <th className="p-2">Metadata</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {auditLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="p-2 text-slate-500 font-mono text-[11px]">
                          {formatDateTimeIN(log.created_at)}
                        </td>
                        <td className="p-2 font-medium text-slate-900">{log.action}</td>
                        <td className="p-2 text-slate-600 font-mono text-[10px]">
                          {JSON.stringify(log.metadata)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Invite Staff Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invite Clinic Staff Member"
        description="Provide staff details to grant access to the clinic dashboard."
        maxWidth="md"
      >
        <form onSubmit={handleInviteStaff} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              placeholder="e.g. Pooja Sharma (Receptionist)"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              placeholder="pooja@apexdental.in"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Role *
            </label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as "staff" | "owner")}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            >
              <option value="staff">Staff (Appointments, Patients, Inbox)</option>
              <option value="owner">Owner (Full access including Billing & WhatsApp config)</option>
            </select>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsInviteModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Send Invite
            </Button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}

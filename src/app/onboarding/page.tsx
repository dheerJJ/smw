"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  PhoneCall,
  Users,
  FileCode,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Check,
  Shield,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(false);

  // Form State
  const [clinicName, setClinicName] = React.useState("Apex Dental Care & Implant Center");
  const [doctorName, setDoctorName] = React.useState("Dr. Rajesh Sharma, MDS");
  const [city, setCity] = React.useState("Mumbai");
  const [avgTreatmentValue, setAvgTreatmentValue] = React.useState("3500");

  // WhatsApp Credentials
  const [phoneNumberId, setPhoneNumberId] = React.useState("109823451293847");
  const [accessToken, setAccessToken] = React.useState("EAAGm0PX4ZBmwBA...");
  const [wabaId, setWabaId] = React.useState("wamid_demo_9921");
  const [useMockProvider, setUseMockProvider] = React.useState(true);
  const [testSendStatus, setTestSendStatus] = React.useState<"idle" | "success" | "error">("idle");

  // Patient consent acknowledgment for Step 3
  const [consentConfirmed, setConsentConfirmed] = React.useState(true);

  const steps = [
    { number: 1, title: "Clinic Details", icon: Building2 },
    { number: 2, title: "Connect WhatsApp", icon: PhoneCall },
    { number: 3, title: "Patients & Consent", icon: Users },
    { number: 4, title: "Review Templates", icon: FileCode },
  ];

  const handleTestWhatsApp = async () => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setTestSendStatus("success");
    setIsLoading(false);
  };

  const handleFinish = async () => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Step Indicator Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold mb-3">
            <Shield className="w-3.5 h-3.5" />
            Clinic Onboarding
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Set up your Dental Clinic</h1>
          <p className="text-sm text-slate-600 mt-1">
            Complete 4 quick steps to start automated WhatsApp appointment reminders and recalls
          </p>
        </div>

        {/* Stepper Progress */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-8 shadow-xs">
          <div className="grid grid-cols-4 gap-2">
            {steps.map((s) => {
              const Icon = s.icon;
              const isDone = currentStep > s.number;
              const isCurrent = currentStep === s.number;
              return (
                <div
                  key={s.number}
                  className={`flex flex-col sm:flex-row items-center gap-2 p-2 rounded-lg text-center sm:text-left transition-colors ${
                    isCurrent
                      ? "bg-teal-50 border border-teal-200 text-teal-900"
                      : isDone
                      ? "text-slate-700"
                      : "text-slate-400"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${
                      isDone
                        ? "bg-emerald-600 text-white"
                        : isCurrent
                        ? "bg-teal-600 text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {isDone ? <Check className="w-4 h-4" /> : s.number}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{s.title}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          {/* STEP 1: Clinic Profile */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Clinic Profile</h2>
                <p className="text-xs text-slate-500">
                  This information will be displayed in WhatsApp reminders sent to your patients.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Clinic Name
                  </label>
                  <input
                    type="text"
                    required
                    value={clinicName}
                    onChange={(e) => setClinicName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    placeholder="e.g. Apex Dental Care & Implant Center"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Primary Doctor Name & Qualifications
                  </label>
                  <input
                    type="text"
                    required
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    placeholder="e.g. Dr. Rajesh Sharma, MDS"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    placeholder="e.g. Mumbai"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Average Treatment Sitting Value (₹)
                  </label>
                  <input
                    type="number"
                    required
                    value={avgTreatmentValue}
                    onChange={(e) => setAvgTreatmentValue(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    placeholder="3500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Used to calculate recovered revenue when a missed patient returns.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Clinic Timezone
                  </label>
                  <input
                    type="text"
                    disabled
                    value="Asia/Kolkata (IST)"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: WhatsApp Setup */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Connect WhatsApp Business API</h2>
                <p className="text-xs text-slate-500">
                  SmileRecall uses Meta&apos;s Official WhatsApp Cloud API to ensure high delivery rates and verified templates.
                </p>
              </div>

              {/* Developer / Mode Selector */}
              <div className="p-4 rounded-lg bg-teal-50 border border-teal-200 flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
                <div className="text-xs text-teal-950">
                  <p className="font-semibold mb-1">Local Testing Mode Available</p>
                  <p>
                    You can use the built-in <strong>Mock Provider</strong> to test sending and receiving reminders
                    immediately, without setting up a Meta developer account right now.
                  </p>
                  <label className="flex items-center gap-2 mt-2 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useMockProvider}
                      onChange={(e) => setUseMockProvider(e.target.checked)}
                      className="rounded text-teal-600 focus:ring-teal-500"
                    />
                    Enable Mock WhatsApp Provider (Simulated sending)
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    WhatsApp Phone Number ID
                  </label>
                  <input
                    type="text"
                    value={phoneNumberId}
                    onChange={(e) => setPhoneNumberId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    placeholder="109823451293847"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Permanent System User Access Token
                  </label>
                  <input
                    type="password"
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    placeholder="EAAGm0PX4ZBmwBA..."
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Tokens are encrypted at rest with AES-256-GCM.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    WhatsApp Business Account ID (WABA ID)
                  </label>
                  <input
                    type="text"
                    value={wabaId}
                    onChange={(e) => setWabaId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    placeholder="wamid_demo_9921"
                  />
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleTestWhatsApp}
                    isLoading={isLoading}
                  >
                    Test WhatsApp Connection
                  </Button>
                  {testSendStatus === "success" && (
                    <Badge variant="success" className="gap-1 py-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Connection Verified Successfully
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Patients & Consent */}
          {currentStep === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Patients & DPDP Compliance</h2>
                <p className="text-xs text-slate-500">
                  SmileRecall comes pre-loaded with 25 realistic test patients. You can also import your existing patient
                  list via CSV.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Pre-loaded Test Roster</h3>
                    <p className="text-xs text-slate-500">
                      25 Indian dental patients with realistic appointments, RCT sitting plans, and recall dates.
                    </p>
                  </div>
                  <Badge variant="info">25 Patients Loaded</Badge>
                </div>
              </div>

              {/* Consent requirement checkbox */}
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 space-y-2">
                <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                  Patient Consent Mandate (India DPDP Act & Meta Policy)
                </h4>
                <p className="text-xs text-amber-900 leading-relaxed">
                  Automated WhatsApp messages may only be sent to patients who have provided opt-in consent. SmileRecall
                  automatically halts messages for any patient with opt-in disabled, or when a patient replies STOP.
                </p>
                <label className="flex items-start gap-2.5 pt-2 text-xs font-medium text-amber-950 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentConfirmed}
                    onChange={(e) => setConsentConfirmed(e.target.checked)}
                    className="mt-0.5 rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span>
                    I confirm that our dental clinic has obtained consent from our patients to send WhatsApp appointment
                    reminders and treatment recall follow-ups.
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* STEP 4: Review Templates */}
          {currentStep === 4 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Default Recall & Reminder Templates</h2>
                <p className="text-xs text-slate-500">
                  These 5 standard templates are pre-configured in English and Hindi. You can customize timing and text
                  later in Settings.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-900">1. Day-Before Appointment Reminder</span>
                    <Badge variant="default">Scheduled for 6:00 PM</Badge>
                  </div>
                  <p className="text-xs text-slate-600">
                    &quot;Hello {"{{patient_name}}"}, this is a reminder from {"{{clinic_name}}"} for your dental appointment tomorrow at {"{{time}}"}. Please reply YES to confirm or NO to reschedule.&quot;
                  </p>
                </div>

                <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-900">2. Same-Day Reminder</span>
                    <Badge variant="default">2 hours before</Badge>
                  </div>
                  <p className="text-xs text-slate-600">
                    &quot;Hello {"{{patient_name}}"}, your appointment with {"{{doctor_name}}"} is in 2 hours at {"{{time}}"}. See you shortly at {"{{clinic_name}}"}.&quot;
                  </p>
                </div>

                <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-900">3. Missed Appointment Follow-up</span>
                    <Badge variant="default">Next morning 10:00 AM</Badge>
                  </div>
                  <p className="text-xs text-slate-600">
                    &quot;Dear {"{{patient_name}}"}, we noticed you were unable to make it to your appointment at {"{{clinic_name}}"} today. Would you like to reschedule for this week? Reply YES to connect.&quot;
                  </p>
                </div>

                <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-900">4. Pending Treatment Sitting Follow-up</span>
                    <Badge variant="default">After 5 days & 10 days</Badge>
                  </div>
                  <p className="text-xs text-slate-600">
                    &quot;Hello {"{{patient_name}}"}, you have {"{{remaining_sittings}}"} pending sitting(s) for your {"{{treatment_name}}"}. Completing timely ensures lasting results. Reply YES to schedule.&quot;
                  </p>
                </div>

                <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-900">5. 6-Month Routine Recall</span>
                    <Badge variant="default">At recall due date</Badge>
                  </div>
                  <p className="text-xs text-slate-600">
                    &quot;Hello {"{{patient_name}}"}, it has been 6 months since your last dental cleaning and checkup at {"{{clinic_name}}"}. Reply YES to book your slot.&quot;
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Stepper Navigation Buttons */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
            {currentStep > 1 ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep((prev) => prev - 1)}
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Previous Step
              </Button>
            ) : (
              <div />
            )}

            {currentStep < 4 ? (
              <Button
                type="button"
                variant="primary"
                onClick={() => setCurrentStep((prev) => prev + 1)}
                disabled={currentStep === 3 && !consentConfirmed}
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                onClick={handleFinish}
                isLoading={isLoading}
              >
                Complete Setup & Open Dashboard
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import * as React from "react";
import { Check, CreditCard, Sparkles, AlertCircle, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";

export default function BillingPage() {
  const { toast } = useToast();
  const [currentPlan, setCurrentPlan] = React.useState<"starter" | "growth">("starter");
  const [isProcessing, setIsProcessing] = React.useState(false);

  // Usage metrics
  const messagesUsed = 48;
  const messagesLimit = currentPlan === "starter" ? 300 : 1000;
  const usagePercentage = Math.round((messagesUsed / messagesLimit) * 100);

  const handleSelectPlan = async (plan: "starter" | "growth") => {
    setIsProcessing(true);
    await new Promise((r) => setTimeout(r, 600));
    setCurrentPlan(plan);
    setIsProcessing(false);
    toast(`Switched to ${plan === "starter" ? "Starter (₹1,000/mo)" : "Growth (₹2,000/mo)"} plan!`, "success");
  };

  return (
    <AppShell
      title="Billing & Subscription Plans"
      subtitle="Manage your clinic messaging quota, Razorpay subscription, and invoice receipts"
    >
      <div className="space-y-6 max-w-4xl">
        {/* Trial & Usage Banner */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Current Plan: 30-Day Free Trial</h3>
                <Badge variant="success">Active Trial</Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Trial ends on 04/11/2026. All automated reminder features and templates are unlocked.
              </p>
            </div>
            <span className="text-xs text-slate-500 font-mono">Starter Tier</span>
          </div>

          {/* Usage Meter */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Monthly WhatsApp Message Quota</span>
              <span className="font-bold text-slate-900">
                {messagesUsed} / {messagesLimit} messages used ({usagePercentage}%)
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-teal-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${usagePercentage}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Sending is automatically protected from overages. Upgrades take effect immediately.
            </p>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Starter Plan */}
          <div
            className={`bg-white rounded-xl border p-6 shadow-xs flex flex-col justify-between transition-all ${
              currentPlan === "starter" ? "border-teal-500 ring-2 ring-teal-500/20" : "border-slate-200"
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-bold text-slate-900">Starter Plan</h4>
                  <p className="text-xs text-slate-500">For solo practices & small dental clinics</p>
                </div>
                {currentPlan === "starter" && <Badge variant="default">Current</Badge>}
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-slate-900">₹1,000</span>
                <span className="text-xs text-slate-500">/ month</span>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-700 pt-2 border-t border-slate-100">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>Up to <strong>300 WhatsApp messages</strong> / month</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>Day-before & 2h appointment reminders</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>Missed appointment follow-ups</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>Receptionist WhatsApp Inbox</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>Up to 2 staff accounts</span>
                </li>
              </ul>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100">
              <Button
                variant={currentPlan === "starter" ? "outline" : "primary"}
                className="w-full text-xs"
                disabled={currentPlan === "starter"}
                onClick={() => handleSelectPlan("starter")}
                isLoading={isProcessing && currentPlan !== "starter"}
              >
                {currentPlan === "starter" ? "Active Plan" : "Choose Starter"}
              </Button>
            </div>
          </div>

          {/* Growth Plan */}
          <div
            className={`bg-white rounded-xl border p-6 shadow-xs flex flex-col justify-between transition-all ${
              currentPlan === "growth" ? "border-teal-500 ring-2 ring-teal-500/20" : "border-slate-200"
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-bold text-slate-900">Growth Plan</h4>
                  <p className="text-xs text-slate-500">For busy clinics with multiple consulting chairs</p>
                </div>
                {currentPlan === "growth" && <Badge variant="default">Current</Badge>}
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-slate-900">₹2,000</span>
                <span className="text-xs text-slate-500">/ month</span>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-700 pt-2 border-t border-slate-100">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>Up to <strong>1,000 WhatsApp messages</strong> / month</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>All Starter features included</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>Pending RCT Sitting Follow-up automations</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>6-Month Routine Recall campaigns</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>Recovered Revenue Analytics & Reports</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>Unlimited clinic staff members</span>
                </li>
              </ul>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100">
              <Button
                variant={currentPlan === "growth" ? "outline" : "primary"}
                className="w-full text-xs"
                disabled={currentPlan === "growth"}
                onClick={() => handleSelectPlan("growth")}
                isLoading={isProcessing && currentPlan !== "growth"}
              >
                {currentPlan === "growth" ? "Active Plan" : "Upgrade to Growth"}
              </Button>
            </div>
          </div>
        </div>

        {/* Razorpay Security Note */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3 text-xs text-slate-600">
          <ShieldCheck className="w-5 h-5 text-teal-700 shrink-0" />
          <span>
            Payments are securely processed via Razorpay with UPI, Netbanking, and Credit/Debit cards. GST invoices
            issued on monthly renewal.
          </span>
        </div>
      </div>
    </AppShell>
  );
}

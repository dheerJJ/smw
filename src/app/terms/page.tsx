import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";

export const metadata = {
  title: "Terms and Conditions | SmileRecall",
  description: "Terms and conditions for dental practices using the SmileRecall SaaS platform.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 p-8 sm:p-12">
        <Link
          href="/"
          className="inline-flex items-center text-sm font-medium text-teal-700 hover:text-teal-800 mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to SmileRecall
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Terms of Service</h1>
            <p className="text-sm text-slate-500">Last updated: October 2026</p>
          </div>
        </div>

        <div className="prose prose-slate max-w-none text-sm leading-relaxed text-slate-700 space-y-6">
          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">1. Agreement to Terms</h2>
            <p>
              By accessing or using SmileRecall, you agree to be bound by these Terms of Service. If you are registering
              on behalf of a dental clinic or practice, you represent that you have the authority to bind that entity.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">2. Acceptable Use and Messaging Rules</h2>
            <p>
              You agree to comply with Meta WhatsApp Business Policies and Indian Telecom Commercial Communications
              Customer Preference Regulations (TCCR). Specifically:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>You may only contact patients who have provided affirmative consent.</li>
              <li>You may not use the service for unsolicited promotional spam.</li>
              <li>All business-initiated notifications must use pre-approved WhatsApp templates.</li>
              <li>You must honor patient opt-out requests immediately.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">3. Clinic Responsibilities</h2>
            <p>
              Each clinic is responsible for maintaining accurate patient records, verifying treatment appointments,
              and safeguarding their user account credentials.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">4. Service Availability & Delivery</h2>
            <p>
              SmileRecall aims for 99.9% uptime. Actual delivery of WhatsApp notifications is subject to Meta WhatsApp
              Cloud API operational status and recipient telecommunications carrier connectivity.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">5. Subscriptions and Fees</h2>
            <p>
              Subscription fees are billed in Indian Rupees (₹) as per chosen plan tiers (Starter, Growth). Usage limits
              for WhatsApp messaging apply per billing cycle.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">6. Governing Law</h2>
            <p>
              These terms shall be governed by and construed in accordance with the laws of India, subject to the
              jurisdiction of courts in Mumbai.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

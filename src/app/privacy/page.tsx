import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | SmileRecall",
  description: "Privacy Policy and DPDP Act compliance information for SmileRecall dental automation SaaS.",
};

export default function PrivacyPage() {
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
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Privacy Policy</h1>
            <p className="text-sm text-slate-500">Effective Date: October 2026 | DPDP Act (India) Compliant</p>
          </div>
        </div>

        <div className="prose prose-slate max-w-none text-sm leading-relaxed text-slate-700 space-y-6">
          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">1. Overview and Purpose</h2>
            <p>
              SmileRecall provides a clinic management and patient recall automation platform for registered dental
              practices in India. We act as a Data Processor on behalf of dental clinics, who act as Data Fiduciaries
              under the Digital Personal Data Protection (DPDP) Act, 2023.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">2. Information We Process</h2>
            <p>
              We process only minimal, necessary information provided by clinics to schedule appointments and send recall
              notices:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Patient name and Indian mobile phone number (+91)</li>
              <li>Appointment date, time, and appointment status</li>
              <li>Treatment plan names and sitting progress count</li>
              <li>WhatsApp opt-in consent records and delivery timestamps</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">3. Patient Consent and WhatsApp Opt-in</h2>
            <p>
              SmileRecall strictly enforces verifiable opt-in. Automated WhatsApp reminders are never dispatched to any
              patient number unless the clinic has obtained patient consent. Patients can immediately opt out at any time
              by sending "STOP" or "UNSUBSCRIBE" via WhatsApp, which immediately halts automated outbound messaging.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">4. Data Security & Encryption</h2>
            <p>
              All external credentials, including WhatsApp access tokens, are encrypted at rest using AES-256-GCM.
              Row-Level Security (RLS) ensures that data from one dental clinic cannot be accessed by another clinic.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">5. Patient Rights: Access, Export, and Erasure</h2>
            <p>
              In accordance with India DPDP Act obligations, dental clinics using SmileRecall have tools to:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Export patient records in CSV format on request</li>
              <li>Permanently erase patient details upon request</li>
              <li>Review audit logs detailing access and modifications</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">6. Clinic Patient Consent Template (Recommended)</h2>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 font-mono text-xs text-slate-800">
              "I hereby consent to receive appointment reminders, follow-ups, and dental health updates from [Clinic Name]
              via WhatsApp and SMS at my registered mobile number. I understand I can withdraw consent at any time by
              replying STOP."
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">7. Contact Information</h2>
            <p>
              For privacy queries or data requests, contact our Data Protection Officer at privacy@smilerecall.in.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

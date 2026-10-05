import Link from "next/link";
import {
  CalendarCheck,
  MessageSquare,
  TrendingUp,
  ShieldCheck,
  ArrowRight,
  Clock,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "SmileRecall | Automated WhatsApp Appointment Reminders & Recalls for Dental Clinics",
  description:
    "Recover lost clinic revenue from no-shows and unfinished dental sittings. Automated WhatsApp reminders, day-before notices, and 6-month recall campaigns.",
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navigation Header */}
      <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-xs">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12 2C8.5 2 5 4.2 5 8C5 10.5 6 13 7 16C7.8 18.4 8.5 21.5 10 21.5C11 21.5 11.3 19.5 12 17C12.7 19.5 13 21.5 14 21.5C15.5 21.5 16.2 18.4 17 16C18 13 19 10.5 19 8C19 4.2 15.5 2 12 2Z" />
            </svg>
          </div>
          <div>
            <span className="font-bold text-lg text-slate-900 tracking-tight">SmileRecall</span>
            <span className="block text-[10px] font-medium text-teal-700 uppercase tracking-wider">Dental SaaS</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="outline" size="sm">
              Sign In
            </Button>
          </Link>
          <Link href="/signup">
            <Button variant="primary" size="sm">
              Register Clinic
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-8 max-w-5xl mx-auto text-center flex-1 flex flex-col justify-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold mx-auto mb-6">
          <ShieldCheck className="w-3.5 h-3.5" />
          Designed for Dental Clinics in India
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Automate WhatsApp reminders. <br />
          <span className="text-teal-700">Stop dental appointment no-shows.</span>
        </h1>

        <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Dental clinics lose predictable revenue every week when patients miss scheduled sittings or forget their
          6-month checkups. SmileRecall sends automated WhatsApp reminders so patients confirm, show up, and complete
          treatments.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button variant="primary" size="lg" className="w-full sm:w-auto gap-2">
              Launch Clinic Dashboard
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/login" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              Clinic Staff Login
            </Button>
          </Link>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 text-left">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center mb-4">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Automated Appointment Reminders</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Sends reminders 24 hours prior (default 6:00 PM) and 2 hours before the visit with interactive YES/NO
              confirmation buttons.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center mb-4">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Treatment Sitting Follow-ups</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Never let root canal or crown patients drop out mid-treatment. Auto-follows up after 5 days if next sitting
              is unbooked.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center mb-4">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Recovered Revenue Tracking</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Tracks every recovered patient booking and computes exact clinic income recovered from automated WhatsApp
              outreach.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 px-4 sm:px-8 text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            © {new Date().getFullYear()} SmileRecall Technologies. Compliant with India DPDP Act 2023.
          </div>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-teal-700">Privacy Policy</Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-teal-700">Terms of Service</Link>
            <span>•</span>
            <Link href="/dashboard" className="text-teal-700 font-semibold">Demo Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

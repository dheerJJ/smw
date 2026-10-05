"use client";

import { Menu, Plus, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  title: string;
  subtitle?: string;
  onOpenMobileMenu?: () => void;
  onQuickAddPatient?: () => void;
  onQuickAddAppointment?: () => void;
}

export function Header({
  title,
  subtitle,
  onOpenMobileMenu,
  onQuickAddPatient,
  onQuickAddAppointment,
}: HeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-slate-900 leading-tight">{title}</h1>
          {subtitle && <p className="text-xs text-slate-500 hidden sm:block">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="hidden md:flex items-center gap-2">
          <Badge variant="success" className="gap-1 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <PhoneCall className="w-3 h-3" />
            WhatsApp Active
          </Badge>
          <span className="text-[11px] text-slate-400 font-mono">Asia/Kolkata</span>
        </div>

        {onQuickAddPatient && (
          <Button size="sm" variant="outline" onClick={onQuickAddPatient}>
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Patient</span>
          </Button>
        )}

        {onQuickAddAppointment && (
          <Button size="sm" variant="primary" onClick={onQuickAddAppointment}>
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Book Appointment</span>
          </Button>
        )}
      </div>
    </header>
  );
}

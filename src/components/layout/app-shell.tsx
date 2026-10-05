"use client";

import * as React from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { ToastProvider } from "@/components/ui/toast";

interface AppShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onQuickAddPatient?: () => void;
  onQuickAddAppointment?: () => void;
}

export function AppShell({
  title,
  subtitle,
  children,
  onQuickAddPatient,
  onQuickAddAppointment,
}: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-50 flex">
        {/* Desktop & Mobile Sidebar */}
        <Sidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
          <Header
            title={title}
            subtitle={subtitle}
            onOpenMobileMenu={() => setMobileMenuOpen(true)}
            onQuickAddPatient={onQuickAddPatient}
            onQuickAddAppointment={onQuickAddAppointment}
          />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}

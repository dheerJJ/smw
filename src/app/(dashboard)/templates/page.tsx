"use client";

import * as React from "react";
import {
  FileCode,
  Smartphone,
  Save,
  CheckCircle2,
  Copy,
  ExternalLink,
  Info,
  Clock,
  Send,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { dbRepo } from "@/lib/db/repo";
import { MessageTemplate } from "@/lib/db/types";
import { renderTemplateBody } from "@/lib/automation/engine";

export default function TemplatesPage() {
  const { toast } = useToast();
  const [templates, setTemplates] = React.useState<MessageTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = React.useState<MessageTemplate | null>(null);
  const [editedBody, setEditedBody] = React.useState("");
  const [editedName, setEditedName] = React.useState("");
  const [activeTab, setActiveTab] = React.useState<"editor" | "meta_submission">("editor");
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);

  const loadTemplates = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await dbRepo.listTemplates();
      setTemplates(data);
      if (data.length > 0) {
        setSelectedTemplate((prev) => {
          if (prev) return prev;
          setEditedBody(data[0].body);
          setEditedName(data[0].name);
          return data[0];
        });
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleSelectTemplate = (t: MessageTemplate) => {
    setSelectedTemplate(t);
    setEditedBody(t.body);
    setEditedName(t.name);
  };

  const handleSave = async () => {
    if (!selectedTemplate) return;
    setIsSaving(true);
    try {
      await dbRepo.updateTemplate(selectedTemplate.id, {
        name: editedName,
        body: editedBody,
      });
      setSelectedTemplate({
        ...selectedTemplate,
        name: editedName,
        body: editedBody,
      });
      await loadTemplates();
      toast("Template saved successfully", "success");
    } catch {
      toast("Failed to update template", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const sampleVariables: Record<string, string> = {
    patient_name: "Aarav Patel",
    clinic_name: "Apex Dental Care & Implant Center",
    doctor_name: "Dr. Rajesh Sharma",
    date: "06/10/2026",
    time: "10:30 AM",
    treatment_name: "Root Canal Treatment",
    remaining_sittings: "2",
  };

  const livePreviewText = renderTemplateBody(editedBody, sampleVariables);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast("Copied to clipboard for Meta submission", "info");
  };

  return (
    <AppShell
      title="Message Templates"
      subtitle="Customize WhatsApp reminder texts, live phone previews, and Meta approval submissions"
    >
      <div className="space-y-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs">
          <button
            onClick={() => setActiveTab("editor")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === "editor" ? "bg-teal-50 text-teal-800 font-semibold" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Template Editor & Live Preview
          </button>
          <button
            onClick={() => setActiveTab("meta_submission")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === "meta_submission"
                ? "bg-teal-50 text-teal-800 font-semibold"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Meta Approval Guide & Text
          </button>
        </div>

        {activeTab === "editor" ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Template Selector List (4 cols) */}
            <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-2">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Available Templates ({templates.length})
              </h3>

              {isLoading ? (
                <p className="text-xs text-slate-500 py-4 text-center">Loading templates...</p>
              ) : (
                <div className="space-y-1.5">
                  {templates.map((t) => {
                    const isSelected = selectedTemplate?.id === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => handleSelectTemplate(t)}
                        className={`w-full text-left p-3 rounded-lg border text-xs transition-colors ${
                          isSelected
                            ? "border-teal-500 bg-teal-50/60 text-teal-950 font-semibold shadow-xs"
                            : "border-slate-200 hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="truncate">{t.name}</span>
                          <Badge variant="default" className="text-[10px] uppercase">
                            {t.language}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">{t.whatsapp_template_name}</p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Template Editor (5 cols) */}
            <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
              {selectedTemplate ? (
                <>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Edit Template</h3>
                      <p className="text-[11px] font-mono text-slate-500">
                        {selectedTemplate.whatsapp_template_name}
                      </p>
                    </div>
                    <Badge variant="success" className="gap-1 py-0.5 text-[10px]">
                      <CheckCircle2 className="w-3 h-3" />
                      Meta Approved
                    </Badge>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Template Title
                    </label>
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Message Body
                      </label>
                      <span className="text-[11px] text-slate-400">{editedBody.length} chars</span>
                    </div>
                    <textarea
                      rows={6}
                      value={editedBody}
                      onChange={(e) => setEditedBody(e.target.value)}
                      className="w-full p-3 border border-slate-300 rounded-lg text-xs font-mono leading-relaxed focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>

                  {/* Available placeholders guide */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5 text-slate-700">
                    <span className="font-semibold block text-[11px] text-slate-900">
                      Available Dynamic Placeholders:
                    </span>
                    <div className="flex flex-wrap gap-1.5 text-[11px]">
                      {Object.keys(sampleVariables).map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setEditedBody((prev) => `${prev} {{${v}}}`)}
                          className="px-2 py-0.5 bg-white border border-slate-300 hover:border-teal-500 hover:text-teal-700 rounded font-mono text-[10px]"
                        >
                          +{`{{${v}}}`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-end">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSave}
                      isLoading={isSaving}
                      className="gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Save Template
                    </Button>
                  </div>
                </>
              ) : (
                <div className="p-8 text-center text-xs text-slate-500">Select a template to edit</div>
              )}
            </div>

            {/* Live WhatsApp Mobile Screen Mockup (3 cols) */}
            <div className="lg:col-span-3 flex flex-col items-center">
              <div className="w-full max-w-[280px] bg-slate-900 rounded-[32px] p-2.5 shadow-xl border-4 border-slate-800">
                {/* Mobile Camera Notch */}
                <div className="h-4 w-28 bg-slate-800 rounded-full mx-auto mb-2" />

                {/* WhatsApp Chat UI Mockup */}
                <div className="bg-[#efeae2] rounded-[22px] overflow-hidden flex flex-col h-[400px]">
                  {/* WhatsApp Top Bar */}
                  <div className="bg-[#075e54] text-white px-3 py-2 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold flex items-center justify-center">
                      A
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold leading-tight truncate">Apex Dental Care</p>
                      <p className="text-[9px] text-teal-200">Verified Business</p>
                    </div>
                  </div>

                  {/* Chat Area */}
                  <div className="flex-1 p-2.5 overflow-y-auto space-y-2 flex flex-col justify-end">
                    <div className="bg-white rounded-lg p-2.5 shadow-xs max-w-[90%] text-[11px] text-slate-900 leading-snug space-y-1.5 relative">
                      <p className="whitespace-pre-wrap">{livePreviewText}</p>
                      <div className="text-[9px] text-slate-400 text-right">
                        10:30 AM <span className="text-teal-600">✓✓</span>
                      </div>
                    </div>

                    {/* Quick Reply Buttons */}
                    <div className="space-y-1">
                      <div className="bg-white/90 border border-slate-200 rounded text-center py-1 text-[10px] font-semibold text-teal-700 shadow-2xs">
                        YES - Confirm
                      </div>
                      <div className="bg-white/90 border border-slate-200 rounded text-center py-1 text-[10px] font-semibold text-rose-700 shadow-2xs">
                        NO - Reschedule
                      </div>
                    </div>
                  </div>

                  {/* WhatsApp Bottom Bar */}
                  <div className="bg-slate-100 p-1.5 text-center text-[9px] text-slate-400 border-t border-slate-200">
                    Official WhatsApp Cloud API
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-3 font-medium">Live Patient Phone Preview</p>
            </div>
          </div>
        ) : (
          /* Meta Approval Guide Tab */
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Meta WhatsApp Business Manager Template Submission
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                To send business-initiated messages in production, copy these exact template strings into your Meta
                Business Manager under <strong>WhatsApp &gt; Message Templates</strong>.
              </p>
            </div>

            <div className="space-y-4">
              {templates.map((t) => (
                <div key={t.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-xs text-slate-900">{t.name}</span>
                      <span className="text-slate-400 text-xs ml-2 font-mono">({t.whatsapp_template_name})</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(t.body)}
                      className="h-7 text-xs gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      Copy Text
                    </Button>
                  </div>
                  <pre className="p-3 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 whitespace-pre-wrap">
                    {t.body}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

import React, { useState, useRef, useEffect } from "react";
import { useProjectData } from "@/lib/niecp/useProjectData";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { MessageSquare, Send, Loader2, Sparkles } from "lucide-react";

const SUGGESTIONS = [
  "What approvals may apply to my project?",
  "Why do I need Fire NOC?",
  "Which documents are missing?",
  "What is blocking my project?",
  "What should I do next?",
  "Why is Boiler Approval not shown?"
];

export default function Copilot() {
  const { selected, approvals, documents, blockers, nextBestAction, loading } = useProjectData();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  if (loading) return <div className="py-20 text-center text-slate-400">Loading copilot…</div>;
  if (!selected) return <div className="bg-white rounded-2xl border p-10 text-center text-slate-400">Select a profile to use the copilot.</div>;

  async function ask(q) {
    const question = q || input;
    if (!question || busy) return;
    setMessages((m) => [...m, { role: "user", text: question }]);
    setInput("");
    setBusy(true);
    try {
      const context = {
        name: selected.name, industry: selected.industry, sub_industry: selected.sub_industry,
        state: selected.state, city: selected.city, stage: selected.project_stage,
        approvals: approvals.map((a) => ({ approval_name: a.approval_name, authority: a.authority, status: a.status, triggered_factors: a.triggered_factors })),
        documents: documents.map((d) => ({ document_name: d.document_name, approval_name: d.approval_name, status: d.status })),
        blockers: blockers.map((b) => ({ document_name: b.document_name, status: b.status, approval_name: b.approval_name })),
        nextBestAction: nextBestAction?.label
      };
      const res = await base44.functions.invoke("copilot", { question, context });
      const answer = res?.data?.answer || res?.answer || "I could not generate an answer right now.";
      setMessages((m) => [...m, { role: "assistant", text: answer }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", text: "Copilot is unavailable. Please confirm with the relevant authority." }]);
    } finally { setBusy(false); }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Sparkles className="w-5 h-5 text-purple-500" /> NIECP Copilot</h1>
        <p className="text-sm text-slate-500">Project-aware assistant for {selected.name}. Answers use your project data and verified catalogs.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[60vh]">
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-10">
              <MessageSquare className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-400">Ask about your approvals, documents, blockers or next steps.</p>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${m.role === "user" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-800"}`}>
                {m.text}
              </div>
            </div>
          ))}
          {busy && <div className="flex justify-start"><div className="bg-slate-100 rounded-2xl px-4 py-2.5"><Loader2 className="w-4 h-4 animate-spin text-slate-400" /></div></div>}
          <div ref={endRef} />
        </div>

        {messages.length === 0 && (
          <div className="px-5 pb-3 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => ask(s)} className="text-xs px-3 py-1.5 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50">{s}</button>
            ))}
          </div>
        )}

        <div className="border-t border-slate-100 p-3 flex items-center gap-2">
          <input className="flex-1 px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 ring-blue-200" placeholder="Ask the copilot…" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && ask()} />
          <Button className="bg-blue-600 hover:bg-blue-700" disabled={busy} onClick={() => ask()}><Send className="w-4 h-4" /></Button>
        </div>
      </div>
      <p className="text-xs text-slate-400 text-center">The copilot provides guidance only — not legal advice. Confirm with the relevant authority.</p>
    </div>
  );
}
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShieldCheck, FileText, GitBranch, MessageSquare, Landmark, Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";

const FEATURES = [
  { icon: ShieldCheck, title: "Explainable Approvals", desc: "Know which approvals may apply to your project — and why." },
  { icon: FileText, title: "Document Intelligence", desc: "Approval-linked document requirements, gap analysis and expiry tracking." },
  { icon: GitBranch, title: "Dependency & Critical Path", desc: "See what depends on what, and what's blocking you." },
  { icon: MessageSquare, title: "NIECP Copilot", desc: "A project-aware AI assistant that answers in context." },
  { icon: Landmark, title: "Government Portal Gateway", desc: "Connect to the correct official channel — truthfully labelled." },
  { icon: Sparkles, title: "AI Regulatory Factors", desc: "AI suggests relevant factors with confidence; you confirm." }
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[color-mix(in_srgb,hsl(var(--theme-background-background-1))_100%,transparent)] via-[color-mix(in_srgb,hsl(var(--theme-background-background-1))_100%,transparent)] to-[color-mix(in_srgb,hsl(var(--theme-background-background-2))_100%,transparent)] text-white">
      <header className="px-6 md:px-12 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center font-bold">N</div>
          <div>
            <div className="font-bold leading-none">NIECP-AI</div>
            <div className="text-[10px] text-slate-400 mt-1">Regulatory Intelligence</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm text-slate-300 hover:text-white">Sign in</Link>
          <Link to="/register"><Button size="sm" className="bg-blue-500 hover:bg-blue-600">Get started</Button></Link>
        </div>
      </header>

      <section className="px-6 md:px-12 pt-16 pb-24 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs text-blue-200 mb-6">
          <Sparkles className="w-3.5 h-3.5" /> AI-powered regulatory decision-support system for Indian businesses
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight">
          Understand. Prepare. Apply.<br />
          <span className="bg-gradient-to-r from-blue-400 to-teal-300 bg-clip-text text-transparent">Track. Comply. Grow.</span>
        </h1>
        <p className="mt-6 text-lg text-slate-300 max-w-2xl mx-auto">
          NIECP-AI converts a complex industrial approval process into an intelligent, project-specific
          execution roadmap — explaining which approvals may apply, why, and what to do next.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link to="/dashboard"><Button size="lg" className="bg-blue-500 hover:bg-blue-600">Start Project <ArrowRight className="w-4 h-4 ml-1" /></Button></Link>
          <Link to="/login"><Button size="lg" variant="outline" className="bg-transparent border-white/20 text-white hover:bg-white/10">Explore How It Works</Button></Link>
        </div>
        <p className="mt-4 text-xs text-slate-400">Simplifying Approvals. Accelerating India's Growth.</p>
      </section>

      <section className="px-6 md:px-12 pb-20 max-w-5xl mx-auto">
        <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
          <div className="text-xs uppercase tracking-widest text-blue-300 text-center mb-4">From project details to execution roadmap</div>
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {["Project Details", "AI Regulatory Analysis", "Relevant Requirements", "Why Required", "Evidence & Sources", "Dependency Map", "Critical Path", "Blocker Detection", "Next Best Action", "Readiness Tracking"].map((s, i, arr) => (
              <React.Fragment key={s}>
                <span className="text-[11px] px-2.5 py-1 rounded-full bg-white/10 text-slate-200 whitespace-nowrap">{s}</span>
                {i < arr.length - 1 && <ArrowRight className="w-3 h-3 text-blue-400/60" />}
              </React.Fragment>
            ))}
          </div>
          <p className="text-sm text-slate-300 text-center mt-5 max-w-3xl mx-auto">
            NIECP-AI does not simply tell you which approvals exist. It understands your project context, identifies
            applicable regulatory requirements, explains <b className="text-white">why</b> each one applies with evidence,
            maps dependencies, detects blockers, finds your critical regulatory path, and recommends the next best action.
          </p>
        </div>
      </section>

      <section className="px-6 md:px-12 pb-24 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-4">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="rounded-2xl bg-white/5 border border-white/10 p-6 hover:bg-white/10 transition">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-blue-300" />
                </div>
                <h3 className="font-semibold text-lg">{f.title}</h3>
                <p className="text-sm text-slate-400 mt-1">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="px-6 md:px-12 pb-24 max-w-3xl mx-auto">
        <div className="rounded-2xl bg-white/5 border border-white/10 p-6 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-teal-300 mt-0.5 shrink-0" />
          <p className="text-sm text-slate-300">
            NIECP-AI provides regulatory intelligence and guidance. It does not issue government approvals.
            Final applicability, approval and compliance decisions remain with the relevant government authority.
          </p>
        </div>
      </section>

      <footer className="px-6 md:px-12 py-8 border-t border-white/10 text-center text-xs text-slate-500">
        National Industrial Ease & Compliance Platform – AI · Demo / UAT
      </footer>
    </div>
  );
}
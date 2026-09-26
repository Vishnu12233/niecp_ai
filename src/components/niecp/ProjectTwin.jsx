import React, { useState } from "react";
import { buildProjectTwin, PROVENANCE } from "@/lib/niecp/projectTwin";
import { Building2, ChevronDown, Fingerprint } from "lucide-react";

function Chip({ code }) {
  const p = PROVENANCE[code] || PROVENANCE.REQUIRES_VERIFICATION;
  return <span className={`text-[9px] uppercase font-semibold px-1.5 py-0.5 rounded border shrink-0 ${p.className}`}>{p.label}</span>;
}

export default function ProjectTwin({ profile }) {
  const twin = buildProjectTwin(profile);
  const [openSection, setOpenSection] = useState("identity");

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center"><Fingerprint className="w-4 h-4 text-blue-600" /></div>
          <div>
            <h3 className="font-semibold text-slate-900">Project Twin</h3>
            <p className="text-xs text-slate-500">
              {twin.total} project facts · {twin.completeness}% complete · {twin.verified_from_gov} backed by a government source
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-slate-900">{twin.completeness}%</div>
          <div className="text-[10px] text-slate-400 uppercase tracking-wide">Fact completeness</div>
        </div>
      </div>

      <div className="h-2 bg-slate-100 rounded-full overflow-hidden mt-3">
        <div className="h-full bg-gradient-to-r from-blue-600 to-teal-500" style={{ width: `${twin.completeness}%` }} />
      </div>

      <div className="mt-4 space-y-2">
        {twin.sections.map((s) => {
          const open = openSection === s.key;
          const gaps = s.facts.filter((f) => f.provenance === "INFORMATION_UNAVAILABLE").length;
          return (
            <div key={s.key} className="border border-slate-200 rounded-xl overflow-hidden">
              <button onClick={() => setOpenSection(open ? null : s.key)}
                className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-slate-50 text-left">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-sm font-medium text-slate-800">{s.title}</span>
                <span className="text-[10px] text-slate-400">{s.facts.length} facts</span>
                {gaps > 0 && <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded px-1.5 py-0.5">{gaps} missing</span>}
                <ChevronDown className={`w-4 h-4 text-slate-400 ml-auto transition-transform ${open ? "rotate-180" : ""}`} />
              </button>
              {open && (
                <div className="border-t border-slate-100 divide-y divide-slate-100">
                  {s.facts.map((f) => (
                    <div key={f.label} className="px-3 py-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">{f.label}</div>
                        <Chip code={f.provenance} />
                      </div>
                      <div className="text-sm text-slate-800 mt-0.5">{f.value}</div>
                      {f.note && <div className="text-[11px] text-slate-400 mt-0.5">{f.note}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
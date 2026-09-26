import React from "react";
import { Info } from "lucide-react";

// Truthful data-mode label (spec: never fabricate regulatory intelligence).
export default function DataModeBadge({ className = "" }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1 ${className}`}>
      <Info className="w-3 h-3 shrink-0" />
      Prototype / Demonstration Data — verify with the concerned authority
    </span>
  );
}
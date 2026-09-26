import React, { useMemo } from "react";
import { StatusChip } from "@/pages/Dashboard";
import { Lock } from "lucide-react";

// Interactive node-based approval dependency graph.
// Nodes are laid out topologically (dependencies left → dependents right);
// edges show actual structured dependency relationships from the rule pack.

const NODE_W = 200, NODE_H = 96, GAP_X = 70, GAP_Y = 28, PAD = 24;

const NODE_STYLE = {
  COMPLETED: "border-teal-400 bg-teal-50",
  IN_PROGRESS: "border-blue-400 bg-blue-50",
  PENDING: "border-slate-300 bg-white",
  BLOCKED: "border-red-400 bg-red-50",
  NEEDS_CONFIRMATION: "border-amber-400 bg-amber-50"
};

export default function DependencyGraph({ nodes, criticalPath = [], onSelect }) {
  const layout = useMemo(() => {
    const byLevel = {};
    nodes.forEach((n) => {
      const lv = n.level || 0;
      (byLevel[lv] = byLevel[lv] || []).push(n);
    });
    const levels = Object.keys(byLevel).map(Number).sort((a, b) => a - b);
    const pos = {};
    levels.forEach((lv) => {
      byLevel[lv].forEach((n, i) => {
        pos[n.approval_key] = { x: PAD + lv * (NODE_W + GAP_X), y: PAD + i * (NODE_H + GAP_Y) };
      });
    });
    const maxRows = Math.max(1, ...levels.map((lv) => byLevel[lv].length));
    return {
      pos,
      width: PAD * 2 + levels.length * NODE_W + Math.max(0, levels.length - 1) * GAP_X,
      height: PAD * 2 + maxRows * NODE_H + (maxRows - 1) * GAP_Y
    };
  }, [nodes]);

  if (!nodes.length) {
    return <p className="text-sm text-slate-400">No approvals identified yet — complete your regulatory assessment first.</p>;
  }

  const edges = [];
  nodes.forEach((n) => {
    (n.dep_keys || []).forEach((d) => {
      const from = layout.pos[d], to = layout.pos[n.approval_key];
      if (!from || !to) return;
      edges.push({
        key: `${d}->${n.approval_key}`,
        x1: from.x + NODE_W, y1: from.y + NODE_H / 2,
        x2: to.x, y2: to.y + NODE_H / 2
      });
    });
  });

  return (
    <div className="overflow-x-auto">
      <div className="relative" style={{ width: layout.width, height: layout.height, minWidth: "100%" }}>
        <svg className="absolute inset-0 pointer-events-none" width={layout.width} height={layout.height}>
          <defs>
            <marker id="niecp-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8" />
            </marker>
          </defs>
          {edges.map((e) => (
            <path key={e.key}
              d={`M ${e.x1} ${e.y1} C ${e.x1 + 35} ${e.y1}, ${e.x2 - 35} ${e.y2}, ${e.x2 - 2} ${e.y2}`}
              fill="none" stroke="#94a3b8" strokeWidth="1.8" markerEnd="url(#niecp-arrow)" />
          ))}
        </svg>
        {nodes.map((n) => {
          const p = layout.pos[n.approval_key];
          const onPath = criticalPath.includes(n.approval_key);
          return (
            <button key={n.approval_key} onClick={() => onSelect && onSelect(n)} title={n.approval_name}
              className={`absolute text-left rounded-xl border-2 shadow-sm hover:shadow-md transition cursor-pointer ${NODE_STYLE[n.lifecycle] || NODE_STYLE.PENDING} ${onPath ? "ring-2 ring-purple-300" : ""}`}
              style={{ left: p.x, top: p.y, width: NODE_W, height: NODE_H }}>
              <div className="p-2.5 h-full flex flex-col">
                <div className="flex items-start justify-between gap-1">
                  <div className="text-[11px] font-semibold text-slate-800 leading-tight line-clamp-2">{n.approval_name}</div>
                  {onPath && <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0 mt-1" />}
                </div>
                <div className="text-[9px] text-slate-500 truncate">{n.authority}</div>
                <div className="mt-auto flex items-center justify-between gap-1">
                  <StatusChip status={n.lifecycle} />
                  <span className="text-[9px] text-slate-400 whitespace-nowrap">
                    {n.conditional ? "Conditional" : "Required"}{n.dep_keys?.length ? ` · ${n.dep_keys.length} dep` : ""}
                  </span>
                </div>
                {n.blocks_count > 0 && (
                  <div className="text-[9px] font-semibold text-red-500 flex items-center gap-0.5 mt-0.5">
                    <Lock className="w-2.5 h-2.5" /> blocks {n.blocks_count}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
import React, { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateManualStatus, recordManualQuery } from "@/lib/niecp/government/manager";

const STATUSES = ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "QUERY_RAISED", "RESPONDED", "APPROVED", "REJECTED"];

// Manual Application Adapter UI — record real-world application details.
// All recorded data is USER_ENTERED and labelled as such.
export default function ManualStatusDialog({ application, onClose, onSaved }) {
  const [reference, setReference] = useState(application.application_reference || "");
  const [submittedDate, setSubmittedDate] = useState(application.submitted_date ? application.submitted_date.slice(0, 10) : "");
  const [portal, setPortal] = useState(application.portal || application.official_url || "");
  const [status, setStatus] = useState(application.status || "DRAFT");
  const [notes, setNotes] = useState(application.notes || "");
  const [newQuery, setNewQuery] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await updateManualStatus(application, {
        application_reference: reference,
        submitted_date: submittedDate ? new Date(submittedDate).toISOString() : "",
        portal,
        status,
        notes,
        next_action: status === "APPROVED" ? "Review approval conditions and compliance obligations." : "Keep tracking until the decision is received."
      });
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  async function addQuery() {
    if (!newQuery.trim()) return;
    setSaving(true);
    try {
      await recordManualQuery(application, newQuery.trim());
      setNewQuery("");
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">Record Application Details</DialogTitle>
          <DialogDescription className="text-left text-xs">
            Manual tracking — all information below is user-entered and is never presented as live government data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-600">Application ID / Reference</label>
            <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="As given by the authority/portal" className="text-xs mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600">Submitted date</label>
              <Input type="date" value={submittedDate} onChange={(e) => setSubmittedDate(e.target.value)} className="text-xs mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Current status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}
                className="w-full mt-1 text-xs border rounded-lg px-2 py-2 bg-white outline-none focus:ring-2 ring-blue-200">
                {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Official portal used</label>
            <Input value={portal} onChange={(e) => setPortal(e.target.value)} placeholder="https://…" className="text-xs mt-1" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Notes</label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Officer name, acknowledgment number, follow-ups…" className="text-xs mt-1 min-h-[60px]" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Government query received</label>
            <Textarea value={newQuery} onChange={(e) => setNewQuery(e.target.value)} placeholder="Paste the query/communication you received…" className="text-xs mt-1 min-h-[60px]" />
            <Button size="sm" variant="outline" className="mt-2 text-xs" disabled={!newQuery.trim() || saving} onClick={addQuery}>
              Record query
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving} className="bg-blue-600 hover:bg-blue-700">Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
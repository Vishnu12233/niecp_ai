import React, { useState, useMemo } from "react";
import { useProjectData } from "@/lib/niecp/useProjectData";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusChip } from "./Dashboard";
import ComplianceReadiness from "@/components/compliance/ComplianceReadiness";
import { Upload, FileText, Search, Filter, HelpCircle, Loader2, X, CheckCircle2, AlertTriangle } from "lucide-react";

export default function Documents() {
  const { selected, loading, documents, approvals, documentMap, compliance, reload } = useProjectData();
  const [filter, setFilter] = useState("all");
  const [approvalFilter, setApprovalFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(null); // requirement_key being uploaded
  const [uploadForm, setUploadForm] = useState(null);
  const [whyOpen, setWhyOpen] = useState(null);

  const filtered = useMemo(() => {
    return documents.filter((d) => {
      if (filter !== "all") {
        const map = { missing: "MISSING", expiring: "EXPIRING_SOON", expired: "EXPIRED", uploaded: "VALID", needs_verification: "NEEDS_VERIFICATION" };
        if (map[filter] && d.status !== map[filter]) return false;
      }
      if (approvalFilter !== "all" && d.approval_key !== approvalFilter) return false;
      if (search && !d.document_name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [documents, filter, approvalFilter, search]);

  if (loading) return <div className="py-20 text-center text-slate-400">Loading documents…</div>;
  if (!selected) return <div className="bg-white rounded-2xl border p-10 text-center text-slate-400">Select a profile to view documents.</div>;

  const total = documents.length;
  const valid = documents.filter((d) => d.status === "VALID" || d.status === "NO_EXPIRY").length;
  const missing = documents.filter((d) => d.status === "MISSING").length;
  const expiring = documents.filter((d) => d.status === "EXPIRING_SOON").length;
  const expired = documents.filter((d) => d.status === "EXPIRED").length;
  const needsVerif = documents.filter((d) => d.status === "NEEDS_VERIFICATION").length;
  const readiness = total ? Math.round((valid / total) * 100) : 0;

  function startUpload(req) {
    setUploadForm({ requirement_key: req.requirement_key, document_name: req.document_name, approval_name: req.approval_name, authority: req.authority, file: null, issue_date: "", expiry_date: "", no_expiry: false });
  }

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { alert("File exceeds 10 MB limit."); return; }
    setUploadForm((f) => ({ ...f, file }));
  }

  async function submitUpload() {
    if (!uploadForm.file) { alert("Select a file."); return; }
    setUploading(uploadForm.requirement_key);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: uploadForm.file });
      const existing = documents.find((d) => d.requirement_key === uploadForm.requirement_key);
      const payload = {
        profile_id: selected.id,
        requirement_key: uploadForm.requirement_key,
        document_name: uploadForm.document_name,
        approval_key: documents.find((d) => d.requirement_key === uploadForm.requirement_key)?.approval_key,
        approval_name: uploadForm.approval_name,
        file_url,
        issue_date: uploadForm.issue_date || null,
        expiry_date: uploadForm.no_expiry ? null : uploadForm.expiry_date,
        no_expiry: uploadForm.no_expiry,
        authority: uploadForm.authority,
        status: "UPLOADED",
        priority: documents.find((d) => d.requirement_key === uploadForm.requirement_key)?.priority,
        mandatory: true,
        ai_classification: { detected: uploadForm.document_name, confidence: 90, confirmed: true, note: "User-uploaded and confirmed." }
      };
      if (existing) await base44.entities.ProjectDocument.update(existing.id, payload);
      else await base44.entities.ProjectDocument.create(payload);
      await base44.entities.AuditLog.create({ profile_id: selected.id, action: "document_uploaded", detail: uploadForm.document_name, category: "document" });
      setUploadForm(null);
      await reload();
    } catch (e) {
      alert("Upload failed: " + (e?.message || e));
    } finally {
      setUploading(null);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Document Center</h1>
        <p className="text-sm text-slate-500">Upload, validate and track project-specific document requirements.</p>
      </div>

      {/* Readiness banner */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs text-slate-400 uppercase">Project Document Readiness</div>
            <div className="text-3xl font-bold text-blue-700">{readiness}%</div>
            <div className="text-xs text-slate-500">{valid} / {total} required documents complete</div>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 text-center">
            <Mini label="Required" value={total} color="slate" />
            <Mini label="Valid" value={valid} color="teal" />
            <Mini label="Missing" value={missing} color="red" />
            <Mini label="Expiring" value={expiring} color="amber" />
            <Mini label="Expired" value={expired} color="red" />
            <Mini label="Verify" value={needsVerif} color="amber" />
          </div>
        </div>
      </div>

      {/* Empty-state guidance */}
      {total > 0 && missing > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <div className="font-semibold text-amber-800 text-sm">Documents needed for your project</div>
              <div className="text-xs text-amber-700 mt-1">Your project has {missing} missing document requirement(s). Highest priority: <b>{documents.find((d) => d.status === "MISSING")?.document_name}</b> for <b>{documents.find((d) => d.status === "MISSING")?.approval_name}</b>.</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-40">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input className="pl-9" placeholder="Search documents…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="border rounded-md px-3 py-2 text-sm" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="missing">Missing</option>
          <option value="uploaded">Uploaded / Valid</option>
          <option value="expiring">Expiring Soon</option>
          <option value="expired">Expired</option>
          <option value="needs_verification">Needs Verification</option>
        </select>
        <select className="border rounded-md px-3 py-2 text-sm" value={approvalFilter} onChange={(e) => setApprovalFilter(e.target.value)}>
          <option value="all">All Approvals</option>
          {approvals.map((a) => <option key={a.approval_key} value={a.approval_key}>{a.approval_name}</option>)}
        </select>
      </div>

      {/* Document cards */}
      <div className="grid md:grid-cols-2 gap-3">
        {filtered.map((d) => (
          <div key={d.requirement_key} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center"><FileText className="w-4 h-4 text-slate-500" /></div>
                <div>
                  <div className="font-medium text-slate-900 text-sm">{d.document_name}</div>
                  <div className="text-xs text-slate-500">Required for: {d.approval_name}</div>
                  {(documentMap[d.requirement_key] || []).length > 1 && (
                    <div className="text-[10px] text-blue-700 mt-0.5">
                      Used by {documentMap[d.requirement_key].length} approvals: {documentMap[d.requirement_key].map((x) => x.name).join(" · ")}
                    </div>
                  )}
                </div>
              </div>
              <StatusChip status={d.status} />
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-slate-500">
              <div>Authority: <b className="text-slate-700">{d.authority}</b></div>
              <div>Priority: <b className="text-slate-700 capitalize">{d.priority}</b></div>
              {d.issue_date && <div>Issued: {d.issue_date}</div>}
              {d.expiry_date && <div>Expiry: {d.expiry_date}</div>}
              {d.no_expiry && <div>No expiry</div>}
              {d.ai_classification?.confirmed && <div className="text-teal-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Classified</div>}
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-4">
              {d.status === "MISSING" ? (
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => startUpload(d)}><Upload className="w-3.5 h-3.5 mr-1" /> Upload</Button>
              ) : (
                <>
                  {d.file_url && <a href={d.file_url} target="_blank" rel="noreferrer"><Button size="sm" variant="outline">View</Button></a>}
                  <Button size="sm" variant="outline" onClick={() => startUpload(d)}>Replace</Button>
                </>
              )}
              <Button size="sm" variant="ghost" onClick={() => setWhyOpen(whyOpen === d.requirement_key ? null : d.requirement_key)}><HelpCircle className="w-3.5 h-3.5 mr-1" /> Why required?</Button>
            </div>
            {whyOpen === d.requirement_key && (
              <div className="mt-3 text-xs text-slate-600 bg-blue-50 rounded-lg p-3 space-y-1">
                <div><b>Required for:</b> {d.approval_name}</div>
                <div><b>Authority:</b> {d.authority}</div>
                <div><b>Source:</b> <a href={d.source_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{d.source_url}</a></div>
                <div><b>Expiry required:</b> {d.expiry_required ? "Yes" : "No"}</div>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && <div className="md:col-span-2 text-center text-sm text-slate-400 py-10">No documents match the current filter.</div>}
      </div>

      <ComplianceReadiness items={compliance} />

      {/* Upload modal */}
      {uploadForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => !uploading && setUploadForm(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Upload Document</h3>
              <button onClick={() => !uploading && setUploadForm(null)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <div className="space-y-3">
              <div className="text-sm"><b>{uploadForm.document_name}</b><div className="text-xs text-slate-500">Required for {uploadForm.approval_name}</div></div>
              <div className="text-xs text-slate-500 bg-slate-50 rounded p-2">
                Accepted: PDF, DOCX, JPG, PNG · Max 10 MB.<br />
                Validation is based on the issue and expiry dates you enter — no automated content validation is performed.
              </div>
              <div>
                <Label className="text-xs">File</Label>
                <Input type="file" accept=".pdf,.docx,.jpg,.jpeg,.png" onChange={handleFile} />
                {uploadForm.file && <div className="text-xs text-teal-600 mt-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {uploadForm.file.name}</div>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Document Issue Date</Label><Input type="date" value={uploadForm.issue_date} onChange={(e) => setUploadForm((f) => ({ ...f, issue_date: e.target.value }))} /></div>
                <div><Label className="text-xs">Document Expiry Date</Label><Input type="date" disabled={uploadForm.no_expiry} value={uploadForm.expiry_date} onChange={(e) => setUploadForm((f) => ({ ...f, expiry_date: e.target.value }))} /></div>
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" checked={uploadForm.no_expiry} onChange={(e) => setUploadForm((f) => ({ ...f, no_expiry: e.target.checked }))} /> No Expiry / Not Applicable</label>
              <div><Label className="text-xs">Authority / Issuing Body</Label><Input value={uploadForm.authority} onChange={(e) => setUploadForm((f) => ({ ...f, authority: e.target.value }))} /></div>
              <Button className="w-full bg-blue-600 hover:bg-blue-700" disabled={!!uploading} onClick={submitUpload}>
                {uploading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Upload className="w-4 h-4 mr-1" />} Upload Document
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Mini({ label, value, color }) {
  const c = { slate: "text-slate-600", teal: "text-teal-600", red: "text-red-600", amber: "text-amber-600" };
  return <div><div className={`text-xl font-bold ${c[color]}`}>{value}</div><div className="text-[10px] text-slate-400 uppercase">{label}</div></div>;
}
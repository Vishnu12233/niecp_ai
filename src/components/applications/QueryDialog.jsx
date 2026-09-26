import React, { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Languages } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { respondToQuery } from "@/lib/niecp/government/manager";

// Government Query Translator: ORIGINAL QUERY → plain-language explanation →
// what's missing → what's needed → recommended action → response preparation
// → user confirmation. AI explanation is always labelled as AI-generated.
export default function QueryDialog({ application, query, onClose, onResponded }) {
  const [loading, setLoading] = useState(true);
  const [translation, setTranslation] = useState(null);
  const [disclaimer, setDisclaimer] = useState("");
  const [responseText, setResponseText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function translate() {
      setLoading(true);
      try {
        const res = await base44.functions.invoke("queryTranslator", {
          query: query.text,
          approval_name: application.approval_name,
          authority: application.authority
        });
        if (cancelled) return;
        const data = res?.data || {};
        setTranslation(data.translation);
        setDisclaimer(data.disclaimer || "AI-generated explanation — verify against the official communication.");
        setResponseText(data.translation?.response_draft || "");
      } catch (e) {
        if (!cancelled) {
          setTranslation(null);
          setDisclaimer("AI translation is unavailable right now. Read the original communication carefully and respond with the details it asks for.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    translate();
    return () => { cancelled = true; };
  }, [query?.id]);

  async function submit() {
    if (!responseText.trim()) return;
    setSubmitting(true);
    try {
      await respondToQuery(application, query.id, responseText.trim());
      onResponded();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Languages className="w-4 h-4 text-blue-600" /> Government Query Translator
          </DialogTitle>
          <DialogDescription className="text-left text-xs">
            {query.source === "NIECP_DEMO" ? "Synthetic demo query — not a real government communication. " : ""}
            AI-generated explanation — verify against the official communication.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <div className="text-[10px] uppercase font-bold text-amber-700 mb-1">Original query</div>
            <div className="text-slate-800 text-xs">{query.text}</div>
          </div>

          {loading && (
            <div className="flex items-center gap-2 text-slate-500 text-xs py-4 justify-center">
              <Loader2 className="w-4 h-4 animate-spin" /> Translating the query…
            </div>
          )}

          {!loading && translation && (
            <>
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                <div className="text-[10px] uppercase font-bold text-blue-700 mb-1">Plain language explanation</div>
                <div className="text-slate-800 text-xs whitespace-pre-wrap">{translation.plain_explanation}</div>
              </div>
              <div className="grid gap-2">
                <div className="text-xs"><b>What is missing:</b> <span className="text-slate-600">{translation.what_is_missing}</span></div>
                <div className="text-xs"><b>What is needed:</b> <span className="text-slate-600">{translation.what_is_needed}</span></div>
                <div className="text-xs"><b>Recommended action:</b> <span className="text-slate-600">{translation.recommended_action}</span></div>
              </div>
            </>
          )}
          {!loading && !translation && (
            <div className="text-xs text-slate-500">{disclaimer}</div>
          )}

          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Your response</div>
            <Textarea value={responseText} onChange={(e) => setResponseText(e.target.value)}
              placeholder="Prepare your response to the query…"
              className="text-xs min-h-[90px]" />
            <div className="text-[10px] text-slate-400 mt-1">
              Review before submitting. {application.integration_mode === "DEMO" ? "This response goes to the NIECP demo environment (synthetic)." : "Copy this response into the official portal or your reply to the authority."}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={!responseText.trim() || submitting} onClick={submit} className="bg-blue-600 hover:bg-blue-700">
            {submitting && <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />}
            Submit response
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
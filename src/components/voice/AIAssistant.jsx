import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Mic, Square, Volume2, VolumeX, X, Keyboard, Send, Loader2, RotateCcw, Settings } from "lucide-react";
import { useProjectData } from "@/lib/niecp/useProjectData";
import { useVoiceAssistant, STATE_LABELS } from "./useVoiceAssistant";
import VoiceReactiveCore from "./VoiceReactiveCore";
import { VOICE_LANGUAGES, SPEED_OPTIONS } from "@/lib/niecp/voiceConfig";

const ACTION_ROUTES = {
  view_approvals: "/approvals",
  check_documents: "/documents",
  view_critical_path: "/critical-path",
  view_applications: "/applications",
  view_government: "/government"
};

const STATE_HINTS = {
  PERMISSION_DENIED: "Microphone access is unavailable. You can type your request instead.",
  NO_SPEECH: "I didn't catch that. Tap the microphone and speak again, or type your request.",
  NETWORK_ERROR: "Connection problem. Please check your internet and try again.",
  ERROR: "Something went wrong. Please try again."
};

export default function AIAssistant() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [text, setText] = useState("");
  const [history, setHistory] = useState([]);
  const historyRef = useRef([]);
  historyRef.current = history;
  const historyEndRef = useRef(null);
  const { selected, approvals, documents, blockers, applications, readiness, criticalPath, nextBestAction } = useProjectData();

  const getContext = () => ({
    name: selected?.name,
    industry: selected?.industry,
    sub_industry: selected?.sub_industry,
    state: selected?.state,
    city: selected?.city,
    stage: selected?.project_stage,
    government_data: selected?.government_data,
    readiness,
    criticalPathLength: criticalPath?.length,
    nextBestAction: nextBestAction?.label,
    approvals: approvals.map((a) => ({
      approval_name: a.approval_name, authority: a.authority, status: a.status,
      triggered_factors: a.triggered_factors, readiness: a.readiness
    })),
    documents: documents.map((d) => ({ document_name: d.document_name, approval_name: d.approval_name, status: d.status })),
    blockers: blockers.map((b) => ({ document_name: b.document_name, status: b.status, approval_name: b.approval_name })),
    applications: applications.map((a) => ({
      approval_name: a.approval_name, status: a.status,
      integration_mode: a.integration_mode, status_source: a.status_source
    })),
    history: historyRef.current.slice(-6).map((m) => ({ role: m.role, text: m.text }))
  });

  const va = useVoiceAssistant(getContext);

  // Append each completed exchange to the conversation history
  useEffect(() => {
    if (!va.response) return;
    const question = va.transcript;
    setHistory((h) => [...h, { role: "user", text: question }, { role: "assistant", text: va.response.message }]);
  }, [va.response]);

  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  function handleOpen() {
    setOpen(true);
    setShowInput(!va.supportsVoice);
    va.activate();
  }

  function handleClose() {
    va.close();
    setOpen(false);
  }

  function go(route) {
    handleClose();
    navigate(route);
  }

  function submitText() {
    const q = text.trim();
    if (!q) return;
    setText("");
    va.sendText(q);
  }

  const statusHint = STATE_HINTS[va.state];
  const langInfo = VOICE_LANGUAGES[va.settings.language];

  return (
    <>
      {/* Floating NIA orb */}
      <motion.button
        onClick={handleOpen}
        aria-label="Open NIA voice assistant"
        className="fixed bottom-6 right-6 z-40 flex items-center gap-3 group"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <span className="hidden sm:block text-xs font-medium text-slate-600 bg-white/90 backdrop-blur border border-slate-200 rounded-full px-3 py-1.5 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
          NIA Assistant
        </span>
        <motion.span
          className="relative w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 shadow-[0_0_28px_rgba(34,211,238,0.55)]"
          animate={{ scale: [1, 1.06, 1], boxShadow: ["0 0 18px rgba(34,211,238,0.45)", "0 0 30px rgba(34,211,238,0.7)", "0 0 18px rgba(34,211,238,0.45)"] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <Mic className="w-5 h-5 text-white" />
        </motion.span>
      </motion.button>

      {/* Holographic NIA interface */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#040d1f]/95 backdrop-blur-md overflow-y-auto"
            role="dialog" aria-label="NIA voice assistant"
            onKeyDown={(e) => e.key === "Escape" && handleClose()}
          >
            <div className="min-h-full flex items-center justify-center p-4">
              <div className="w-full max-w-2xl py-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-[10px] tracking-[0.3em] text-cyan-300/70 font-semibold">NIECP-AI</div>
                    <div className="text-lg font-semibold text-white flex items-center gap-2">
                      NIA Assistant
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-cyan-400/10 border border-cyan-400/30 text-cyan-200">
                        {langInfo?.nativeLabel} · {va.settings.voice} · {va.settings.speed.toFixed(2)}x
                      </span>
                    </div>
                  </div>
                  <button onClick={handleClose} aria-label="Close assistant" className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Core */}
                <div className="flex justify-center py-3">
                  <VoiceReactiveCore analyserRef={va.analyserRef} speakPulseRef={va.speakPulseRef} state={va.state} size={280} />
                </div>

                {/* Status */}
                <div className="text-center">
                  <div className="text-sm font-semibold tracking-widest text-cyan-300">
                    {va.state === "PROCESSING" && <Loader2 className="w-4 h-4 inline-block mr-2 animate-spin" />}
                    {STATE_LABELS[va.state] || "NIA READY"}
                  </div>
                  {statusHint && <div className="text-xs text-slate-400 mt-1">{statusHint}</div>}
                  {va.notice && <div className="text-[11px] text-amber-300 mt-1">{va.notice}</div>}
                </div>

                {/* Transcript + latest response */}
                <div className="mt-4 space-y-3">
                  {va.transcript && va.state !== "IDLE" && (
                    <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-3">
                      <div className="text-[10px] uppercase tracking-widest text-cyan-300/70 mb-1">You said</div>
                      <div className="text-sm text-cyan-50">{va.transcript}</div>
                    </div>
                  )}
                  {va.response && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-[10px] uppercase tracking-widest text-slate-400">NIA</div>
                        {va.response.subject && va.response.subject !== "general" && (
                          <span className="text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-cyan-400/10 text-cyan-300 border border-cyan-400/20">{va.response.subject}</span>
                        )}
                      </div>
                      <p className="text-sm text-slate-100 leading-relaxed whitespace-pre-wrap">{va.response.message}</p>
                      {va.response.actions?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {va.response.actions.filter((a) => ACTION_ROUTES[a.type]).map((a, i) => (
                            <button key={i} onClick={() => go(ACTION_ROUTES[a.type])}
                              className="text-xs px-3 py-1.5 rounded-full bg-cyan-400/10 border border-cyan-400/30 text-cyan-200 hover:bg-cyan-400/20 transition">
                              {a.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>

                {/* Conversation history */}
                {history.length > 0 && (
                  <div className="mt-3 max-h-36 overflow-y-auto space-y-2 pr-1">
                    {history.map((m, i) => (
                      <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${m.role === "user" ? "bg-cyan-400/10 border border-cyan-400/20 text-cyan-100" : "bg-white/5 border border-white/10 text-slate-300"}`}>
                          {m.text}
                        </div>
                      </div>
                    ))}
                    <div ref={historyEndRef} />
                  </div>
                )}

                {/* Text input */}
                {showInput && (
                  <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-2">
                    <input
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && submitText()}
                      placeholder="Type your question…"
                      aria-label="Type your question"
                      className="flex-1 bg-transparent px-2 py-1.5 text-sm text-white placeholder:text-slate-500 outline-none"
                    />
                    <button onClick={submitText} aria-label="Send" className="p-2 rounded-lg text-cyan-300 hover:bg-cyan-400/10">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Voice settings panel */}
                {settingsOpen && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
                    <div className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Voice Assistant</div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-slate-200">
                      <label className="space-y-1">
                        <span className="text-slate-400">Language</span>
                        <select value={va.settings.language} onChange={(e) => va.updateSettings({ language: e.target.value })}
                          className="w-full bg-[#0a1930] border border-white/10 rounded-lg px-2 py-1.5 outline-none">
                          {Object.entries(VOICE_LANGUAGES).map(([code, l]) => (
                            <option key={code} value={code}>{l.nativeLabel} ({l.label})</option>
                          ))}
                        </select>
                      </label>
                      <label className="space-y-1">
                        <span className="text-slate-400">Voice</span>
                        <select value={va.settings.voice} onChange={(e) => va.updateSettings({ voice: e.target.value })}
                          className="w-full bg-[#0a1930] border border-white/10 rounded-lg px-2 py-1.5 outline-none capitalize">
                          <option value="female">Natural Female</option>
                          <option value="male">Natural Male</option>
                        </select>
                      </label>
                      <label className="space-y-1 col-span-2 sm:col-span-1">
                        <span className="text-slate-400">Speed</span>
                        <select value={va.settings.speed} onChange={(e) => va.updateSettings({ speed: Number(e.target.value) })}
                          className="w-full bg-[#0a1930] border border-white/10 rounded-lg px-2 py-1.5 outline-none">
                          {SPEED_OPTIONS.map((s) => (
                            <option key={s} value={s}>{s.toFixed(2)}x</option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <button onClick={va.testVoice} disabled={va.state === "RESPONDING"}
                      className="text-xs px-3 py-1.5 rounded-full bg-cyan-400/10 border border-cyan-400/30 text-cyan-200 hover:bg-cyan-400/20 transition disabled:opacity-50">
                      Test Voice
                    </button>
                  </motion.div>
                )}

                {/* Controls */}
                <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
                  {(va.state === "IDLE" || va.state === "NO_SPEECH" || va.state === "PERMISSION_DENIED") && va.supportsVoice && (
                    <button onClick={va.activate} aria-label="Start listening"
                      className="flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-400/15 border border-cyan-400/40 text-cyan-200 text-xs font-medium hover:bg-cyan-400/25 transition">
                      <Mic className="w-3.5 h-3.5" /> Microphone
                    </button>
                  )}
                  {(va.state === "LISTENING" || va.state === "PROCESSING" || va.state === "RESPONDING") && (
                    <button onClick={va.stop} aria-label="Stop"
                      className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-slate-200 text-xs font-medium hover:bg-white/15 transition">
                      <Square className="w-3.5 h-3.5" /> Stop
                    </button>
                  )}
                  <button onClick={va.replay} aria-label="Replay last answer" disabled={va.state === "RESPONDING"}
                    className="p-2.5 rounded-full bg-white/10 border border-white/20 text-slate-300 hover:bg-white/15 transition disabled:opacity-40">
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button onClick={va.toggleMute} aria-label={va.muted ? "Unmute" : "Mute"}
                    className={`p-2.5 rounded-full border text-xs transition ${va.muted ? "bg-white/10 border-white/20 text-slate-400" : "bg-cyan-400/10 border-cyan-400/30 text-cyan-200"}`}>
                    {va.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <button onClick={() => setShowInput((v) => !v)} aria-label="Type instead"
                    className={`p-2.5 rounded-full border text-xs transition ${showInput ? "bg-cyan-400/10 border-cyan-400/30 text-cyan-200" : "bg-white/10 border-white/20 text-slate-300"}`}>
                    <Keyboard className="w-4 h-4" />
                  </button>
                  <button onClick={() => setSettingsOpen((v) => !v)} aria-label="Voice settings"
                    className={`p-2.5 rounded-full border text-xs transition ${settingsOpen ? "bg-cyan-400/10 border-cyan-400/30 text-cyan-200" : "bg-white/10 border-white/20 text-slate-300"}`}>
                    <Settings className="w-4 h-4" />
                  </button>
                  <button onClick={handleClose} aria-label="Close assistant"
                    className="p-2.5 rounded-full bg-white/10 border border-white/20 text-slate-300 hover:bg-white/15 transition">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-center text-[10px] text-slate-500 mt-4 leading-relaxed">
                  NIA provides regulatory intelligence only — not legal advice or government decisions.<br />
                  Confirm with the relevant authority. Press Esc to close.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
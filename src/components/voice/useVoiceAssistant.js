import { useCallback, useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { VOICE_LANGUAGES, loadVoiceSettings, saveVoiceSettings } from "@/lib/niecp/voiceConfig";

// NIA voice assistant hook.
// Input: Web Speech recognition in the selected language (ta/en/hi/mr-IN).
// Output: neural TTS via the secure backend (OpenAI), played through Web Audio
// so the core reacts to the REAL TTS audio. Browser speechSynthesis is only a
// labelled fallback. Repeated phrases are cached and never re-generated.

const SpeechRecognitionImpl =
  typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

export const STATE_LABELS = {
  IDLE: "NIA READY",
  ACTIVATING: "INITIALIZING NIA...",
  LISTENING: "LISTENING...",
  PROCESSING: "THINKING...",
  RESPONDING: "NIA IS SPEAKING",
  PERMISSION_DENIED: "MICROPHONE UNAVAILABLE",
  NO_SPEECH: "NO SPEECH DETECTED",
  NETWORK_ERROR: "CONNECTION ERROR",
  ERROR: "SOMETHING WENT WRONG"
};

// Audio cache: same text + language + voice + speed → same audio, generated once.
const audioCache = new Map();
const MAX_CACHE = 30;
const cacheKey = (text, s) => `${s.language}|${s.voice}|${s.speed}|${text}`;

export function useVoiceAssistant(getContext) {
  const [state, setState] = useState("IDLE");
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState(null);
  const [muted, setMuted] = useState(false);
  const [notice, setNotice] = useState("");
  const [settings, setSettings] = useState(loadVoiceSettings);

  const stateRef = useRef(state);
  stateRef.current = state;
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const mutedRef = useRef(false);
  const busyRef = useRef(false);
  const activeRef = useRef(false);
  const ctxFnRef = useRef(getContext);
  ctxFnRef.current = getContext;

  const micAnalyserRef = useRef(null);
  const analyserRef = useRef(null);      // current analyser for the visualizer
  const audioCtxRef = useRef(null);
  const streamRef = useRef(null);
  const recognitionRef = useRef(null);
  const ttsSourceRef = useRef(null);
  const lastSpokenRef = useRef("");
  const speakPulseRef = useRef(0);       // kept for the browser-TTS fallback visuals

  const ensureAudioCtx = useCallback(() => {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
      audioCtxRef.current = new AudioCtx();
    }
    return audioCtxRef.current;
  }, []);

  // ---- Last-resort fallback: browser speech synthesis ----
  const speakBrowser = useCallback((text) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setNotice("Voice service temporarily unavailable. You can continue using text guidance.");
      setState("IDLE");
      return;
    }
    const lang = settingsRef.current.language;
    const voices = window.speechSynthesis.getVoices ? window.speechSynthesis.getVoices() : [];
    const voice =
      voices.find((v) => v.lang === lang) ||
      voices.find((v) => (v.lang || "").startsWith(lang.split("-")[0]));
    if (!voice) {
      setNotice("Voice service temporarily unavailable. You can continue using text guidance.");
      setState("IDLE");
      return;
    }
    try { window.speechSynthesis.cancel(); } catch (e) { /* noop */ }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice;
    utterance.lang = voice.lang;
    utterance.rate = settingsRef.current.speed;
    utterance.pitch = 0.95;
    utterance.onboundary = () => { speakPulseRef.current = 1; };
    utterance.onend = () => setState("IDLE");
    utterance.onerror = () => setState("IDLE");
    setState("RESPONDING");
    window.speechSynthesis.speak(utterance);
  }, []);

  const stopTtsSource = useCallback(() => {
    try { ttsSourceRef.current?.stop(); } catch (e) { /* noop */ }
    ttsSourceRef.current = null;
  }, []);

  // ---- Primary engine: neural TTS via secure backend ----
  const speak = useCallback(async (text) => {
    if (!text) { setState("IDLE"); return; }
    setNotice("");
    if (mutedRef.current) { setState("IDLE"); return; }
    const s = settingsRef.current;
    const key = cacheKey(text, s);
    let entry = audioCache.get(key);
    setState("RESPONDING");

    if (!entry) {
      try {
        const res = await base44.functions.invoke("niaTts", {
          text, language: s.language, voice: s.voice, speed: s.speed
        });
        const data = res?.data || {};
        if (data.audio) {
          const binary = atob(data.audio);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
          entry = { url: URL.createObjectURL(new Blob([bytes], { type: "audio/mpeg" })), applyRate: false };
        } else if (data.url) {
          // Platform neural TTS — no encoded speed, applied at playback
          entry = { url: data.url, applyRate: true };
        } else throw new Error("no audio");
        if (audioCache.size >= MAX_CACHE) {
          const firstKey = audioCache.keys().next().value;
          const firstEntry = audioCache.get(firstKey);
          if (firstEntry) URL.revokeObjectURL(firstEntry.url);
          audioCache.delete(firstKey);
        }
        audioCache.set(key, entry);
      } catch (e) {
        setNotice("Voice service temporarily unavailable — using the device's built-in voice.");
        speakBrowser(text);
        return;
      }
    }

    // Play through Web Audio so the visuals react to the real TTS audio.
    try {
      const ctx = ensureAudioCtx();
      if (ctx.state === "suspended") await ctx.resume();
      const bufferData = await (await fetch(entry.url)).arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(bufferData);
      stopTtsSource();
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      if (entry.applyRate) source.playbackRate.value = s.speed;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.7;
      source.connect(analyser);
      analyser.connect(ctx.destination);
      ttsSourceRef.current = source;
      analyserRef.current = analyser;
      source.onended = () => {
        ttsSourceRef.current = null;
        analyserRef.current = micAnalyserRef.current;
        if (stateRef.current === "RESPONDING") setState("IDLE");
      };
      source.start();
    } catch (e) {
      speakBrowser(text);
    }
  }, [ensureAudioCtx, speakBrowser, stopTtsSource]);

  const handleQuery = useCallback(async (text) => {
    if (!text || busyRef.current) return;
    busyRef.current = true;
    setState("PROCESSING");
    setTranscript(text);
    setResponse(null);
    try {
      const context = ctxFnRef.current();
      const res = await base44.functions.invoke("copilot", {
        message: text,
        language: settingsRef.current.language,
        history: context.history || [],
        context
      });
      const data = res?.data || {};
      const message = data.message || data.answer || "I could not generate a response right now.";
      setResponse({
        message, actions: data.actions || [], sources: data.sources || [],
        subject: data.subject, status: data.status
      });
      lastSpokenRef.current = message;
      speak(message);
    } catch (e) {
      setState("NETWORK_ERROR");
    } finally {
      busyRef.current = false;
    }
  }, [speak]);

  const startRecognition = useCallback(() => {
    if (!SpeechRecognitionImpl) return;
    try { recognitionRef.current?.abort(); } catch (e) { /* noop */ }
    const recognition = new SpeechRecognitionImpl();
    recognition.lang = settingsRef.current.language; // selected language controls recognition
    recognition.interimResults = true;
    recognition.continuous = false;
    let finalText = "";
    recognition.onresult = (ev) => {
      let interim = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        if (ev.results[i].isFinal) finalText += ev.results[i][0].transcript;
        else interim += ev.results[i][0].transcript;
      }
      setTranscript((finalText + " " + interim).trim());
    };
    recognition.onerror = (ev) => {
      if (ev.error === "not-allowed" || ev.error === "service-not-allowed") setState("PERMISSION_DENIED");
      else if (ev.error === "no-speech") setState("NO_SPEECH");
      else if (ev.error === "network") setState("NETWORK_ERROR");
      else if (ev.error !== "aborted") setState("ERROR");
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      if (finalText.trim()) handleQuery(finalText.trim());
      else if (activeRef.current && !busyRef.current) setState((s) => (s === "LISTENING" ? "NO_SPEECH" : s));
    };
    recognitionRef.current = recognition;
    try {
      recognition.start();
      analyserRef.current = micAnalyserRef.current;
      setState("LISTENING");
    } catch (e) { /* noop */ }
  }, [handleQuery]);

  const playChime = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = 880;
      gain.gain.value = 0.06;
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start();
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45);
      oscillator.stop(ctx.currentTime + 0.5);
      setTimeout(() => ctx.close().catch(() => {}), 900);
    } catch (e) { /* noop */ }
  }, []);

  const activate = useCallback(async () => {
    if (activeRef.current) { startRecognition(); return; }
    activeRef.current = true;
    setTranscript("");
    setResponse(null);
    setNotice("");
    setState("ACTIVATING");
    playChime();
    if (!SpeechRecognitionImpl || !navigator.mediaDevices?.getUserMedia) {
      activeRef.current = false;
      setState("PERMISSION_DENIED");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = ensureAudioCtx();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.7;
      source.connect(analyser);
      micAnalyserRef.current = analyser;
      analyserRef.current = analyser;
      startRecognition();
    } catch (e) {
      activeRef.current = false;
      setState(e?.name === "NotAllowedError" ? "PERMISSION_DENIED" : "ERROR");
    }
  }, [ensureAudioCtx, playChime, startRecognition]);

  const stop = useCallback(() => {
    try { recognitionRef.current?.abort(); } catch (e) { /* noop */ }
    recognitionRef.current = null;
    stopTtsSource();
    try { window.speechSynthesis?.cancel(); } catch (e) { /* noop */ }
    setState("IDLE");
  }, [stopTtsSource]);

  // Full cleanup: microphone stream and AudioContext MUST be released.
  const close = useCallback(() => {
    stop();
    activeRef.current = false;
    try { streamRef.current?.getTracks().forEach((t) => t.stop()); } catch (e) { /* noop */ }
    streamRef.current = null;
    micAnalyserRef.current = null;
    analyserRef.current = null;
    try { audioCtxRef.current?.close(); } catch (e) { /* noop */ }
    audioCtxRef.current = null;
  }, [stop]);

  useEffect(() => () => close(), [close]);

  const sendText = useCallback((text) => { handleQuery(text); }, [handleQuery]);

  const replay = useCallback(() => {
    if (lastSpokenRef.current) speak(lastSpokenRef.current);
  }, [speak]);

  const testVoice = useCallback(() => {
    const sample = VOICE_LANGUAGES[settingsRef.current.language]?.sample;
    if (sample) speak(sample);
  }, [speak]);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      mutedRef.current = !m;
      if (mutedRef.current) {
        stopTtsSource();
        try { window.speechSynthesis?.cancel(); } catch (e) { /* noop */ }
        setState((s) => (s === "RESPONDING" ? "IDLE" : s));
      }
      return !m;
    });
  }, [stopTtsSource]);

  const updateSettings = useCallback((partial) => {
    setSettings((s) => {
      const next = { ...s, ...partial };
      saveVoiceSettings(next);
      return next;
    });
  }, []);

  return {
    state, transcript, response, muted, notice, settings, updateSettings,
    toggleMute, supportsVoice: !!SpeechRecognitionImpl,
    analyserRef, speakPulseRef,
    activate, stop, close, sendText, replay, testVoice, restartListening: startRecognition
  };
}
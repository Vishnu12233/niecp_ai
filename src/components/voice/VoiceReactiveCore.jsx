import React, { useEffect, useRef } from "react";

// NIA holographic voice-reactive core, rendered on a single canvas.
// LISTENING reacts to REAL microphone input and RESPONDING reacts to the
// REAL neural-TTS audio — both via a Web Audio AnalyserNode. The pulse
// fallback only applies when browser speech synthesis is used instead.
export default function VoiceReactiveCore({ analyserRef, speakPulseRef, state, size = 300 }) {
  const canvasRef = useRef(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    let raf;
    let t = 0;
    const particles = Array.from({ length: 42 }, () => ({
      a: Math.random() * Math.PI * 2,
      r: 0.62 + Math.random() * 0.3,
      s: 0.0015 + Math.random() * 0.004,
      o: 0.15 + Math.random() * 0.5
    }));
    const freq = new Uint8Array(128);
    const timeData = new Uint8Array(512);

    function draw() {
      t += 0.016;
      const st = stateRef.current;
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const base = Math.min(w, h) * 0.16;
      let level = 0.1 + Math.sin(t * 0.9) * 0.04;
      const analyser = analyserRef?.current;
      const liveAudio = (st === "LISTENING" || st === "RESPONDING") && analyser;

      if (liveAudio) {
        // Real audio amplitude — microphone when listening, TTS when speaking
        analyser.getByteTimeDomainData(timeData);
        let sum = 0;
        for (let i = 0; i < timeData.length; i += 4) {
          const v = (timeData[i] - 128) / 128;
          sum += v * v;
        }
        level = Math.min(1, Math.sqrt(sum / (timeData.length / 4)) * 3);
      } else if (st === "RESPONDING") {
        // Fallback visuals when browser speech synthesis is speaking
        if ((speakPulseRef?.current || 0) > 0.01) speakPulseRef.current *= 0.9;
        level = 0.25 + (speakPulseRef?.current || 0) * 0.5;
      } else if (st === "ACTIVATING") {
        level = 0.15 + (Math.sin(t * 6) + 1) * 0.12;
      } else if (st === "PROCESSING") {
        level = 0.28 + Math.sin(t * 3) * 0.06;
      }

      ctx.clearRect(0, 0, w, h);

      // Glowing core
      const cr = base * (1 + level * 0.55);
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, cr * 2.2);
      grad.addColorStop(0, "rgba(224,255,255,0.95)");
      grad.addColorStop(0.25, `rgba(34,211,238,${0.35 + level * 0.4})`);
      grad.addColorStop(0.6, "rgba(14,116,144,0.18)");
      grad.addColorStop(1, "rgba(8,20,40,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, cr * 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(240,253,255,0.9)";
      ctx.shadowColor = "rgba(34,211,238,0.9)";
      ctx.shadowBlur = 30 * (0.5 + level);
      ctx.beginPath();
      ctx.arc(cx, cy, cr * 0.38, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Real audio frequency bars (microphone while listening, TTS while speaking)
      if (liveAudio) {
        analyser.getByteFrequencyData(freq);
        const bars = 72;
        for (let i = 0; i < bars; i++) {
          const v = freq[Math.floor((i * freq.length) / (bars * 2))] / 255;
          const len = base * 0.5 + v * base * 1.1;
          const ang = (i / bars) * Math.PI * 2 + t * 0.15;
          ctx.strokeStyle = `rgba(34,211,238,${0.25 + v * 0.6})`;
          ctx.lineWidth = 2 * dpr;
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(ang) * base * 1.75, cy + Math.sin(ang) * base * 1.75);
          ctx.lineTo(cx + Math.cos(ang) * (base * 1.75 + len * 0.4), cy + Math.sin(ang) * (base * 1.75 + len * 0.4));
          ctx.stroke();
        }
      }

      // Rotating holographic rings
      const ringSpeed = st === "ACTIVATING" || st === "PROCESSING" ? 2.2 : st === "LISTENING" || st === "RESPONDING" ? 1.1 : 0.35;
      [1.45, 1.9].forEach((rr, idx) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(t * ringSpeed * (idx % 2 ? -0.7 : 1));
        ctx.strokeStyle = `rgba(103,232,249,${0.35 + level * 0.3})`;
        ctx.lineWidth = 1.2 * dpr;
        ctx.setLineDash([base * 0.22, base * 0.18]);
        ctx.beginPath();
        ctx.arc(0, 0, base * rr, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        ctx.setLineDash([]);
      });

      // Particles
      particles.forEach((p) => {
        p.a += p.s * (1 + level * 2);
        const pr = base * (p.r + level * 0.18);
        ctx.fillStyle = `rgba(165,243,252,${p.o * (0.3 + level)})`;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(p.a) * pr, cy + Math.sin(p.a) * pr, 1.6 * dpr, 0, Math.PI * 2);
        ctx.fill();
      });

      // Processing scan line
      if (st === "PROCESSING") {
        const sy = cy + Math.sin(t * 2.2) * base * 1.2;
        ctx.strokeStyle = "rgba(103,232,249,0.5)";
        ctx.lineWidth = 1 * dpr;
        ctx.beginPath();
        ctx.moveTo(cx - base * 1.6, sy);
        ctx.lineTo(cx + base * 1.6, sy);
        ctx.stroke();
      }

      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(raf);
  }, [size, analyserRef, speakPulseRef]);

  return <canvas ref={canvasRef} style={{ width: size, height: size }} className="max-w-full" aria-hidden="true" />;
}
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';

// NIA Text-to-Speech — high-quality neural TTS via OpenAI. Server-side only:
// the API key never reaches the frontend. Browser speechSynthesis remains a
// client-side fallback; this function is NIA's primary voice engine.
// Supports Tamil (ta-IN), English (en-IN), Hindi (hi-IN), Marathi (mr-IN).

const VOICE_IDS = { female: 'shimmer', male: 'echo' };
const SPEEDS = [0.9, 0.95, 1.0];
const LANGS = ['ta-IN', 'en-IN', 'hi-IN', 'mr-IN'];

const NIA_INSTRUCTIONS = 'You are NIA, a warm, professional, calm and clear AI regulatory assistant for Indian businesses. Speak with natural pronunciation in the given language, clear syllable separation, and a gentle, unhurried pace. Pause briefly between sentences. Never sound robotic, rushed, aggressive, or child-like.';

// Pronunciation normalization: remove code blocks, URLs, emojis, markdown
// symbols and excess punctuation before the text reaches the TTS engine.
function sanitizeForSpeech(input) {
  return String(input)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/\p{Extended_Pictographic}/gu, ' ')
    .replace(/[*_#`~>\[\]{}|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function toBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const text = sanitizeForSpeech(String(body?.text || '')).slice(0, 1500);
    if (!text) return Response.json({ error: 'Text required' }, { status: 400 });
    const language = LANGS.includes(body?.language) ? body.language : 'en-IN';
    const voice = body?.voice === 'male' ? 'male' : 'female';
    const speedNum = Number(body?.speed);
    const speed = SPEEDS.includes(speedNum) ? speedNum : 0.95;

    const apiKey = secrets.get('OPENAI_API_KEY');
    if (!apiKey) return Response.json({ error: 'tts_unavailable' }, { status: 503 });

    // Primary: gpt-4o-mini-tts (steerable personality via instructions).
    // Secondary: tts-1 (neural, no instructions param) — used if the primary
    // model is rate-limited or unavailable for this key.
    const attempts = [
      {
        model: 'gpt-4o-mini-tts',
        instructions: NIA_INSTRUCTIONS
      },
      {
        model: 'tts-1'
      }
    ];
    let audioBuffer = null;
    let lastDetail = 'no_response';
    for (const attempt of attempts) {
      const resp = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: attempt.model,
          voice: VOICE_IDS[voice],
          input: text,
          speed,
          response_format: 'mp3',
          ...(attempt.instructions ? { instructions: attempt.instructions } : {})
        })
      });
      if (resp.ok) { audioBuffer = await resp.arrayBuffer(); break; }
      lastDetail = String(resp.status) + ': ' + (await resp.text()).slice(0, 300);
    }
    if (!audioBuffer) {
      // Middle tier: platform neural TTS (high-quality multilingual) — keeps
      // NIA's voice premium even when the OpenAI account is out of credits.
      try {
        const speech = await base44.asServiceRole.integrations.Core.GenerateSpeech({
          text,
          voice: voice === 'male' ? 'storm' : 'honey',
          language_code: language.split('-')[0]
        });
        if (speech?.url) {
          return Response.json({
            url: speech.url, language, voice, speed, status: 'success', engine: 'platform_tts'
          });
        }
      } catch (e) { /* fall through */ }
      return Response.json({ error: 'tts_unavailable', detail: lastDetail }, { status: 502 });
    }
    return Response.json({
      audio: toBase64(audioBuffer),
      format: 'mp3',
      language,
      voice,
      speed,
      status: 'success',
      engine: 'openai'
    });
  } catch (error) {
    return Response.json({ error: 'tts_unavailable' }, { status: 500 });
  }
}
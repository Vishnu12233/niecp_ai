import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';

// NIA AI Brain — project-aware regulatory assistant. OpenAI (server-side,
// existing OPENAI_API_KEY secret) is the primary engine; Base44 InvokeLLM is
// the fallback, then a deterministic answer. Accepts {message} (voice) or
// {question} (text), plus {language, history, context}.
// Identifies the EXACT regulatory subject and answers only about it.
// Never invents legal requirements; answers are short and speech-friendly.

const ACTION_TYPES = ['view_approvals', 'check_documents', 'view_critical_path', 'view_applications', 'view_government', 'none'];

const LANGUAGE_RULES = {
  'en-IN': 'Respond in natural Indian English.',
  'ta-IN': 'Respond in natural Tamil script (தமிழ்) — never Tanglish/romanized Tamil. Technical terms like GST, PAN, NIA, NIECP-AI, Compliance, Dashboard may stay in their standard form.',
  'hi-IN': 'Respond in natural Hindi (Devanagari). Technical terms like GST, PAN, NIA, NIECP-AI may stay in their standard form.',
  'mr-IN': 'Respond in natural Marathi (Devanagari). Technical terms like GST, PAN, NIA, NIECP-AI may stay in their standard form.'
};

function buildPrompt(q, ctx, language, history) {
  const approvalsText = (ctx.approvals || []).map((a) =>
    `- ${a.approval_name} (${a.authority}): ${a.status}. Triggered by ${a.triggered_factors?.join(', ') || 'n/a'}. Document readiness ${a.readiness ?? 'n/a'}%.`
  ).join('\n');
  const docsText = (ctx.documents || []).map((d) =>
    `- ${d.document_name} for ${d.approval_name}: ${d.status || 'missing'}`
  ).join('\n');
  const blockersText = (ctx.blockers || []).map((b) => `- ${b.document_name} (${b.status}) for ${b.approval_name}`).join('\n');
  const appsText = (ctx.applications || []).map((a) =>
    `- ${a.approval_name}: ${a.status} via ${a.integration_mode}`
  ).join('\n');
  const historyText = (history || []).slice(-6).map((m) => `${m.role === 'user' ? 'User' : 'NIA'}: ${m.text}`).join('\n');

  return `You are NIA (NIECP-AI Assistant), an AI regulatory assistant for Indian businesses.
Answer the user's question using ONLY the project context below. Do not invent legal requirements, government facts, fees, timelines or procedures.
First identify the EXACT regulatory subject of the question (for example: boiler, water discharge, fire safety, factory licensing, chemical storage, labour, electrical, waste management, MSME). Answer ONLY about that subject — never return a list of unrelated approvals.
Use the conversation history to resolve follow-up questions (e.g. "documents?" refers to the previous subject).
Ask a clarification ONLY if that specific subject genuinely requires missing information (e.g. boiler usage unknown for a boiler question). Never ask unrelated questions.
If the context does not contain enough verified information, say honestly that the requirement could not be verified from the available sources and advise confirming with the concerned government department or official portal.
The answer will be SPOKEN ALOUD, so keep it short: 1–3 short spoken sentences, plain text only, no markdown, emojis or URLs. Natural pauses between short sentences.
Language rule: ${LANGUAGE_RULES[language] || LANGUAGE_RULES['en-IN']}

PROJECT CONTEXT
Business: ${ctx.name || 'N/A'}
Industry: ${ctx.industry || 'N/A'} / ${ctx.sub_industry || 'N/A'}
Location: ${ctx.state || 'N/A'}, ${ctx.city || 'N/A'}
Stage: ${ctx.stage || 'N/A'}
Overall readiness: ${typeof ctx.readiness === 'number' ? ctx.readiness + '%' : 'N/A'}

APPLICABLE APPROVALS:
${approvalsText || 'None identified yet.'}

DOCUMENTS:
${docsText || 'None uploaded yet.'}

CRITICAL BLOCKERS:
${blockersText || 'None.'}

APPLICATIONS:
${appsText || 'None yet.'}

NEXT BEST ACTION: ${ctx.nextBestAction || 'N/A'}
GOVERNMENT DATA LINKED: ${JSON.stringify(ctx.government_data || {}).slice(0, 800)}

CONVERSATION HISTORY (most recent last):
${historyText || 'None.'}

USER QUESTION: ${q}`;
}

async function askOpenAI(prompt, apiKey) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.4,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You are NIA, a regulatory assistant. Respond ONLY with a JSON object: { "answer": string (short, spoken-friendly), "intent": string, "subject": string (the exact regulatory subject), "sources": string[], "actions": [{ "type": one of ' + ACTION_TYPES.join(', ') + ', "label": string }] }.'
        },
        { role: 'user', content: prompt }
      ]
    })
  });
  if (!res.ok) throw new Error('openai_failed');
  const data = await res.json();
  return JSON.parse(data.choices[0].message.content);
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { message, question, history, context } = body || {};
    const q = String(message || question || '').slice(0, 2000);
    if (!q) return Response.json({ error: 'Message required' }, { status: 400 });
    const language = LANGUAGE_RULES[body?.language] ? body.language : 'en-IN';
    const ctx = context || {};
    const prompt = buildPrompt(q, ctx, language, history);

    let parsed = null;
    const apiKey = secrets.get('OPENAI_API_KEY');
    if (apiKey) {
      try { parsed = await askOpenAI(prompt, apiKey); } catch (e) { parsed = null; }
    }
    let engine = 'openai';
    if (!parsed) {
      const schema = {
        type: 'object',
        properties: {
          answer: { type: 'string' },
          intent: { type: 'string' },
          subject: { type: 'string' },
          sources: { type: 'array', items: { type: 'string' } },
          actions: {
            type: 'array',
            items: {
              type: 'object',
              properties: { type: { type: 'string', enum: ACTION_TYPES }, label: { type: 'string' } },
              required: ['type', 'label']
            }
          }
        },
        required: ['answer', 'intent', 'subject', 'sources', 'actions']
      };
      try {
        parsed = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt, response_json_schema: schema, model: 'gemini_3_flash'
        });
        engine = 'invokeLLM';
      } catch (e) { parsed = null; }
    }

    if (parsed?.answer) {
      const actions = (parsed.actions || [])
        .filter((a) => ACTION_TYPES.includes(a?.type))
        .slice(0, 3);
      return Response.json({
        answer: String(parsed.answer),
        message: String(parsed.answer),
        intent: parsed.intent || 'general',
        subject: parsed.subject || 'general',
        sources: parsed.sources || [],
        actions,
        status: 'success',
        engine
      });
    }

    const answer = 'AI assistance is currently unavailable. Based on your project data: ' +
      `${(ctx.approvals || []).length} potentially applicable approvals, ${(ctx.blockers || []).length} critical blockers, ` +
      `overall readiness ${typeof ctx.readiness === 'number' ? ctx.readiness + '%' : 'unknown'}. ` +
      `Next best action: ${ctx.nextBestAction || 'complete your project profile'}. ` +
      'Please confirm details with the relevant authority.';
    return Response.json({
      answer, message: answer, intent: 'fallback', subject: 'general',
      sources: [], actions: [], status: 'fallback', engine: 'none'
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
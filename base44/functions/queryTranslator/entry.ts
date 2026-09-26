import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// NIECP Government Query Translator — explains a government communication
// (synthetic NIECP demo query or user-entered real query) in plain language.
// It only explains the text provided — it never invents government queries,
// requirements or deadlines.

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const query = String(body?.query || '').slice(0, 3000);
    const approvalName = String(body?.approval_name || '').slice(0, 200);
    const authority = String(body?.authority || '').slice(0, 200);
    if (!query) return Response.json({ error: 'Query text required' }, { status: 400 });

    const prompt = `You are NIECP-AI, a regulatory assistant for Indian businesses.
A business received the following communication regarding their "${approvalName}" application, attributed to "${authority}".
Explain it in plain language for a non-expert business owner. Use ONLY the text provided below — never invent government requirements, deadlines or facts. If something cannot be determined from the text, say so honestly.

COMMUNICATION:
"""${query}"""`;

    const schema = {
      type: 'object',
      properties: {
        plain_explanation: { type: 'string' },
        what_is_missing: { type: 'string' },
        what_is_needed: { type: 'string' },
        recommended_action: { type: 'string' },
        response_draft: { type: 'string' }
      },
      required: ['plain_explanation', 'what_is_missing', 'what_is_needed', 'recommended_action', 'response_draft']
    };

    try {
      const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: schema,
        model: 'gemini_3_flash'
      });
      return Response.json({
        translation: res,
        status: 'success',
        disclaimer: 'AI-generated explanation — verify against the official communication.'
      });
    } catch (e) {
      return Response.json({
        translation: null,
        status: 'fallback',
        disclaimer: 'AI translation is unavailable right now. Read the original communication carefully and respond with the details it asks for.'
      });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
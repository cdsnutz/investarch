import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Hugging Face Inference Providers, run with the signed-in app user's own connector token.
const HF_CONNECTOR_ID = '6af0a4ce163a9d18edd2e5f1';
const ROUTER = 'https://router.huggingface.co/v1/chat/completions';
const DEFAULT_MODEL = 'meta-llama/Llama-3.1-8B-Instruct';
const MODELS = ['meta-llama/Llama-3.1-8B-Instruct', 'mistralai/Mistral-Small-24B-Instruct-2501'];
const SECTION_LABEL = {
  executive_summary: 'Executive Summary',
  value_proposition: 'Value Proposition',
  strategic_edge: 'Strategic Edge',
  market_analysis: 'Market Analysis',
  financial_forecast: 'Forecast Rationale',
  investor_narrative: 'Investor Narrative'
};

async function chat(accessToken, model, messages, maxTokens) {
  const res = await fetch(ROUTER, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature: 0.4 }),
    signal: AbortSignal.timeout(55000)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error('HF inference failed', res.status, JSON.stringify(data).slice(0, 400));
    const detail = data?.error?.message || data?.error || `Hugging Face returned ${res.status}`;
    throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
  }
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('The model returned no text');
  return text.trim();
}

function parseJudgement(text) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end > start) {
    try {
      const o = JSON.parse(text.slice(start, end + 1));
      const raw = Number(o.signal_score ?? o.score);
      const note = o.note ?? o.reason;
      if (Number.isFinite(raw)) return { score: raw, note: typeof note === 'string' ? note : '' };
    } catch { /* fall through to plain-text parsing */ }
  }
  const m = text.match(/\b(10|[1-9])\b/);
  return { score: m ? Number(m[1]) : null, note: text.replace(/\s+/g, ' ').slice(0, 240) };
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = body.action;
    if (!['status', 'rewrite_section', 'score_signal'].includes(action)) {
      return Response.json({ error: 'Unknown action' }, { status: 400 });
    }

    let accessToken;
    try {
      ({ accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection(HF_CONNECTOR_ID));
    } catch (e) {
      console.error('HF connector not connected for app user', e?.message);
      return Response.json({ error: 'Connect your Hugging Face account first.', code: 'not_connected' }, { status: 409 });
    }
    if (!accessToken) {
      return Response.json({ error: 'Connect your Hugging Face account first.', code: 'not_connected' }, { status: 409 });
    }

    const model = MODELS.includes(body.model) ? body.model : DEFAULT_MODEL;

    if (action === 'status') {
      return Response.json({ connected: true, model, models: MODELS });
    }

    if (action === 'rewrite_section') {
      const field = body.field;
      if (!SECTION_LABEL[field]) return Response.json({ error: 'Unknown section' }, { status: 400 });
      if (!body.projectId) return Response.json({ error: 'projectId is required' }, { status: 400 });

      const project = await base44.entities.Project.get(body.projectId).catch((e) => (e.status === 404 ? null : Promise.reject(e)));
      if (!project) return Response.json({ error: 'Not found' }, { status: 404 });

      const current = typeof project[field] === 'string' ? project[field].trim() : '';
      if (!current) return Response.json({ error: 'This section is empty, so there is nothing to rewrite.' }, { status: 400 });

      const context = [
        `Company: ${project.company_name || 'unnamed'}`,
        project.industry ? `Industry: ${project.industry}` : '',
        project.value_proposition ? `Value proposition: ${project.value_proposition.slice(0, 700)}` : ''
      ].filter(Boolean).join('\n');

      const text = await chat(accessToken, model, [
        {
          role: 'system',
          content: 'You rewrite one section of a professional investment dossier. Keep every fact, number, and claim that is already present and add none that are not. Return only the rewritten section body: no heading, no preamble, no commentary, no markdown fences. Institutional register: plain declarative sentences, specific nouns, no filler, no hedging, no rhetorical questions.'
        },
        {
          role: 'user',
          content: `CONTEXT\n${context}\n\nSECTION: ${SECTION_LABEL[field]}\n${current.slice(0, 6000)}\n\nRewrite this section tighter and sharper. Same substance, better order and precision.`
        }
      ], 900);

      return Response.json({ text, model });
    }

    if (!body.seedId) return Response.json({ error: 'seedId is required' }, { status: 400 });
    const seed = await base44.entities.MarketSeed.get(body.seedId).catch((e) => (e.status === 404 ? null : Promise.reject(e)));
    if (!seed) return Response.json({ error: 'Not found' }, { status: 404 });

    const answer = await chat(accessToken, model, [
      {
        role: 'system',
        content: 'You are a conviction analyst. Judge an investment signal and reply with strict JSON only: {"signal_score": <integer 1-10>, "note": "<one sentence, max 200 characters, naming the strongest reason for the score>"}. No prose outside the JSON.'
      },
      {
        role: 'user',
        content: `TITLE: ${(seed.title || '').slice(0, 300)}\nVECTOR: ${(seed.vector || 'unclassified').slice(0, 120)}\nSOURCE: ${(seed.source || 'unknown').slice(0, 300)}\nTHESIS: ${(seed.thesis || 'no thesis supplied').slice(0, 2000)}\n\nScore how actionable and defensible this opportunity is for a sovereign IP holding company.`
      }
    ], 300);

    const judged = parseJudgement(answer);
    if (judged.score === null) {
      return Response.json({ error: 'The model did not return a usable score. Try again.' }, { status: 502 });
    }
    const signal_score = Math.max(1, Math.min(10, Math.round(judged.score)));

    return Response.json({ signal_score, note: judged.note.slice(0, 400), model });
  } catch (error) {
    console.error('hfInference failed', error?.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
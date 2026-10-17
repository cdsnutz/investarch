import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const ALLOWED_FIELDS = ['title', 'vector', 'source', 'signal_score', 'thesis', 'status'];
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60_000;

// Fixed-window rate limiter (per caller key), same pattern as validateRegistrationKey.
const rateBuckets = new Map();
function rateLimit(key) {
  const now = Date.now();
  const bucket = rateBuckets.get(key);
  if (!bucket || now - bucket.windowStart >= RATE_LIMIT_WINDOW_MS) {
    rateBuckets.set(key, { windowStart: now, count: 1 });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= RATE_LIMIT_MAX;
}

function reject(message, status) {
  return Response.json({ error: message }, { status });
}

export default async function(req) {
  try {
    if (req.method !== 'POST') return reject('Method not allowed. Use POST.', 405);

    const base44 = createClientFromRequest(req);
    let body;
    try {
      body = await req.json();
    } catch {
      return reject('Request body must be valid JSON.', 400);
    }
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      return reject('Payload must be a JSON object.', 400);
    }

    const sharedKey = process.env.MARKET_HUNTER_KEY;
    const providedKey =
      req.headers.get('x-market-hunter-key') || (typeof body.auth_key === 'string' ? body.auth_key : null);
    const hasValidKey = Boolean(sharedKey && providedKey && providedKey === sharedKey);

    let callerKey;
    let authed = false;
    let signedIn = false;
    if (hasValidKey) {
      // Rate-limit key: hash of the secret, never the secret itself.
      const digest = new TextEncoder().encode(sharedKey);
      const hash = await crypto.subtle.digest('SHA-256', digest);
      callerKey = 'key:' + Array.from(new Uint8Array(hash).slice(0, 8)).map((b) => b.toString(16).padStart(2, '0')).join('');
      authed = true;
    } else {
      let user = null;
      try {
        user = await base44.auth.me();
      } catch {
        user = null;
      }
      signedIn = Boolean(user);
      if (user && user.role === 'admin') {
        callerKey = 'user:' + user.id;
        authed = true;
      }
    }

    if (!authed) {
      if (providedKey && !sharedKey) {
        console.error('createMarketSeed: MARKET_HUNTER_KEY secret is not configured; shared-key access unavailable.');
      }
      return reject('Unauthorized. Provide a valid shared key header (x-market-hunter-key) or log in as an admin.', providedKey || signedIn ? 403 : 401);
    }

    if (!rateLimit(callerKey)) {
      return reject('Rate limit exceeded: 20 calls per minute per caller.', 429);
    }

    // Strict payload validation: reject unknown/passthrough fields.
    const rejected = Object.keys(body).filter((k) => !ALLOWED_FIELDS.includes(k) && k !== 'auth_key');
    if (rejected.length > 0) {
      return reject(`Unallowed payload fields: ${rejected.join(', ')}.`, 400);
    }

    const str = (v) => (typeof v === 'string' ? v.trim() : null);

    const title = str(body.title);
    if (!title) return reject('title is required.', 400);
    if (title.length > 200) return reject('title must be at most 200 characters.', 400);

    const vector = body.vector === undefined ? '' : str(body.vector);
    if (vector === null) return reject('vector must be a string.', 400);
    if (vector.length > 200) return reject('vector must be at most 200 characters.', 400);

    const source = body.source === undefined ? '' : str(body.source);
    if (source === null) return reject('source must be a string.', 400);
    if (source.length > 500) return reject('source must be at most 500 characters.', 400);

    const signal_score = body.signal_score === undefined ? null : body.signal_score;
    if (signal_score !== null && (!Number.isInteger(signal_score) || signal_score < 1 || signal_score > 10)) {
      return reject('signal_score must be an integer between 1 and 10.', 400);
    }

    const thesis = body.thesis === undefined ? '' : str(body.thesis);
    if (thesis === null) return reject('thesis must be a string.', 400);
    if (thesis.length > 2000) return reject('thesis must be at most 2000 characters.', 400);

    if (body.status !== 'New') return reject('status must be exactly "New".', 400);

    // Idempotency: same title within the last 7 days is a duplicate, not a new seed.
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const existing = await base44.asServiceRole.entities.MarketSeed.filter(
      { title, created_date: { $gte: since } },
      { sort: '-created_date', limit: 1 }
    );
    const duplicate = existing && existing.items && existing.items.length > 0 ? existing.items[0] : null;
    if (duplicate) {
      return Response.json({ seed: duplicate, duplicate: true });
    }

    const seed = await base44.asServiceRole.entities.MarketSeed.create({
      title,
      vector,
      source,
      ...(signal_score === null ? {} : { signal_score }),
      thesis,
      status: 'New'
    });

    try {
      await base44.asServiceRole.entities.ActivityEvent.create({
        action: 'seed.create',
        detail: `actor=market-hunter seed_id=${seed.id} title="${title.slice(0, 100)}"`,
        timestamp: new Date().toISOString()
      });
    } catch (auditError) {
      console.error('createMarketSeed: audit write to ActivityEvent failed:', auditError && auditError.message);
    }

    return Response.json({ seed });
  } catch (error) {
    console.error('createMarketSeed failed', error);
    return reject(error.message || 'Internal error', 500);
  }
}
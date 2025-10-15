export type SourceCheck = {
  url: string;
  ok: boolean;
  status?: number;
  finalUrl?: string;
  error?: string;
};

export type SourceValidationResult = {
  results: SourceCheck[];
  valid: string[];
  invalid: string[];
};

function isHttpUrl(u: string) {
  try {
    const parsed = new URL(u);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

async function tryHead(url: string, timeoutMs: number): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { method: 'HEAD', redirect: 'follow', signal: ctrl.signal, headers: { 'user-agent': 'RankoraAI/1.0 (+pdf-verifier)' } });
  } finally {
    clearTimeout(t);
  }
}

async function tryGet(url: string, timeoutMs: number): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { method: 'GET', redirect: 'follow', signal: ctrl.signal, headers: { 'user-agent': 'RankoraAI/1.0 (+pdf-verifier)' } });
  } finally {
    clearTimeout(t);
  }
}

export async function validateSources(urls: string[], timeoutMs = 8000): Promise<SourceValidationResult> {
  const unique = Array.from(new Set((urls || []).filter(Boolean)));
  const checks: SourceCheck[] = [];

  for (const url of unique) {
    if (!isHttpUrl(url)) {
      checks.push({ url, ok: false, error: 'invalid_url' });
      continue;
    }
    try {
      let res = await tryHead(url, timeoutMs);
      if (res.status === 405 || res.status === 501) {
        // some servers do not allow HEAD
        res = await tryGet(url, timeoutMs);
      } else if (res.status >= 400) {
        // fallback to GET for better signal
        const g = await tryGet(url, timeoutMs);
        if (g.ok) res = g; else res = g;
      }
      const finalUrl = res.url;
      const ok = res.ok && res.status >= 200 && res.status < 400;
      checks.push({ url, ok, status: res.status, finalUrl });
    } catch (e: any) {
      checks.push({ url, ok: false, error: e?.message || 'fetch_error' });
    }
  }

  const valid = checks.filter(c => c.ok).map(c => c.url);
  const invalid = checks.filter(c => !c.ok).map(c => c.url);
  return { results: checks, valid, invalid };
}

import { describe, expect, it } from 'vitest';

import { GET, POST } from './route';

function makeJsonRequest(body: unknown, headers?: Record<string, string>) {
  return new Request('http://localhost/api/v1/sources', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(headers || {}),
    },
    body: JSON.stringify(body),
  }) as any;
}

describe('GET /api/v1/sources', () => {
  it('includes Algora as an active source', async () => {
    const res = await GET({} as any);
    const json = await res.json();
    const algora = json.data.sources.find((s: any) => s.type === 'algora');

    expect(json.success).toBe(true);
    expect(algora).toBeTruthy();
    expect(algora.status).toBe('active');
    expect(algora.config.repositories.length).toBeGreaterThan(0);
  });
});

describe('POST /api/v1/sources', () => {
  it('accepts Algora source configuration in development mode', async () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const req = makeJsonRequest({
      type: 'algora',
      config: {
        repositories: ['foo/bar', 'baz/qux'],
        labels: ['💎 Bounty', 'algora'],
      },
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.type).toBe('algora');
    expect(json.data.config.repositories).toEqual(['foo/bar', 'baz/qux']);

    process.env.NODE_ENV = prev;
  });

  it('still rejects unsupported source types', async () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const req = makeJsonRequest({
      type: 'opencollective',
      config: {
        repositories: ['foo/bar'],
      },
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);

    process.env.NODE_ENV = prev;
  });
});

import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import {
  isPublicInternetAddress,
  safeFetchText,
  SafeTextFetchError,
  type SafeTextFetchDependencies,
} from '../../src/backend/dataSources/safeTextFetch.js';
import {
  extractWebsiteText,
  websiteScraper,
} from '../../src/backend/dataSources/websiteScraper.js';

const publicAddress = { address: '93.184.216.34', family: 4 as const };

function createResponse(
  statusCode: number,
  headers: Record<string, string>,
  chunks: ReadonlyArray<string | Buffer> = [],
) {
  const response = Readable.from(chunks);
  return Object.assign(response, { headers, statusCode });
}

function createDependencies(
  overrides: Partial<SafeTextFetchDependencies> = {},
): SafeTextFetchDependencies {
  return {
    lookup: async () => [publicAddress],
    request: async () => {
      throw new Error('Unexpected outbound request');
    },
    ...overrides,
  };
}

async function expectSafeFetchError(
  promise: Promise<unknown>,
  code: SafeTextFetchError['code'],
) {
  await assert.rejects(promise, (error: unknown) => {
    assert.ok(error instanceof SafeTextFetchError);
    assert.equal(error.code, code);
    return true;
  });
}

assert.equal(isPublicInternetAddress('8.8.8.8'), true);
assert.equal(isPublicInternetAddress('2606:4700:4700::1111'), true);
for (const address of [
  '0.0.0.0',
  '10.0.0.1',
  '100.64.0.1',
  '127.0.0.1',
  '169.254.169.254',
  '172.16.0.1',
  '192.168.1.1',
  '224.0.0.1',
  '::',
  '::1',
  '::ffff:127.0.0.1',
  'fd00:ec2::254',
  'fe80::1',
  'ff02::1',
  '4000::1',
]) {
  assert.equal(isPublicInternetAddress(address), false, address);
}

{
  let lookupCalls = 0;
  const dependencies = createDependencies({
    lookup: async () => {
      lookupCalls += 1;
      return [publicAddress];
    },
  });

  await expectSafeFetchError(
    safeFetchText('file:///etc/passwd', {}, dependencies),
    'UNSUPPORTED_PROTOCOL',
  );
  await expectSafeFetchError(
    safeFetchText('https://user:secret@example.com/', {}, dependencies),
    'URL_CREDENTIALS_FORBIDDEN',
  );
  await expectSafeFetchError(
    safeFetchText('http://localhost/admin', {}, dependencies),
    'HOST_BLOCKED',
  );
  assert.equal(lookupCalls, 0);
}

for (const url of [
  'http://127.0.0.1/admin',
  'http://127.1/admin',
  'http://2130706433/admin',
  'http://0x7f000001/admin',
  'http://169.254.169.254/latest/meta-data/',
  'http://[::1]/admin',
  'http://[::ffff:127.0.0.1]/admin',
  'http://[fd00:ec2::254]/latest/meta-data/',
]) {
  await expectSafeFetchError(
    safeFetchText(url, {}, createDependencies()),
    'HOST_BLOCKED',
  );
}

{
  let requestCalls = 0;
  const privateDnsDependencies = createDependencies({
    lookup: async () => [{ address: '10.20.30.40', family: 4 }],
    request: async () => {
      requestCalls += 1;
      return createResponse(200, { 'content-type': 'text/html' }, ['unsafe']);
    },
  });
  await expectSafeFetchError(
    safeFetchText('https://internal.example/', {}, privateDnsDependencies),
    'HOST_BLOCKED',
  );
  assert.equal(requestCalls, 0);

  const mixedDnsDependencies = createDependencies({
    lookup: async () => [publicAddress, { address: '127.0.0.1', family: 4 }],
  });
  await expectSafeFetchError(
    safeFetchText('https://mixed.example/', {}, mixedDnsDependencies),
    'HOST_BLOCKED',
  );
}

{
  let requestCalls = 0;
  const dependencies = createDependencies({
    request: async (_url, address) => {
      requestCalls += 1;
      assert.deepEqual(address, publicAddress);
      return createResponse(302, { location: 'http://169.254.169.254/latest/meta-data/' });
    },
  });

  await expectSafeFetchError(
    safeFetchText('https://public.example/start', {}, dependencies),
    'HOST_BLOCKED',
  );
  assert.equal(requestCalls, 1);
}

{
  let requestCalls = 0;
  const dependencies = createDependencies({
    request: async () => {
      requestCalls += 1;
      return createResponse(302, { location: '/next' });
    },
  });
  await expectSafeFetchError(
    safeFetchText('https://public.example/start', { maxRedirects: 1 }, dependencies),
    'TOO_MANY_REDIRECTS',
  );
  assert.equal(requestCalls, 2);
}

{
  const response = createResponse(
    200,
    { 'content-type': 'text/html; charset=utf-8' },
    [Buffer.from('1234'), Buffer.from('5678')],
  );
  const dependencies = createDependencies({
    request: async () => response,
  });

  await expectSafeFetchError(
    safeFetchText('https://public.example/large', { maxBytes: 7 }, dependencies),
    'RESPONSE_TOO_LARGE',
  );
  assert.equal(response.destroyed, true);
}

{
  const dependencies = createDependencies({
    request: async () => createResponse(
      200,
      { 'content-type': 'application/octet-stream' },
      ['binary'],
    ),
  });
  await expectSafeFetchError(
    safeFetchText('https://public.example/file', {}, dependencies),
    'CONTENT_TYPE_UNSUPPORTED',
  );
}

{
  const response = Object.assign(
    new Readable({
      read() {
        this.destroy(new Error('remote stream failed'));
      },
    }),
    {
      headers: { 'content-type': 'text/html' },
      statusCode: 200,
    },
  );
  const dependencies = createDependencies({
    request: async () => response,
  });
  await expectSafeFetchError(
    safeFetchText('https://public.example/failure', {}, dependencies),
    'NETWORK_ERROR',
  );
}

{
  const dependencies = createDependencies({
    request: async (_url, _address, signal) => new Promise<never>((_resolve, reject) => {
      const onAbort = () => reject(new Error('aborted'));
      if (signal.aborted) {
        onAbort();
        return;
      }
      signal.addEventListener('abort', onAbort, { once: true });
    }),
  });
  await expectSafeFetchError(
    safeFetchText('https://slow.example/', { timeoutMs: 20 }, dependencies),
    'TIMEOUT',
  );
}

{
  const dependencies = createDependencies({
    lookup: async () => new Promise<never>(() => undefined),
  });
  await expectSafeFetchError(
    safeFetchText('https://slow-dns.example/', { timeoutMs: 20 }, dependencies),
    'TIMEOUT',
  );
}

{
  const html = '<html><style>.hidden{}</style><body><h1>Example</h1><script>steal()</script><p>Small page.</p></body></html>';
  const dependencies = createDependencies({
    request: async (url, address) => {
      assert.equal(url.hostname, 'public.example');
      assert.deepEqual(address, publicAddress);
      return createResponse(
        200,
        { 'content-type': 'text/html; charset=utf-8' },
        [html.slice(0, 40), html.slice(40)],
      );
    },
  });

  const fetchedHtml = await safeFetchText('https://public.example/page', {}, dependencies);
  assert.equal(fetchedHtml, html);
  assert.equal(extractWebsiteText(fetchedHtml), 'Example Small page.');
}

{
  const logs: string[] = [];
  const originalLog = console.log;
  const originalError = console.error;
  console.log = (...values: unknown[]) => logs.push(values.map(String).join(' '));
  console.error = (...values: unknown[]) => logs.push(values.map(String).join(' '));
  try {
    const result = await websiteScraper.scrapeText(
      'https://user:top-secret@example.com/private?token=query-secret',
    );
    assert.match(result.error || '', /^URL_CREDENTIALS_FORBIDDEN:/);
  } finally {
    console.log = originalLog;
    console.error = originalError;
  }

  const joinedLogs = logs.join('\n');
  assert.match(joinedLogs, /host=example\.com/);
  assert.doesNotMatch(joinedLogs, /top-secret|query-secret|\/private/);
}

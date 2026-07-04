import { lookup as dnsLookup } from 'node:dns/promises';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { BlockList, isIP } from 'node:net';
import type { IncomingHttpHeaders } from 'node:http';
import type { RequestOptions } from 'node:https';

export const DEFAULT_SAFE_FETCH_MAX_BYTES = 512 * 1024;
export const DEFAULT_SAFE_FETCH_MAX_REDIRECTS = 3;
export const DEFAULT_SAFE_FETCH_TIMEOUT_MS = 10_000;

const MAX_DNS_ADDRESSES = 16;
const MAX_SAFE_FETCH_BYTES = 5 * 1024 * 1024;
const MAX_SAFE_FETCH_REDIRECTS = 10;
const MAX_SAFE_FETCH_TIMEOUT_MS = 30_000;
const MAX_URL_LENGTH = 2_048;

export type SafeTextFetchErrorCode =
  | 'INVALID_URL'
  | 'UNSUPPORTED_PROTOCOL'
  | 'URL_CREDENTIALS_FORBIDDEN'
  | 'HOST_BLOCKED'
  | 'DNS_LOOKUP_FAILED'
  | 'DNS_RESULT_INVALID'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'TOO_MANY_REDIRECTS'
  | 'REDIRECT_INVALID'
  | 'HTTP_STATUS_ERROR'
  | 'CONTENT_TYPE_UNSUPPORTED'
  | 'CONTENT_ENCODING_UNSUPPORTED'
  | 'RESPONSE_TOO_LARGE';

export class SafeTextFetchError extends Error {
  readonly code: SafeTextFetchErrorCode;

  constructor(code: SafeTextFetchErrorCode, message: string) {
    super(message);
    this.name = 'SafeTextFetchError';
    this.code = code;
  }
}

export interface SafeTextFetchOptions {
  maxBytes?: number;
  maxRedirects?: number;
  timeoutMs?: number;
}

export interface ResolvedHostAddress {
  address: string;
  family: 4 | 6;
}

interface SafeHttpResponse extends AsyncIterable<Uint8Array | string> {
  destroy(error?: Error): void;
  headers: IncomingHttpHeaders;
  statusCode?: number;
}

export interface SafeTextFetchDependencies {
  lookup(hostname: string): Promise<ReadonlyArray<ResolvedHostAddress>>;
  request(
    url: URL,
    address: ResolvedHostAddress,
    signal: AbortSignal,
  ): Promise<SafeHttpResponse>;
}

const blockedIpv4Addresses = new BlockList();
const blockedIpv6Addresses = new BlockList();
const publicIpv6Addresses = new BlockList();

publicIpv6Addresses.addSubnet('2000::', 3, 'ipv6');

for (const [network, prefix] of [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.88.99.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
] as const) {
  blockedIpv4Addresses.addSubnet(network, prefix, 'ipv4');
}

for (const [network, prefix] of [
  ['::', 128],
  ['::1', 128],
  ['::ffff:0:0', 96],
  ['64:ff9b::', 96],
  ['64:ff9b:1::', 48],
  ['100::', 64],
  ['2001::', 32],
  ['2001:2::', 48],
  ['2001:10::', 28],
  ['2001:20::', 28],
  ['2001:db8::', 32],
  ['2002::', 16],
  ['fc00::', 7],
  ['fec0::', 10],
  ['fe80::', 10],
  ['ff00::', 8],
] as const) {
  blockedIpv6Addresses.addSubnet(network, prefix, 'ipv6');
}

function normalizeHostname(hostname: string) {
  const withoutBrackets = hostname.startsWith('[') && hostname.endsWith(']')
    ? hostname.slice(1, -1)
    : hostname;

  return withoutBrackets.toLowerCase().replace(/\.$/, '');
}

function isBlockedHostname(hostname: string) {
  const normalized = normalizeHostname(hostname);
  return normalized === 'localhost'
    || normalized.endsWith('.localhost')
    || normalized === 'localhost.localdomain';
}

export function isPublicInternetAddress(address: string) {
  const family = isIP(address);
  if (family === 0) {
    return false;
  }

  return family === 4
    ? !blockedIpv4Addresses.check(address, 'ipv4')
    : publicIpv6Addresses.check(address, 'ipv6')
      && !blockedIpv6Addresses.check(address, 'ipv6');
}

function parseOutboundUrl(input: string, invalidCode: SafeTextFetchErrorCode = 'INVALID_URL') {
  if (typeof input !== 'string' || input.length === 0 || input.length > MAX_URL_LENGTH) {
    throw new SafeTextFetchError(invalidCode, 'Outbound URL is invalid');
  }

  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new SafeTextFetchError(invalidCode, 'Outbound URL is invalid');
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new SafeTextFetchError('UNSUPPORTED_PROTOCOL', 'Only HTTP and HTTPS URLs are allowed');
  }
  if (url.username || url.password) {
    throw new SafeTextFetchError('URL_CREDENTIALS_FORBIDDEN', 'URL credentials are not allowed');
  }
  if (!url.hostname) {
    throw new SafeTextFetchError(invalidCode, 'Outbound URL is invalid');
  }

  url.hash = '';
  return url;
}

async function defaultLookup(hostname: string): Promise<ReadonlyArray<ResolvedHostAddress>> {
  const records = await dnsLookup(hostname, { all: true, verbatim: true });
  return records.map(({ address, family }) => ({
    address,
    family: family === 6 ? 6 : 4,
  }));
}

function defaultRequest(
  url: URL,
  address: ResolvedHostAddress,
  signal: AbortSignal,
): Promise<SafeHttpResponse> {
  return new Promise((resolve, reject) => {
    const originalHostname = normalizeHostname(url.hostname);
    const options: RequestOptions = {
      agent: false,
      family: address.family,
      headers: {
        Accept: 'text/html,text/plain,application/xhtml+xml,application/xml;q=0.9,application/json;q=0.8',
        'Accept-Encoding': 'identity',
        Host: url.host,
        'User-Agent': 'WarpalaBot/1.0 (AI Business OS)',
      },
      hostname: address.address,
      method: 'GET',
      path: `${url.pathname}${url.search}`,
      port: url.port || undefined,
      protocol: url.protocol,
      setHost: false,
      signal,
    };

    if (url.protocol === 'https:' && isIP(originalHostname) === 0) {
      options.servername = originalHostname;
    }

    const request = (url.protocol === 'https:' ? httpsRequest : httpRequest)(options, resolve);
    request.once('error', reject);
    request.end();
  });
}

const defaultDependencies: SafeTextFetchDependencies = {
  lookup: defaultLookup,
  request: defaultRequest,
};

function validateIntegerOption(
  value: number,
  name: string,
  maximum: number,
) {
  if (!Number.isInteger(value) || value < 0 || value > maximum) {
    throw new TypeError(`${name} must be an integer between 0 and ${maximum}`);
  }
  return value;
}

function resolveOptions(options: SafeTextFetchOptions) {
  const maxBytes = validateIntegerOption(
    options.maxBytes ?? DEFAULT_SAFE_FETCH_MAX_BYTES,
    'maxBytes',
    MAX_SAFE_FETCH_BYTES,
  );
  const maxRedirects = validateIntegerOption(
    options.maxRedirects ?? DEFAULT_SAFE_FETCH_MAX_REDIRECTS,
    'maxRedirects',
    MAX_SAFE_FETCH_REDIRECTS,
  );
  const timeoutMs = validateIntegerOption(
    options.timeoutMs ?? DEFAULT_SAFE_FETCH_TIMEOUT_MS,
    'timeoutMs',
    MAX_SAFE_FETCH_TIMEOUT_MS,
  );

  if (maxBytes === 0 || timeoutMs === 0) {
    throw new TypeError('maxBytes and timeoutMs must be greater than zero');
  }

  return { maxBytes, maxRedirects, timeoutMs };
}

async function resolvePublicAddress(
  url: URL,
  signal: AbortSignal,
  dependencies: SafeTextFetchDependencies,
) {
  const hostname = normalizeHostname(url.hostname);
  if (isBlockedHostname(hostname)) {
    throw new SafeTextFetchError('HOST_BLOCKED', 'Outbound host is not publicly routable');
  }

  const literalFamily = isIP(hostname);
  const addresses = literalFamily === 0
    ? await new Promise<ReadonlyArray<ResolvedHostAddress>>((resolve, reject) => {
        if (signal.aborted) {
          reject(new Error('Outbound request aborted'));
          return;
        }

        const onAbort = () => reject(new Error('Outbound request aborted'));
        signal.addEventListener('abort', onAbort, { once: true });
        dependencies.lookup(hostname).then(resolve, reject).finally(() => {
          signal.removeEventListener('abort', onAbort);
        });
      })
    : [{ address: hostname, family: literalFamily as 4 | 6 }];

  if (addresses.length === 0 || addresses.length > MAX_DNS_ADDRESSES) {
    throw new SafeTextFetchError('DNS_RESULT_INVALID', 'Outbound host returned an invalid address set');
  }

  for (const resolved of addresses) {
    const actualFamily = isIP(resolved.address);
    if (actualFamily === 0 || actualFamily !== resolved.family) {
      throw new SafeTextFetchError('DNS_RESULT_INVALID', 'Outbound host returned an invalid address');
    }
    if (!isPublicInternetAddress(resolved.address)) {
      throw new SafeTextFetchError('HOST_BLOCKED', 'Outbound host is not publicly routable');
    }
  }

  return addresses[0];
}

function getSingleHeader(headers: IncomingHttpHeaders, name: string) {
  const value = headers[name];
  return Array.isArray(value) ? value[0] : value;
}

function isRedirectStatus(statusCode: number) {
  return statusCode === 301
    || statusCode === 302
    || statusCode === 303
    || statusCode === 307
    || statusCode === 308;
}

function isTextualContentType(value: string | undefined) {
  if (!value) {
    return false;
  }

  const mediaType = value.split(';', 1)[0].trim().toLowerCase();
  return mediaType.startsWith('text/')
    || mediaType === 'application/json'
    || mediaType === 'application/xml'
    || mediaType === 'application/xhtml+xml'
    || mediaType.endsWith('+json')
    || mediaType.endsWith('+xml');
}

function assertSupportedResponse(headers: IncomingHttpHeaders, maxBytes: number) {
  if (!isTextualContentType(getSingleHeader(headers, 'content-type'))) {
    throw new SafeTextFetchError('CONTENT_TYPE_UNSUPPORTED', 'Response content type is not textual');
  }

  const contentEncoding = getSingleHeader(headers, 'content-encoding')?.trim().toLowerCase();
  if (contentEncoding && contentEncoding !== 'identity') {
    throw new SafeTextFetchError(
      'CONTENT_ENCODING_UNSUPPORTED',
      'Compressed responses are not accepted by the bounded text fetcher',
    );
  }

  const contentLength = getSingleHeader(headers, 'content-length');
  if (contentLength && /^\d+$/.test(contentLength) && Number(contentLength) > maxBytes) {
    throw new SafeTextFetchError('RESPONSE_TOO_LARGE', 'Response exceeds the configured byte limit');
  }
}

async function readBoundedBody(response: SafeHttpResponse, maxBytes: number) {
  const chunks: Buffer[] = [];
  let bytesRead = 0;

  for await (const rawChunk of response) {
    const chunk = typeof rawChunk === 'string' ? Buffer.from(rawChunk) : Buffer.from(rawChunk);
    if (chunk.length > maxBytes - bytesRead) {
      response.destroy();
      throw new SafeTextFetchError('RESPONSE_TOO_LARGE', 'Response exceeds the configured byte limit');
    }
    chunks.push(chunk);
    bytesRead += chunk.length;
  }

  return Buffer.concat(chunks, bytesRead).toString('utf8');
}

async function requestText(
  initialUrl: URL,
  maxBytes: number,
  maxRedirects: number,
  signal: AbortSignal,
  dependencies: SafeTextFetchDependencies,
) {
  let currentUrl = initialUrl;

  for (let redirectCount = 0; ; redirectCount += 1) {
    let address: ResolvedHostAddress;
    try {
      address = await resolvePublicAddress(currentUrl, signal, dependencies);
    } catch (error) {
      if (error instanceof SafeTextFetchError) {
        throw error;
      }
      throw new SafeTextFetchError('DNS_LOOKUP_FAILED', 'Outbound host could not be resolved');
    }

    let response: SafeHttpResponse;
    try {
      response = await dependencies.request(currentUrl, address, signal);
    } catch (error) {
      if (signal.aborted) {
        throw error;
      }
      throw new SafeTextFetchError('NETWORK_ERROR', 'Outbound request failed');
    }

    const statusCode = response.statusCode ?? 0;
    if (isRedirectStatus(statusCode)) {
      const location = getSingleHeader(response.headers, 'location');
      response.destroy();
      if (!location) {
        throw new SafeTextFetchError('REDIRECT_INVALID', 'Redirect response is missing a location');
      }
      if (redirectCount >= maxRedirects) {
        throw new SafeTextFetchError('TOO_MANY_REDIRECTS', 'Outbound request exceeded the redirect limit');
      }

      let redirectUrl: URL;
      try {
        redirectUrl = new URL(location, currentUrl);
      } catch {
        throw new SafeTextFetchError('REDIRECT_INVALID', 'Redirect location is invalid');
      }
      currentUrl = parseOutboundUrl(redirectUrl.href, 'REDIRECT_INVALID');
      continue;
    }

    if (statusCode < 200 || statusCode >= 300) {
      response.destroy();
      throw new SafeTextFetchError('HTTP_STATUS_ERROR', `Website returned HTTP ${statusCode}`);
    }

    try {
      assertSupportedResponse(response.headers, maxBytes);
      return await readBoundedBody(response, maxBytes);
    } catch (error) {
      response.destroy();
      if (!(error instanceof SafeTextFetchError) && !signal.aborted) {
        throw new SafeTextFetchError('NETWORK_ERROR', 'Outbound response failed');
      }
      throw error;
    }
  }
}

export async function safeFetchText(
  input: string,
  options: SafeTextFetchOptions = {},
  dependencies: SafeTextFetchDependencies = defaultDependencies,
) {
  const url = parseOutboundUrl(input);
  const { maxBytes, maxRedirects, timeoutMs } = resolveOptions(options);
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  try {
    return await requestText(
      url,
      maxBytes,
      maxRedirects,
      controller.signal,
      dependencies,
    );
  } catch (error) {
    if (timedOut) {
      throw new SafeTextFetchError('TIMEOUT', 'Outbound request timed out');
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

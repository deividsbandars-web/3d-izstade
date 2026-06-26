import { getFrontendRuntimeEnv } from '../config/runtimeEnv';
import { supabaseClient } from '../lib/supabaseClient';

function buildServerApiUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getFrontendRuntimeEnv().apiBaseUrl}${normalizedPath}`;
}

async function buildServerApiHeaders(includeJsonBody: boolean, accessToken?: string) {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (includeJsonBody) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    } else {
      const { data } = await supabaseClient.auth.getSession();
      const sessionAccessToken = data.session?.access_token;
      if (sessionAccessToken) {
        headers.Authorization = `Bearer ${sessionAccessToken}`;
      }
    }
  } catch (error) {
    console.warn('SERVER_API_AUTH_SESSION_UNAVAILABLE', error);
  }

  return headers;
}

export async function serverApiGet<T>(path: string): Promise<T> {
  const response = await fetch(buildServerApiUrl(path), {
    method: 'GET',
    headers: await buildServerApiHeaders(false),
  });

  if (!response.ok) {
    throw new Error(`SERVER_API_HTTP_${response.status}`);
  }

  return await response.json() as T;
}

export async function serverApiGetText(path: string): Promise<{
  content: string;
  contentType: string;
}> {
  const headers = await buildServerApiHeaders(false);
  headers.Accept = 'text/csv, application/json;q=0.9, text/plain;q=0.8, */*;q=0.7';

  const response = await fetch(buildServerApiUrl(path), {
    headers,
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`SERVER_API_HTTP_${response.status}`);
  }

  return {
    content: await response.text(),
    contentType: response.headers.get('content-type') || 'text/plain;charset=utf-8',
  };
}

export async function serverApiPost<T>(path: string, body: unknown, accessToken?: string): Promise<T> {
  const response = await fetch(buildServerApiUrl(path), {
    method: 'POST',
    headers: await buildServerApiHeaders(true, accessToken),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`SERVER_API_HTTP_${response.status}`);
  }

  return await response.json() as T;
}

export async function serverApiPatch<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(buildServerApiUrl(path), {
    method: 'PATCH',
    headers: await buildServerApiHeaders(true),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`SERVER_API_HTTP_${response.status}`);
  }

  return await response.json() as T;
}

export async function serverApiUploadBinary<T>(
  path: string,
  body: Blob,
  options: {
    contentType: string;
    headers?: Record<string, string>;
  },
): Promise<T> {
  const headers = await buildServerApiHeaders(false);
  headers['Content-Type'] = options.contentType;

  Object.entries(options.headers || {}).forEach(([key, value]) => {
    headers[key] = value;
  });

  const response = await fetch(buildServerApiUrl(path), {
    method: 'POST',
    headers,
    body,
  });

  if (!response.ok) {
    throw new Error(`SERVER_API_HTTP_${response.status}`);
  }

  return await response.json() as T;
}

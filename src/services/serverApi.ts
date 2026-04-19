import { getFrontendRuntimeEnv } from '../config/runtimeEnv';
import { supabaseClient } from '../lib/supabaseClient';

function buildServerApiUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getFrontendRuntimeEnv().apiBaseUrl}${normalizedPath}`;
}

async function buildServerApiHeaders(includeJsonBody: boolean) {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (includeJsonBody) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const { data } = await supabaseClient.auth.getSession();
    const accessToken = data.session?.access_token;
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
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

export async function serverApiPost<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(buildServerApiUrl(path), {
    method: 'POST',
    headers: await buildServerApiHeaders(true),
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

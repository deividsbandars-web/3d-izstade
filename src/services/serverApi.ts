export async function serverApiGet<T>(path: string): Promise<T> {
  const response = await fetch(path, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`SERVER_API_HTTP_${response.status}`);
  }

  return await response.json() as T;
}

export async function serverApiPost<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`SERVER_API_HTTP_${response.status}`);
  }

  return await response.json() as T;
}

export async function serverApiPatch<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(path, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`SERVER_API_HTTP_${response.status}`);
  }

  return await response.json() as T;
}

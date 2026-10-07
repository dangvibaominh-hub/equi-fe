const fallbackBaseUrl = 'https://6ac4f94c54a61668c5f6a08a.mockapi.io/api/v1';

export const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || fallbackBaseUrl).replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
    });
  } catch (error) {
    throw new ApiError(error instanceof Error ? error.message : 'Network request failed');
  }

  if (!response.ok) {
    const message = await response.text();
    throw new ApiError(message || `Request failed: ${response.status}`, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const apiGet = <T>(path: string) => request<T>(path);
export const apiPost = <T>(path: string, payload: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(payload) });
export const apiPut = <T>(path: string, payload: unknown) => request<T>(path, { method: 'PUT', body: JSON.stringify(payload) });

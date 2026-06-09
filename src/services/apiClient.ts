import type { ApiValidationErrors } from '../types/file';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000';
const API_PREFIX = '/api';
const TOKEN_KEY = 'ceph_file_system_token';

interface ApiErrorBody {
  message?: string;
  errors?: ApiValidationErrors;
  [key: string]: unknown;
}

export class ApiError extends Error {
  status?: number;
  errors?: ApiValidationErrors;
  details?: Record<string, unknown>;

  constructor(
    message: string,
    status?: number,
    errors?: ApiValidationErrors,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
    this.details = details;
  }
}

export const getStoredToken = () => localStorage.getItem(TOKEN_KEY);

export const setStoredToken = (token: string) => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const clearStoredToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

export const buildApiUrl = (path: string) => {
  const baseUrl = API_BASE_URL.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  return `${baseUrl}${API_PREFIX}${cleanPath}`;
};

const parseJson = async <T>(response: Response): Promise<T | null> => {
  const contentType = response.headers.get('content-type') ?? '';

  if (!contentType.includes('application/json')) {
    return null;
  }

  return response.json() as Promise<T>;
};

const buildHeaders = (options: RequestInit) => {
  const headers = new Headers(options.headers);
  const token = getStoredToken();

  headers.set('Accept', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return headers;
};

export const apiRequest = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  try {
    const response = await fetch(buildApiUrl(path), {
      ...options,
      headers: buildHeaders(options),
    });

    const json = await parseJson<T | ApiErrorBody>(response);

    if (!response.ok) {
      const errorBody = json as ApiErrorBody | null;

      throw new ApiError(
        errorBody?.message ?? `Request failed with status ${response.status}`,
        response.status,
        errorBody?.errors,
        errorBody ? Object.fromEntries(Object.entries(errorBody).filter(([key]) => !['message', 'errors'].includes(key))) : undefined,
      );
    }

    return json as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError('Cannot connect to the Laravel backend. Is php artisan serve running?');
  }
};

export const apiBlobRequest = async (path: string): Promise<Blob> => {
  try {
    const response = await fetch(buildApiUrl(path), {
      headers: buildHeaders({}),
    });

    if (!response.ok) {
      const json = await parseJson<ApiErrorBody>(response);

      throw new ApiError(
        json?.message ?? `Request failed with status ${response.status}`,
        response.status,
        json?.errors,
        json ? Object.fromEntries(Object.entries(json).filter(([key]) => !['message', 'errors'].includes(key))) : undefined,
      );
    }

    return response.blob();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError('Cannot connect to the Laravel backend. Is php artisan serve running?');
  }
};

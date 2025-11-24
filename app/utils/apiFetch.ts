import { getToken } from '../hooks/useAuth';
import { API_URL } from '@/config/api';

/**
 * Fetch wrapper that automatically adds Authorization header
 * 
 * @param url - API endpoint (relative or absolute)
 * @param options - Fetch options
 * @returns Promise<Response>
 */
export async function apiFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getToken();
  const fullUrl = url.startsWith('http') ? url : `${API_URL}${url}`;

  const headers = new Headers(options.headers);

  // Add Authorization header if token exists
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Set Content-Type if body is provided and not already set
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(fullUrl, {
    ...options,
    headers,
  });
}


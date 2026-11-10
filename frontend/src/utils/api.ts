export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const defaultHeaders: Record<string, string> = {};

  if (options.body && typeof options.body === 'string' && !options.headers?.hasOwnProperty('Content-Type')) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  const mergedOptions: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers
    }
  };

  let res: Response;
  try {
    res = await fetch(url, mergedOptions);
  } catch (err: any) {
    throw new Error(`Unable to connect to server at ${url}. Please check your internet connection or VITE_API_URL configuration.`);
  }

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const responseText = await res.text();

  let data: any = {};
  if (isJson && responseText) {
    try {
      data = JSON.parse(responseText);
    } catch {
      data = {};
    }
  } else if (!res.ok) {
    const cleanText = responseText.replace(/<[^>]*>?/gm, '').trim();
    const shortText = cleanText.length > 120 ? `${cleanText.slice(0, 120)}...` : cleanText;
    throw new Error(shortText || `Server returned status ${res.status}`);
  }

  if (!res.ok) {
    const errorMessage = data.message || data.error || `Request failed with status ${res.status}`;
    throw new Error(errorMessage);
  }

  return data as T;
}

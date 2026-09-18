const API_BASE = String(import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...options.headers,
    },
  });
  const type = response.headers.get('content-type') || '';
  const result = type.includes('application/json') ? await response.json() : { message: await response.text() };
  if (!response.ok || result?.ok === false) {
    const error = new Error(result?.message || 'Permintaan gagal diproses.');
    error.status = response.status;
    error.data = result;
    throw error;
  }
  return result;
}

export const get = (path) => api(path);
export const post = (path, data) => api(path, { method: 'POST', body: data instanceof FormData ? data : JSON.stringify(data) });
export const patch = (path, data) => api(path, { method: 'PATCH', body: JSON.stringify(data) });

export function money(value) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value || 0));
}

export function mediaUrl(path) {
  if (!path) return '/assets/images/templates/placeholder-couple.svg';
  if (/^https?:\/\//i.test(path) || path.startsWith('/')) return path;
  if (path.startsWith('uploads/')) return `/${path}`;
  return `${API_BASE}/media/${String(path).replace(/^\/+/, '')}`;
}

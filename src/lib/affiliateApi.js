const configuredBase = String(import.meta.env.VITE_AFFILIATE_API_URL || '').trim().replace(/\/$/, '');
// Use the current website origin by default. In development Vite proxies /api
// to the affiliate Worker, preventing localhost/127.0.0.1 from being treated
// as two different sites by the browser security layer.
const apiBase = configuredBase;

export async function affiliateApi(path, options = {}) {
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const response = await fetch(`${apiBase}/api/affiliate${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(options.body && !isFormData ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });
  const result = await response.json().catch(() => ({ ok: false, message: '' }));
  if (!response.ok) {
    const publicMessage = response.status >= 500
      ? 'Gagal memproses permintaan. Silakan coba lagi.'
      : result.message || 'Permintaan belum dapat diproses. Silakan periksa kembali data yang diisi.';
    const failure = new Error(publicMessage);
    failure.status = response.status;
    failure.code = result.code;
    throw failure;
  }
  return result;
}

export function friendlyAffiliateError(error) {
  if (error instanceof TypeError && /fetch/i.test(error.message)) {
    return 'Gagal memproses permintaan. Silakan coba lagi.';
  }
  return error?.message || 'Gagal memproses permintaan. Silakan coba lagi.';
}

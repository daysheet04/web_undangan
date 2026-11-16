/**
 * Ensures non-Error objects (such as Supabase PostgrestError) are wrapped as Error
 * instances so Hono's onError handler always intercepts them, and masks 5xx internals.
 */

export function normalizeThrownError(err) {
  if (err instanceof Error) return err;
  const wrapped = new Error(String(err?.message || 'Internal server error'));
  const status = Number(err?.status);
  wrapped.status = Number.isInteger(status) && status >= 400 && status < 600 ? status : 500;
  return wrapped;
}

export function maskedErrorResponse(error, c, fallback5xxMessage = 'Terjadi kesalahan pada server.') {
  console.error(error);
  const status = Number(error?.status);
  const safeStatus = Number.isInteger(status) && status >= 400 && status < 600 ? status : 500;
  const message = safeStatus >= 500
    ? fallback5xxMessage
    : error?.message || 'Permintaan tidak dapat diproses.';
  return c.json({ ok: false, message }, safeStatus);
}

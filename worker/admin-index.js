import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import admin from './routes/admin.js';

const app = new Hono();

app.use('*', secureHeaders());
app.use('/api/admin/*', cors({
  origin: (origin) => origin || 'http://localhost:8081',
  allowMethods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Accept'],
  credentials: true,
}));
app.route('/api', admin);

app.get('/api/health', (c) => c.json({ ok: true, service: 'daymoment-admin', runtime: 'cloudflare-workers' }));

app.notFound((c) => c.json({ ok: false, message: 'Endpoint admin tidak ditemukan.' }, 404));
app.onError((error, c) => {
  console.error(error);
  return c.json({ ok: false, message: error.message || 'Terjadi kesalahan pada server admin.' }, error.status || 500);
});

export default app;

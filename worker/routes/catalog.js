import { Hono } from 'hono';
import { activeTemplates, templateByCode } from '../lib/repositories.js';

const catalog = new Hono();

catalog.get('/templates', async (c) => {
  c.header('Cache-Control', 'public, max-age=300, stale-while-revalidate=1800');
  return c.json({ ok: true, templates: await activeTemplates(c.env) });
});
catalog.get('/templates/:code', async (c) => {
  c.header('Cache-Control', 'public, max-age=300, stale-while-revalidate=1800');
  return c.json({ ok: true, template: await templateByCode(c.env, c.req.param('code')) });
});

export default catalog;

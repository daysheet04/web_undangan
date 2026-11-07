export function templateSlug(template) {
  const source = typeof template === 'object'
    ? (template?.url_slug || template?.name || template?.code || '')
    : template;

  return String(source || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function templatePreviewPath(template) {
  return `/template/${encodeURIComponent(templateSlug(template))}`;
}

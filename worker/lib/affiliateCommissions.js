/**
 * Per-affiliate custom commission helpers.
 *
 * Uses `public.affiliate_template_commissions` when migrated and transparently
 * falls back to `public.site_settings` (`aff_comm_<affiliateId>`) when the new
 * table is not yet present so admin overrides always work end-to-end.
 */

const FALLBACK_PREFIX = 'aff_comm_';

export function fallbackCommissionKey(affiliateId) {
  return `${FALLBACK_PREFIX}${String(affiliateId || '').trim()}`;
}

export function isMissingCustomCommissionTableError(error) {
  const code = String(error?.code || '');
  const message = String(error?.message || error?.details || '');
  return code === '42P01' || code === 'PGRST205' || /affiliate_template_commissions|schema cache/i.test(message);
}

export function clampCommissionPercent(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string' && value.trim() === '') return null;
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  const clamped = Math.max(0, Math.min(100, num));
  return Math.round(clamped * 100) / 100;
}

export function normalizeCommissionMap(raw, validTemplateCodes = null) {
  const source = raw && typeof raw === 'object' && raw.templates && typeof raw.templates === 'object'
    ? raw.templates
    : raw;
  const result = {};
  if (!source || typeof source !== 'object' || Array.isArray(source)) return result;

  const allowedSet = validTemplateCodes ? new Set([...validTemplateCodes].map((c) => String(c))) : null;
  for (const [rawCode, rawValue] of Object.entries(source)) {
    const code = String(rawCode || '').trim();
    if (!code) continue;
    if (allowedSet && !allowedSet.has(code)) continue;
    const pct = clampCommissionPercent(rawValue);
    if (pct !== null) {
      result[code] = pct;
    }
  }
  return result;
}

function parseFallbackValue(rawValue) {
  if (!rawValue) return {};
  try {
    const parsed = typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue;
    return normalizeCommissionMap(parsed);
  } catch {
    return {};
  }
}

export function resolveAffiliateCommissionPercent(customMap, template, pkg) {
  const defaultPercent = clampCommissionPercent(pkg?.affiliate_commission_default_percent ?? 0) ?? 0;
  if (!customMap || typeof customMap !== 'object') {
    return { percent: defaultPercent, isCustom: false, defaultPercent };
  }

  let override = null;
  if (template?.code && Object.prototype.hasOwnProperty.call(customMap, template.code)) {
    override = clampCommissionPercent(customMap[template.code]);
  } else if (template?.id !== undefined && template?.id !== null && Object.prototype.hasOwnProperty.call(customMap, String(template.id))) {
    override = clampCommissionPercent(customMap[String(template.id)]);
  }

  if (override !== null) {
    return { percent: override, isCustom: true, defaultPercent };
  }
  return { percent: defaultPercent, isCustom: false, defaultPercent };
}

async function loadTemplateCodeById(db, suppliedMap = null) {
  if (suppliedMap instanceof Map) return suppliedMap;
  const { data, error } = await db.from('templates').select('id,code');
  if (error) throw error;
  return new Map((data || []).map((row) => [String(row.id), row.code]));
}

export async function getAffiliateCustomCommissionsMap(db, affiliateIds = [], templateCodeById = null) {
  const ids = [...new Set((affiliateIds || []).map((id) => String(id || '').trim()).filter(Boolean))];
  const result = new Map(ids.map((id) => [id, {}]));
  if (!ids.length) return result;

  const keys = ids.map(fallbackCommissionKey);
  const [tableResult, fallbackResult] = await Promise.all([
    db.from('affiliate_template_commissions')
      .select('affiliate_id,template_id,commission_percent')
      .in('affiliate_id', ids),
    db.from('site_settings')
      .select('key,value')
      .in('key', keys),
  ]);

  if (!fallbackResult.error && Array.isArray(fallbackResult.data)) {
    const idByKey = new Map(ids.map((id) => [fallbackCommissionKey(id), id]));
    for (const row of fallbackResult.data) {
      const affiliateId = idByKey.get(String(row.key || ''));
      if (!affiliateId) continue;
      Object.assign(result.get(affiliateId), parseFallbackValue(row.value));
    }
  } else if (fallbackResult.error && !['42P01', 'PGRST205'].includes(String(fallbackResult.error.code || ''))) {
    throw fallbackResult.error;
  }

  if (!tableResult.error && Array.isArray(tableResult.data)) {
    if (tableResult.data.length > 0) {
      const codeMap = await loadTemplateCodeById(db, templateCodeById);
      for (const row of tableResult.data) {
        const affiliateId = String(row.affiliate_id || '');
        const templateCode = codeMap.get(String(row.template_id));
        const pct = clampCommissionPercent(row.commission_percent);
        if (!affiliateId || !templateCode || pct === null) continue;
        if (!result.has(affiliateId)) result.set(affiliateId, {});
        result.get(affiliateId)[templateCode] = pct;
      }
    }
  } else if (tableResult.error && !isMissingCustomCommissionTableError(tableResult.error)) {
    throw tableResult.error;
  }

  return result;
}

export async function getAffiliateCustomCommissions(db, affiliateId, templateCodeById = null) {
  const cleanId = String(affiliateId || '').trim();
  if (!cleanId) return {};
  const map = await getAffiliateCustomCommissionsMap(db, [cleanId], templateCodeById);
  return map.get(cleanId) || {};
}

export async function deleteAffiliateCustomCommissionsFallback(db, affiliateId) {
  const cleanId = String(affiliateId || '').trim();
  if (!cleanId) return;
  try {
    await db.from('site_settings').delete().eq('key', fallbackCommissionKey(cleanId));
  } catch {
    // Best-effort cleanup only.
  }
}

export async function saveAffiliateCustomCommissions(db, affiliateId, commissionByCode, templates = []) {
  const cleanId = String(affiliateId || '').trim();
  if (!cleanId) throw new Error('ID affiliate tidak valid.');

  const templateByCode = new Map((templates || []).map((tpl) => [String(tpl.code), tpl]));
  const normalized = normalizeCommissionMap(
    commissionByCode,
    templateByCode.size ? [...templateByCode.keys()] : null,
  );
  const now = new Date().toISOString();

  // Attempt primary storage in affiliate_template_commissions first.
  let tableSupported = true;
  const { data: existingRows, error: readExistingError } = await db
    .from('affiliate_template_commissions')
    .select('template_id')
    .eq('affiliate_id', cleanId);

  if (readExistingError) {
    if (!isMissingCustomCommissionTableError(readExistingError)) {
      throw readExistingError;
    }
    tableSupported = false;
  }

  if (tableSupported) {
    const upsertRows = Object.entries(normalized)
      .map(([code, pct]) => {
        const tpl = templateByCode.get(code);
        return tpl
          ? { affiliate_id: cleanId, template_id: tpl.id, commission_percent: pct, updated_at: now }
          : null;
      })
      .filter(Boolean);

    if (upsertRows.length > 0) {
      const { error: upsertError } = await db
        .from('affiliate_template_commissions')
        .upsert(upsertRows, { onConflict: 'affiliate_id,template_id' });
      if (upsertError) {
        if (isMissingCustomCommissionTableError(upsertError)) {
          tableSupported = false;
        } else {
          throw upsertError;
        }
      }
    }

    if (tableSupported) {
      const keptTemplateIds = new Set(upsertRows.map((row) => String(row.template_id)));
      const removedTemplateIds = (existingRows || [])
        .map((row) => row.template_id)
        .filter((id) => !keptTemplateIds.has(String(id)));

      if (removedTemplateIds.length > 0) {
        const { error: deleteError } = await db
          .from('affiliate_template_commissions')
          .delete()
          .eq('affiliate_id', cleanId)
          .in('template_id', removedTemplateIds);
        if (deleteError) throw deleteError;
      }

      // Single source of truth once primary table succeeds.
      await deleteAffiliateCustomCommissionsFallback(db, cleanId);
      return normalized;
    }
  }

  // Fallback mirror in site_settings when migration table is not yet created.
  if (Object.keys(normalized).length > 0) {
    const { error: fallbackError } = await db
      .from('site_settings')
      .upsert(
        {
          key: fallbackCommissionKey(cleanId),
          value: JSON.stringify({ templates: normalized }),
          updated_at: now,
        },
        { onConflict: 'key' },
      );
    if (fallbackError) throw fallbackError;
  } else {
    const { error: deleteFallbackError } = await db
      .from('site_settings')
      .delete()
      .eq('key', fallbackCommissionKey(cleanId));
    if (deleteFallbackError && !['42P01', 'PGRST205'].includes(String(deleteFallbackError.code || ''))) {
      throw deleteFallbackError;
    }
  }

  return normalized;
}

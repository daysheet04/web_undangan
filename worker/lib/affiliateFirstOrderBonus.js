/**
 * Shared helper for the one-time first-order affiliate bonus:
 * - Eligible ONLY for Signature or Prestige package orders reaching `payment_status === 'paid'`.
 * - Essential package orders NEVER earn the bonus (only regular percentage commission).
 * - Bonus amount on the earliest qualifying paid order:
 *   - Rp 100.000 for template "The Heritage" (`vintage_classic` / `the_heritage`).
 *   - Rp 50.000 for all other templates.
 * - Subsequent qualifying orders earn regular percentage commission only.
 */

export const FIRST_ORDER_BONUS_DEFAULT_AMOUNT = 50000;
export const FIRST_ORDER_BONUS_HERITAGE_AMOUNT = 100000;
export const FIRST_ORDER_BONUS_AMOUNT = FIRST_ORDER_BONUS_DEFAULT_AMOUNT;
export const ELIGIBLE_FIRST_ORDER_PACKAGE_CODES = new Set(['signature', 'prestige']);

const HERITAGE_TEMPLATE_CODES = new Set([
  'vintage_classic',
  'vintage-classic',
  'the_heritage',
  'the-heritage',
]);

function orderSortTimestamp(order) {
  const ms = Date.parse(String(order?.created_at || ''));
  return Number.isFinite(ms) ? ms : 0;
}

function compareOrdersAscending(left, right) {
  const timeDiff = orderSortTimestamp(left) - orderSortTimestamp(right);
  if (timeDiff !== 0) return timeDiff;

  const leftId = Number(left?.id);
  const rightId = Number(right?.id);
  if (Number.isFinite(leftId) && Number.isFinite(rightId) && leftId !== rightId) {
    return leftId - rightId;
  }
  return String(left?.id ?? '').localeCompare(String(right?.id ?? ''));
}

function lookupEntry(map, id) {
  if (!map || id === undefined || id === null) return null;
  if (map instanceof Map) return map.get(String(id)) || map.get(id) || null;
  if (typeof map === 'object') return map[String(id)] || map[id] || null;
  return null;
}

export function isEligibleFirstOrderPackage(order, packageById = null) {
  const pkg = lookupEntry(packageById, order?.package_id);
  const candidates = [
    order?.package_code,
    order?.product?.code,
    pkg?.code,
    order?.package_name,
    order?.product_name,
    order?.product?.name,
    pkg?.name,
  ];
  for (const candidate of candidates) {
    const normalized = String(candidate || '').trim().toLowerCase();
    if (ELIGIBLE_FIRST_ORDER_PACKAGE_CODES.has(normalized)) {
      return true;
    }
  }
  return false;
}

export function isHeritageTemplate(order, templateById = null) {
  const tpl = lookupEntry(templateById, order?.template_id);
  const codeCandidates = [
    order?.template_code,
    order?.template?.code,
    tpl?.code,
  ];
  for (const candidate of codeCandidates) {
    const normalized = String(candidate || '').trim().toLowerCase();
    if (HERITAGE_TEMPLATE_CODES.has(normalized)) {
      return true;
    }
  }

  const nameCandidates = [
    order?.template_name,
    order?.template?.name,
    tpl?.name,
  ];
  for (const candidate of nameCandidates) {
    if (String(candidate || '').toLowerCase().includes('the heritage')) {
      return true;
    }
  }
  return false;
}

export function resolveFirstOrderBonusAmount(order, templateById = null) {
  return isHeritageTemplate(order, templateById)
    ? FIRST_ORDER_BONUS_HERITAGE_AMOUNT
    : FIRST_ORDER_BONUS_DEFAULT_AMOUNT;
}

export function findFirstPaidOrder(orders = [], lookup = {}) {
  const packageById = lookup?.packageById || null;
  const paid = (Array.isArray(orders) ? orders : []).filter(
    (order) => order?.payment_status === 'paid' && isEligibleFirstOrderPackage(order, packageById),
  );
  if (!paid.length) return null;
  paid.sort(compareOrdersAscending);
  return paid[0] || null;
}

export function annotateAffiliateOrdersWithFirstOrderBonus(orders = [], allAffiliateOrders = null, lookup = {}) {
  const list = Array.isArray(orders) ? orders : [];
  const templateById = lookup?.templateById || null;
  const packageById = lookup?.packageById || null;
  const firstPaidOrder = findFirstPaidOrder(allAffiliateOrders || list, { packageById });
  const firstPaidId = firstPaidOrder?.id !== undefined && firstPaidOrder?.id !== null
    ? String(firstPaidOrder.id)
    : null;

  return list.map((order) => {
    const baseCommission = Number(order?.affiliate_commission_amount || 0);
    const eligiblePackage = isEligibleFirstOrderPackage(order, packageById);
    const isFirstPaid = Boolean(
      firstPaidId !== null
      && order?.payment_status === 'paid'
      && eligiblePackage
      && order?.id !== undefined
      && order?.id !== null
      && String(order.id) === firstPaidId,
    );
    const firstOrderBonus = isFirstPaid ? resolveFirstOrderBonusAmount(order, templateById) : 0;
    return {
      ...order,
      base_commission_amount: baseCommission,
      is_first_paid_order: isFirstPaid,
      is_eligible_bonus_package: eligiblePackage,
      first_order_bonus_amount: firstOrderBonus,
      affiliate_commission_amount: baseCommission + firstOrderBonus,
    };
  });
}

export function summarizeAffiliateFirstOrderStatus(orders = [], lookup = {}) {
  const list = Array.isArray(orders) ? orders : [];
  const templateById = lookup?.templateById || null;
  const packageById = lookup?.packageById || null;

  const totalOrders = list.length;
  const paidOrders = list.filter((order) => order?.payment_status === 'paid');
  const qualifyingPaidOrders = paidOrders.filter((order) => isEligibleFirstOrderPackage(order, packageById));
  const essentialPaidOrders = paidOrders.filter((order) => !isEligibleFirstOrderPackage(order, packageById));
  const pendingOrders = list.filter((order) => order?.payment_status === 'pending');
  const firstPaid = findFirstPaidOrder(qualifyingPaidOrders, { packageById });

  if (firstPaid) {
    const bonusAmount = resolveFirstOrderBonusAmount(firstPaid, templateById);
    const tpl = lookupEntry(templateById, firstPaid.template_id);
    const pkg = lookupEntry(packageById, firstPaid.package_id);
    return {
      total_orders: totalOrders,
      paid_orders_count: paidOrders.length,
      qualifying_paid_orders_count: qualifyingPaidOrders.length,
      essential_paid_orders_count: essentialPaidOrders.length,
      pending_orders_count: pendingOrders.length,
      has_first_paid_order: true,
      bonus_amount: bonusAmount,
      bonus_status: 'earned',
      is_heritage_bonus: bonusAmount === FIRST_ORDER_BONUS_HERITAGE_AMOUNT,
      first_paid_order_id: firstPaid.id ?? null,
      first_paid_order_code: firstPaid.order_code || null,
      first_paid_order_at: firstPaid.created_at || null,
      first_paid_template_code: firstPaid.template_code || firstPaid.template?.code || tpl?.code || null,
      first_paid_template_name: firstPaid.template_name || firstPaid.template?.name || tpl?.name || null,
      first_paid_package_code: firstPaid.package_code || firstPaid.product?.code || pkg?.code || null,
      first_paid_package_name: firstPaid.package_name || firstPaid.product_name || firstPaid.product?.name || pkg?.name || null,
    };
  }

  let bonusStatus = 'none';
  if (paidOrders.length > 0) {
    bonusStatus = 'essential_only';
  } else if (totalOrders > 0) {
    bonusStatus = 'pending';
  }

  return {
    total_orders: totalOrders,
    paid_orders_count: paidOrders.length,
    qualifying_paid_orders_count: 0,
    essential_paid_orders_count: essentialPaidOrders.length,
    pending_orders_count: pendingOrders.length,
    has_first_paid_order: false,
    bonus_amount: 0,
    bonus_status: bonusStatus,
    is_heritage_bonus: false,
    first_paid_order_id: null,
    first_paid_order_code: null,
    first_paid_order_at: null,
    first_paid_template_code: null,
    first_paid_template_name: null,
    first_paid_package_code: null,
    first_paid_package_name: null,
  };
}

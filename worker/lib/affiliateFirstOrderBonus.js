/**
 * Shared helper for the one-time Rp 50.000 bonus on an affiliate's first paid order.
 *
 * Only the earliest order reaching `payment_status === 'paid'` receives
 * `FIRST_ORDER_BONUS_AMOUNT` (+50.000) in addition to its regular commission.
 * Subsequent orders receive their regular percentage commission only.
 */

export const FIRST_ORDER_BONUS_AMOUNT = 50000;

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

export function findFirstPaidOrder(orders = []) {
  const paid = (Array.isArray(orders) ? orders : []).filter((order) => order?.payment_status === 'paid');
  if (!paid.length) return null;
  paid.sort(compareOrdersAscending);
  return paid[0] || null;
}

export function annotateAffiliateOrdersWithFirstOrderBonus(orders = [], allAffiliateOrders = null) {
  const list = Array.isArray(orders) ? orders : [];
  const firstPaidOrder = findFirstPaidOrder(allAffiliateOrders || list);
  const firstPaidId = firstPaidOrder?.id !== undefined && firstPaidOrder?.id !== null
    ? String(firstPaidOrder.id)
    : null;

  return list.map((order) => {
    const baseCommission = Number(order?.affiliate_commission_amount || 0);
    const isFirstPaid = Boolean(
      firstPaidId !== null
      && order?.payment_status === 'paid'
      && order?.id !== undefined
      && order?.id !== null
      && String(order.id) === firstPaidId,
    );
    const firstOrderBonus = isFirstPaid ? FIRST_ORDER_BONUS_AMOUNT : 0;
    return {
      ...order,
      base_commission_amount: baseCommission,
      is_first_paid_order: isFirstPaid,
      first_order_bonus_amount: firstOrderBonus,
      affiliate_commission_amount: baseCommission + firstOrderBonus,
    };
  });
}

export function summarizeAffiliateFirstOrderStatus(orders = []) {
  const list = Array.isArray(orders) ? orders : [];
  const totalOrders = list.length;
  const paidOrders = list.filter((order) => order?.payment_status === 'paid');
  const pendingOrders = list.filter((order) => order?.payment_status === 'pending');
  const firstPaid = findFirstPaidOrder(paidOrders);

  if (firstPaid) {
    return {
      total_orders: totalOrders,
      paid_orders_count: paidOrders.length,
      pending_orders_count: pendingOrders.length,
      has_first_paid_order: true,
      bonus_amount: FIRST_ORDER_BONUS_AMOUNT,
      bonus_status: 'earned',
      first_paid_order_id: firstPaid.id ?? null,
      first_paid_order_code: firstPaid.order_code || null,
      first_paid_order_at: firstPaid.created_at || null,
    };
  }

  return {
    total_orders: totalOrders,
    paid_orders_count: 0,
    pending_orders_count: pendingOrders.length,
    has_first_paid_order: false,
    bonus_amount: 0,
    bonus_status: totalOrders > 0 ? 'pending' : 'none',
    first_paid_order_id: null,
    first_paid_order_code: null,
    first_paid_order_at: null,
  };
}

import { Router } from 'express';
import { supabase, isSupabaseConfigured } from '../config/supabase.js';

const router = Router();

/**
 * GET /api/orders
 * List orders with filtering, pagination, and joined customer/product/vendor details.
 */
router.get('/', async (req, res) => {
  try {
    if (!isSupabaseConfigured() || !supabase) {
      return res.status(503).json({
        error: 'Supabase is not configured yet. Please check backend .env',
        orders: [],
        pagination: { total: 0, page: 1, limit: 20, totalPages: 0 },
      });
    }

    const {
      page = 1,
      limit = 20,
      risk_band,
      payment_type,
      status,
      search,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    let query = supabase
      .from('orders')
      .select(
        `
        *,
        customers (*),
        products (*),
        vendors (*)
      `,
        { count: 'exact' }
      );

    // Apply filters
    if (risk_band) {
      query = query.eq('risk_band', risk_band.toUpperCase());
    }

    if (payment_type) {
      query = query.eq('payment_method', payment_type.toUpperCase());
    }

    if (status) {
      query = query.eq('status', status.toUpperCase());
    }

    if (search) {
      query = query.or(`id.ilike.%${search}%,city.ilike.%${search}%`);
    }

    // Sort newest first
    query = query.order('created_at', { ascending: false });

    // Pagination
    query = query.range(offset, offset + limitNum - 1);

    const { data: rawOrders, count, error } = await query;

    if (error) {
      console.error('[Orders API] Error fetching orders:', error);
      return res.status(500).json({ error: error.message });
    }

    // Normalize field names so frontend components have a consistent interface
    const orders = (rawOrders || []).map((o) => ({
      ...o,
      external_id: o.id,
      payment_type: o.payment_method || 'COD',
      amount: o.order_amount || 0,
      rto_risk_score: o.risk_score,
      selected_size: o.products?.available_sizes?.split?.('|')?.[0] || 'M',
    }));

    const total = count || 0;
    const totalPages = Math.ceil(total / limitNum);

    res.json({
      orders,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
      },
    });
  } catch (err) {
    console.error('[Orders API] Unexpected error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/orders/stats/summary
 * Aggregate metrics: Total orders, COD share, RTO count, High-Risk counts, and loss metrics.
 */
router.get('/stats/summary', async (req, res) => {
  try {
    if (!isSupabaseConfigured() || !supabase) {
      return res.json({
        totalOrders: 0,
        codOrders: 0,
        rtoOrders: 0,
        deliveredOrders: 0,
        highRiskOrders: 0,
        baselineRtoRate: 0.26,
        estimatedRtoCostPerUnit: 120,
        totalLossEstimated: 0,
      });
    }

    // Query high-level aggregates
    const [
      { count: totalOrders },
      { count: codOrders },
      { count: rtoOrders },
      { count: deliveredOrders },
      { count: highRiskOrders },
    ] = await Promise.all([
      supabase.from('orders').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('*', { count: 'exact', head: true }).eq('payment_method', 'COD'),
      supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'RTO'),
      supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'DELIVERED'),
      supabase.from('orders').select('*', { count: 'exact', head: true }).eq('risk_band', 'HIGH'),
    ]);

    const codCount = codOrders || 0;
    const rtoCount = rtoOrders || 0;
    const rtoRate = codCount > 0 ? Number((rtoCount / codCount).toFixed(4)) : 0.3591;
    const estimatedLoss = rtoCount * 120;

    res.json({
      totalOrders: totalOrders || 0,
      codOrders: codCount,
      rtoOrders: rtoCount,
      deliveredOrders: deliveredOrders || 0,
      highRiskOrders: highRiskOrders || 0,
      calculatedRtoRate: rtoRate,
      baselineRtoRate: 0.26,
      estimatedRtoCostPerUnit: 120,
      totalLossEstimated: estimatedLoss,
    });
  } catch (err) {
    console.error('[Orders Stats API] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/orders/:id
 * Retrieve single order with deep customer, product, vendor, and return signals.
 */
router.get('/:id', async (req, res) => {
  try {
    if (!isSupabaseConfigured() || !supabase) {
      return res.status(503).json({ error: 'Supabase is not configured.' });
    }

    const { id } = req.params;

    const { data: rawOrder, error } = await supabase
      .from('orders')
      .select(
        `
        *,
        customers (*),
        products (*),
        vendors (*)
      `
      )
      .eq('id', id)
      .single();

    if (error || !rawOrder) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    // Fetch related returns for this customer and product if any
    const { data: relatedReturns } = await supabase
      .from('returns')
      .select('*')
      .or(`customer_id.eq.${rawOrder.customer_id},product_id.eq.${rawOrder.product_id}`)
      .limit(10);

    const order = {
      ...rawOrder,
      external_id: rawOrder.id,
      payment_type: rawOrder.payment_method || 'COD',
      amount: rawOrder.order_amount || 0,
      rto_risk_score: rawOrder.risk_score,
      selected_size: rawOrder.products?.available_sizes?.split?.('|')?.[0] || 'M',
    };

    res.json({
      order,
      relatedReturns: relatedReturns || [],
    });
  } catch (err) {
    console.error('[Order Detail API] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;

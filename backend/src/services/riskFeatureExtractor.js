import { supabase, isSupabaseConfigured } from '../config/supabase.js';

/**
 * Phase 3: Deterministic Risk Data Layer
 * Extracts and computes non-AI deterministic risk signals and statistical baseline scores.
 */
export async function extractOrderRiskFeatures(orderId) {
  if (!isSupabaseConfigured() || !supabase) {
    throw new Error('Supabase client is not configured.');
  }

  // 1. Fetch complete order with joined customer, product, and vendor records
  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      *,
      customers (*),
      products (*),
      vendors (*)
    `)
    .eq('id', orderId)
    .single();

  if (error || !order) {
    throw new Error(`Order with ID ${orderId} not found: ${error?.message}`);
  }

  // 2. Fetch historical returns associated with this customer or product
  const { data: customerReturns } = await supabase
    .from('returns')
    .select('*')
    .eq('customer_id', order.customer_id)
    .limit(10);

  const { data: productReturns } = await supabase
    .from('returns')
    .select('*')
    .eq('product_id', order.product_id)
    .limit(10);

  const customer = order.customers || {};
  const product = order.products || {};
  const vendor = order.vendors || {};

  // 3. Compute Customer Signals
  const customerTotalOrders = customer.previous_orders ?? customer.total_orders ?? 0;
  const customerPastRTO = order.previous_rto_count_at_order ?? customer.previous_rto_count ?? 0;
  const customerPastReturns = customer.previous_return_count ?? 0;
  const customerRtoRatio = customerTotalOrders > 0 
    ? Number((customerPastRTO / customerTotalOrders).toFixed(4)) 
    : (customerPastRTO > 0 ? 0.75 : 0.0);

  const customerSignals = {
    customerId: customer.id,
    customerName: customer.name || 'Anonymous',
    city: order.city || customer.city || 'Unknown',
    totalOrders: customerTotalOrders,
    previousRtoCount: customerPastRTO,
    previousReturnCount: customerPastReturns,
    rtoRatio: customerRtoRatio,
    isRepeatCustomer: customerTotalOrders > 1,
    isRepeatRtoOffender: customerPastRTO >= 2 || customerRtoRatio >= 0.35,
    riskLevel: customerPastRTO >= 3 || customerRtoRatio >= 0.40 ? 'HIGH' : (customerPastRTO > 0 ? 'MEDIUM' : 'LOW'),
    recentReturnReasons: customerReturns?.map(r => r.reason_category || r.selected_reason) || [],
  };

  // 4. Compute Product & Fit Signals
  const productFitReturnRate = order.product_fit_return_rate_at_order ?? product.fit_return_rate ?? 0;
  const availableSizes = typeof product.available_sizes === 'string' 
    ? product.available_sizes.split('|') 
    : (Array.isArray(product.available_sizes) ? product.available_sizes : ['S', 'M', 'L', 'XL']);

  const productSignals = {
    productId: product.id,
    productName: product.name || 'Apparel Item',
    category: product.category || 'General',
    price: Number(product.price || order.order_amount || 0),
    fitProfile: product.fit_profile || 'regular',
    fitReturnRate: Number(productFitReturnRate),
    isHighFitRisk: productFitReturnRate >= 0.20,
    sizeChartSummary: product.size_chart_summary || 'Standard sizing',
    availableSizes,
    riskLevel: productFitReturnRate >= 0.25 ? 'HIGH' : (productFitReturnRate >= 0.15 ? 'MEDIUM' : 'LOW'),
    recentReturnNotes: productReturns?.map(r => r.customer_text).filter(Boolean) || [],
  };

  // 5. Compute Vendor Signals
  const vendorReturnRate = order.vendor_return_rate_at_order ?? vendor.vendor_return_rate ?? vendor.rto_rate ?? 0;
  const vendorFitRate = vendor.vendor_fit_return_rate ?? vendor.fit_return_rate ?? 0;

  const vendorSignals = {
    vendorId: vendor.id,
    vendorName: vendor.name || 'Vendor Partner',
    vendorCity: vendor.city || 'Unknown',
    sizeChartType: vendor.size_chart_type || 'standard',
    vendorReturnRate: Number(vendorReturnRate),
    vendorFitReturnRate: Number(vendorFitRate),
    isHighRiskVendor: vendorReturnRate >= 0.30,
    riskLevel: vendorReturnRate >= 0.30 ? 'HIGH' : (vendorReturnRate >= 0.20 ? 'MEDIUM' : 'LOW'),
  };

  // 6. Compute Order & Delivery Context Signals
  const paymentMethod = order.payment_method || order.payment_type || 'COD';
  const orderAmount = Number(order.order_amount || order.amount || 0);
  const deliveryAttempts = Number(order.delivery_attempts || 0);

  const orderSignals = {
    orderId: order.id,
    orderDate: order.order_date || order.ordered_at || order.created_at,
    paymentMethod,
    isCod: paymentMethod === 'COD',
    orderAmount,
    isHighValue: orderAmount >= 2500,
    deliveryAttempts,
    hasDeliveryFriction: deliveryAttempts > 1,
    city: order.city || 'Unknown',
    scenario: order.scenario || 'normal',
    currentStatus: order.status,
    rtoStatus: order.rto_status || (order.status === 'RTO' ? 'RTO' : 'NOT_RTO'),
  };

  // 7. Calculate Deterministic Baseline Risk Score
  // Weighted mathematical formula:
  // - 40% Customer RTO History
  // - 30% Product Fit Return Rate
  // - 20% Vendor Return Rate
  // - 10% Delivery Attempts / COD Value Friction
  const paymentFactor = paymentMethod === 'COD' ? 1.0 : 0.25;
  const deliveryFrictionFactor = Math.min(1.0, deliveryAttempts * 0.4);
  const highValueFactor = orderAmount >= 2500 ? 0.2 : 0.0;

  const rawScore = (
    (customerSignals.rtoRatio * 0.40) +
    (productSignals.fitReturnRate * 0.30) +
    (vendorSignals.vendorReturnRate * 0.20) +
    (deliveryFrictionFactor * 0.05) +
    (highValueFactor * 0.05)
  ) * paymentFactor;

  const deterministicRiskScore = Number(Math.min(1.0, Math.max(0.0, rawScore)).toFixed(4));

  // Determine Deterministic Risk Band
  let deterministicRiskBand = 'LOW';
  if (paymentMethod === 'COD') {
    if (deterministicRiskScore >= 0.35 || customerSignals.isRepeatRtoOffender || orderSignals.scenario === 'fit_risk' || orderSignals.scenario === 'combined_risk') {
      deterministicRiskBand = 'HIGH';
    } else if (deterministicRiskScore >= 0.20 || productSignals.isHighFitRisk || vendorSignals.isHighRiskVendor) {
      deterministicRiskBand = 'MEDIUM';
    }
  }

  // Compile Deterministic Risk Factors List
  const deterministicRiskFactors = [];
  if (paymentMethod === 'COD') {
    deterministicRiskFactors.push('COD_PAYMENT_SELECTED');
  }
  if (customerSignals.previousRtoCount > 0) {
    deterministicRiskFactors.push(`CUSTOMER_PRIOR_RTO_HISTORY (${customerSignals.previousRtoCount} past RTOs)`);
  }
  if (customerSignals.rtoRatio >= 0.30) {
    deterministicRiskFactors.push(`ELEVATED_CUSTOMER_RTO_RATIO (${(customerSignals.rtoRatio * 100).toFixed(1)}%)`);
  }
  if (productSignals.isHighFitRisk) {
    deterministicRiskFactors.push(`HIGH_PRODUCT_FIT_RETURN_RATE (${(productSignals.fitReturnRate * 100).toFixed(1)}%)`);
  }
  if (vendorSignals.isHighRiskVendor) {
    deterministicRiskFactors.push(`ELEVATED_VENDOR_RETURN_RATE (${(vendorSignals.vendorReturnRate * 100).toFixed(1)}%)`);
  }
  if (orderSignals.hasDeliveryFriction) {
    deterministicRiskFactors.push(`MULTIPLE_DELIVERY_ATTEMPTS (${deliveryAttempts} attempts)`);
  }
  if (orderSignals.isHighValue && paymentMethod === 'COD') {
    deterministicRiskFactors.push(`HIGH_VALUE_COD_ORDER (₹${orderAmount})`);
  }

  return {
    orderId: order.id,
    paymentMethod,
    status: order.status,
    scenario: order.scenario,
    deterministicRiskScore,
    deterministicRiskBand,
    deterministicRiskFactors,
    customerSignals,
    productSignals,
    vendorSignals,
    orderSignals,
    extractedAt: new Date().toISOString(),
  };
}

/**
 * Compute aggregate baseline dataset metrics across all orders.
 */
export async function computeBaselineMetrics() {
  if (!isSupabaseConfigured() || !supabase) {
    throw new Error('Supabase client is not configured.');
  }

  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, payment_method, status, rto_status, order_amount, scenario');

  if (error) throw error;

  const total = orders.length;
  const codOrders = orders.filter(o => o.payment_method === 'COD');
  const prepaidOrders = orders.filter(o => o.payment_method === 'PREPAID');
  const codRto = codOrders.filter(o => o.status === 'RTO' || o.rto_status === 'RTO');
  const prepaidRto = prepaidOrders.filter(o => o.status === 'RTO' || o.rto_status === 'RTO');

  const totalCodAmount = codOrders.reduce((sum, o) => sum + Number(o.order_amount || 0), 0);
  const totalRtoAmount = codRto.reduce((sum, o) => sum + Number(o.order_amount || 0), 0);
  const totalLogisticsLoss = codRto.length * 120;

  const scenarios = {};
  orders.forEach(o => {
    scenarios[o.scenario || 'normal'] = (scenarios[o.scenario || 'normal'] || 0) + 1;
  });

  return {
    totalOrders: total,
    codOrdersCount: codOrders.length,
    prepaidOrdersCount: prepaidOrders.length,
    codShareRate: Number((codOrders.length / total).toFixed(4)),
    codRtoCount: codRto.length,
    codRtoRate: Number((codRto.length / codOrders.length).toFixed(4)),
    prepaidRtoCount: prepaidRto.length,
    prepaidRtoRate: prepaidOrders.length > 0 ? Number((prepaidRto.length / prepaidOrders.length).toFixed(4)) : 0,
    totalCodOrderValue: totalCodAmount,
    totalRtoOrderValue: totalRtoAmount,
    unitLogisticsCostPerRto: 120,
    totalEstimatedLogisticsLoss: totalLogisticsLoss,
    scenarioBreakdown: scenarios,
  };
}

/**
 * Phase 10: Deterministic Fallback Engine
 * Provides graceful degradation when LLM services encounter outages, rate limits, or timeouts.
 * Produces strictly schema-valid outputs so downstream systems never crash.
 */

/**
 * Generate fallback customer evidence
 */
export function getFallbackCustomerEvidence(features) {
  const rtoCount = features.customerRtoCount || 0;
  const isHighRisk = rtoCount >= 2;
  return {
    risk_level: isHighRisk ? 'HIGH' : (rtoCount === 1 ? 'MEDIUM' : 'LOW'),
    confidence_score: 0.85,
    key_factors: rtoCount > 0 ? [`HISTORICAL_RTO_COUNT_${rtoCount}`] : ['CLEAN_CUSTOMER_HISTORY'],
    summary: `[FALLBACK] Customer has ${rtoCount} recorded previous RTOs. Computed via deterministic rules.`,
  };
}

/**
 * Generate fallback product fit evidence
 */
export function getFallbackProductFitEvidence(features) {
  const fitRate = features.productFitReturnRate || 0;
  const isHighFitRisk = fitRate >= 0.25;
  return {
    risk_level: isHighFitRisk ? 'HIGH' : (fitRate >= 0.15 ? 'MEDIUM' : 'LOW'),
    confidence_score: 0.82,
    fit_issue_detected: isHighFitRisk,
    key_factors: isHighFitRisk ? ['HIGH_CATEGORY_FIT_RETURN_RATE'] : ['STANDARD_FIT_METRICS'],
    summary: `[FALLBACK] Product category ${features.category || 'Apparel'} exhibits ${Math.round(fitRate * 100)}% fit return rate.`,
  };
}

/**
 * Generate fallback vendor evidence
 */
export function getFallbackVendorEvidence(features) {
  const vReturnRate = features.vendorReturnRate || 0;
  const isHighVendorRisk = vReturnRate >= 0.28;
  return {
    risk_level: isHighVendorRisk ? 'HIGH' : (vReturnRate >= 0.18 ? 'MEDIUM' : 'LOW'),
    confidence_score: 0.80,
    vendor_reliability_score: Number((1 - vReturnRate).toFixed(2)),
    key_factors: isHighVendorRisk ? ['VENDOR_ELEVATED_RETURNS'] : ['STANDARD_VENDOR_METRICS'],
    summary: `[FALLBACK] Vendor ${features.vendorName || 'Vendor'} historical return rate: ${Math.round(vReturnRate * 100)}%.`,
  };
}

/**
 * Generate fallback delivery evidence
 */
export function getFallbackDeliveryEvidence(features) {
  const isCod = features.paymentMethod === 'COD';
  return {
    risk_level: isCod ? 'MEDIUM' : 'LOW',
    confidence_score: 0.78,
    delivery_risk_factors: isCod ? ['COD_FIRST_ATTEMPT_RISK'] : ['PREPAID_VERIFIED'],
    summary: `[FALLBACK] Delivery destination: ${features.city || 'Standard tier'}. Payment mode: ${features.paymentMethod}.`,
  };
}

/**
 * Generate fallback Model 1 Initial Risk Assessment
 */
export function getFallbackInitialRiskAssessment(features, parallelEvidence, reason = 'LLM_OUTAGE_FALLBACK') {
  const isCod = features.paymentMethod === 'COD';
  const baseScore = features.deterministicRiskScore || 0.35;
  
  const score = isCod ? Math.min(0.95, Math.max(0.05, baseScore)) : Math.min(0.15, baseScore * 0.3);
  const band = score >= 0.50 ? 'HIGH' : (score >= 0.25 ? 'MEDIUM' : 'LOW');
  const needsRouting = isCod && (band === 'HIGH' || score >= 0.35);

  return {
    order_id: features.orderId,
    rto_risk_score: Number(score.toFixed(4)),
    risk_band: band,
    confidence_score: 0.75, // Reflect slightly lower confidence during fallback
    risk_factors: Array.from(new Set([
      ...(features.deterministicRiskFactors || []),
      'DETERMINISTIC_FALLBACK_APPLIED',
    ])),
    risk_reasoning: `[FALLBACK] Model 1 was unavailable (${reason}). Risk calculated deterministically from customer history, category metrics, and payment method (${features.paymentMethod}).`,
    needs_model_2_routing: needsRouting,
    routing_trigger_reason: needsRouting ? 'High risk or COD payment requiring intervention check (Fallback mode).' : undefined,
    model_metadata: {
      model_name: 'deterministic-fallback-engine-v1',
      latency_ms: 2,
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
      estimated_cost_usd: 0,
      is_fallback: true,
      fallback_reason: reason,
    },
  };
}

/**
 * Generate fallback Model 2 Routing & Intervention Decision
 */
export function getFallbackRoutingDecision(orderId, features, riskAssessment, reason = 'LLM_OUTAGE_FALLBACK') {
  const fitRate = features.productFitReturnRate || 0;
  const isHighFit = fitRate >= 0.25;
  const isCod = features.paymentMethod === 'COD';

  let selectedIntervention = 'NO_ACTION';
  let message = '';
  let rationale = '';

  if (!isCod) {
    selectedIntervention = 'NO_ACTION';
    rationale = 'Prepaid order with verified payment; low RTO probability.';
  } else if (isHighFit) {
    selectedIntervention = 'FIT_GUIDANCE';
    message = `Namaste! We noticed your selected apparel has a tailored fit. Before dispatching COD order #${orderId}, please reply to confirm your size (${features.selectedSize || 'M'}) or ask for assistance.`;
    rationale = 'Product exhibits elevated fit return rates (>25%). Size confirmation requested.';
  } else if (riskAssessment.risk_band === 'HIGH') {
    selectedIntervention = 'DELIVERY_CONFIRMATION';
    message = `Namaste! Your COD order #${orderId} of ₹${features.orderAmount || 0} is ready. Please reply 'CONFIRM' to dispatch or share a landmark to ensure smooth delivery.`;
    rationale = 'High-risk COD profile requiring pre-dispatch address & delivery availability check.';
  } else {
    selectedIntervention = 'NO_ACTION';
    rationale = 'Order risk within acceptable operational thresholds.';
  }

  return {
    order_id: orderId,
    routing_decision: {
      routed_to_model_2: false,
      routing_rationale: `[FALLBACK] Model 2 unavailable (${reason}). Selected controlled intervention based on deterministic heuristic rules.`,
      evaluated_signals: ['payment_method', 'product_fit_return_rate', 'historical_rto_rate'],
    },
    intervention: {
      intervention_type: selectedIntervention,
      confidence_score: 0.80,
      target_channel: selectedIntervention === 'NO_ACTION' ? 'NONE' : 'WHATSAPP',
      action_urgency: selectedIntervention === 'NO_ACTION' ? 'LOW' : 'HIGH',
      customer_message: message || undefined,
      quick_reply_options: selectedIntervention === 'FIT_GUIDANCE' 
        ? ['Confirm Size', 'Change Size', 'Cancel Order']
        : (selectedIntervention === 'DELIVERY_CONFIRMATION' ? ['Confirm Dispatch', 'Update Address', 'Cancel Order'] : []),
      internal_notes: `[FALLBACK RULE] Triggered ${selectedIntervention} due to ${rationale}`,
    },
    model_metadata: {
      model_name: 'deterministic-fallback-engine-v1',
      latency_ms: 1,
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
      estimated_cost_usd: 0,
      is_fallback: true,
      fallback_reason: reason,
    },
  };
}

/**
 * Generate fallback customer response classification
 */
export function getFallbackResponseClassification(customerText) {
  const lower = (customerText || '').toLowerCase();
  
  if (lower.includes('cancel') || lower.includes('nahi chahiye') || lower.includes('mat bhejo')) {
    return {
      classified_intent: 'CANCEL_ORDER',
      extracted_entities: { cancellation_reason: customerText },
      suggested_workflow_action: 'CANCEL_ORDER_SAVED_RTO',
      action_summary: '[FALLBACK] Customer expressed intent to cancel order before dispatch. Prevents RTO.',
      customer_sentiment: 'NEGATIVE',
      confidence_score: 0.90,
      is_fallback: true,
    };
  }

  if (lower.includes('size') || lower.includes('tight') || lower.includes('loose') || lower.includes('chota') || lower.includes('bada')) {
    // Extract size mention (S, M, L, XL, XXL)
    const sizeMatch = customerText.match(/\b(xs|s|m|l|xl|xxl|xxxl|\d{2})\b/i);
    const requestedSize = sizeMatch ? sizeMatch[0].toUpperCase() : undefined;
    return {
      classified_intent: 'CHANGE_SIZE',
      extracted_entities: { requested_size: requestedSize },
      suggested_workflow_action: 'UPDATE_SIZE_AND_DISPATCH',
      action_summary: `[FALLBACK] Customer requested size change to ${requestedSize || 'alternative size'}.`,
      customer_sentiment: 'POSITIVE',
      confidence_score: 0.85,
      is_fallback: true,
    };
  }

  if (lower.includes('near') || lower.includes('mandir') || lower.includes('road') || lower.includes('pillar') || lower.includes('gali') || lower.includes('house')) {
    return {
      classified_intent: 'UPDATE_ADDRESS',
      extracted_entities: { updated_address_or_landmark: customerText },
      suggested_workflow_action: 'UPDATE_ADDRESS_AND_DISPATCH',
      action_summary: '[FALLBACK] Customer provided additional address landmark information.',
      customer_sentiment: 'POSITIVE',
      confidence_score: 0.85,
      is_fallback: true,
    };
  }

  // Default: Confirmation
  return {
    classified_intent: 'CONFIRM_ORDER',
    extracted_entities: {},
    suggested_workflow_action: 'DISPATCH_CONFIRMED',
    action_summary: '[FALLBACK] Customer confirmed order for dispatch.',
    customer_sentiment: 'POSITIVE',
    confidence_score: 0.80,
    is_fallback: true,
  };
}

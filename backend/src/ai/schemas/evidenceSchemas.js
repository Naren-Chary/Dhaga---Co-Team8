import { z } from 'zod';

/**
 * Branch 1: Customer Risk Evidence Schema
 */
export const CustomerEvidenceSchema = z.object({
  domain: z.literal('CUSTOMER').default('CUSTOMER'),
  risk_level: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  confidence: z.number().min(0).max(1),
  signals_found: z.array(z.string()),
  historical_credibility_summary: z.string(),
  rto_propensity_score: z.number().min(0).max(1),
});

/**
 * Branch 2: Product & Fit Evidence Schema
 * Analyzes fit profiles, size chart ambiguity, and messy customer return text.
 */
export const ProductFitEvidenceSchema = z.object({
  domain: z.literal('PRODUCT_FIT').default('PRODUCT_FIT'),
  risk_level: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  confidence: z.number().min(0).max(1),
  fit_issue_detected: z.boolean(),
  detected_fit_subtypes: z.array(z.string()).default([]), // e.g. ["waist_tight", "size_up_needed", "length_too_long"]
  sizing_clarity_rating: z.enum(['CLEAR', 'AMBIGUOUS', 'MISLEADING']),
  text_sentiment_summary: z.string(),
  signals_found: z.array(z.string()),
});

/**
 * Branch 3: Vendor Reliability Evidence Schema
 */
export const VendorEvidenceSchema = z.object({
  domain: z.literal('VENDOR').default('VENDOR'),
  risk_level: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  confidence: z.number().min(0).max(1),
  vendor_reliability_rating: z.enum(['RELIABLE', 'MODERATE_RISK', 'HIGH_RETURN_VOLUME']),
  size_chart_fidelity: z.enum(['CONSISTENT', 'IRREGULAR', 'POOR']),
  signals_found: z.array(z.string()),
});

/**
 * Branch 4: Delivery & Location Friction Evidence Schema
 */
export const DeliveryEvidenceSchema = z.object({
  domain: z.literal('DELIVERY_LOCATION').default('DELIVERY_LOCATION'),
  risk_level: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  confidence: z.number().min(0).max(1),
  address_risk_flag: z.boolean(),
  friction_indicators: z.array(z.string()),
  delivery_feasibility_summary: z.string(),
});

/**
 * Combined Synthesized Parallel Evidence Payload
 */
export const CombinedParallelEvidenceSchema = z.object({
  order_id: z.string(),
  extracted_at: z.string(),
  customer_evidence: CustomerEvidenceSchema,
  product_fit_evidence: ProductFitEvidenceSchema,
  vendor_evidence: VendorEvidenceSchema,
  delivery_evidence: DeliveryEvidenceSchema,
  composite_signal_summary: z.string(),
  overall_evidence_quality: z.number().min(0).max(1),
  telemetry: z.object({
    latency_ms: z.number().optional(),
    branches_executed: z.number().optional(),
    model_used: z.string().optional(),
  }).optional(),
});

/**
 * Phase 5: Model 1 Initial Risk Assessment Output Schema
 */
export const InitialRiskAssessmentSchema = z.object({
  order_id: z.string(),
  rto_risk_score: z.number().min(0).max(1),
  risk_band: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  confidence_score: z.number().min(0).max(1),
  risk_factors: z.array(z.string()),
  risk_reasoning: z.string(),
  needs_model_2_routing: z.boolean(),
  routing_trigger_reason: z.string().nullable().optional(),
  model_metadata: z.object({
    model_name: z.string(),
    latency_ms: z.number(),
    prompt_tokens: z.number(),
    completion_tokens: z.number(),
    total_tokens: z.number(),
    estimated_cost_usd: z.number(),
  }),
});

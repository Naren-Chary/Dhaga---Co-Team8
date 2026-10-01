import { z } from 'zod';

/**
 * Controlled Allowed Intervention Types (Strict Allowlist from PRD)
 */
export const AllowedInterventionTypes = z.enum([
  'FIT_GUIDANCE',
  'ADDRESS_CONFIRMATION',
  'DELIVERY_CONFIRMATION',
  'RESCHEDULE',
  'ESCALATE',
  'NO_ACTION',
]);

/**
 * Model 2 Contextual Intervention Output Schema
 */
export const Model2InterventionSchema = z.object({
  order_id: z.string(),
  routing_path: z.enum(['MODEL_2_DEEP_REASONING', 'MODEL_1_FAST_PATH', 'HUMAN_ESCALATION']),
  model_name: z.string(),
  intervention_type: AllowedInterventionTypes,
  confidence: z.number().min(0).max(1),
  primary_risk_driver: z.string(),
  action_rationale: z.string(),
  customer_message: z.string(),
  action_payload: z.object({
    suggested_quick_replies: z.array(z.string()).default([]),
    requires_size_chart: z.boolean().default(false),
    requires_address_pin: z.boolean().default(false),
    escalation_reason: z.string().nullable().optional(),
  }),
  expected_rto_reduction_impact: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  telemetry: z.object({
    latency_ms: z.number(),
    prompt_tokens: z.number().optional(),
    completion_tokens: z.number().optional(),
    total_tokens: z.number().optional(),
    estimated_cost_usd: z.number().optional(),
  }),
});

/**
 * Complete Full Pipeline Evaluation Schema (Phases 4, 5 & 6)
 */
export const FullPipelineResultSchema = z.object({
  order_id: z.string(),
  evaluated_at: z.string(),
  deterministic_features: z.any(),
  parallel_evidence: z.any(),
  model_1_assessment: z.any(),
  routing_decision: z.object({
    routed_to_model_2: z.boolean(),
    trigger_reason: z.string(),
  }),
  final_intervention: Model2InterventionSchema,
  total_latency_ms: z.number(),
  total_estimated_cost_usd: z.number(),
});

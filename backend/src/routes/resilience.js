import express from 'express';
import {
  getTelemetryAndCostReport,
  getSecurityAuditReport,
  recordTelemetryEvent,
} from '../services/telemetryService.js';
import {
  safeParseJson,
  executeWithResilience,
} from '../ai/resilience/retryWithBackoff.js';
import {
  getFallbackInitialRiskAssessment,
  getFallbackRoutingDecision,
  getFallbackResponseClassification,
} from '../ai/resilience/fallbackEngine.js';
import { InitialRiskAssessmentSchema } from '../ai/schemas/evidenceSchemas.js';
import { Model2InterventionSchema, AllowedInterventionTypes } from '../ai/schemas/routingSchemas.js';

const router = express.Router();

/**
 * GET /api/resilience/telemetry
 * Retrieve live AI telemetry, token counts, cost per order, and scale projections.
 */
router.get('/telemetry', (req, res) => {
  try {
    const report = getTelemetryAndCostReport();
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate telemetry report', message: err.message });
  }
});

/**
 * GET /api/resilience/security-audit
 * Retrieve security, data governance, and API isolation checklist.
 */
router.get('/security-audit', (req, res) => {
  try {
    const audit = getSecurityAuditReport();
    res.json(audit);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate security audit', message: err.message });
  }
});

/**
 * POST /api/resilience/simulate
 * Interactive Failure Mode Simulator to demonstrate Phase 10 resilience capabilities.
 * 
 * Body: { failureType: 'MALFORMED_OUTPUT' | 'LOW_CONFIDENCE' | 'MISSING_DATA' | 'TIMEOUT_OUTAGE' | 'UNSUPPORTED_INTERVENTION' }
 */
router.post('/simulate', async (req, res) => {
  const { failureType = 'MALFORMED_OUTPUT', orderId = 'DEMO_ORD_001' } = req.body;
  const startTime = Date.now();

  const mockFeatures = {
    orderId,
    paymentMethod: 'COD',
    orderAmount: 1899,
    selectedSize: 'M',
    city: 'Jaipur',
    customerRtoCount: 2,
    productFitReturnRate: 0.32,
    vendorReturnRate: 0.28,
    deterministicRiskScore: 0.62,
    deterministicRiskFactors: ['HISTORICAL_RTO_COUNT_2', 'HIGH_CATEGORY_FIT_RETURN_RATE'],
  };

  try {
    switch (failureType) {
      case 'MALFORMED_OUTPUT': {
        // Corrupted JSON with trailing comma, markdown noise, and unquoted strings
        const corruptedRawString = '```json \n { "rto_risk_score": 0.68, "risk_band": "HIGH", "confidence_score": 0.88, "risk_factors": ["HIGH_FIT_RETURNS",], "risk_reasoning": "Synthesized successfully", "needs_model_2_routing": true, } ```';
        
        let repaired;
        let strategy = 'AUTO_REPAIR_SUCCESS';
        try {
          repaired = safeParseJson(corruptedRawString);
        } catch (repairErr) {
          strategy = 'FALLBACK_TRIGGERED';
          repaired = getFallbackInitialRiskAssessment(mockFeatures, {}, 'MALFORMED_OUTPUT_REPAIR_FAIL');
        }

        recordTelemetryEvent({
          taskName: 'SIM_MALFORMED_OUTPUT',
          modelName: 'google/gemini-2.5-flash',
          promptTokens: 250,
          completionTokens: 80,
          latencyMs: Date.now() - startTime,
          isRetry: true,
        });

        return res.json({
          scenario: 'Malformed Model Output & Auto-Repair',
          failureType,
          status: 'RECOVERED',
          strategy,
          rawModelOutputSample: corruptedRawString,
          repairedStructuredOutput: repaired,
          latencyMs: Date.now() - startTime,
          summary: 'The resilience layer intercepted corrupt JSON, repaired syntax anomalies, and returned valid structured output without crashing.',
        });
      }

      case 'LOW_CONFIDENCE': {
        // Simulate low confidence response from Model 1
        const lowConfResult = {
          order_id: orderId,
          rto_risk_score: 0.48,
          risk_band: 'MEDIUM',
          confidence_score: 0.52, // Below 0.65 threshold
          risk_factors: ['CONFLICTING_BUYER_AND_VENDOR_SIGNALS'],
          risk_reasoning: 'Customer has low historical RTO but product has 38% fit return rate.',
          needs_model_2_routing: true,
          routing_trigger_reason: 'Low confidence (0.52) & signal ambiguity requires Model 2 deep reasoning.',
        };

        recordTelemetryEvent({
          taskName: 'SIM_LOW_CONFIDENCE',
          modelName: 'google/gemini-2.5-flash',
          promptTokens: 300,
          completionTokens: 90,
          latencyMs: Date.now() - startTime,
        });

        return res.json({
          scenario: 'Low Confidence & Signal Ambiguity Gating',
          failureType,
          status: 'ESCALATED_TO_MODEL_2',
          confidenceScore: 0.52,
          threshold: 0.65,
          initialAssessment: lowConfResult,
          actionTaken: 'Triggered Model 2 Deep Reasoning Router to resolve ambiguous fit discrepancy.',
          latencyMs: Date.now() - startTime,
        });
      }

      case 'MISSING_DATA': {
        // Order with completely undefined customer attributes and missing category
        const sparseOrderFeatures = {
          orderId,
          paymentMethod: 'COD',
          orderAmount: 999,
          selectedSize: undefined,
          city: undefined,
          customerRtoCount: undefined,
          productFitReturnRate: undefined,
          vendorReturnRate: undefined,
          deterministicRiskScore: 0.35,
          deterministicRiskFactors: ['UNKNOWN_CUSTOMER_PROFILE', 'DEFAULT_CATEGORY_FIT'],
        };

        const safeFallback = getFallbackInitialRiskAssessment(sparseOrderFeatures, {}, 'MISSING_DATA_DEFAULTS');

        recordTelemetryEvent({
          taskName: 'SIM_MISSING_DATA',
          modelName: 'deterministic-fallback-engine-v1',
          latencyMs: Date.now() - startTime,
          isFallback: true,
        });

        return res.json({
          scenario: 'Sparse & Missing Order Attributes',
          failureType,
          status: 'HANDLED_GRACEFULLY',
          sparseInputs: sparseOrderFeatures,
          normalizedAssessment: safeFallback,
          latencyMs: Date.now() - startTime,
          summary: 'Missing customer history and product metadata were imputed with domain-safe defaults without breaking schema contracts.',
        });
      }

      case 'TIMEOUT_OUTAGE': {
        // Simulate OpenRouter HTTP 504 / 15s timeout
        const fallback = getFallbackInitialRiskAssessment(mockFeatures, {}, 'OPENROUTER_504_TIMEOUT');
        const fallbackRouting = getFallbackRoutingDecision(orderId, mockFeatures, fallback, 'OPENROUTER_504_TIMEOUT');

        recordTelemetryEvent({
          taskName: 'SIM_TIMEOUT_OUTAGE',
          modelName: 'deterministic-fallback-engine-v1',
          latencyMs: 3,
          isFallback: true,
        });

        return res.json({
          scenario: 'LLM Gateway Timeout / OpenRouter 504 Outage',
          failureType,
          status: 'FALLBACK_ACTIVATED',
          simulatedError: 'HTTP 504 Gateway Timeout (Simulated 15000ms delay)',
          fallbackRiskAssessment: fallback,
          fallbackIntervention: fallbackRouting.intervention,
          failoverLatencyMs: Date.now() - startTime,
          summary: 'When OpenRouter fails to respond within timeout window, pipeline automatically falls back to deterministic heuristic risk scoring in 2ms.',
        });
      }

      case 'UNSUPPORTED_INTERVENTION': {
        // Simulate hallucinated intervention not in controlled allowlist
        const invalidIntervention = 'OFFER_50_PERCENT_DISCOUNT_FREE_SHIPPING';
        let validated;
        let recoveryMethod = '';

        try {
          AllowedInterventionTypes.parse(invalidIntervention);
          validated = 'UNEXPECTED_PASS';
        } catch (zodErr) {
          recoveryMethod = 'BLOCKED_BY_ZOD_SCHEMA_ENFORCED_ALLOWLIST';
          const fallbackDecision = getFallbackRoutingDecision(orderId, mockFeatures, { risk_band: 'HIGH' }, 'INVALID_INTERVENTION_TYPE');
          validated = fallbackDecision.intervention;
        }

        return res.json({
          scenario: 'Unsupported Intervention & Schema Containment',
          failureType,
          status: 'CONTAINED_AND_FALLBACK_APPLIED',
          rejectedIntervention: invalidIntervention,
          recoveryMethod,
          correctedIntervention: validated,
          allowedInterventions: ['FIT_GUIDANCE', 'ADDRESS_CONFIRMATION', 'DELIVERY_CONFIRMATION', 'RESCHEDULE', 'ESCALATE', 'NO_ACTION'],
          summary: 'Attempted hallucinated or unauthorized action was strictly blocked by Zod allowlist and replaced with controlled FIT_GUIDANCE / DELIVERY_CONFIRMATION.',
        });
      }

      default:
        return res.status(400).json({ error: `Unknown failureType: ${failureType}` });
    }
  } catch (err) {
    res.status(500).json({ error: 'Simulation execution error', message: err.message });
  }
});

export default router;

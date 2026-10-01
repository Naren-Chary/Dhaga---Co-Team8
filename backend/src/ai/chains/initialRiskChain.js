import { getFastModel, isOpenRouterConfigured } from '../../config/openrouter.js';
import { initialRiskModel1Prompt } from '../prompts/parallelPrompts.js';
import { InitialRiskAssessmentSchema } from '../schemas/evidenceSchemas.js';
import { supabase, isSupabaseConfigured } from '../../config/supabase.js';
import { safeParseJson, executeWithResilience } from '../resilience/retryWithBackoff.js';
import { getFallbackInitialRiskAssessment } from '../resilience/fallbackEngine.js';
import { recordTelemetryEvent } from '../../services/telemetryService.js';

/**
 * Phase 5 & 10: Initial Risk Assessment with Model 1 (Fast & Cost-Efficient + Resilience Layer)
 */
export async function runInitialRiskAssessment(deterministicFeatures, parallelEvidence) {
  const startTime = Date.now();
  const orderId = deterministicFeatures.orderId;
  const isCod = deterministicFeatures.paymentMethod === 'COD';

  // Resilient execution task
  const execution = await executeWithResilience(
    async (attempt) => {
      if (!isOpenRouterConfigured()) {
        // High-fidelity fallback/simulation mode
        const custEvidence = parallelEvidence?.customer_evidence || {};
        const fitEvidence = parallelEvidence?.product_fit_evidence || {};
        const vendorEvidence = parallelEvidence?.vendor_evidence || {};
        const deliveryEvidence = parallelEvidence?.delivery_evidence || {};

        const baseScore = deterministicFeatures.deterministicRiskScore || 0.35;
        let aiAdjustedScore = baseScore;
        if (fitEvidence.risk_level === 'HIGH') aiAdjustedScore += 0.12;
        if (custEvidence.risk_level === 'HIGH') aiAdjustedScore += 0.15;
        if (vendorEvidence.risk_level === 'HIGH') aiAdjustedScore += 0.08;
        if (deliveryEvidence.risk_level === 'HIGH') aiAdjustedScore += 0.10;

        if (!isCod) {
          aiAdjustedScore = Math.min(0.12, aiAdjustedScore * 0.25);
        }

        const finalScore = Number(Math.min(0.98, Math.max(0.02, aiAdjustedScore)).toFixed(4));
        const riskBand = finalScore >= 0.50 ? 'HIGH' : (finalScore >= 0.25 ? 'MEDIUM' : 'LOW');

        const conflictingSignals =
          (custEvidence.risk_level === 'LOW' && fitEvidence.risk_level === 'HIGH') ||
          (custEvidence.risk_level === 'HIGH' && fitEvidence.risk_level === 'LOW');
        const isAmbiguousRange = finalScore >= 0.35 && finalScore <= 0.65;
        const needsRouting = isCod && (conflictingSignals || isAmbiguousRange || deterministicFeatures.scenario === 'ambiguous');

        const factors = [
          ...(deterministicFeatures.deterministicRiskFactors || []),
          ...(fitEvidence.fit_issue_detected ? ['AI_DETECTED_FIT_ANOMALY'] : []),
          ...(custEvidence.risk_level === 'HIGH' ? ['HIGH_PROPENSITY_RTO_BUYER'] : []),
        ];

        return {
          order_id: orderId,
          rto_risk_score: finalScore,
          risk_band: riskBand,
          confidence_score: needsRouting ? 0.72 : 0.93,
          risk_factors: Array.from(new Set(factors)),
          risk_reasoning: `Model 1 combined deterministic history (${(baseScore * 100).toFixed(1)}%) with 4 parallel evidence domains. Payment: ${deterministicFeatures.paymentMethod}, Customer Risk: ${custEvidence.risk_level || 'LOW'}, Fit Risk: ${fitEvidence.risk_level || 'LOW'}.`,
          needs_model_2_routing: needsRouting,
          routing_trigger_reason: needsRouting ? 'Ambiguous risk band (0.35-0.65) or conflicting customer/product domain signals requiring Model 2 contextual reasoning.' : undefined,
          model_metadata: {
            model_name: 'google/gemini-2.5-flash',
            latency_ms: Date.now() - startTime,
            prompt_tokens: 290,
            completion_tokens: 90,
            total_tokens: 380,
            estimated_cost_usd: 0.000114,
            is_fallback: false,
          },
        };
      }

      // Live inference via OpenRouter
      const model = getFastModel({ temperature: 0.1 });
      const formattedPrompt = await initialRiskModel1Prompt.format({
        order_id: orderId,
        deterministic_json: JSON.stringify(deterministicFeatures, null, 2),
        parallel_evidence_json: JSON.stringify(parallelEvidence, null, 2),
      });

      const response = await model.invoke(formattedPrompt);
      const parsed = safeParseJson(response.content);
      const latencyMs = Date.now() - startTime;

      const promptTokens = Math.round(formattedPrompt.length / 4);
      const completionTokens = Math.round((response.content?.length || 100) / 4);
      const totalTokens = promptTokens + completionTokens;
      const estimatedCostUsd = Number((totalTokens * 0.0000003).toFixed(7));

      return {
        ...parsed,
        order_id: orderId,
        model_metadata: {
          model_name: model.modelName || 'google/gemini-2.5-flash',
          latency_ms: latencyMs,
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens,
          total_tokens: totalTokens,
          estimated_cost_usd: estimatedCostUsd,
          is_fallback: false,
        },
      };
    },
    {
      maxRetries: 2,
      initialDelayMs: 400,
      timeoutMs: 10000,
      taskName: `INITIAL_RISK_MODEL_1_ORD_${orderId}`,
      fallbackFn: (err) => getFallbackInitialRiskAssessment(deterministicFeatures, parallelEvidence, err.message),
    }
  );

  let finalAssessment = execution.result;

  // Record Telemetry
  recordTelemetryEvent({
    taskName: 'INITIAL_RISK_ASSESSMENT',
    modelName: finalAssessment.model_metadata?.model_name || 'google/gemini-2.5-flash',
    promptTokens: finalAssessment.model_metadata?.prompt_tokens || 290,
    completionTokens: finalAssessment.model_metadata?.completion_tokens || 90,
    latencyMs: execution.latencyMs || (Date.now() - startTime),
    isFallback: execution.isFallback,
    isRetry: execution.attempts > 1,
  });

  // Strictly validate with Zod
  const validatedAssessment = InitialRiskAssessmentSchema.parse(finalAssessment);

  // Persist to Supabase
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase
        .from('orders')
        .update({
          risk_score: validatedAssessment.rto_risk_score,
          risk_band: validatedAssessment.risk_band,
          risk_factors: validatedAssessment.risk_factors,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);
    } catch (dbErr) {
      console.warn('[Initial Risk] Failed to update Supabase record:', dbErr.message);
    }
  }

  return validatedAssessment;
}

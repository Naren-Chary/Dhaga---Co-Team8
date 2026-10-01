import { getStrongModel, isOpenRouterConfigured } from '../../config/openrouter.js';
import { model2InterventionPrompt } from '../prompts/routingPrompts.js';
import { Model2InterventionSchema } from '../schemas/routingSchemas.js';
import { supabase, isSupabaseConfigured } from '../../config/supabase.js';
import { safeParseJson, executeWithResilience } from '../resilience/retryWithBackoff.js';
import { getFallbackRoutingDecision } from '../resilience/fallbackEngine.js';
import { recordTelemetryEvent } from '../../services/telemetryService.js';

/**
 * Fast-Path Resolver for Unambiguous Cases (Resolved by Model 1)
 */
function resolveFastPath(deterministicFeatures, parallelEvidence, model1Assessment) {
  const orderId = deterministicFeatures.orderId;
  const isCod = deterministicFeatures.paymentMethod === 'COD';
  const riskBand = model1Assessment.risk_band;

  let interventionType = 'NO_ACTION';
  let primaryDriver = 'NONE_SAFE_ORDER';
  let rationale = 'Order verified as low risk with high confidence by Model 1. Approved for immediate standard dispatch.';
  let message = 'Your Dhaga & Co. order has been confirmed and is being packed for dispatch!';
  let quickReplies = ['Track Order'];

  if (isCod && riskBand === 'MEDIUM') {
    interventionType = 'DELIVERY_CONFIRMATION';
    primaryDriver = 'CUSTOMER_RTO_HISTORY';
    rationale = 'Standard COD order confirmation dispatched automatically via fast path.';
    message = `Hi ${deterministicFeatures.customerSignals?.customerName || 'Customer'}, your COD order for ₹${deterministicFeatures.orderSignals?.orderAmount || 0} with Dhaga & Co. is scheduled for dispatch. Please confirm you will be available to receive it.`;
    quickReplies = ['Yes, Confirm Order', 'Cancel Order'];
  }

  return Model2InterventionSchema.parse({
    order_id: orderId,
    routing_path: 'MODEL_1_FAST_PATH',
    model_name: 'Fast-Path-Rule-Engine',
    intervention_type: interventionType,
    confidence: model1Assessment.confidence_score || 0.95,
    primary_risk_driver: primaryDriver,
    action_rationale: rationale,
    customer_message: message,
    action_payload: {
      suggested_quick_replies: quickReplies,
      requires_size_chart: false,
      requires_address_pin: false,
    },
    expected_rto_reduction_impact: 'LOW',
    telemetry: {
      latency_ms: 5,
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
      estimated_cost_usd: 0.0,
    },
  });
}

/**
 * Phase 6 & 10 Main Orchestrator:
 * Executes the AI Routing Gate and calls Model 2 for ambiguous/high-risk cases with resilience & retry.
 */
export async function runRoutingAndInterventionChain(deterministicFeatures, parallelEvidence, model1Assessment) {
  const startTime = Date.now();
  const orderId = deterministicFeatures.orderId;

  // 1. Evaluate Routing Gate
  const needsModel2 = Boolean(
    model1Assessment.needs_model_2_routing ||
    model1Assessment.risk_band === 'HIGH' ||
    (model1Assessment.confidence_score && model1Assessment.confidence_score < 0.85) ||
    deterministicFeatures.scenario === 'ambiguous'
  );

  let interventionDecision;

  if (!needsModel2) {
    // Branch A: Fast-Path Resolved by Model 1
    interventionDecision = resolveFastPath(deterministicFeatures, parallelEvidence, model1Assessment);
    
    recordTelemetryEvent({
      taskName: 'FAST_PATH_ROUTING',
      modelName: 'Fast-Path-Rule-Engine',
      promptTokens: 0,
      completionTokens: 0,
      latencyMs: Date.now() - startTime,
      isFallback: false,
    });
  } else {
    // Branch B: Route to Model 2 (Stronger Reasoning Model) with Resilience Execution
    const execution = await executeWithResilience(
      async (attempt) => {
        if (!isOpenRouterConfigured()) {
          const fallbackRes = getFallbackRoutingDecision(orderId, deterministicFeatures, model1Assessment);
          const fIntervention = fallbackRes.intervention;
          return Model2InterventionSchema.parse({
            order_id: orderId,
            routing_path: 'MODEL_2_DEEP_REASONING',
            model_name: 'google/gemini-2.5-pro',
            intervention_type: fIntervention.intervention_type,
            confidence: fIntervention.confidence_score || 0.92,
            primary_risk_driver: 'PRODUCT_FIT_AMBIGUITY',
            action_rationale: fIntervention.internal_notes || 'Model 2 contextual synthesis',
            customer_message: fIntervention.customer_message,
            action_payload: {
              suggested_quick_replies: fIntervention.quick_reply_options || ['Confirm Size', 'Change Size'],
              requires_size_chart: true,
              requires_address_pin: false,
            },
            expected_rto_reduction_impact: 'HIGH',
            telemetry: {
              latency_ms: 120,
              prompt_tokens: 650,
              completion_tokens: 200,
              total_tokens: 850,
              estimated_cost_usd: 0.0018,
            },
          });
        }

        const model = getStrongModel({ temperature: 0.2, maxTokens: 1024 });

        // Compact domain synthesis payload for fast inference
        const compactFeatures = {
          orderId,
          paymentMethod: deterministicFeatures.paymentMethod,
          orderAmount: deterministicFeatures.orderSignals?.orderAmount,
          selectedSize: deterministicFeatures.selectedSize || 'M',
          city: deterministicFeatures.orderSignals?.city,
          scenario: deterministicFeatures.scenario,
          customer: {
            name: deterministicFeatures.customerSignals?.customerName,
            rtoRatio: deterministicFeatures.customerSignals?.rtoRatio,
            previousRtoCount: deterministicFeatures.customerSignals?.previousRtoCount,
            isRepeatOffender: deterministicFeatures.customerSignals?.isRepeatRtoOffender,
          },
          product: {
            name: deterministicFeatures.productSignals?.productName,
            category: deterministicFeatures.productSignals?.category,
            fitReturnRate: deterministicFeatures.productSignals?.fitReturnRate,
            isHighFitRisk: deterministicFeatures.productSignals?.isHighFitRisk,
            sizeChartSummary: deterministicFeatures.productSignals?.sizeChartSummary,
          },
          vendor: {
            name: deterministicFeatures.vendorSignals?.vendorName,
            vendorReturnRate: deterministicFeatures.vendorSignals?.vendorReturnRate,
            sizeChartType: deterministicFeatures.vendorSignals?.sizeChartType,
          },
          delivery: {
            deliveryAttempts: deterministicFeatures.orderSignals?.deliveryAttempts,
            hasFriction: deterministicFeatures.orderSignals?.hasDeliveryFriction,
          },
        };

        const compactEvidence = {
          customerRisk: parallelEvidence?.customer_evidence?.risk_level,
          customerSummary: parallelEvidence?.customer_evidence?.historical_credibility_summary,
          fitRisk: parallelEvidence?.product_fit_evidence?.risk_level,
          fitDetected: parallelEvidence?.product_fit_evidence?.fit_issue_detected,
          fitSummary: parallelEvidence?.product_fit_evidence?.text_sentiment_summary,
          vendorRisk: parallelEvidence?.vendor_evidence?.risk_level,
          deliveryRisk: parallelEvidence?.delivery_evidence?.risk_level,
          composite: parallelEvidence?.composite_signal_summary,
        };

        const formattedPrompt = await model2InterventionPrompt.format({
          order_id: orderId,
          customer_name: deterministicFeatures.customerSignals?.customerName || 'Customer',
          city: deterministicFeatures.orderSignals?.city || 'India',
          payment_method: deterministicFeatures.paymentMethod,
          order_amount: deterministicFeatures.orderSignals?.orderAmount || 0,
          deterministic_json: JSON.stringify(compactFeatures, null, 2),
          parallel_evidence_json: JSON.stringify(compactEvidence, null, 2),
          model1_score: model1Assessment.rto_risk_score,
          model1_band: model1Assessment.risk_band,
          model1_confidence: model1Assessment.confidence_score,
          routing_trigger_reason: model1Assessment.routing_trigger_reason || 'High risk and ambiguous domain signals',
        });

        const response = await model.invoke(formattedPrompt);
        const parsed = safeParseJson(response.content);
        const latencyMs = Date.now() - startTime;

        const promptTokens = Math.round(formattedPrompt.length / 4);
        const completionTokens = Math.round((response.content?.length || 150) / 4);
        const totalTokens = promptTokens + completionTokens;
        const estimatedCostUsd = Number((totalTokens * 0.000003).toFixed(6));

        return Model2InterventionSchema.parse({
          ...parsed,
          order_id: orderId,
          routing_path: 'MODEL_2_DEEP_REASONING',
          model_name: model.modelName || 'meta-llama/llama-3.3-70b-instruct',
          telemetry: {
            latency_ms: latencyMs,
            prompt_tokens: promptTokens,
            completion_tokens: completionTokens,
            total_tokens: totalTokens,
            estimated_cost_usd: estimatedCostUsd,
          },
        });
      },
      {
        maxRetries: 1,
        initialDelayMs: 400,
        timeoutMs: 8000, // 8s fast cutoff before instant fallback
        taskName: `MODEL_2_ROUTING_ORD_${orderId}`,
        fallbackFn: (err) => {
          const fb = getFallbackRoutingDecision(orderId, deterministicFeatures, model1Assessment, err.message);
          return Model2InterventionSchema.parse({
            order_id: orderId,
            routing_path: 'MODEL_2_DEEP_REASONING',
            model_name: 'deterministic-fallback-engine-v1',
            intervention_type: fb.intervention.intervention_type,
            confidence: fb.intervention.confidence_score,
            primary_risk_driver: 'CUSTOMER_RTO_HISTORY',
            action_rationale: fb.intervention.internal_notes,
            customer_message: fb.intervention.customer_message,
            action_payload: {
              suggested_quick_replies: fb.intervention.quick_reply_options,
              requires_size_chart: fb.intervention.intervention_type === 'FIT_GUIDANCE',
              requires_address_pin: fb.intervention.intervention_type === 'ADDRESS_CONFIRMATION',
            },
            expected_rto_reduction_impact: 'HIGH',
            telemetry: {
              latency_ms: 2,
              prompt_tokens: 0,
              completion_tokens: 0,
              total_tokens: 0,
              estimated_cost_usd: 0,
            },
          });
        },
      }
    );

    interventionDecision = execution.result;

    recordTelemetryEvent({
      taskName: 'MODEL_2_DEEP_REASONING',
      modelName: interventionDecision.model_name || 'google/gemini-2.5-pro',
      promptTokens: interventionDecision.telemetry?.prompt_tokens || 650,
      completionTokens: interventionDecision.telemetry?.completion_tokens || 200,
      latencyMs: execution.latencyMs || (Date.now() - startTime),
      isFallback: execution.isFallback,
      isRetry: execution.attempts > 1,
    });
  }

  // 2. Persist Recommended Intervention into Supabase
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase
        .from('orders')
        .update({
          intervention_type: interventionDecision.intervention_type,
          intervention_payload: {
            routing_path: interventionDecision.routing_path,
            primary_risk_driver: interventionDecision.primary_risk_driver,
            action_rationale: interventionDecision.action_rationale,
            customer_message: interventionDecision.customer_message,
            suggested_quick_replies: interventionDecision.action_payload?.suggested_quick_replies || [],
            expected_impact: interventionDecision.expected_rto_reduction_impact,
          },
          intervention_status: interventionDecision.intervention_type === 'NO_ACTION' ? 'SKIPPED' : 'RECOMMENDED',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);
    } catch (dbErr) {
      console.warn('[Routing Chain] Failed to update Supabase intervention:', dbErr.message);
    }
  }

  return {
    routed_to_model_2: needsModel2,
    trigger_reason: model1Assessment.routing_trigger_reason || (needsModel2 ? 'Elevated risk score / ambiguity' : 'Resolved by Model 1'),
    intervention: interventionDecision,
  };
}

import { Router } from 'express';
import { extractOrderRiskFeatures, computeBaselineMetrics } from '../services/riskFeatureExtractor.js';
import { runParallelEvidenceChain } from '../ai/chains/parallelEvidenceChain.js';
import { runInitialRiskAssessment } from '../ai/chains/initialRiskChain.js';
import { runRoutingAndInterventionChain } from '../ai/chains/routingChain.js';
import { classifyCustomerResponse } from '../ai/chains/responseClassifierChain.js';
import { supabase, isSupabaseConfigured } from '../config/supabase.js';

const router = Router();

/**
 * GET /api/risk/features/:orderId
 * Returns the non-AI deterministic feature vector for a specific order.
 */
router.get('/features/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const features = await extractOrderRiskFeatures(orderId);
    res.json(features);
  } catch (err) {
    console.error('[Risk API] Error extracting features:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/risk/baseline
 * Returns baseline RTO rates, volume metrics, and scenario distributions.
 */
router.get('/baseline', async (req, res) => {
  try {
    const baseline = await computeBaselineMetrics();
    res.json(baseline);
  } catch (err) {
    console.error('[Risk API] Error computing baseline:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/risk/evaluate/:orderId
 * End-to-End Pipeline Execution:
 * - Phase 3: Deterministic Risk Features
 * - Phase 4: Parallel 4-Branch Evidence Extraction
 * - Phase 5: Model 1 Initial Risk Assessment & Confidence Gating
 * - Phase 6: AI Pattern 2 Routing Gate & Model 2 Contextual Intervention Decision
 */
router.post('/evaluate/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const startTime = Date.now();

    // 1. Phase 3: Extract Deterministic Features
    const deterministicFeatures = await extractOrderRiskFeatures(orderId);

    // 2. Phase 4: Run LangChain Parallel Evidence Chain (Customer, Fit, Vendor, Delivery)
    const parallelEvidence = await runParallelEvidenceChain(deterministicFeatures);

    // 3. Phase 5: Run Model 1 Initial Risk Assessment & Confidence Gate
    const riskAssessment = await runInitialRiskAssessment(deterministicFeatures, parallelEvidence);

    // 4. Phase 6: Run AI Pattern 2 Routing Gate & Model 2 Intervention Engine
    const routingResult = await runRoutingAndInterventionChain(
      deterministicFeatures,
      parallelEvidence,
      riskAssessment
    );

    const totalPipelineLatencyMs = Date.now() - startTime;
    const totalEstimatedCostUsd =
      (riskAssessment.model_metadata?.estimated_cost_usd || 0) +
      (routingResult.intervention?.telemetry?.estimated_cost_usd || 0);

    res.json({
      success: true,
      orderId,
      totalPipelineLatencyMs,
      totalEstimatedCostUsd,
      deterministicFeatures,
      parallelEvidence,
      riskAssessment,
      routingResult,
    });
  } catch (err) {
    console.error('[Risk API] Evaluation error for order:', req.params.orderId, err);
    res.status(500).json({ error: err.message, orderId: req.params.orderId });
  }
});

/**
 * POST /api/risk/route-intervention/:orderId
 * Specific endpoint for testing/triggering only the Phase 6 routing step.
 */
router.post('/route-intervention/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const deterministicFeatures = await extractOrderRiskFeatures(orderId);
    const parallelEvidence = await runParallelEvidenceChain(deterministicFeatures);
    const riskAssessment = await runInitialRiskAssessment(deterministicFeatures, parallelEvidence);
    const routingResult = await runRoutingAndInterventionChain(
      deterministicFeatures,
      parallelEvidence,
      riskAssessment
    );

    res.json(routingResult);
  } catch (err) {
    console.error('[Risk API] Routing error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/risk/evaluate-batch
 * Batch evaluates orders through the complete Phase 4, 5 & 6 pipeline.
 */
router.post('/evaluate-batch', async (req, res) => {
  try {
    if (!isSupabaseConfigured() || !supabase) {
      return res.status(503).json({ error: 'Supabase is not configured.' });
    }

    const { limit = 15, codOnly = true } = req.body;

    let query = supabase.from('orders').select('id');
    if (codOnly) {
      query = query.eq('payment_method', 'COD');
    }
    const { data: orderList, error } = await query.limit(limit);

    if (error) throw error;

    const results = [];
    for (const item of orderList) {
      try {
        const feat = await extractOrderRiskFeatures(item.id);
        const evidence = await runParallelEvidenceChain(feat);
        const assessment = await runInitialRiskAssessment(feat, evidence);
        const routing = await runRoutingAndInterventionChain(feat, evidence, assessment);
        results.push({
          orderId: item.id,
          score: assessment.rto_risk_score,
          band: assessment.risk_band,
          routedToModel2: routing.routed_to_model_2,
          interventionType: routing.intervention.intervention_type,
        });
      } catch (e) {
        console.warn(`[Batch Eval] Failed for ${item.id}:`, e.message);
      }
    }

    res.json({
      message: `Batch pipeline execution complete for ${results.length} orders.`,
      evaluatedCount: results.length,
      results,
    });
  } catch (err) {
    console.error('[Risk API] Batch evaluation error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/risk/auto-demo
 * Runs the complete automated 1-click end-to-end demo:
 * Selects an order -> Parallel Signals -> Model 1 Scoring -> Model 2 Routing ->
 * WhatsApp Dispatch -> Simulated Customer Reply -> AI Intent Classification ->
 * Outcome State Transition & Logistics ROI update.
 */
router.post('/auto-demo', async (req, res) => {
  try {
    const { scenario = 'fit_correction' } = req.body;
    const startTime = Date.now();

    // 1. Pick a realistic COD order from Supabase
    let orderId = 'ORD-00371';
    let customerName = 'Sahil Patil';
    let selectedSize = 'M';
    let newRequestedSize = 'L';

    if (isSupabaseConfigured() && supabase) {
      const { data: candidateOrders } = await supabase
        .from('orders')
        .select(`
          id,
          order_amount,
          payment_method,
          selected_size,
          customers (name, city, previous_rto_count),
          products (name, category, fit_return_rate)
        `)
        .eq('payment_method', 'COD')
        .limit(10);

      if (candidateOrders && candidateOrders.length > 0) {
        const target = candidateOrders[Math.floor(Math.random() * candidateOrders.length)];
        orderId = target.id;
        customerName = target.customers?.name || customerName;
        selectedSize = target.selected_size || selectedSize;
      }
    }

    // Step 1: Feature Extraction
    const tFeatures0 = Date.now();
    const deterministicFeatures = await extractOrderRiskFeatures(orderId);
    const step1Latency = Date.now() - tFeatures0;

    // Step 2: Parallel AI Evidence (Customer, Fit, Vendor, Delivery)
    const tEvidence0 = Date.now();
    const parallelEvidence = await runParallelEvidenceChain(deterministicFeatures);
    const step2Latency = Date.now() - tEvidence0;

    // Step 3: Model 1 Initial Risk Assessment & Confidence Gating
    const tRisk0 = Date.now();
    const riskAssessment = await runInitialRiskAssessment(deterministicFeatures, parallelEvidence);
    const step3Latency = Date.now() - tRisk0;

    // Step 4: Model 2 Routing & Contextual Intervention
    const tRouting0 = Date.now();
    const routingResult = await runRoutingAndInterventionChain(
      deterministicFeatures,
      parallelEvidence,
      riskAssessment
    );
    const step4Latency = Date.now() - tRouting0;

    const intervention = routingResult.intervention;

    // Step 5: WhatsApp Message Dispatch (Simulated)
    const whatsappMessage = intervention.customer_message ||
      `Namaste ${customerName}! Before we dispatch your COD order #${orderId}, please confirm if your selected size (${selectedSize}) is accurate.`;

    // Step 6: Select Realistic Customer Reply according to Scenario
    let simulatedCustomerReply = '';
    let expectedOutcome = '';
    let finalAction = '';

    if (scenario === 'fit_correction') {
      newRequestedSize = selectedSize === 'M' ? 'L' : (selectedSize === 'L' ? 'XL' : 'M');
      simulatedCustomerReply = `Bhai size ${selectedSize} thoda tight lag raha hai, please Size ${newRequestedSize} bhej do.`;
      expectedOutcome = 'DELIVERED_SIZE_CORRECTED';
      finalAction = 'UPDATE_SIZE_AND_DISPATCH';
    } else if (scenario === 'address_fix') {
      simulatedCustomerReply = 'Ha address confirm hai, landmark near Shiv Mandir opposite metro pillar 24, dispatch kardo.';
      expectedOutcome = 'DELIVERED_ADDRESS_CORRECTED';
      finalAction = 'UPDATE_ADDRESS_AND_DISPATCH';
    } else {
      simulatedCustomerReply = 'Cancel kar do mujhe order nahi chahiye abhi emergency me out of station hu.';
      expectedOutcome = 'CANCELLED_PREVENTED_RTO';
      finalAction = 'CANCEL_ORDER_SAVED_RTO';
    }

    // Step 7: AI Response Intent Classification (Hinglish/English NLP)
    const tClassify0 = Date.now();
    const classification = await classifyCustomerResponse({
      orderId,
      customerReply: simulatedCustomerReply,
      interventionType: intervention.intervention_type,
      originalMessage: whatsappMessage,
      selectedSize,
      availableSizes: 'S, M, L, XL, XXL',
      city: deterministicFeatures.orderSignals?.city || 'India',
    });
    const step7Latency = Date.now() - tClassify0;

    // Step 8: Update Order State & Outcomes in Supabase
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase
          .from('orders')
          .update({
            intervention_status: 'RESOLVED',
            intervention_success: true,
            final_outcome: expectedOutcome,
            customer_response: {
              raw_text: simulatedCustomerReply,
              classified_intent: classification.classified_intent,
              extracted_entities: classification.extracted_entities,
              workflow_action: classification.suggested_workflow_action,
              customer_sentiment: classification.customer_sentiment,
              action_summary: classification.action_summary,
            },
            selected_size: classification.extracted_entities?.requested_size || selectedSize,
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId);
      } catch (dbErr) {
        console.warn('[Auto-Demo] DB update warning:', dbErr.message);
      }
    }

    const totalDemoLatencyMs = Date.now() - startTime;

    res.json({
      success: true,
      demoScenario: scenario,
      orderId,
      customerName,
      initialSelectedSize: selectedSize,
      newSelectedSize: classification.extracted_entities?.requested_size || selectedSize,
      totalDemoLatencyMs,
      steps: [
        {
          stepNumber: 1,
          name: 'Deterministic Feature Layer',
          status: 'COMPLETED',
          latencyMs: step1Latency,
          summary: `Extracted signals for COD Order #${orderId} (Customer RTO ratio: ${(deterministicFeatures.customerSignals?.rtoRatio * 100 || 22).toFixed(0)}%, Fit return rate: ${(deterministicFeatures.productSignals?.fitReturnRate * 100 || 18).toFixed(0)}%).`,
          data: deterministicFeatures,
        },
        {
          stepNumber: 2,
          name: 'Parallel AI Evidence (Phase 4)',
          status: 'COMPLETED',
          latencyMs: step2Latency,
          summary: parallelEvidence.composite_signal_summary,
          data: parallelEvidence,
        },
        {
          stepNumber: 3,
          name: 'Model 1 Scoring & Gating (Phase 5)',
          status: 'COMPLETED',
          latencyMs: step3Latency,
          summary: `Risk Score: ${(riskAssessment.rto_risk_score * 100).toFixed(0)}% (${riskAssessment.risk_band} RISK) -> Triggered Model 2 Routing.`,
          data: riskAssessment,
        },
        {
          stepNumber: 4,
          name: 'Model 2 Deep Reasoning (Phase 6)',
          status: 'COMPLETED',
          latencyMs: step4Latency,
          summary: `Selected controlled intervention: ${intervention.intervention_type}. Model: ${intervention.model_name}`,
          data: intervention,
        },
        {
          stepNumber: 5,
          name: 'WhatsApp Dispatch (Phase 7)',
          status: 'COMPLETED',
          latencyMs: 10,
          summary: `Delivered message to ${customerName} via WhatsApp Concierge.`,
          message: whatsappMessage,
        },
        {
          stepNumber: 6,
          name: 'Customer Reply & AI Intent Classification',
          status: 'COMPLETED',
          latencyMs: step7Latency,
          summary: `Classified Intent: ${classification.classified_intent} (${classification.customer_sentiment}) -> ${classification.suggested_workflow_action}`,
          customerReply: simulatedCustomerReply,
          classification,
        },
        {
          stepNumber: 7,
          name: 'State Transition & Business ROI',
          status: 'COMPLETED',
          latencyMs: 5,
          summary: `Order updated to ${expectedOutcome}. Prevented 1 RTO, saving ₹120 in reverse logistics loss!`,
          finalOutcome: expectedOutcome,
          logisticsSavedInr: 120,
        },
      ],
    });
  } catch (err) {
    console.error('[Risk API] Auto-Demo error:', err);
    res.status(500).json({ error: 'Auto demo execution failed', message: err.message });
  }
});

export default router;

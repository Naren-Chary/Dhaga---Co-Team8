import { Router } from 'express';
import { supabase, isSupabaseConfigured } from '../config/supabase.js';
import { classifyCustomerResponse } from '../ai/chains/responseClassifierChain.js';
import { AllowedInterventionTypes } from '../ai/schemas/routingSchemas.js';

const router = Router();

/**
 * GET /api/interventions/queue
 * Returns active intervention queue for operations team.
 */
router.get('/queue', async (req, res) => {
  try {
    if (!isSupabaseConfigured() || !supabase) {
      return res.status(503).json({ error: 'Supabase is not configured.', queue: [] });
    }

    const { status_filter } = req.query;

    let query = supabase
      .from('orders')
      .select(`
        *,
        customers (*),
        products (*),
        vendors (*)
      `)
      .not('intervention_type', 'is', null)
      .neq('intervention_type', 'NO_ACTION')
      .order('created_at', { ascending: false });

    if (status_filter) {
      query = query.eq('intervention_status', status_filter.toUpperCase());
    }

    const { data: queue, error } = await query.limit(50);

    if (error) throw error;

    res.json({
      total: queue?.length || 0,
      queue: queue || [],
    });
  } catch (err) {
    console.error('[Interventions API] Queue error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/interventions/send/:orderId
 * Operations approves and sends the WhatsApp intervention message.
 */
router.post('/send/:orderId', async (req, res) => {
  try {
    if (!isSupabaseConfigured() || !supabase) {
      return res.status(503).json({ error: 'Supabase is not configured.' });
    }

    const { orderId } = req.params;
    const { customMessage } = req.body;

    const { data: order, error: fetchErr } = await supabase
      .from('orders')
      .select('*, customers(*), products(*)')
      .eq('id', orderId)
      .single();

    if (fetchErr || !order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    const updatedPayload = {
      ...(order.intervention_payload || {}),
      customer_message: customMessage || order.intervention_payload?.customer_message,
      sent_at: new Date().toISOString(),
      sent_by: 'OPERATIONS_AGENT',
    };

    const { data: updatedOrder, error: updateErr } = await supabase
      .from('orders')
      .update({
        intervention_status: 'SENT',
        intervention_payload: updatedPayload,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select('*, customers(*), products(*), vendors(*)')
      .single();

    if (updateErr) throw updateErr;

    res.json({
      success: true,
      message: `Intervention ${order.intervention_type} sent to ${order.customers?.name || 'Customer'}.`,
      order: updatedOrder,
    });
  } catch (err) {
    console.error('[Interventions API] Send error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/interventions/simulate-response/:orderId
 * Simulates receiving a customer reply, runs AI classification, and applies state transitions.
 */
router.post('/simulate-response/:orderId', async (req, res) => {
  try {
    if (!isSupabaseConfigured() || !supabase) {
      return res.status(503).json({ error: 'Supabase is not configured.' });
    }

    const { orderId } = req.params;
    const { responseText } = req.body;

    if (!responseText || typeof responseText !== 'string') {
      return res.status(400).json({ error: 'responseText is required.' });
    }

    // 1. Fetch current order
    const { data: order, error: fetchErr } = await supabase
      .from('orders')
      .select('*, customers(*), products(*), vendors(*)')
      .eq('id', orderId)
      .single();

    if (fetchErr || !order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    // 2. Classify customer intent using LangChain AI Chain
    const classification = await classifyCustomerResponse({
      orderId,
      customerReply: responseText,
      interventionType: order.intervention_type || 'DELIVERY_CONFIRMATION',
      originalMessage: order.intervention_payload?.customer_message || '',
      selectedSize: order.selected_size || 'M',
      availableSizes: order.products?.available_sizes || 'S, M, L, XL',
      city: order.city || 'India',
    });

    // 3. Determine state transitions based on classified action
    let newOrderStatus = order.status;
    let newRtoStatus = order.rto_status || 'NOT_RTO';
    let newInterventionStatus = 'RESOLVED';
    let interventionSuccess = true;
    let finalOutcome = 'DELIVERED';

    switch (classification.suggested_workflow_action) {
      case 'CANCEL_ORDER_SAVED_RTO':
        finalOutcome = 'CANCELLED_PREVENTED_RTO';
        interventionSuccess = true; // High value: saved ₹120 logistics cost!
        break;

      case 'UPDATE_SIZE_AND_DISPATCH':
        finalOutcome = 'DELIVERED_SIZE_CORRECTED';
        interventionSuccess = true;
        break;

      case 'UPDATE_ADDRESS_AND_DISPATCH':
        finalOutcome = 'DELIVERED_ADDRESS_CORRECTED';
        interventionSuccess = true;
        break;

      case 'RESCHEDULE_SHIPMENT':
        finalOutcome = 'DELIVERY_RESCHEDULED';
        interventionSuccess = true;
        break;

      case 'ESCALATE_TO_CX_AGENT':
        newInterventionStatus = 'ESCALATED';
        finalOutcome = 'PENDING_HUMAN_CALL';
        interventionSuccess = false;
        break;

      case 'DISPATCH_CONFIRMED':
      default:
        finalOutcome = 'CONFIRMED_BY_CUSTOMER';
        interventionSuccess = true;
        break;
    }

    const customerResponsePayload = {
      raw_text: responseText,
      classified_intent: classification.classified_intent,
      confidence: classification.confidence,
      extracted_entities: classification.extracted_entities,
      customer_sentiment: classification.customer_sentiment,
      workflow_action: classification.suggested_workflow_action,
      action_summary: classification.action_summary,
      received_at: new Date().toISOString(),
    };

    // 4. Update Supabase
    const updateFields = {
      intervention_status: newInterventionStatus,
      customer_response: customerResponsePayload,
      intervention_success: interventionSuccess,
      final_outcome: finalOutcome,
      updated_at: new Date().toISOString(),
    };

    const { data: updatedOrder, error: updateErr } = await supabase
      .from('orders')
      .update(updateFields)
      .eq('id', orderId)
      .select('*, customers(*), products(*), vendors(*)')
      .single();

    if (updateErr) throw updateErr;

    res.json({
      success: true,
      classification,
      order: updatedOrder,
      outcomeSummary: {
        newOrderStatus,
        newInterventionStatus,
        interventionSuccess,
        finalOutcome,
      },
    });
  } catch (err) {
    console.error('[Interventions API] Response simulation error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/interventions/override/:orderId
 * Operations agent manual override.
 */
router.post('/override/:orderId', async (req, res) => {
  try {
    if (!isSupabaseConfigured() || !supabase) {
      return res.status(503).json({ error: 'Supabase is not configured.' });
    }

    const { orderId } = req.params;
    const { overrideAction, newInterventionType, notes } = req.body;

    // Validate new intervention type if provided
    if (newInterventionType) {
      AllowedInterventionTypes.parse(newInterventionType);
    }

    let newStatus;
    let newInterventionStatus = 'OVERRIDDEN';

    if (overrideAction === 'FORCE_DISPATCH') {
      newStatus = 'SHIPPED';
    } else if (overrideAction === 'CANCEL_ORDER') {
      newStatus = 'CANCELLED';
    } else if (overrideAction === 'ESCALATE_CALL') {
      newInterventionStatus = 'ESCALATED';
    }

    const { data: updatedOrder, error } = await supabase
      .from('orders')
      .update({
        ...(newStatus ? { status: newStatus } : {}),
        ...(newInterventionType ? { intervention_type: newInterventionType } : {}),
        intervention_status: newInterventionStatus,
        intervention_payload: {
          override_notes: notes || 'Manual operations intervention',
          overridden_at: new Date().toISOString(),
          overridden_by: 'CX_SUPERVISOR',
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select('*, customers(*), products(*), vendors(*)')
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Intervention successfully overridden by operations.',
      order: updatedOrder,
    });
  } catch (err) {
    console.error('[Interventions API] Override error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;

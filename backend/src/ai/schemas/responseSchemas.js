import { z } from 'zod';

/**
 * Customer Response Intent Classification Schema
 */
export const CustomerResponseIntentSchema = z.object({
  order_id: z.string(),
  raw_response_text: z.string(),
  classified_intent: z.enum([
    'CONFIRM_ORDER',
    'CHANGE_SIZE',
    'UPDATE_ADDRESS',
    'RESCHEDULE_DELIVERY',
    'CANCEL_ORDER',
    'UNRECOGNIZED_CLARIFY',
  ]),
  confidence: z.number().min(0).max(1),
  extracted_entities: z.object({
    requested_size: z.string().nullable().optional(),
    updated_address_or_landmark: z.string().nullable().optional(),
    preferred_date: z.string().nullable().optional(),
    cancellation_reason: z.string().nullable().optional(),
  }),
  customer_sentiment: z.enum(['POSITIVE', 'NEUTRAL', 'NEGATIVE', 'CONFUSED']),
  suggested_workflow_action: z.enum([
    'DISPATCH_CONFIRMED',
    'UPDATE_SIZE_AND_DISPATCH',
    'UPDATE_ADDRESS_AND_DISPATCH',
    'RESCHEDULE_SHIPMENT',
    'CANCEL_ORDER_SAVED_RTO',
    'ESCALATE_TO_CX_AGENT',
  ]),
  action_summary: z.string(),
});

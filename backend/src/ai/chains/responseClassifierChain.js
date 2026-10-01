import { PromptTemplate } from '@langchain/core/prompts';
import { getFastModel, isOpenRouterConfigured } from '../../config/openrouter.js';
import { CustomerResponseIntentSchema } from '../schemas/responseSchemas.js';
import { safeParseJson, executeWithResilience } from '../resilience/retryWithBackoff.js';
import { recordTelemetryEvent } from '../../services/telemetryService.js';

const responseClassificationPrompt = PromptTemplate.fromTemplate(`
You are an expert CX AI for Dhaga & Co., specializing in Indian e-commerce customer intent classification.
A customer has replied to our pre-dispatch WhatsApp intervention message regarding order #{order_id}.

Original Intervention Sent:
Type: {intervention_type}
Message: "{original_message}"

Customer Raw Reply:
"{customer_reply}"

Order Context:
Selected Size: {selected_size}
Available Sizes: {available_sizes}
City: {city}

Classification Guidelines:
1. Parse casual English, Hinglish, abbreviations, or regional idioms:
   - "ha bhai dispatch kardo" / "yes correct size" -> CONFIRM_ORDER
   - "chota lagega L bhej do" / "please send XL instead" -> CHANGE_SIZE (extract requested_size)
   - "opposite metro pillar 45" / "landmark shiv mandir" -> UPDATE_ADDRESS (extract updated_address_or_landmark)
   - "abhi out of station hu Saturday ko bhejna" -> RESCHEDULE_DELIVERY (extract preferred_date)
   - "cancel kar do nahi chahiye" / "wrong order cancel" -> CANCEL_ORDER (extract cancellation_reason)
2. Map to the appropriate suggested_workflow_action:
   - CONFIRM_ORDER -> DISPATCH_CONFIRMED
   - CHANGE_SIZE -> UPDATE_SIZE_AND_DISPATCH
   - UPDATE_ADDRESS -> UPDATE_ADDRESS_AND_DISPATCH
   - RESCHEDULE_DELIVERY -> RESCHEDULE_SHIPMENT
   - CANCEL_ORDER -> CANCEL_ORDER_SAVED_RTO
   - UNRECOGNIZED_CLARIFY -> ESCALATE_TO_CX_AGENT

Return ONLY a valid JSON object matching this schema:
{{
  "order_id": "{order_id}",
  "raw_response_text": "{customer_reply}",
  "classified_intent": "CONFIRM_ORDER" | "CHANGE_SIZE" | "UPDATE_ADDRESS" | "RESCHEDULE_DELIVERY" | "CANCEL_ORDER" | "UNRECOGNIZED_CLARIFY",
  "confidence": <number 0.0 to 1.0>,
  "extracted_entities": {{
    "requested_size": "<e.g. L, XL, M or null>",
    "updated_address_or_landmark": "<extracted landmark/address or null>",
    "preferred_date": "<extracted date/day or null>",
    "cancellation_reason": "<extracted reason or null>"
  }},
  "customer_sentiment": "POSITIVE" | "NEUTRAL" | "NEGATIVE" | "CONFUSED",
  "suggested_workflow_action": "DISPATCH_CONFIRMED" | "UPDATE_SIZE_AND_DISPATCH" | "UPDATE_ADDRESS_AND_DISPATCH" | "RESCHEDULE_SHIPMENT" | "CANCEL_ORDER_SAVED_RTO" | "ESCALATE_TO_CX_AGENT",
  "action_summary": "<concise 1-sentence action summary for the operations team>"
}}
`);

/**
 * Fast-path heuristic classifier fallback
 */
function heuristicClassify(customerReply, orderId, selectedSize) {
  const lower = customerReply.toLowerCase().trim();

  if (lower.includes('cancel') || lower.includes('nahi chahiye') || lower.includes('mat bhejo')) {
    return {
      order_id: orderId,
      raw_response_text: customerReply,
      classified_intent: 'CANCEL_ORDER',
      confidence: 0.95,
      extracted_entities: {
        requested_size: null,
        updated_address_or_landmark: null,
        preferred_date: null,
        cancellation_reason: customerReply,
      },
      customer_sentiment: 'NEGATIVE',
      suggested_workflow_action: 'CANCEL_ORDER_SAVED_RTO',
      action_summary: 'Customer requested order cancellation. Order cancelled before dispatch, saving ₹120 RTO logistics loss.',
    };
  }

  if (lower.includes('size') || lower.includes('xl') || lower.includes('xxl') || lower.includes('chota') || lower.includes('bada') || lower.includes('medium') || lower.includes('large')) {
    let newSize = 'L';
    if (lower.includes('xxl')) newSize = 'XXL';
    else if (lower.includes('xl')) newSize = 'XL';
    else if (lower.includes('xs')) newSize = 'XS';
    else if (lower.includes('s')) newSize = 'S';
    else if (lower.includes('m')) newSize = 'M';

    return {
      order_id: orderId,
      raw_response_text: customerReply,
      classified_intent: 'CHANGE_SIZE',
      confidence: 0.90,
      extracted_entities: {
        requested_size: newSize,
        updated_address_or_landmark: null,
        preferred_date: null,
        cancellation_reason: null,
      },
      customer_sentiment: 'NEUTRAL',
      suggested_workflow_action: 'UPDATE_SIZE_AND_DISPATCH',
      action_summary: `Customer requested size update from ${selectedSize} to ${newSize}. Update product size and proceed with dispatch.`,
    };
  }

  if (lower.includes('landmark') || lower.includes('near') || lower.includes('mandir') || lower.includes('pillar') || lower.includes('opposite') || lower.includes('street')) {
    return {
      order_id: orderId,
      raw_response_text: customerReply,
      classified_intent: 'UPDATE_ADDRESS',
      confidence: 0.92,
      extracted_entities: {
        requested_size: null,
        updated_address_or_landmark: customerReply,
        preferred_date: null,
        cancellation_reason: null,
      },
      customer_sentiment: 'POSITIVE',
      suggested_workflow_action: 'UPDATE_ADDRESS_AND_DISPATCH',
      action_summary: 'Customer provided landmark/address update. Address updated for courier dispatch.',
    };
  }

  if (lower.includes('reschedule') || lower.includes('tomorrow') || lower.includes('saturday') || lower.includes('sunday') || lower.includes('monday') || lower.includes('later')) {
    return {
      order_id: orderId,
      raw_response_text: customerReply,
      classified_intent: 'RESCHEDULE_DELIVERY',
      confidence: 0.88,
      extracted_entities: {
        requested_size: null,
        updated_address_or_landmark: null,
        preferred_date: customerReply,
        cancellation_reason: null,
      },
      customer_sentiment: 'NEUTRAL',
      suggested_workflow_action: 'RESCHEDULE_SHIPMENT',
      action_summary: 'Customer requested delivery reschedule. Dispatch schedule adjusted.',
    };
  }

  return {
    order_id: orderId,
    raw_response_text: customerReply,
    classified_intent: 'CONFIRM_ORDER',
    confidence: 0.94,
    extracted_entities: {
      requested_size: null,
      updated_address_or_landmark: null,
      preferred_date: null,
      cancellation_reason: null,
    },
    customer_sentiment: 'POSITIVE',
    suggested_workflow_action: 'DISPATCH_CONFIRMED',
    action_summary: 'Customer confirmed order availability and sizing. Safe to dispatch immediately.',
  };
}

/**
 * Classify customer response using LangChain Model 1 / Model 2 with resilience
 */
export async function classifyCustomerResponse({
  orderId,
  customerReply,
  interventionType = 'DELIVERY_CONFIRMATION',
  originalMessage = '',
  selectedSize = 'M',
  availableSizes = 'S, M, L, XL',
  city = 'India',
}) {
  const startTime = Date.now();

  if (!isOpenRouterConfigured()) {
    const heuristic = heuristicClassify(customerReply, orderId, selectedSize);
    return CustomerResponseIntentSchema.parse(heuristic);
  }

  const execution = await executeWithResilience(
    async (attempt) => {
      const model = getFastModel({ temperature: 0.1 });
      const formatted = await responseClassificationPrompt.format({
        order_id: orderId,
        intervention_type: interventionType,
        original_message: originalMessage,
        customer_reply: customerReply,
        selected_size: selectedSize,
        available_sizes: availableSizes,
        city,
      });

      const response = await model.invoke(formatted);
      const parsed = safeParseJson(response.content);
      return CustomerResponseIntentSchema.parse({
        ...parsed,
        order_id: orderId,
        raw_response_text: customerReply,
      });
    },
    {
      maxRetries: 2,
      initialDelayMs: 400,
      timeoutMs: 8000,
      taskName: `RESPONSE_CLASSIFIER_ORD_${orderId}`,
      fallbackFn: () => CustomerResponseIntentSchema.parse(heuristicClassify(customerReply, orderId, selectedSize)),
    }
  );

  const result = execution.result;

  recordTelemetryEvent({
    taskName: 'RESPONSE_CLASSIFICATION',
    modelName: 'google/gemini-2.5-flash',
    promptTokens: 280,
    completionTokens: 90,
    latencyMs: execution.latencyMs || (Date.now() - startTime),
    isFallback: execution.isFallback,
  });

  return result;
}

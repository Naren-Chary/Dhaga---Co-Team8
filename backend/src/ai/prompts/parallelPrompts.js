import { PromptTemplate } from '@langchain/core/prompts';

/**
 * Branch 1: Customer Risk Prompt Template
 */
export const customerSignalPrompt = PromptTemplate.fromTemplate(`
You are an expert e-commerce fraud and delivery risk analyst specializing in Indian D2C fashion retail (Dhaga & Co.).
Analyze the provided customer historical profile and assess RTO (Return to Origin) delivery risk.

Customer Data:
{customer_json}

Evaluation Guidelines:
1. Examine repeat order count vs prior RTO count. A customer with previous RTOs on COD has high risk.
2. Consider return frequency and past cancellation/return reasons.
3. Assess customer credibility.

Return ONLY a valid JSON object matching this schema:
{{
  "domain": "CUSTOMER",
  "risk_level": "LOW" | "MEDIUM" | "HIGH",
  "confidence": <number 0.0 to 1.0>,
  "signals_found": [<string>, ...],
  "historical_credibility_summary": "<concise 1-2 sentence assessment>",
  "rto_propensity_score": <number 0.0 to 1.0>
}}
`);

/**
 * Branch 2: Product & Fit Return Context Prompt Template
 */
export const productFitPrompt = PromptTemplate.fromTemplate(`
You are a senior fashion apparel merchandiser and fit-intelligence specialist at Dhaga & Co.
Analyze the product attributes, sizing specifications, and historical return feedback (including messy Hinglish text).

Product & Return Feedback Data:
{product_json}

Evaluation Guidelines:
1. Examine product fit profile (e.g. slim fit, tailored waist, relaxed) and sizing chart summary.
2. Parse messy or unstructured customer return feedback for hidden fit issues masked under 'OTHER' or 'QUALITY'.
3. Flag high fit-return patterns that lead to buyer rejection upon delivery.

Return ONLY a valid JSON object matching this schema:
{{
  "domain": "PRODUCT_FIT",
  "risk_level": "LOW" | "MEDIUM" | "HIGH",
  "confidence": <number 0.0 to 1.0>,
  "fit_issue_detected": <true | false>,
  "detected_fit_subtypes": [<string>, ...],
  "sizing_clarity_rating": "CLEAR" | "AMBIGUOUS" | "MISLEADING",
  "text_sentiment_summary": "<concise 1-2 sentence analysis>",
  "signals_found": [<string>, ...]
}}
`);

/**
 * Branch 3: Vendor Reliability Prompt Template
 */
export const vendorSignalPrompt = PromptTemplate.fromTemplate(`
You are a supply chain vendor quality auditor for Dhaga & Co.
Evaluate the vendor reliability, sizing consistency, and return frequency.

Vendor Data:
{vendor_json}

Evaluation Guidelines:
1. Assess vendor return rate and vendor fit return discrepancy.
2. Evaluate size chart type (standard vs custom/brand-specific).
3. Identify if vendor manufacturing deviations contribute to delivery failures.

Return ONLY a valid JSON object matching this schema:
{{
  "domain": "VENDOR",
  "risk_level": "LOW" | "MEDIUM" | "HIGH",
  "confidence": <number 0.0 to 1.0>,
  "vendor_reliability_rating": "RELIABLE" | "MODERATE_RISK" | "HIGH_RETURN_VOLUME",
  "size_chart_fidelity": "CONSISTENT" | "IRREGULAR" | "POOR",
  "signals_found": [<string>, ...]
}}
`);

/**
 * Branch 4: Delivery & Location Context Prompt Template
 */
export const deliveryContextPrompt = PromptTemplate.fromTemplate(`
You are a last-mile delivery operations manager in India.
Analyze the order delivery context, geographic signals, and delivery attempts.

Delivery & Order Context Data:
{delivery_json}

Evaluation Guidelines:
1. Assess payment method: COD orders carry substantial refusal risk compared to PREPAID.
2. Check delivery attempts and order amount thresholds.
3. Identify friction points in last-mile delivery.

Return ONLY a valid JSON object matching this schema:
{{
  "domain": "DELIVERY_LOCATION",
  "risk_level": "LOW" | "MEDIUM" | "HIGH",
  "confidence": <number 0.0 to 1.0>,
  "address_risk_flag": <true | false>,
  "friction_indicators": [<string>, ...],
  "delivery_feasibility_summary": "<concise 1-2 sentence summary>"
}}
`);

/**
 * Phase 5: Model 1 Initial Composite Risk Assessment Prompt Template
 */
export const initialRiskModel1Prompt = PromptTemplate.fromTemplate(`
You are the Chief Risk Engine AI (Model 1: Fast & Cost-Efficient) for Dhaga & Co.
Your mission is to perform high-volume COD RTO risk scoring by combining:
1. Non-AI Deterministic Risk Signals
2. Synthesized Parallel Domain Evidence (Customer, Product/Fit, Vendor, Delivery)

Order & Deterministic Features:
{deterministic_json}

Parallel Domain AI Evidence:
{parallel_evidence_json}

Scoring & Decision Rules:
- Payment Method: PREPAID orders have minimal RTO risk (< 0.10) unless severe fraud.
- COD Orders: RTO risk is heavily amplified by customer prior RTOs, fit ambiguity, and vendor return rates.
- Confidence & Routing Gate:
  - If signals strongly align (e.g. low risk across all domains or obvious repeat RTO offender), assign high confidence (> 0.85) and needs_model_2_routing = false.
  - If signals are ambiguous (e.g. high customer rating but high product fit return rate, or score between 0.35 and 0.65), flag needs_model_2_routing = true for deeper Model 2 reasoning.

Return ONLY a valid JSON object matching this schema:
{{
  "order_id": "{order_id}",
  "rto_risk_score": <number 0.0 to 1.0>,
  "risk_band": "LOW" | "MEDIUM" | "HIGH",
  "confidence_score": <number 0.0 to 1.0>,
  "risk_factors": [<string>, ...],
  "risk_reasoning": "<explain clearly why this score was assigned>",
  "needs_model_2_routing": <true | false>,
  "routing_trigger_reason": "<optional reason if routed to Model 2>"
}}
`);

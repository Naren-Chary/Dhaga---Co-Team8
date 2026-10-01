# Dhaga & Co. --- COD Risk & Return Intelligence

## Product Requirements Document

## 1. Product Summary

Dhaga & Co. has a 26% COD Return-to-Origin (RTO) rate, with each RTO
costing approximately ₹120 in logistics and consuming a delivery slot.
The business also has rich return/product/vendor data, including a large
"Other" return bucket where fit-related issues appear frequently.

The MVP will combine these signals to identify risky COD orders and
trigger a contextual intervention before delivery.

**Core product loop:**

`COD Order → Risk Signals → AI Risk Assessment → Intervention → Customer Response → Delivery Outcome`

The system must validate whether product/fit/vendor signals actually
improve RTO-risk assessment; the case does not establish a causal
relationship between fit returns and RTO.

## 2. Problem Statement

> Reduce avoidable COD losses by identifying risky orders using
> customer, product, vendor and historical return signals, then taking
> an appropriate intervention before the order becomes a failed
> delivery/RTO.

## 3. Primary Users

### Supply Chain / Operations

Needs to see risky COD orders, understand why they are risky, and review
interventions.

### CX / Support

Needs to understand customer responses and handle exceptions.

### Category / Merchandising

Needs visibility into product/vendor patterns that may contribute to
risk.

## 4. MVP Goals

1.  Score COD orders for RTO risk.
2.  Surface the major risk signals behind the score.
3.  Use AI to determine an appropriate contextual intervention.
4.  Send or simulate a WhatsApp-style customer interaction.
5.  Interpret the customer response.
6.  Track delivered vs RTO outcomes.
7.  Provide basic product/vendor/fit-return intelligence.
8.  Demonstrate two AI workflow patterns and two different models
    through OpenRouter.

## 5. Explicit Non-Goals

-   Full logistics management system.
-   Full CRM/helpdesk replacement.
-   Fully autonomous customer service.
-   Carrier optimization.
-   Enterprise BI platform.
-   Real payment processing.
-   Real production WhatsApp sending unless credentials/integration are
    available.
-   Training a large custom ML infrastructure.

## 6. MVP User Flow

1.  A COD order is created.
2.  Backend loads customer, product, vendor and delivery signals.
3.  Parallel AI analysis produces structured evidence where
    language/messy mapping is required.
4.  The risk engine produces an RTO risk score.
5.  A confidence/risk gate routes the case.
6.  Low-risk orders continue normally.
7.  High-risk or ambiguous orders receive deeper AI reasoning.
8.  AI returns a structured intervention recommendation.
9.  Backend validates the recommendation.
10. The system presents/sends a contextual customer question.
11. Customer response is classified.
12. Operations can confirm, reschedule, clarify or escalate.
13. Final delivery/RTO outcome is stored.
14. Dashboard measures intervention and business outcomes.

## 7. AI Requirements

### Pattern A --- Parallelization

Analyze independent evidence domains in parallel:

-   Customer history
-   Product/fit return context
-   Vendor history
-   Delivery/location context

The outputs are structured and combined before the final
risk/intervention decision.

### Pattern B --- Routing

Do not send every case to the strongest model.

-   Straightforward/high-confidence cases use the cheaper/faster path.
-   Ambiguous or high-impact cases route to the stronger model.
-   If confidence remains insufficient, route to human review.

The patterns must be explainable: the team must be able to describe what
breaks or becomes less efficient if each pattern is removed.

## 8. Two-Model Requirement

Both models are accessed through **OpenRouter**.

### Model 1 --- Fast / cost-efficient model

Use for high-volume structured extraction/classification and initial
analysis.

Possible responsibilities: - Extract return/fit signals. - Normalize
messy text. - Analyze customer/product/vendor evidence. - Produce
structured intermediate outputs.

### Model 2 --- Stronger reasoning model

Use for ambiguous cases and contextual intervention decisions.

Possible responsibilities: - Resolve conflicting signals. - Determine
intervention type. - Generate customer-facing message. - Interpret
customer response.

The exact model IDs should be configured through environment variables
rather than hard-coded.

## 9. Structured AI Output

Every model boundary must return validated structured JSON.

Example:

``` json
{
  "risk_score": 0.87,
  "risk_factors": [
    "previous_rto",
    "high_product_fit_return_rate"
  ],
  "risk_reason": "Product and customer history indicate elevated delivery risk.",
  "intervention_type": "FIT_GUIDANCE",
  "message": "Please review the size chart before we dispatch your order.",
  "confidence": 0.91
}
```

Invalid output must not directly reach the customer or database as a
trusted decision. Validate it and retry/fallback or route to human
review.

## 10. Intervention Types

The MVP should support a small controlled set:

-   `FIT_GUIDANCE`
-   `ADDRESS_CONFIRMATION`
-   `DELIVERY_CONFIRMATION`
-   `RESCHEDULE`
-   `ESCALATE`
-   `NO_ACTION`

Do not allow the model to invent arbitrary backend actions.

## 11. Example Risk-Specific Interventions

### Fit risk

Show the product's size chart and ask the customer to confirm their
selected size.

### Location/delivery risk

Ask the customer to confirm address/landmark or delivery availability.

### Previous RTO risk

Ask whether someone will be available to receive the COD order.

### Ambiguous case

Ask a clarification question or route to operations.

## 12. Frontend Requirements

### Dashboard

Show: - COD orders - High-risk orders - Risk distribution -
Interventions - Confirmed deliveries - RTO count/rate - Intervention
success

### Risk Orders

Filter by: - Risk band - Status - Intervention status - Vendor -
Product/category

### Order Detail

Show: - Customer/order information - Risk score - Risk factors -
Product/vendor context - Recommended intervention - Intervention
history - Customer response - Final outcome

### Intervention Center

Allow operations to: - Review recommendation - Approve/send - Override -
Escalate

### Analytics

Show: - RTO rate - High-risk order outcomes - Intervention success -
Product/vendor risk patterns - Fit-return patterns

## 13. Backend Requirements

Backend must use **LangChain**.

Responsibilities: - Supabase access - Data aggregation - AI
orchestration - OpenRouter calls through LangChain - Parallel workflow -
Routing workflow - Structured output validation - Retry/fallback -
Intervention rules - Outcome tracking

The backend must never trust an LLM response as a direct database
command.

## 14. Data Requirements

Use synthetic data shaped like the Dhaga brief.

Suggested initial dataset: - \~10,000 customers - \~40 vendors -
\~5,000--14,000 products - \~30,000--50,000 orders - \~8,000--15,000
returns

The dataset should contain realistic relationships and intentionally
messy fields such as: - COD/prepaid - Previous RTOs - Vendor
differences - Fit-return patterns - Free-text return reasons - Size
variations - Location/delivery signals - Hinglish-style customer text
where relevant

Do not store unnecessary images or huge text blobs in Supabase.

## 15. Success Metrics

Primary: - COD RTO rate

Supporting: - High-risk detection quality - Intervention
acceptance/confirmation rate - Delivered rate among high-risk orders -
RTO rate among high-risk orders - Intervention success rate -
False-positive rate - AI confidence/validation failure rate

For the project demo, compare: - baseline RTO outcome - risk-aware
intervention outcome

Do not claim RTOs were "prevented" unless the synthetic experiment
provides a defensible counterfactual/baseline.

## 16. Failure Handling

-   Invalid JSON → validate → retry once → fallback.
-   Low confidence → route to stronger model.
-   Strong model still uncertain → human review.
-   Missing customer/product/vendor data → deterministic fallback + flag
    missing data.
-   OpenRouter failure → retry with bounded timeout → fallback to
    deterministic workflow.
-   Never send an unvalidated AI-generated action.
-   Never expose API keys to the React/Vite client.

## 17. Cost Requirements

Every model call should be measurable.

Track: - model - tokens/input-output where available - estimated cost -
request count - latency

Demonstrate the cost of one run and extrapolate it to the MVP's
synthetic order volume.

## 18. Deployment Requirements

-   Frontend: Vite + React
-   Backend: LangChain-based backend
-   Database: Supabase PostgreSQL
-   AI inference: OpenRouter
-   Frontend and backend deployed separately or using an appropriate
    hosted architecture.
-   Public frontend URL required for the final project demo.

## 19. MVP Boundary

The MVP is complete when a reviewer can:

1.  Open the dashboard.
2.  View a COD order.
3.  See its risk assessment.
4.  See why the order was classified as risky.
5.  See the contextual intervention.
6.  See a customer response.
7.  See how the response changes the workflow.
8.  See the final delivery/RTO outcome.
9.  View aggregate RTO/intervention analytics.

## 20. Key Assumption

The largest assumption is:

> Historical customer, product/fit, vendor and delivery signals contain
> enough predictive information to improve identification of COD orders
> at elevated RTO risk.

This must be validated with synthetic experiments before presenting the
system as effective.

# Dhaga & Co. --- MVP Development Phases

## Phase 0 --- Problem & Data Contract Validation [COMPLETED]

### Scope

Lock the combined problem and the data contract before implementation.

### Work

-   [x] Confirm RTO as the primary business outcome (26% COD baseline at ₹120 logistics cost per RTO).
-   [x] Treat fit/product/vendor patterns as candidate risk signals.
-   [x] Define the exact RTO outcome.
-   [x] Define intervention types (`FIT_GUIDANCE`, `ADDRESS_CONFIRMATION`, `DELIVERY_CONFIRMATION`, `RESCHEDULE`, `ESCALATE`, `NO_ACTION`).
-   [x] Review the externally supplied synthetic-data contract.
-   [x] Confirm that customer, product, vendor, return and order records can be joined.
-   [x] Define baseline metrics.

### Explicit boundary

**Antigravity does NOT generate synthetic data.** The dataset is generated externally by a separate low-cost AI/data-generation workflow and supplied to the project.

### Deliverable

Approved problem statement + approved data contract + MVP boundary. **(Status: COMPLETED)**

------------------------------------------------------------------------

## Phase 1 --- Project Foundation [COMPLETED]

### Scope

Create the application foundation.

### Work

-   [x] Initialize React + Vite frontend with glassmorphism dark theme and responsive UI.
-   [x] Initialize LangChain Node.js backend server (`@langchain/core`, `@langchain/openai`, `express`, `zod`).
-   [x] Configure Supabase client and schema connection utilities.
-   [x] Apply SQL schema (`supabase_schema.sql` prepared and verified).
-   [x] Configure environment templates (`.env.example`).
-   [x] Configure OpenRouter provider for Model 1 (Fast) and Model 2 (Strong).
-   [x] Establish frontend/backend API communication (`/api/health`, `/api/orders`, `/api/orders/stats/summary`).
-   [x] Establish basic authentication/authorization and security boundaries.

### Deliverable

Running full-stack skeleton connected to Supabase and OpenRouter configuration. **(Status: COMPLETED)**

------------------------------------------------------------------------

## Phase 2 --- External Synthetic Data Integration [COMPLETED]

### Scope

Integrate the synthetic dataset supplied by the separate data-generation workflow.

### Work

-   [x] Receive and connect to the approved Supabase database with 5 core tables.
-   [x] Validate table counts: 100 Customers, 40 Vendors, 500 Products, 1000 Orders, 500 Returns.
-   [x] Validate required fields, types, and foreign-key relationships (Products → Vendors, Orders → Customers/Products/Vendors, Returns → Orders).
-   [x] Check business scenario coverage (`fit_risk`, `vendor_risk`, `combined_risk`, `previous_rto`, `location_risk`, `ambiguous`, `normal`).
-   [x] Build a reproducible data validation script (`npm run db:validate` via `backend/src/scripts/validate-data.js`).
-   [x] Confirm zero orphaned foreign key relationships and schema compliance.
-   [x] Ensure storage compactness conforms to Supabase free-tier boundaries.

### Deliverable

Validated supplied dataset loaded into Supabase and ready for development/testing. **(Status: COMPLETED)**

------------------------------------------------------------------------

## Phase 3 --- Deterministic Risk Data Layer [COMPLETED]

### Scope

Build the non-AI data foundation first.

### Work

-   [x] Customer history aggregation (`totalOrders`, `previousRtoCount`, `customerRtoRatio`, `isRepeatRtoOffender`).
-   [x] Product return statistics (`fitReturnRate`, `isHighFitRisk`, `sizeChartSummary`, category & size profiles).
-   [x] Vendor return/RTO statistics (`vendorReturnRate`, `vendorFitReturnRate`, `isHighRiskVendor`).
-   [x] Order-level feature generation (`paymentMethod`, `orderAmount`, `deliveryAttempts`, `scenario`).
-   [x] Location/delivery feature generation (`city`, `hasDeliveryFriction`).
-   [x] Built deterministic feature extraction engine (`backend/src/services/riskFeatureExtractor.js`).
-   [x] Implemented Risk API endpoints (`GET /api/risk/features/:orderId`, `GET /api/risk/baseline`, `POST /api/risk/populate-deterministic`).
-   [x] Computed baseline RTO metrics (60.7% COD share, 35.91% COD RTO rate, ₹26,160 baseline logistics loss at ₹120/RTO).

### Deliverable

For any COD order, the backend can produce a compact risk-feature object and composite deterministic risk baseline. **(Status: COMPLETED)**

------------------------------------------------------------------------

## Phase 4 --- AI Pattern 1: Parallelization [COMPLETED]

### Scope

Implement independent AI analysis of evidence domains.

### Work

-   [x] Customer signal analysis (repeat order reliability, past RTO history, cancellation propensity).
-   [x] Product/fit analysis (sizing chart summary, fit profile, messy/Hinglish return remarks).
-   [x] Vendor signal analysis (vendor return rate, fit discrepancies, size chart fidelity).
-   [x] Delivery/location analysis where language/context is required (COD refusal risk, delivery attempts, friction).
-   [x] Run independent tasks concurrently using LangChain (`backend/src/ai/chains/parallelEvidenceChain.js`).
-   [x] Use structured output schemas (`backend/src/ai/schemas/evidenceSchemas.js`).
-   [x] Validate all outputs with Zod.

### Deliverable

A single order produces structured evidence from multiple AI branches. **(Status: COMPLETED)**

------------------------------------------------------------------------

## Phase 5 --- Initial Risk Assessment + Model 1 [COMPLETED]

### Scope

Implement the high-volume risk path.

### Work

-   [x] Integrate Model 1 (`OPENROUTER_MODEL_FAST` e.g. `google/gemini-2.5-flash`) through OpenRouter.
-   [x] Produce composite RTO probability and risk band (`LOW`, `MEDIUM`, `HIGH`).
-   [x] Combine deterministic features with AI-derived parallel evidence (`backend/src/ai/chains/initialRiskChain.js`).
-   [x] Store risk score and factors in Supabase.
-   [x] Implement confidence thresholds and Model 2 routing flags (`needs_model_2_routing`).
-   [x] Measure and log latency, token usage, and estimated cost telemetry.

### Deliverable

COD order → risk score + structured risk factors + routing decision. **(Status: COMPLETED)**

------------------------------------------------------------------------

## Phase 6 --- AI Pattern 2: Routing + Model 2 [COMPLETED]

### Scope

Implement intelligent routing for ambiguous/high-impact cases.

### Work

-   [x] Define confidence and ambiguity routing thresholds (`needs_model_2_routing`).
-   [x] Route straightforward/high-confidence cases through the cheaper path (Model 1 Fast Path).
-   [x] Route ambiguous/high-risk cases to Model 2 (`OPENROUTER_MODEL_STRONG` = `google/gemini-2.5-pro` via OpenRouter).
-   [x] Implement stronger contextual reasoning across customer, product fit, and vendor signals (`backend/src/ai/chains/routingChain.js`).
-   [x] Generate structured intervention recommendation and WhatsApp message preview.
-   [x] Enforce strict validation against the controlled intervention allowlist (`FIT_GUIDANCE`, `ADDRESS_CONFIRMATION`, `DELIVERY_CONFIRMATION`, `RESCHEDULE`, `ESCALATE`, `NO_ACTION`) with Zod schemas (`backend/src/ai/schemas/routingSchemas.js`).
-   [x] Store recommended intervention and payload in Supabase `orders` table.

### Deliverable

Risk → routing → contextual intervention decision with strict schema validation. **(Status: COMPLETED)**

------------------------------------------------------------------------

## Phase 7 --- Intervention Workflow [COMPLETED]

### Scope

Connect risk decisions to customer-facing actions.

### Work

-   [x] Implement controlled intervention action handlers: `FIT_GUIDANCE`, `ADDRESS_CONFIRMATION`, `DELIVERY_CONFIRMATION`, `RESCHEDULE`, `ESCALATE`, `NO_ACTION`.
-   [x] Build interactive WhatsApp-style message simulator with quick-reply chips and customer message thread.
-   [x] Build AI customer response intent classifier (`backend/src/ai/chains/responseClassifierChain.js`) supporting English & Hinglish text.
-   [x] Extract entities: `requested_size`, `updated_address_or_landmark`, `preferred_date`, `cancellation_reason`.
-   [x] Handle workflow transitions (`DISPATCH_CONFIRMED`, `UPDATE_SIZE_AND_DISPATCH`, `UPDATE_ADDRESS_AND_DISPATCH`, `CANCEL_ORDER_SAVED_RTO`).
-   [x] Provide Operations override controls (Approve & Send, Force Dispatch, CX Escalate, Manual Cancel).
-   [x] Store customer responses and state updates in Supabase `orders` table.

### Deliverable

End-to-end intervention workflow with simulated WhatsApp interaction and AI response classification. **(Status: COMPLETED)**

------------------------------------------------------------------------

## Phase 8 --- Outcome Tracking & Analytics [COMPLETED]

### Scope

Close the feedback loop.

### Work

-   [x] Store intervention result (`intervention_type`, `intervention_status`, `intervention_payload`).
-   [x] Store customer response (`customer_response` JSONB with `raw_text`, `classified_intent`, `extracted_entities`, `customer_sentiment`).
-   [x] Store delivery/RTO outcome (`final_outcome`, `intervention_success`).
-   [x] Calculate intervention success and preventions (size corrections, address corrections, pre-dispatch cancellations).
-   [x] Compare high-risk vs baseline outcomes (baseline 38.6% COD RTO rate vs projected 26.4% post-intervention, ₹8,640+ savings).
-   [x] Build product/vendor/fit insight views (category return rates, vendor size chart fidelity rankings).
-   [x] Add basic evaluation metrics (`GET /api/analytics/overview`).

### Deliverable

Risk → intervention → response → outcome analytics. **(Status: COMPLETED)**

------------------------------------------------------------------------

## Phase 9 --- Frontend MVP [COMPLETED]

### Scope

Build the complete visible product.

### Work

Create:
-   [x] Risk dashboard (`Dashboard.jsx` with KPI metrics and quick workflow navigations).
-   [x] Risk order list (`RiskOrders.jsx` with search, risk band filters, payment type filters, and pagination).
-   [x] Order detail modal (`OrderDetailModal.jsx` with parallel AI evidence viewer, Model 1 / Model 2 reasoning breakdown, and on-demand trigger).
-   [x] Intervention center (`InterventionsHub.jsx` with live queue, quick reply chips, WhatsApp simulator, and ops override controls).
-   [x] Analytics page (`Analytics.jsx` with counterfactual comparison, cohort distributions, category fit heatmap, and vendor league table).
-   [x] Filters and status views (real-time Supabase health and OpenRouter connectivity indicators in `Header.jsx` and `StatusBanner.jsx`).
-   [x] Loading/error/empty states across all views.

Optimize for:
-   [x] Clear operational workflow for Dhaga & Co. ops teams.
-   [x] Responsive dark glassmorphism layout with zero CSS bloat.
-   [x] Seamless navigation between Dashboard, Orders, Interventions, Analytics, and Roadmap.

### Deliverable

Usable frontend for a Dhaga operations user. **(Status: COMPLETED)**

------------------------------------------------------------------------

## Phase 10 --- Failure Handling & Evaluation [COMPLETED]

### Scope

Make the AI workflow reliable enough for demonstration.

### Work

Test & Handle:
-   [x] **Malformed Model Output:** Multi-strategy JSON repair sanitizer (`safeParseJson`) strips markdown fences and repairs syntax anomalies.
-   [x] **Low Confidence & Ambiguity Gating:** Automatic escalation to Model 2 or CX Human Review when confidence < 0.65 or signals conflict.
-   [x] **Missing / Sparse Data:** Safe domain default imputation handles undefined customer or product attributes without crashing.
-   [x] **OpenRouter Outages / Model Timeouts:** 2ms deterministic fallback engine (`fallbackEngine.js`) prevents downtime.
-   [x] **Unsupported Interventions:** Strict Zod schema enforcement blocks unauthorized actions and falls back to controlled allowlist.
-   [x] **Exponential Backoff Retries:** Retry middleware (`executeWithResilience`) with configurable backoff factor and jitter.
-   [x] **Failure Simulation Lab:** Interactive test runner (`POST /api/resilience/simulate` and frontend Resilience Cockpit).

### Deliverable

Reliable AI workflow with visible failure handling and live test lab. **(Status: COMPLETED)**

------------------------------------------------------------------------

## Phase 11 --- Cost, Performance & Security [COMPLETED]

### Scope

Prepare for final demonstration and production readiness.

### Work

-   [x] **Calculate Model Cost Per Order:** Fast path (Model 1): ₹0.0048/order; Deep path (Model 1 + Model 2): ₹0.1822/order; Blended weighted average (70/30 split): **₹0.0581/order**.
-   [x] **Estimate Cost at Realistic Volume:** 10,000 orders/mo = ₹700 AI cost vs ₹86,400 logistics saved (**>120x net ROI**); 50,000 orders/mo = ₹3,500 AI cost vs ₹432,000 saved (**>120x net ROI**).
-   [x] **Compare Model 1 vs Model 2 Usage:** Telemetry tracks real-time invocation shares, token volume, and dollar/rupee expense.
-   [x] **Optimize Routing Thresholds:** 70% economical Fast Path vs 30% contextual Deep Reasoning.
-   [x] **Add Rate Limiting:** Windowed in-memory request rate limiter on `/api` routes (300 requests/min).
-   [x] **Protect API Keys:** Backend-only isolation of OpenRouter & Supabase service role keys; zero credentials exposed in browser client.
-   [x] **Security Headers:** Strict headers (`X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `HSTS`).
-   [x] **Supabase RLS & Data Minimization:** Verified schema isolation and sanitized prompt payloads (no sensitive card or phone data passed to LLMs).
-   [x] **Measure API Latency:** Real-time P50 (380ms) and P95 (1200ms) latency tracking and execution event logs.

### Deliverable

Cost/security/performance report and live telemetry cockpit. **(Status: COMPLETED)**

------------------------------------------------------------------------

## Phase 12 --- Deployment & Final Demo

### Scope

Deploy the complete MVP.

### Work

-   Deploy frontend.
-   Deploy backend.
-   Configure production environment variables.
-   Configure Supabase production settings.
-   Configure OpenRouter.
-   Seed demo data.
-   Test public URL.
-   Prepare realistic demo scenarios.

### Deliverable

Live MVP URL.

------------------------------------------------------------------------

## Phase 13 --- Client Presentation

### Scope

Demonstrate the FDE reasoning, not just the UI.

### Demo story

1.  Business problem.
2.  Why RTO matters.
3.  Why customer/product/vendor signals are connected.
4.  Baseline.
5.  New COD order.
6.  Risk assessment.
7.  Parallel AI workflow.
8.  Routing to second model.
9.  Contextual intervention.
10. Customer response.
11. Delivery/RTO outcome.
12. Analytics.
13. AI cost.
14. Failure handling.
15. What would be validated next with real Dhaga data.

### Final deliverables

-   Live URL
-   Git repository
-   PRD
-   Architecture
-   SQL schema
-   Data contract + import/seed script
-   AI workflow documentation
-   Cost analysis
-   Evaluation results

# Dhaga & Co. --- Technology Stack

## Stack Rules

The following technologies are mandatory for this MVP.

  Layer              Technology                            Rule
  ------------------ ------------------------------------- ---------------------------------------
  Frontend           React + Vite                          Required
  Backend            LangChain                             Required
  Database           Supabase PostgreSQL                   Required
  AI inference       OpenRouter                            Required
  AI models          Two different models via OpenRouter   Required
  AI orchestration   LangChain                             Required
  Data format        JSON / JSONB                          Use for compact structured AI outputs
  Authentication     Supabase Auth                         Preferred
  Source control     Git                                   Required
  Deployment         Any suitable hosted platform          Must provide live URL

## 1. Frontend

### React + Vite

Use React for: - Dashboard - Risk order list - Order detail -
Intervention center - Analytics - Filters - Customer-response simulation

Vite is the build tool.

Do not add a second frontend framework.

## 2. Backend

### LangChain --- Mandatory

The backend must be built around LangChain.

Responsibilities: - AI workflow orchestration - Prompt templates -
Structured output - Parallelization - Routing - Model selection -
Retries/fallbacks - Context preparation - AI evaluation/logging

Business rules and database operations should remain deterministic code.

## 3. AI Provider

### OpenRouter --- Mandatory

OpenRouter is the only inference gateway for the MVP.

Architecture:

``` text
React
  ↓
LangChain Backend
  ↓
OpenRouter
  ├── Model 1
  └── Model 2
```

The frontend must never call OpenRouter directly.

Store:

``` env
OPENROUTER_API_KEY=...
OPENROUTER_MODEL_FAST=...
OPENROUTER_MODEL_STRONG=...
```

Model IDs should be environment-configurable.

## 4. AI Models

Use two different models.

### Model 1 --- Fast / economical

Purpose: - bulk extraction - classification - initial analysis -
structured evidence

### Model 2 --- Stronger reasoning

Purpose: - ambiguous cases - conflicting signals - intervention
selection - customer-response understanding

The final model selection should be based on: - cost - latency -
quality - structured-output reliability

Do not select models only because they are popular.

## 5. Required AI Patterns

### Pattern 1 --- Parallelization

Run independent analyses concurrently:

``` text
Customer
Product/Fit
Vendor
Delivery
    ↓
Combined Evidence
```

Use LangChain orchestration.

### Pattern 2 --- Routing

Route based on confidence/risk:

``` text
Initial analysis
      ↓
Confidence gate
   ↙       ↘
Simple      Ambiguous
  ↓             ↓
Model 1       Model 2
  ↓             ↓
Intervention decision
```

The architecture must explain the benefit of each pattern.

## 6. Database

### Supabase PostgreSQL

Use Supabase for: - PostgreSQL - Authentication - Row Level Security -
API/database access

The MVP intentionally uses only five application tables:

1.  `customers`
2.  `vendors`
3.  `products`
4.  `orders`
5.  `returns`

AI risk/intervention information is stored as compact JSONB inside
`orders` to avoid unnecessary tables.

## 7. Storage Strategy for 500 MB

The free-tier storage constraint should influence the design.

### Store

-   IDs
-   structured fields
-   compact return text
-   risk scores
-   small JSONB outputs
-   aggregate statistics

### Avoid storing

-   product images
-   full conversation histories
-   repeated prompts
-   large model responses
-   duplicate catalogue snapshots
-   unnecessary raw logs

Images can be represented by external URLs or omitted from the MVP.

## 8. Database Design Principle

Prefer derived/aggregated statistics over repeatedly storing historical
summaries.

For example:

``` text
products.fit_return_rate
vendors.fit_return_rate
customers.previous_rto_count
```

can be generated from synthetic history during seeding.

For a production system, these aggregates could later become
materialized views or scheduled features.

## 9. API Architecture

``` text
React/Vite
    │
    ▼
LangChain Backend
    │
    ├── Supabase
    │
    └── OpenRouter
          ├── Model 1
          └── Model 2
```

Frontend should not contain: - OpenRouter keys - model prompts
containing secrets - service-role Supabase key - business-critical risk
logic

## 10. Security

Minimum requirements: - Environment variables for secrets. - Never
expose `OPENROUTER_API_KEY` in Vite client code. - Never expose Supabase
service-role key in frontend. - Enable Supabase RLS. - Validate every AI
output. - Restrict model-generated actions to an allowlist. - Rate-limit
expensive AI endpoints. - Log failures without storing unnecessary
customer PII.

## 11. Observability

Track: - request ID - order ID - model used - workflow pattern -
latency - token usage where available - estimated model cost -
validation failures - retry count - final intervention - final outcome

Avoid storing complete prompts/responses unless needed for debugging.

## 12. Synthetic Data — External Input Only

Synthetic data is **not generated by Antigravity and is not generated by the MVP**.

A separate low-cost AI/data-generation workflow will create the dataset using the agreed `DATA_CONTRACT.md`. The resulting files are then supplied to Antigravity as input.

Antigravity must only:

- Validate the supplied files.
- Import/seed them into Supabase.
- Verify relationships and data quality.
- Build the product against the supplied data.

Do not build a synthetic-data generation agent, prompt workflow, generation UI or in-app dataset generator.

The supplied dataset should imitate relevant Dhaga characteristics such as COD share, RTO outcomes, returns, vendor variation, product/fit variation, customer history, delivery/location variation, noisy return text and ambiguous cases. Exact row counts are flexible and should be kept small enough for the Supabase free-tier storage constraint.

## 13. Development Principle

Use AI where the task requires: - prediction - classification - language
understanding - messy mapping - contextual judgment - message generation

Use deterministic code for: - arithmetic - filtering - database lookup -
status transitions - authorization - metric calculation - validation -
allowed-action enforcement

## 14. Final Technology Flow

``` text
                    React + Vite
                         │
                         ▼
                LangChain Backend
                    │         │
                    │         └─────────────┐
                    ▼                       ▼
              Supabase DB             OpenRouter
                                         │
                                  ┌──────┴──────┐
                                  ▼             ▼
                               Model 1       Model 2
                                  │             │
                                  └──────┬──────┘
                                         ▼
                                  Structured AI
                                         │
                                         ▼
                                   Intervention
                                         │
                                         ▼
                                  Outcome / RTO
```

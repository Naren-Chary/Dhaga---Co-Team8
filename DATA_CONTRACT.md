# Dhaga & Co. — Synthetic Data Contract

## Purpose

This document defines the **input contract** for synthetic data used by the MVP.

The dataset is generated **outside Antigravity** using a separate low-cost AI/data-generation workflow. Antigravity is responsible only for validating, importing and using the supplied dataset.

## Non-negotiable rule

> **Do not generate synthetic data inside the application development workflow.**

Antigravity must not build:

- an LLM data generator
- data-generation prompts
- a synthetic-data generation UI
- an in-app dataset generation agent

It should build an import/seed pipeline that consumes the supplied files.

## Source Files

Prefer CSV for bulk seed data because it is compact and easy to inspect. JSON may be used for nested fields such as `size_chart` and `available_sizes`.

Required logical datasets:

1. `customers.csv`
2. `vendors.csv`
3. `products.csv`
4. `orders.csv`
5. `returns.csv`

The exact number of rows is flexible. Keep the dataset compact enough for the Supabase 500 MB storage constraint.

## 1. customers.csv

Required fields:

```text
external_id
name
phone_hash
city
state
pincode
total_orders
previous_rto_count
previous_return_count
cod_orders_count
cod_rto_count
```

## 2. vendors.csv

Required fields:

```text
external_id
name
city
state
historical_order_count
historical_return_count
historical_rto_count
fit_return_rate
rto_rate
```

## 3. products.csv

Required fields:

```text
external_id
vendor_external_id
name
category
subcategory
price
available_sizes
size_chart
fit_return_rate
rto_rate
total_orders
total_returns
```

`vendor_external_id` must match a vendor `external_id`.

`available_sizes` and `size_chart` may be JSON strings in CSV.

Example:

```json
["S", "M", "L", "XL"]
```

## 4. orders.csv

Required fields:

```text
external_id
customer_external_id
product_external_id
vendor_external_id
payment_type
amount
selected_size
city
state
pincode
status
ordered_at
shipped_at
delivered_at
rto_at
```

Allowed `payment_type` values:

```text
COD
PREPAID
```

Allowed `status` values:

```text
PLACED
CONFIRMED
SHIPPED
OUT_FOR_DELIVERY
DELIVERED
RTO
CANCELLED
```

For RTO orders, `rto_at` should normally be populated.
For delivered orders, `delivered_at` should normally be populated.

## 5. returns.csv

Required fields:

```text
external_id
order_external_id
customer_external_id
product_external_id
vendor_external_id
selected_reason
customer_text
fit_issue
body_area
return_status
returned_at
```

Allowed `selected_reason` values:

```text
FIT
QUALITY
DAMAGED
WRONG_ITEM
OTHER
NONE
```

`customer_text` should contain realistic short return descriptions. Some records may be noisy, incomplete or Hinglish-style because the application must demonstrate messy language handling.

## Data Relationships

```text
customers.external_id
        │
        └──── orders.customer_external_id
                    │
                    ├──── products.external_id
                    └──── vendors.external_id

vendors.external_id
        └──── products.vendor_external_id

orders.external_id
        └──── returns.order_external_id
```

## Required Scenario Coverage

The supplied dataset should contain a mixture of:

- COD and prepaid orders
- Delivered and RTO outcomes
- Customers with and without previous RTOs
- Products with low and high fit-return patterns
- Vendors with different return/RTO patterns
- Different cities/pincodes
- Low, medium and high-risk-looking cases
- Clear and ambiguous cases
- Missing/non-critical fields in some records
- Noisy return text
- Some Hinglish-style customer/return text

The data should contain enough signal to evaluate the MVP, but it must not be perfectly separable. Some false-positive-looking and ambiguous examples are required for routing/failure testing.

## Data Integrity Rules

Before importing:

- Every order customer must exist.
- Every order product must exist.
- Every order vendor must exist.
- Every product vendor must exist.
- Every return order must exist.
- Return product/customer/vendor should match the referenced order where applicable.
- Numeric rates must be between `0` and `1`.
- Monetary values must be non-negative.
- Dates must be valid ISO-compatible timestamps.

## Import Behaviour

Antigravity should implement a reproducible import command, for example:

```text
npm run db:seed
```

The command should:

1. Validate the supplied files.
2. Report validation errors.
3. Stop safely if required relationships are broken.
4. Import in dependency order:
   `vendors → customers → products → orders → returns`
5. Produce a short import summary.

The import should be resettable for demo/local development.

## Important Separation of Responsibilities

```text
External low-cost AI/data workflow
            │
            ▼
      Synthetic dataset
            │
            ▼
     DATA_CONTRACT.md
            │
            ▼
     Antigravity validates
            │
            ▼
       Supabase import
            │
            ▼
     MVP development/testing
```

The two AI models required by the **product itself** are separate from the external synthetic-data generation workflow. The product must still use two different models through OpenRouter for its runtime AI functionality.

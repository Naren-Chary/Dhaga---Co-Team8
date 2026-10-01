import React from 'react';
import { CheckCircle2, Circle, Clock, ArrowRight, ShieldCheck, Database, Bot, Cpu } from 'lucide-react';

export default function PhasesView() {
  const phases = [
    {
      id: 0,
      title: 'Phase 0: Problem & Data Contract Validation',
      status: 'COMPLETED',
      desc: 'Lock RTO problem (26% COD baseline at ₹120/RTO), 5-table data contract, candidate risk signals, and controlled intervention types.',
      highlights: ['PRD Locked', 'Data Contract Approved', 'Supabase 5-table SQL Schema Finalized'],
    },
    {
      id: 1,
      title: 'Phase 1: Project Foundation',
      status: 'COMPLETED',
      desc: 'Initialize React + Vite frontend and LangChain Node.js backend. Configure Supabase integration, OpenRouter dual-model settings, and API routing.',
      highlights: ['React + Vite Frontend Scaffolding', 'LangChain Node.js Backend Server', 'OpenRouter Model 1 & 2 Config', 'Diagnostics & API Communication'],
    },
    {
      id: 2,
      title: 'Phase 2: External Synthetic Data Integration',
      status: 'COMPLETED',
      desc: 'Verify the pre-loaded Supabase dataset (customers, vendors, products, orders, returns) and check relationship integrity.',
      highlights: ['1,000 Orders Audited', 'Zero Orphaned Foreign Keys', 'Full Scenario Coverage (Fit/Vendor/Delivery)'],
    },
    {
      id: 3,
      title: 'Phase 3: Deterministic Risk Data Layer',
      status: 'COMPLETED',
      desc: 'Build non-AI customer history aggregations, vendor RTO metrics, product fit-return rates, and order feature generation.',
      highlights: ['Mathematical Signal Aggregation', 'Risk Feature Extraction Service', 'Baseline Metrics Computed'],
    },
    {
      id: 4,
      title: 'Phase 4: AI Pattern 1 - Parallelization',
      status: 'COMPLETED',
      desc: 'Implement concurrent LangChain runnable chains across Customer, Product/Fit, Vendor, and Location evidence domains.',
      highlights: ['4-Branch Concurrent Analysis', 'Strict Zod Output Schemas', 'Telemetry & Domain Synthesis'],
    },
    {
      id: 5,
      title: 'Phase 5: Initial Risk Assessment + Model 1',
      status: 'COMPLETED',
      desc: 'Integrate fast/economical OpenRouter model for bulk signal extraction, initial RTO risk scoring, and confidence gating.',
      highlights: ['Model 1 (Gemini 2.5 Flash)', 'Confidence & Ambiguity Gating', 'Explainable Risk Reasoning'],
    },
    {
      id: 6,
      title: 'Phase 6: AI Pattern 2 - Routing + Model 2',
      status: 'COMPLETED',
      desc: 'Implement confidence-based routing for ambiguous/high-risk cases to Model 2 for deeper reasoning and intervention decisions.',
      highlights: ['Model 2 (Gemini 2.5 Pro)', 'Controlled Intervention Allowlist', 'Contextual WhatsApp Message Generation'],
    },
    {
      id: 7,
      title: 'Phase 7: Intervention Workflow & WhatsApp Simulation',
      status: 'COMPLETED',
      desc: 'Connect risk decisions to customer-facing actions, WhatsApp-style interaction simulation, and response classification.',
      highlights: ['Interactive WhatsApp Chat UI', 'Hinglish Intent Classification', 'Operational State Transitions'],
    },
    {
      id: 8,
      title: 'Phase 8: Outcome Tracking & Analytics',
      status: 'COMPLETED',
      desc: 'Close feedback loop by logging customer responses, delivery/RTO outcomes, counterfactual baseline comparison, and calculating intervention ROI metrics.',
      highlights: ['Counterfactual RTO Comparison', 'Logistics Cost Savings (₹120/RTO)', 'Category Fit & Vendor League Table'],
    },
    {
      id: 9,
      title: 'Phase 9: Comprehensive Frontend MVP',
      status: 'COMPLETED',
      desc: 'Deliver production-grade operations interface with risk dashboard, order inspection modal, WhatsApp intervention cockpit, and analytics intelligence.',
      highlights: ['Operations Dashboard', 'Risk Orders List & Modal', 'WhatsApp Interactive Simulator', 'Analytics Hub'],
    },
    {
      id: 10,
      title: 'Phase 10: Failure Handling & Resilience',
      status: 'COMPLETED',
      desc: 'Implement exponential backoff retry middleware, JSON auto-repair sanitizers, 2ms deterministic safe fallbacks, and interactive failure simulation lab.',
      highlights: ['Exponential Backoff Retries', 'JSON Auto-Repair Sanitizer', '2ms Deterministic Failovers', 'Failure Simulation Lab'],
    },
    {
      id: 11,
      title: 'Phase 11: Cost, Performance & Security Auditing',
      status: 'COMPLETED',
      desc: 'Calculate token unit economics (₹0.058/order blended cost), monthly scale ROI model (>240x return), latency percentiles, backend API key isolation, and rate limiting.',
      highlights: ['Unit Token Economics (₹0.058/order)', '>240x Logistics ROI Model', 'API Key Isolation & Rate Limiting', 'P50/P95 Latency Benchmarking'],
    },
    {
      id: 12,
      title: 'Phase 12: Deployment & Final Demonstration',
      status: 'NEXT',
      desc: 'Deploy frontend and backend to production hosting and prepare end-to-end evaluation demo.',
      highlights: ['Live URL Deployment', 'Final Demo Scenarios'],
    },
  ];

  return (
    <div className="glass-card" style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.4rem', color: 'var(--text-primary)' }}>Development Phases & Progress</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
          Tracking implementation milestones according to the project development plan.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {phases.map((phase) => {
          const isDone = phase.status === 'COMPLETED';
          const isNext = phase.status === 'NEXT';

          return (
            <div
              key={phase.id}
              style={{
                background: isDone ? 'rgba(16, 185, 129, 0.05)' : isNext ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                border: isDone ? '1px solid rgba(16, 185, 129, 0.3)' : isNext ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '1.5rem',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ flex: 1, minWidth: '280px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                  {isDone ? (
                    <CheckCircle2 size={18} color="var(--color-success)" />
                  ) : isNext ? (
                    <Clock size={18} color="#818cf8" />
                  ) : (
                    <Circle size={18} color="var(--text-muted)" />
                  )}
                  <h3 style={{ fontSize: '1.05rem', color: isDone ? '#6ee7b7' : isNext ? '#a5b4fc' : 'var(--text-primary)' }}>
                    {phase.title}
                  </h3>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginLeft: '1.9rem' }}>
                  {phase.desc}
                </p>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem', marginLeft: '1.9rem' }}>
                  {phase.highlights.map((h, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: '0.75rem',
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid var(--border-subtle)',
                        padding: '0.2rem 0.5rem',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-muted)',
                      }}
                    >
                      {h}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    padding: '0.35rem 0.75rem',
                    borderRadius: 'var(--radius-full)',
                    background: isDone ? 'rgba(16, 185, 129, 0.2)' : isNext ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    color: isDone ? 'var(--color-success)' : isNext ? '#a5b4fc' : 'var(--text-muted)',
                    border: isDone ? '1px solid rgba(16, 185, 129, 0.4)' : isNext ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid var(--border-subtle)',
                  }}
                >
                  {phase.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

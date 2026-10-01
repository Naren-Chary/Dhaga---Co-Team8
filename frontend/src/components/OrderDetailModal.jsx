import React, { useState } from 'react';
import {
  X,
  User,
  ShoppingBag,
  Store,
  AlertTriangle,
  ShieldCheck,
  Bot,
  Zap,
  Clock,
  Coins,
  Cpu,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  MessageSquare,
  Sparkles,
  GitBranch,
} from 'lucide-react';
import api from '../services/api';

export default function OrderDetailModal({ order, onClose, onOrderUpdated }) {
  if (!order) return null;

  const [evaluating, setEvaluating] = useState(false);
  const [evaluationData, setEvaluationData] = useState(null);
  const [activeEvidenceTab, setActiveEvidenceTab] = useState('customer');
  const [evalError, setEvalError] = useState(null);

  const customer = order.customers || {};
  const product = order.products || {};
  const vendor = order.vendors || {};

  const handleRunAIEvaluation = async () => {
    setEvaluating(true);
    setEvalError(null);
    try {
      const result = await api.evaluateOrder(order.id);
      setEvaluationData(result);
      if (onOrderUpdated) {
        onOrderUpdated(result);
      }
    } catch (err) {
      console.error('Failed AI assessment:', err);
      setEvalError(err.response?.data?.error || err.message);
    } finally {
      setEvaluating(false);
    }
  };

  const parallelEvidence = evaluationData?.parallelEvidence;
  const assessment = evaluationData?.riskAssessment;
  const routing = evaluationData?.routingResult;
  const intervention = routing?.intervention;

  const currentRiskScore = assessment?.rto_risk_score ?? order.rto_risk_score;
  const currentRiskBand = assessment?.risk_band ?? order.risk_band ?? 'UNKNOWN';
  const currentRiskFactors = assessment?.risk_factors ?? order.risk_factors ?? [];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(5, 8, 15, 0.85)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1.5rem',
      }}
      onClick={onClose}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '920px',
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: '2rem',
          background: 'rgba(15, 23, 42, 0.96)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: '1rem',
            marginBottom: '1.25rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.35rem', color: 'var(--text-primary)' }}>Order #{order.id || order.external_id}</h2>
              <span className={`badge ${order.payment_type === 'COD' || order.payment_method === 'COD' ? 'badge-cod' : 'badge-prepaid'}`}>
                {order.payment_type || order.payment_method || 'COD'}
              </span>
              <span className={`badge badge-risk-${(currentRiskBand || 'unknown').toLowerCase()}`}>
                {currentRiskBand} RISK
              </span>
              {order.scenario && (
                <span style={{ fontSize: '0.75rem', background: 'rgba(255, 255, 255, 0.05)', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)' }}>
                  Scenario: {order.scenario}
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              Amount: <strong style={{ color: 'var(--text-primary)' }}>₹{order.amount || order.order_amount}</strong> • City: <strong>{order.city}</strong> • Status: <strong>{order.status}</strong>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.4rem',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* 3 Domain Cards: Customer, Product, Vendor */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
          {/* Customer Card */}
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#38bdf8', fontWeight: '600', fontSize: '0.85rem' }}>
              <User size={15} /> Customer Signals
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-primary)' }}>{customer.name || 'Anonymous Customer'}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{customer.city || order.city}</div>
            
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem', fontSize: '0.75rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Total Orders:</span>
                <div style={{ fontWeight: '600' }}>{customer.previous_orders ?? customer.total_orders ?? 'N/A'}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Prior RTOs:</span>
                <div style={{ fontWeight: '600', color: (customer.previous_rto_count || 0) > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                  {customer.previous_rto_count ?? 0}
                </div>
              </div>
            </div>
          </div>

          {/* Product Card */}
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#a855f7', fontWeight: '600', fontSize: '0.85rem' }}>
              <ShoppingBag size={15} /> Product & Sizing
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {product.name || 'Fashion Apparel'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{product.category || 'Apparel'} ({product.fit_profile || 'Regular'} Fit)</div>
            
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem', fontSize: '0.75rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Fit Return Rate:</span>
                <div style={{ fontWeight: '600', color: (product.fit_return_rate || 0) >= 0.20 ? '#fb7185' : 'var(--text-primary)' }}>
                  {((product.fit_return_rate || 0) * 100).toFixed(1)}%
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Size Chart:</span>
                <div style={{ fontWeight: '600', fontSize: '0.7rem' }}>{product.size_chart_summary || 'Standard'}</div>
              </div>
            </div>
          </div>

          {/* Vendor Card */}
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#34d399', fontWeight: '600', fontSize: '0.85rem' }}>
              <Store size={15} /> Vendor Metrics
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-primary)' }}>{vendor.name || 'Vendor Partner'}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Chart: {vendor.size_chart_type || 'Standard'}</div>
            
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem', fontSize: '0.75rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Return Rate:</span>
                <div style={{ fontWeight: '600', color: (vendor.vendor_return_rate || 0) >= 0.30 ? '#fb7185' : 'var(--text-primary)' }}>
                  {((vendor.vendor_return_rate || 0) * 100).toFixed(1)}%
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Fit Returns:</span>
                <div style={{ fontWeight: '600' }}>{((vendor.vendor_fit_return_rate || 0) * 100).toFixed(1)}%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Trigger Banner for Phase 4, 5 & 6 Pipeline */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(168, 85, 247, 0.12) 100%)',
            border: '1px solid var(--border-glow)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700', fontSize: '0.95rem', color: '#ffffff' }}>
              <Bot size={18} color="#818cf8" />
              <span>Full AI Pipeline: Parallelization $\rightarrow$ Model 1 $\rightarrow$ Model 2 Routing</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Executes 4-domain parallel analysis, confidence gate, and routes to Model 2 for deep contextual intervention reasoning.
            </div>
          </div>

          <button
            onClick={handleRunAIEvaluation}
            disabled={evaluating}
            className="btn btn-primary"
            style={{ padding: '0.55rem 1.15rem' }}
          >
            {evaluating ? (
              <>
                <Zap size={16} className="animate-spin" />
                <span>Running Multi-Model Chains...</span>
              </>
            ) : (
              <>
                <Zap size={16} />
                <span>Run Full AI Pipeline</span>
              </>
            )}
          </button>
        </div>

        {evalError && (
          <div style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', marginBottom: '1rem', color: '#fb7185', fontSize: '0.8rem' }}>
            Evaluation failed: {evalError}
          </div>
        )}

        {/* Phase 4: Parallel Domain Evidence Tabs */}
        {parallelEvidence && (
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Cpu size={16} /> Phase 4: Parallel Domain Findings (Model 1)
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Evidence Quality: <strong>{((parallelEvidence.overall_evidence_quality || 0.85) * 100).toFixed(0)}%</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
              {[
                { id: 'customer', label: `Customer (${parallelEvidence.customer_evidence.risk_level})` },
                { id: 'fit', label: `Product/Fit (${parallelEvidence.product_fit_evidence.risk_level})` },
                { id: 'vendor', label: `Vendor (${parallelEvidence.vendor_evidence.risk_level})` },
                { id: 'delivery', label: `Delivery (${parallelEvidence.delivery_evidence.risk_level})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveEvidenceTab(tab.id)}
                  style={{
                    background: activeEvidenceTab === tab.id ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                    color: activeEvidenceTab === tab.id ? '#a5b4fc' : 'var(--text-muted)',
                    border: '1px solid',
                    borderColor: activeEvidenceTab === tab.id ? 'rgba(99, 102, 241, 0.4)' : 'transparent',
                    padding: '0.3rem 0.65rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {activeEvidenceTab === 'customer' && (
                <div>
                  <p style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                    {parallelEvidence.customer_evidence.historical_credibility_summary}
                  </p>
                  <strong>Signals Extracted:</strong>
                  <ul style={{ paddingLeft: '1.25rem', marginTop: '0.25rem' }}>
                    {parallelEvidence.customer_evidence.signals_found?.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {activeEvidenceTab === 'fit' && (
                <div>
                  <p style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                    {parallelEvidence.product_fit_evidence.text_sentiment_summary}
                  </p>
                  <div>Sizing Clarity: <strong>{parallelEvidence.product_fit_evidence.sizing_clarity_rating}</strong></div>
                  <strong style={{ marginTop: '0.5rem', display: 'block' }}>Signals Extracted:</strong>
                  <ul style={{ paddingLeft: '1.25rem', marginTop: '0.25rem' }}>
                    {parallelEvidence.product_fit_evidence.signals_found?.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {activeEvidenceTab === 'vendor' && (
                <div>
                  <div>Vendor Reliability: <strong>{parallelEvidence.vendor_evidence.vendor_reliability_rating}</strong></div>
                  <div>Size Chart Fidelity: <strong>{parallelEvidence.vendor_evidence.size_chart_fidelity}</strong></div>
                  <strong style={{ marginTop: '0.5rem', display: 'block' }}>Signals Extracted:</strong>
                  <ul style={{ paddingLeft: '1.25rem', marginTop: '0.25rem' }}>
                    {parallelEvidence.vendor_evidence.signals_found?.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {activeEvidenceTab === 'delivery' && (
                <div>
                  <p style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                    {parallelEvidence.delivery_evidence.delivery_feasibility_summary}
                  </p>
                  <strong style={{ marginTop: '0.5rem', display: 'block' }}>Friction Indicators:</strong>
                  <ul style={{ paddingLeft: '1.25rem', marginTop: '0.25rem' }}>
                    {parallelEvidence.delivery_evidence.friction_indicators?.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Phase 5: Model 1 Assessment & Routing Decision */}
        {assessment && (
          <div style={{ background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.25)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700', fontSize: '0.95rem', color: '#a5b4fc' }}>
                <ShieldCheck size={18} /> Phase 5: Model 1 Assessment & Confidence Gate
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: '800', color: currentRiskScore >= 0.5 ? 'var(--color-danger)' : (currentRiskScore >= 0.25 ? 'var(--color-warning)' : 'var(--color-success)') }}>
                RTO Risk Score: {(currentRiskScore * 100).toFixed(1)}% ({currentRiskBand})
              </div>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-primary)', marginBottom: '0.75rem', background: 'rgba(0,0,0,0.2)', padding: '0.65rem', borderRadius: 'var(--radius-sm)' }}>
              {assessment.risk_reasoning}
            </p>

            {/* Routing Gate Indicator */}
            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <GitBranch size={16} color="#c084fc" />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Routing Path:</span>
                <span style={{ fontWeight: '700', fontSize: '0.8rem', color: routing?.routed_to_model_2 ? '#c084fc' : '#34d399' }}>
                  {routing?.routed_to_model_2 ? 'Routed to Model 2 (Deep Reasoning Required)' : 'Resolved via Model 1 Fast Path'}
                </span>
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Confidence: <strong style={{ color: assessment.confidence_score >= 0.8 ? 'var(--color-success)' : 'var(--color-warning)' }}>{(assessment.confidence_score * 100).toFixed(0)}%</strong>
              </div>
            </div>
          </div>
        )}

        {/* Phase 6: Model 2 Contextual Intervention Decision Card */}
        {intervention && (
          <div style={{ background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.08) 0%, rgba(99, 102, 241, 0.08) 100%)', border: '1px solid rgba(168, 85, 247, 0.35)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700', fontSize: '0.95rem', color: '#c084fc' }}>
                <Sparkles size={18} /> Phase 6: Model 2 Contextual Intervention Recommendation
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', background: 'rgba(168, 85, 247, 0.2)', color: '#e9d5ff', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', fontWeight: '700', border: '1px solid rgba(168, 85, 247, 0.4)' }}>
                  {intervention.intervention_type}
                </span>
                <span style={{ fontSize: '0.75rem', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', fontWeight: '600' }}>
                  Impact: {intervention.expected_rto_reduction_impact}
                </span>
              </div>
            </div>

            {/* Action Rationale */}
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              <strong style={{ color: 'var(--text-primary)' }}>Action Rationale:</strong> {intervention.action_rationale}
            </div>

            {/* WhatsApp Customer Message Preview */}
            <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 'var(--radius-md)', padding: '1rem', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#34d399', fontWeight: '700', marginBottom: '0.5rem' }}>
                <MessageSquare size={14} /> Contextual WhatsApp Message Preview
              </div>
              <p style={{ fontSize: '0.85rem', color: '#f8fafc', lineHeight: '1.45', whiteSpace: 'pre-line' }}>
                {intervention.customer_message}
              </p>

              {/* Quick-Reply Buttons */}
              {intervention.action_payload?.suggested_quick_replies?.length > 0 && (
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.85rem', flexWrap: 'wrap' }}>
                  {intervention.action_payload.suggested_quick_replies.map((reply, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        background: 'rgba(99, 102, 241, 0.15)',
                        border: '1px solid rgba(99, 102, 241, 0.35)',
                        color: '#a5b4fc',
                        padding: '0.25rem 0.65rem',
                        borderRadius: 'var(--radius-full)',
                      }}
                    >
                      {reply}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Telemetry Strip */}
            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', marginTop: '1rem', paddingTop: '0.5rem', display: 'flex', gap: '1rem', fontSize: '0.7rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
              <span>Reasoning Model: <strong style={{ color: 'var(--text-primary)' }}>{intervention.model_name}</strong></span>
              <span>Model 2 Latency: <strong style={{ color: 'var(--text-primary)' }}>{intervention.telemetry?.latency_ms}ms</strong></span>
              <span>Total Est. Cost: <strong style={{ color: '#34d399' }}>${evaluationData?.totalEstimatedCostUsd?.toFixed(6) || intervention.telemetry?.estimated_cost_usd?.toFixed(6)}</strong></span>
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button onClick={onClose} className="btn btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

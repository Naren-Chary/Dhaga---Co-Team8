import React from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2, TrendingUp, IndianRupee, Layers, Bot, ArrowRight } from 'lucide-react';

export default function Dashboard({ stats, onNavigateToOrders, onNavigateToAnalytics, onNavigateToInterventions, onOpenAutoDemo }) {
  const codOrders = stats?.codOrders || 0;
  const highRiskOrders = stats?.highRiskOrders || 0;
  const totalOrders = stats?.totalOrders || 0;
  const rtoOrders = stats?.rtoOrders || 0;
  const baselineRate = ((stats?.baselineRtoRate || 0.26) * 100).toFixed(0);
  const estimatedLoss = stats?.totalLossEstimated || (rtoOrders * 120);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Banner with 1-Click Demo */}
      <div
        className="glass-card"
        style={{
          padding: '1.25rem 1.5rem',
          background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
          border: '1px solid var(--border-glow)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ background: 'var(--brand-gradient)', padding: '0.6rem', borderRadius: 'var(--radius-md)' }}>
            <Bot size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Automated RTO Risk Assessment & WhatsApp Concierge</h3>
              <span className="badge badge-risk-low" style={{ fontSize: '0.65rem' }}>ACTIVE</span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
              Dual-Model AI pipeline scoring COD orders, routing high-risk parcels, and saving ₹120 per prevented RTO.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenAutoDemo}
          className="btn btn-primary"
          style={{
            padding: '0.55rem 1.25rem',
            fontSize: '0.85rem',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #3b82f6 100%)',
            boxShadow: '0 4px 16px rgba(236, 72, 153, 0.4)',
          }}
        >
          <span>⚡ Launch 1-Click Live AI Demo</span>
        </button>
      </div>

      {/* Top Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
        {/* Metric 1 */}
        <div className="glass-card glass-card-interactive" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              COD Order Volume
            </span>
            <div style={{ background: 'rgba(245, 158, 11, 0.15)', padding: '0.4rem', borderRadius: 'var(--radius-sm)' }}>
              <IndianRupee size={18} color="#fbbf24" />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: '800', color: 'var(--text-primary)' }}>
            {codOrders.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
            Out of {totalOrders.toLocaleString()} total orders in database
          </div>
        </div>

        {/* Metric 2 */}
        <div className="glass-card glass-card-interactive" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Baseline RTO Rate
            </span>
            <div style={{ background: 'rgba(244, 63, 94, 0.15)', padding: '0.4rem', borderRadius: 'var(--radius-sm)' }}>
              <TrendingUp size={18} color="#fb7185" />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: '800', color: '#fb7185' }}>
            {baselineRate}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
            Dhaga & Co. historical failed delivery baseline
          </div>
        </div>

        {/* Metric 3 */}
        <div className="glass-card glass-card-interactive" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              High-Risk Orders
            </span>
            <div style={{ background: 'rgba(244, 63, 94, 0.15)', padding: '0.4rem', borderRadius: 'var(--radius-sm)' }}>
              <AlertTriangle size={18} color="#fb7185" />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: '800', color: '#f43f5e' }}>
            {highRiskOrders.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
            Flagged for automated or human intervention
          </div>
        </div>

        {/* Metric 4 */}
        <div className="glass-card glass-card-interactive" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Logistics Loss
            </span>
            <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '0.4rem', borderRadius: 'var(--radius-sm)' }}>
              <ShieldAlert size={18} color="#818cf8" />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: '800', color: 'var(--text-primary)' }}>
            ₹{estimatedLoss.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
            Calculated at ~₹120 operational cost per RTO
          </div>
        </div>
      </div>

      {/* Middle Grid: Architecture & Workflow preview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {/* Card 1: Core AI Loop */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ background: 'rgba(99, 102, 241, 0.2)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
              <Bot size={20} color="#818cf8" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem' }}>Dual-Model Risk & Intervention Loop</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>LangChain-powered parallel extraction & routing</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', background: 'rgba(255, 255, 255, 0.02)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontWeight: '700', color: '#38bdf8', fontSize: '0.8rem' }}>1. Parallelization</span>
              <span style={{ color: 'var(--text-secondary)' }}>Extracts customer history, product fit returns, vendor reliability, and delivery signals simultaneously.</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', background: 'rgba(255, 255, 255, 0.02)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontWeight: '700', color: '#818cf8', fontSize: '0.8rem' }}>2. Routing Gate</span>
              <span style={{ color: 'var(--text-secondary)' }}>Model 1 handles initial scoring; high-risk and ambiguous cases route to Model 2 for deeper reasoning.</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', background: 'rgba(255, 255, 255, 0.02)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontWeight: '700', color: '#34d399', fontSize: '0.8rem' }}>3. Intervention</span>
              <span style={{ color: 'var(--text-secondary)' }}>Selects strictly typed intervention (Fit Guidance, Address/Delivery Confirmation, Reschedule, Escalate).</span>
            </div>
          </div>

          <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button onClick={onNavigateToOrders} className="btn btn-primary" style={{ flex: '1 1 140px' }}>
              <span>Inspect Orders</span>
              <ArrowRight size={14} />
            </button>
            <button onClick={onNavigateToInterventions} className="btn btn-secondary" style={{ flex: '1 1 140px' }}>
              <span>Intervention Hub</span>
            </button>
          </div>
        </div>

        {/* Card 2: Controlled Interventions & Fit Risk */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ background: 'rgba(168, 85, 247, 0.2)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
              <Layers size={20} color="#c084fc" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem' }}>Active Risk Vectors</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Targeting Dhaga & Co. RTO causes</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '0.65rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: '600' }}>
                <span>Fit & Size Ambiguity (Other Bucket)</span>
                <span style={{ color: '#c084fc' }}>High Priority</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Returns masked under generic reasons surfaced via unstructured customer text classification.
              </p>
            </div>

            <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '0.65rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: '600' }}>
                <span>Repeat COD Refusal Risk</span>
                <span style={{ color: '#fb7185' }}>High Priority</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Customers with historical RTO ratio &gt; 30% flagged for pre-dispatch availability confirmation.
              </p>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: '600' }}>
                <span>Vendor Return Clustering</span>
                <span style={{ color: '#fcd34d' }}>Medium Priority</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Vendors exhibiting high fit discrepancy rates automatically weighted in composite risk scoring.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

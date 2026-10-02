import React from 'react';
import { ShieldAlert, BarChart3, Package, Bot, Sparkles } from 'lucide-react';

export default function Header({ activeTab, setActiveTab, systemStatus, onOpenAutoDemo }) {
  const isHealthy = systemStatus?.status === 'healthy';

  const navItems = [
    { id: 'dashboard', label: 'Executive Overview', icon: BarChart3 },
    { id: 'orders', label: 'Risk Orders', icon: Package },
    { id: 'interventions', label: 'Intervention Hub', icon: Bot },
    { id: 'analytics', label: 'Analytics & ROI', icon: Sparkles },
    { id: 'resilience', label: 'Resilience & Cost', icon: ShieldAlert },
  ];

  return (
    <header style={{
      borderBottom: '1px solid var(--border-subtle)',
      background: 'rgba(9, 13, 22, 0.85)',
      backdropFilter: 'blur(20px)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{
        maxWidth: '1440px',
        margin: '0 auto',
        padding: '0.85rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'var(--brand-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)',
          }}>
            <ShieldAlert size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: '800', background: 'var(--brand-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
                Dhaga & Co.
              </h1>
              <span style={{
                fontSize: '0.65rem',
                fontWeight: '700',
                background: 'rgba(99, 102, 241, 0.2)',
                color: '#a5b4fc',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                padding: '0.15rem 0.45rem',
                borderRadius: '999px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}>
                RTO Intelligence
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              AI-Powered COD Risk Assessment & Intervention Engine
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.03)', padding: '0.3rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.45rem 0.95rem',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  cursor: 'pointer',
                  background: isActive ? 'var(--accent-gradient)' : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                  boxShadow: isActive ? '0 2px 10px rgba(99, 102, 241, 0.4)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={15} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Action & Health Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* 1-Click Auto Demo Trigger */}
          <button
            onClick={onOpenAutoDemo}
            className="btn btn-primary"
            style={{
              padding: '0.45rem 0.95rem',
              fontSize: '0.75rem',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #3b82f6 100%)',
              boxShadow: '0 4px 14px rgba(236, 72, 153, 0.35)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <Sparkles size={14} />
            <span>⚡ 1-Click Auto Demo</span>
          </button>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-subtle)',
            padding: '0.35rem 0.75rem',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.75rem',
          }}>
            <span className={`status-dot ${isHealthy ? 'active' : 'warning'}`}></span>
            <span style={{ color: isHealthy ? 'var(--color-success)' : 'var(--color-warning)', fontWeight: '600' }}>
              {isHealthy ? 'System Active' : 'Connecting Services'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

import React from 'react';
import { Database, Cpu, CheckCircle2, AlertCircle, Info } from 'lucide-react';

export default function StatusBanner({ systemStatus, loading }) {
  if (loading) return null;

  const supabaseInfo = systemStatus?.integrations?.supabase;
  const openRouterInfo = systemStatus?.integrations?.openrouter;

  const supabaseOk = supabaseInfo?.connected;
  const openRouterOk = openRouterInfo?.configured;

  return (
    <div style={{
      background: 'rgba(15, 23, 42, 0.65)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-md)',
      padding: '0.75rem 1.25rem',
      marginBottom: '1.5rem',
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1rem',
      fontSize: '0.8rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
        {/* Supabase Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Database size={15} color={supabaseOk ? 'var(--color-success)' : 'var(--color-warning)'} />
          <span style={{ color: 'var(--text-secondary)' }}>Supabase DB:</span>
          <span style={{
            fontWeight: '600',
            color: supabaseOk ? 'var(--color-success)' : 'var(--color-warning)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}>
            {supabaseOk ? (
              <>
                <CheckCircle2 size={13} /> Connected ({supabaseInfo?.orderCount || 0} orders)
              </>
            ) : (
              <>
                <AlertCircle size={13} /> Ready for Credentials
              </>
            )}
          </span>
        </div>

        {/* OpenRouter AI Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Cpu size={15} color={openRouterOk ? '#818cf8' : 'var(--color-warning)'} />
          <span style={{ color: 'var(--text-secondary)' }}>OpenRouter AI (LangChain):</span>
          <span style={{
            fontWeight: '600',
            color: openRouterOk ? '#818cf8' : 'var(--color-warning)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}>
            {openRouterOk ? (
              <>
                <CheckCircle2 size={13} /> Dual Model Ready ({openRouterInfo?.modelFast} & {openRouterInfo?.modelStrong})
              </>
            ) : (
              <>
                <Info size={13} /> Models Configured ({openRouterInfo?.modelFast || 'Fast'} / {openRouterInfo?.modelStrong || 'Strong'})
              </>
            )}
          </span>
        </div>
      </div>

      {/* Backend Version / Phase */}
      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
        Backend: <span style={{ color: '#a5b4fc', fontWeight: '500' }}>LangChain Node.js</span> • Foundation Active
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import {
  Bot,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Send,
  Sparkles,
  User,
  ShoppingBag,
  ArrowRight,
  RefreshCw,
  Sliders,
  PhoneCall,
  Check,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import api from '../services/api';

export default function InterventionsHub({ orders, onSelectOrder }) {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  
  // Simulation State
  const [customerInput, setCustomerInput] = useState('');
  const [simulating, setSimulating] = useState(false);
  const [lastClassification, setLastClassification] = useState(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState(null);

  // Fetch intervention queue
  const fetchQueue = async () => {
    setLoading(true);
    try {
      const data = await api.getInterventionQueue(statusFilter);
      setQueue(data.queue || []);
      if (data.queue && data.queue.length > 0 && !selectedOrder) {
        setSelectedOrder(data.queue[0]);
      }
    } catch (err) {
      console.warn('Failed to fetch queue, using local orders:', err.message);
      const fallbackQueue = orders.filter((o) => o.intervention_type && o.intervention_type !== 'NO_ACTION');
      setQueue(fallbackQueue);
      if (fallbackQueue.length > 0 && !selectedOrder) {
        setSelectedOrder(fallbackQueue[0]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [statusFilter]);

  // Operations: Approve & Send Intervention
  const handleSendIntervention = async () => {
    if (!selectedOrder) return;
    try {
      const res = await api.sendIntervention(selectedOrder.id);
      setActionSuccessMsg(`Intervention sent to ${selectedOrder.customers?.name || 'customer'}!`);
      setSelectedOrder(res.order || { ...selectedOrder, intervention_status: 'SENT' });
      fetchQueue();
    } catch (err) {
      console.error('Failed to send intervention:', err);
    }
  };

  // Simulate Customer Reply
  const handleSimulateReply = async (replyText) => {
    const textToSend = replyText || customerInput;
    if (!textToSend.trim() || !selectedOrder) return;

    setSimulating(true);
    setLastClassification(null);
    setActionSuccessMsg(null);
    try {
      const res = await api.simulateCustomerResponse(selectedOrder.id, textToSend);
      setLastClassification(res.classification);
      setSelectedOrder(res.order || {
        ...selectedOrder,
        intervention_status: 'RESOLVED',
        customer_response: { raw_text: textToSend, classified_intent: res.classification?.classified_intent },
      });
      setCustomerInput('');
      fetchQueue();
    } catch (err) {
      console.error('Failed to simulate customer reply:', err);
    } finally {
      setSimulating(false);
    }
  };

  // Operations: Override
  const handleOverride = async (action) => {
    if (!selectedOrder) return;
    try {
      const res = await api.overrideIntervention(selectedOrder.id, { overrideAction: action });
      setActionSuccessMsg(`Action ${action} applied successfully.`);
      setSelectedOrder(res.order || selectedOrder);
      fetchQueue();
    } catch (err) {
      console.error('Override failed:', err);
    }
  };

  const sampleReplyPrompts = [
    { label: 'Confirm Size M', text: 'Ha size M bilkul sahi hai, dispatch kardo' },
    { label: 'Change to Size L', text: 'Thoda tight lag raha hai, please Size L bhej do' },
    { label: 'Add Landmark', text: 'Near Shiv Mandir, opposite metro pillar 24' },
    { label: 'Cancel Order', text: 'Cancel kardo order mujhe ab nahi chahiye' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Header Card */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: 'var(--accent-gradient)', padding: '0.6rem', borderRadius: 'var(--radius-md)' }}>
              <Bot size={22} color="#ffffff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.35rem' }}>Contextual Intervention Cockpit</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Simulate WhatsApp pre-dispatch customer interactions and AI intent classification
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={fetchQueue} className="btn btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>
              <RefreshCw size={14} />
              <span>Refresh Queue</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
          {[
            { id: '', label: 'All Queue' },
            { id: 'RECOMMENDED', label: 'Recommended' },
            { id: 'SENT', label: 'Sent (Awaiting Reply)' },
            { id: 'RESOLVED', label: 'Resolved' },
            { id: 'ESCALATED', label: 'Escalated' },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setStatusFilter(pill.id)}
              style={{
                background: statusFilter === pill.id ? 'var(--accent-gradient)' : 'rgba(255, 255, 255, 0.04)',
                color: statusFilter === pill.id ? '#ffffff' : 'var(--text-secondary)',
                border: '1px solid',
                borderColor: statusFilter === pill.id ? 'var(--accent-primary)' : 'var(--border-subtle)',
                padding: '0.35rem 0.85rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.75rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 380px) 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Left Column: Intervention Orders List */}
        <div className="glass-card" style={{ padding: '1.25rem', maxHeight: '780px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>Active Interventions ({queue.length})</h3>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Loading queue...
            </div>
          ) : queue.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No interventions in selected filter.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {queue.map((order) => {
                const isSelected = selectedOrder?.id === order.id;
                return (
                  <div
                    key={order.id}
                    onClick={() => {
                      setSelectedOrder(order);
                      setLastClassification(order.customer_response?.classified_intent ? {
                        classified_intent: order.customer_response.classified_intent,
                        extracted_entities: order.customer_response.extracted_entities,
                        suggested_workflow_action: order.customer_response.workflow_action,
                        action_summary: order.customer_response.action_summary,
                        customer_sentiment: order.customer_response.customer_sentiment,
                      } : null);
                      setActionSuccessMsg(null);
                    }}
                    style={{
                      background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid',
                      borderColor: isSelected ? 'rgba(99, 102, 241, 0.5)' : 'var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.85rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <span style={{ fontWeight: '700', fontSize: '0.85rem' }}>#{order.id || order.external_id}</span>
                      <span className={`badge badge-risk-${(order.risk_band || 'high').toLowerCase()}`} style={{ fontSize: '0.65rem' }}>
                        {order.risk_band || 'HIGH'}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: '500' }}>
                      {order.customers?.name || 'Customer'} • ₹{order.order_amount || order.amount}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', fontSize: '0.75rem' }}>
                      <span style={{ color: '#a5b4fc', fontWeight: '600' }}>{order.intervention_type}</span>
                      <span style={{ color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                        {order.intervention_status || 'RECOMMENDED'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: WhatsApp Simulator & Operations Cockpit */}
        {selectedOrder ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Selected Order Summary Bar */}
            <div className="glass-card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.15rem' }}>Order #{selectedOrder.id || selectedOrder.external_id}</h3>
                    <span className="badge badge-cod">COD ₹{selectedOrder.order_amount || selectedOrder.amount}</span>
                    <span style={{ fontSize: '0.75rem', background: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-full)', fontWeight: '700' }}>
                      {selectedOrder.intervention_type}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Customer: <strong style={{ color: 'var(--text-primary)' }}>{selectedOrder.customers?.name || 'Neha Sharma'}</strong> • City: <strong>{selectedOrder.city}</strong> • Product: <strong>{selectedOrder.products?.name || 'Apparel'}</strong> (Size: {selectedOrder.selected_size || 'M'})
                  </div>
                </div>

                {/* Status Badge */}
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Workflow State:</span>
                  <div style={{ fontSize: '0.9rem', fontWeight: '700', color: selectedOrder.intervention_status === 'RESOLVED' ? 'var(--color-success)' : '#818cf8' }}>
                    {selectedOrder.intervention_status || 'RECOMMENDED'}
                  </div>
                </div>
              </div>

              {actionSuccessMsg && (
                <div style={{ marginTop: '0.75rem', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid var(--color-success)', color: '#6ee7b7', padding: '0.5rem 0.85rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckCircle2 size={15} />
                  <span>{actionSuccessMsg}</span>
                </div>
              )}
            </div>

            {/* WhatsApp Interactive Simulator Box */}
            <div
              className="glass-card"
              style={{
                padding: '1.5rem',
                background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(9, 13, 22, 0.98) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
              }}
            >
              {/* WhatsApp Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.85rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MessageSquare size={18} color="#ffffff" />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: '700', fontSize: '0.9rem' }}>
                      <span>Dhaga & Co. Concierge</span>
                      <CheckCircle2 size={14} color="#10b981" />
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Official WhatsApp Business Simulator</div>
                  </div>
                </div>

                {selectedOrder.intervention_status === 'RECOMMENDED' && (
                  <button onClick={handleSendIntervention} className="btn btn-primary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.75rem' }}>
                    <Send size={13} />
                    <span>Approve & Send Message</span>
                  </button>
                )}
              </div>

              {/* Chat Thread Container */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: '180px', marginBottom: '1.25rem' }}>
                {/* Bot Message Bubble (Left/System) */}
                <div style={{ maxWidth: '80%', background: 'rgba(30, 41, 59, 0.9)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px 12px 12px 2px', padding: '0.85rem 1rem' }}>
                  <div style={{ fontSize: '0.7rem', color: '#818cf8', fontWeight: '700', marginBottom: '0.25rem' }}>
                    Dhaga & Co. Assistant • Model 2 Output
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#f8fafc', lineHeight: '1.45', whiteSpace: 'pre-line' }}>
                    {selectedOrder.intervention_payload?.customer_message ||
                      `Namaste ${selectedOrder.customers?.name || 'Customer'}! We noticed your selected apparel has a tailored fit. Before we dispatch your COD order #${selectedOrder.id || selectedOrder.external_id}, please verify your size.`}
                  </p>
                  <div style={{ textAlign: 'right', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                    10:45 AM • Delivered
                  </div>
                </div>

                {/* Customer Reply Bubble (Right) if replied */}
                {selectedOrder.customer_response?.raw_text && (
                  <div style={{ alignSelf: 'flex-end', maxWidth: '80%', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.35)', borderRadius: '12px 12px 2px 12px', padding: '0.85rem 1rem' }}>
                    <div style={{ fontSize: '0.7rem', color: '#34d399', fontWeight: '700', marginBottom: '0.25rem' }}>
                      {selectedOrder.customers?.name || 'Customer'} (WhatsApp Reply)
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#f8fafc', lineHeight: '1.45' }}>
                      {selectedOrder.customer_response.raw_text}
                    </p>
                    <div style={{ textAlign: 'right', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                      10:48 AM • Read
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Reply Simulation Chips */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  Simulate Quick Reply Chip Selection:
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {sampleReplyPrompts.map((p, i) => (
                    <button
                      key={i}
                      disabled={simulating}
                      onClick={() => handleSimulateReply(p.text)}
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid var(--border-subtle)',
                        color: '#38bdf8',
                        padding: '0.35rem 0.75rem',
                        borderRadius: 'var(--radius-full)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Freeform Response Input Bar */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="Type a custom simulated customer reply in English / Hinglish..."
                  value={customerInput}
                  onChange={(e) => setCustomerInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSimulateReply()}
                  style={{
                    flex: 1,
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.6rem 0.95rem',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    outline: 'none',
                  }}
                />
                <button
                  onClick={() => handleSimulateReply()}
                  disabled={simulating || !customerInput.trim()}
                  className="btn btn-primary"
                  style={{ padding: '0.6rem 1.1rem' }}
                >
                  {simulating ? (
                    <span>AI Classifying...</span>
                  ) : (
                    <>
                      <Send size={15} />
                      <span>Send as Customer</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* AI Classification & State Transition Result Box */}
            {lastClassification && (
              <div style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%)', border: '1px solid var(--border-glow)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700', fontSize: '0.9rem', color: '#a5b4fc' }}>
                    <Sparkles size={16} color="#818cf8" />
                    <span>AI Response Intent Classification (Model 1 / LangChain)</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', fontWeight: '700' }}>
                    {lastClassification.classified_intent}
                  </span>
                </div>

                <p style={{ fontSize: '0.8rem', color: 'var(--text-primary)', marginBottom: '0.75rem', background: 'rgba(0,0,0,0.25)', padding: '0.65rem', borderRadius: 'var(--radius-sm)' }}>
                  {lastClassification.action_summary}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', fontSize: '0.75rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Workflow Action:</span>
                    <div style={{ fontWeight: '700', color: '#38bdf8' }}>{lastClassification.suggested_workflow_action}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Extracted Size:</span>
                    <div style={{ fontWeight: '700' }}>{lastClassification.extracted_entities?.requested_size || 'N/A'}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Customer Sentiment:</span>
                    <div style={{ fontWeight: '700', color: lastClassification.customer_sentiment === 'POSITIVE' ? 'var(--color-success)' : 'var(--text-primary)' }}>
                      {lastClassification.customer_sentiment}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Operations Manual Override Actions */}
            <div className="glass-card" style={{ padding: '1.25rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.75rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Sliders size={16} /> Operations Override & Manual Resolution
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button onClick={() => handleOverride('FORCE_DISPATCH')} className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem' }}>
                  <Check size={13} color="var(--color-success)" />
                  <span>Force Dispatch (Confirmed)</span>
                </button>

                <button onClick={() => handleOverride('ESCALATE_CALL')} className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem' }}>
                  <PhoneCall size={13} color="#f59e0b" />
                  <span>Escalate to CX Call</span>
                </button>

                <button onClick={() => handleOverride('CANCEL_ORDER')} className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem', color: '#fb7185' }}>
                  <AlertTriangle size={13} color="#fb7185" />
                  <span>Cancel Order (Save RTO)</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <MessageSquare size={48} style={{ margin: '0 auto 1rem auto', opacity: 0.3 }} />
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>No Order Selected</h3>
            <p style={{ fontSize: '0.8rem', marginTop: '0.35rem' }}>
              Select an order from the queue on the left to review recommendations and simulate WhatsApp interactions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  Pause,
  CheckCircle2,
  Sparkles,
  Bot,
  Zap,
  ArrowRight,
  ArrowLeft,
  MessageSquare,
  IndianRupee,
  ShoppingBag,
  RefreshCw,
  Clock,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  User,
  Store,
  MapPin,
  Layers,
  Check,
  AlertTriangle,
  GitBranch,
  Terminal,
  Activity,
  Cpu,
  Coins,
} from 'lucide-react';
import api from '../services/api';

export default function AutoDemoModal({ isOpen, onClose, onNavigateToOrders, onNavigateToAnalytics }) {
  if (!isOpen) return null;

  const [scenario, setScenario] = useState('fit_correction'); // 'fit_correction' | 'address_fix' | 'cancellation_saving'
  const [running, setRunning] = useState(false);
  const [demoData, setDemoData] = useState(null);
  const [activeStage, setActiveStage] = useState(0);
  const [isPlayingAutoTour, setIsPlayingAutoTour] = useState(false);
  const [showJsonRaw, setShowJsonRaw] = useState(false);

  // Default initial mock/cached data for instant inspection before executing live call
  const initialData = {
    orderId: 'ORD-00371',
    customerName: 'Sahil Patil',
    city: 'Hyderabad',
    paymentMethod: 'COD',
    orderAmount: 1899,
    initialSelectedSize: 'M',
    newSelectedSize: 'L',
    scenario: 'fit_correction',
    totalDemoLatencyMs: 14200,
    deterministic: {
      customerRtoRatio: 0.222,
      previousRtoCount: 2,
      isRepeatOffender: true,
      fitReturnRate: 0.185,
      productCategory: 'Co-ord Sets',
      productName: 'Navy Tailored Co-ord Set',
      sizeChartSummary: 'Runs 1 size small (Bust/Chest tight)',
      vendorName: 'Dhaga Vendor 40',
      vendorReturnRate: 0.225,
      sizeChartType: 'custom',
      deliveryAttempts: 2,
      hasDeliveryFriction: true,
      calculatedBaseScore: 0.68,
    },
    parallelEvidence: {
      customer: {
        riskLevel: 'HIGH',
        confidence: 0.92,
        keySignals: ['2_PREVIOUS_RTOS', 'REPEAT_BUYER_COD_REFUSAL_RISK'],
        summary: 'Customer placed 9 orders with 2 previous COD delivery refusals. Elevated RTO propensity.',
      },
      fit: {
        riskLevel: 'HIGH',
        confidence: 0.94,
        fitIssueDetected: true,
        keySignals: ['HIGH_CATEGORY_FIT_RETURNS (18.5%)', 'VENDOR_SIZE_DISCREPANCY'],
        summary: 'Product category Co-ord Sets has high fit return rate. Return comments frequently report tight fit in chest.',
      },
      vendor: {
        riskLevel: 'MEDIUM',
        confidence: 0.88,
        fidelityRating: 'IRREGULAR',
        keySignals: ['CUSTOM_SIZE_CHART', 'MODERATE_RETURNS (22.5%)'],
        summary: 'Vendor utilizes custom sizing specs with moderate variance from standard national chart.',
      },
      delivery: {
        riskLevel: 'MEDIUM',
        confidence: 0.85,
        addressRisk: true,
        keySignals: ['2_PREVIOUS_ATTEMPTS', 'COD_PAYMENT_SELECTED'],
        summary: 'Courier recorded 2 attempts on prior shipments to Hyderabad location.',
      },
    },
    model1Scoring: {
      rtoRiskScore: 0.78,
      riskBand: 'HIGH',
      confidenceScore: 0.88,
      needsModel2Routing: true,
      routingTriggerReason: 'High risk (0.78) with conflicting domain signals (Fit Anomaly + Customer COD History) requiring Model 2 deep reasoning.',
      latencyMs: 1200,
      modelName: 'google/gemini-2.5-flash',
    },
    model2Routing: {
      selectedIntervention: 'FIT_GUIDANCE',
      confidence: 0.94,
      modelName: 'meta-llama/llama-3.3-70b-instruct',
      primaryDriver: 'PRODUCT_FIT_AMBIGUITY',
      actionRationale: 'Product fit discrepancy is the primary driver of failure. Pre-dispatch sizing verification will preempt return at source.',
      whatsappMessage: 'Namaste Sahil! We noticed our Navy Tailored Co-ord Set has a snug fit. Before we dispatch your COD order #ORD-00371, please confirm if Size M matches your measurements or if you would prefer Size L.',
      quickReplies: ['Confirm Size M', 'Change to Size L', 'View Size Chart', 'Cancel Order'],
      latencyMs: 1450,
      costUsd: 0.00065,
    },
    whatsappInteraction: {
      outboundMessage: 'Namaste Sahil! We noticed our Navy Tailored Co-ord Set has a snug fit. Before we dispatch your COD order #ORD-00371, please confirm if Size M matches your measurements or if you would prefer Size L.',
      inboundCustomerReply: 'Bhai size M thoda tight lag raha hai, please Size L bhej do dispatch me.',
      replyTime: '10:48 AM',
    },
    nlpClassification: {
      classifiedIntent: 'CHANGE_SIZE',
      confidence: 0.95,
      extractedEntities: {
        requested_size: 'L',
        previous_size: 'M',
      },
      customerSentiment: 'POSITIVE',
      suggestedWorkflowAction: 'UPDATE_SIZE_AND_DISPATCH',
      actionSummary: 'Customer requested size upgrade from M to L. Size corrected in warehouse manifest.',
    },
    outcomeRoi: {
      beforeState: 'COD_RISK_HIGH',
      finalState: 'DELIVERED_SIZE_CORRECTED',
      preventedRto: true,
      logisticsLossSavedInr: 120,
      customerRetained: true,
      aiCostInr: 0.058,
      netRoiMultiplier: '240x',
    },
  };

  const currentData = demoData || initialData;

  // Auto-Tour interval
  useEffect(() => {
    let timer;
    if (isPlayingAutoTour) {
      timer = setInterval(() => {
        setActiveStage((prev) => {
          if (prev >= 6) {
            setIsPlayingAutoTour(false);
            return 6;
          }
          return prev + 1;
        });
      }, 3500);
    }
    return () => clearInterval(timer);
  }, [isPlayingAutoTour]);

  // Run live backend auto-demo
  const handleExecuteLiveDemo = async (chosenScenario = scenario) => {
    setRunning(true);
    setIsPlayingAutoTour(false);
    setActiveStage(0);

    try {
      const res = await api.runAutoDemo(chosenScenario);
      if (res && res.steps) {
        setDemoData({
          ...initialData,
          orderId: res.orderId || initialData.orderId,
          customerName: res.customerName || initialData.customerName,
          scenario: chosenScenario,
          initialSelectedSize: res.initialSelectedSize || 'M',
          newSelectedSize: res.newSelectedSize || 'L',
          totalDemoLatencyMs: res.totalDemoLatencyMs || 13500,
          deterministic: {
            ...initialData.deterministic,
            productCategory: res.steps[0]?.data?.productSignals?.category || 'Apparel',
            productName: res.steps[0]?.data?.productSignals?.productName || 'Apparel Item',
            calculatedBaseScore: res.steps[2]?.data?.rto_risk_score || 0.78,
          },
          model1Scoring: {
            ...initialData.model1Scoring,
            rtoRiskScore: res.steps[2]?.data?.rto_risk_score || 0.78,
            riskBand: res.steps[2]?.data?.risk_band || 'HIGH',
            latencyMs: res.steps[2]?.latencyMs || 1200,
          },
          model2Routing: {
            ...initialData.model2Routing,
            selectedIntervention: res.steps[3]?.data?.intervention_type || 'FIT_GUIDANCE',
            whatsappMessage: res.steps[4]?.message || initialData.model2Routing.whatsappMessage,
            modelName: res.steps[3]?.data?.model_name || 'meta-llama/llama-3.3-70b-instruct',
          },
          whatsappInteraction: {
            outboundMessage: res.steps[4]?.message || initialData.model2Routing.whatsappMessage,
            inboundCustomerReply: res.steps[5]?.customerReply || 'Ha size L bhej do please.',
            replyTime: 'Just now',
          },
          nlpClassification: {
            ...initialData.nlpClassification,
            classifiedIntent: res.steps[5]?.classification?.classified_intent || 'CHANGE_SIZE',
            suggestedWorkflowAction: res.steps[5]?.classification?.suggested_workflow_action || 'UPDATE_SIZE_AND_DISPATCH',
            extractedEntities: res.steps[5]?.classification?.extracted_entities || { requested_size: 'L' },
          },
          outcomeRoi: {
            ...initialData.outcomeRoi,
            finalState: res.steps[6]?.finalOutcome || 'DELIVERED_SIZE_CORRECTED',
          },
        });
      }
      setIsPlayingAutoTour(true);
    } catch (err) {
      console.error('Live demo failed:', err);
    } finally {
      setRunning(false);
    }
  };

  const stagesList = [
    { id: 0, title: '1. Ingestion', short: 'Signal Layer', icon: User },
    { id: 1, title: '2. Parallel AI', short: '4-Domain AI', icon: GitBranch },
    { id: 2, title: '3. Model 1 Scoring', short: 'Risk Gating', icon: Bot },
    { id: 3, title: '4. Model 2 Router', short: 'Intervention', icon: Cpu },
    { id: 4, title: '5. WhatsApp Sim', short: 'Concierge', icon: MessageSquare },
    { id: 5, title: '6. AI Intent NLP', short: 'Classifier', icon: Sparkles },
    { id: 6, title: '7. Saved ROI', short: 'Outcome', icon: IndianRupee },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(3, 7, 18, 0.92)',
        backdropFilter: 'blur(16px)',
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
          maxWidth: '1080px',
          maxHeight: '94vh',
          overflowY: 'auto',
          padding: '1.75rem',
          background: 'rgba(15, 23, 42, 0.98)',
          position: 'relative',
          border: '1px solid var(--border-glow)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.7)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: '1rem',
            marginBottom: '1.25rem',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: 'var(--brand-gradient)', padding: '0.6rem', borderRadius: 'var(--radius-md)' }}>
              <Zap size={22} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '1.3rem', margin: 0 }}>Interactive AI Pipeline Simulator & Theater</h2>
                <span className="badge badge-risk-low" style={{ fontSize: '0.65rem' }}>STAGE-BY-STAGE VISUALIZER</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Deep-dive into every mathematical signal, LLM reasoning trace, WhatsApp interaction, and financial ROI commit
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => setShowJsonRaw(!showJsonRaw)}
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
            >
              <Terminal size={13} />
              <span>{showJsonRaw ? 'Visual Mode' : 'Raw JSON'}</span>
            </button>

            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '0.45rem',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Interactive Scenario Bar & Controls */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.25rem',
            marginBottom: '1.25rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          {/* Scenario Selection */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700' }}>SCENARIO:</span>
            {[
              { id: 'fit_correction', label: '👗 Fit Anomaly & Size Fix (M → L)' },
              { id: 'address_fix', label: '📍 Address Landmark Confirmation' },
              { id: 'cancellation_saving', label: '🛑 Pre-Dispatch Cancellation (Save ₹120)' },
            ].map((sc) => (
              <button
                key={sc.id}
                disabled={running}
                onClick={() => {
                  setScenario(sc.id);
                  handleExecuteLiveDemo(sc.id);
                }}
                style={{
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid',
                  borderColor: scenario === sc.id ? 'var(--accent-primary)' : 'var(--border-subtle)',
                  background: scenario === sc.id ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                  color: scenario === sc.id ? '#ffffff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {sc.label}
              </button>
            ))}
          </div>

          {/* Action Trigger Buttons */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setIsPlayingAutoTour(!isPlayingAutoTour)}
              className="btn btn-secondary"
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
            >
              {isPlayingAutoTour ? <Pause size={14} /> : <Play size={14} />}
              <span>{isPlayingAutoTour ? 'Pause Tour' : 'Auto-Play Tour'}</span>
            </button>

            <button
              onClick={() => handleExecuteLiveDemo(scenario)}
              disabled={running}
              className="btn btn-primary"
              style={{
                padding: '0.45rem 1.1rem',
                fontSize: '0.8rem',
                fontWeight: '700',
                background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #3b82f6 100%)',
              }}
            >
              {running ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Executing Pipeline...</span>
                </>
              ) : (
                <>
                  <RefreshCw size={14} />
                  <span>Run Live AI Engine</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Interactive 7-Stage Horizontal Pipeline Visual Stepper */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '0.5rem',
            marginBottom: '1.5rem',
          }}
        >
          {stagesList.map((st, idx) => {
            const Icon = st.icon;
            const isCurrent = activeStage === idx;
            const isCompleted = activeStage > idx;

            return (
              <button
                key={st.id}
                onClick={() => setActiveStage(idx)}
                style={{
                  background: isCurrent
                    ? 'rgba(99, 102, 241, 0.25)'
                    : isCompleted
                    ? 'rgba(16, 185, 129, 0.1)'
                    : 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid',
                  borderColor: isCurrent
                    ? 'var(--accent-primary)'
                    : isCompleted
                    ? 'rgba(16, 185, 129, 0.4)'
                    : 'var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.65rem 0.4rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.35rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: isCurrent
                      ? 'var(--brand-gradient)'
                      : isCompleted
                      ? 'var(--color-success)'
                      : 'rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                  }}
                >
                  {isCompleted ? <Check size={14} /> : <Icon size={14} />}
                </div>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: '700',
                    color: isCurrent ? '#ffffff' : isCompleted ? '#6ee7b7' : 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    width: '100%',
                  }}
                >
                  {st.title}
                </span>
              </button>
            );
          })}
        </div>

        {/* Main Stage Visual Card Display */}
        <div
          className="glass-card"
          style={{
            padding: '1.75rem',
            background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(9, 13, 22, 0.99) 100%)',
            border: '1px solid var(--border-subtle)',
            minHeight: '380px',
          }}
        >
          {/* STAGE 0: Deterministic Ingestion */}
          {activeStage === 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <User size={20} color="#38bdf8" />
                  <h3 style={{ fontSize: '1.15rem' }}>Stage 1: Order Ingestion & Mathematical Signal Extraction</h3>
                </div>
                <span className="badge badge-cod">COD ORDER #{currentData.orderId} • ₹{currentData.orderAmount}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: '700', marginBottom: '0.5rem' }}>👤 CUSTOMER SIGNALS</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '700' }}>{currentData.customerName}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Historical RTO Ratio: <strong style={{ color: '#fb7185' }}>{(currentData.deterministic.customerRtoRatio * 100).toFixed(1)}%</strong>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Prior Delivery Refusals: <strong>{currentData.deterministic.previousRtoCount} RTOs</strong>
                  </div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.75rem', color: '#c084fc', fontWeight: '700', marginBottom: '0.5rem' }}>👗 PRODUCT FIT SIGNALS</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '700' }}>{currentData.deterministic.productName}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Category Fit Return Rate: <strong style={{ color: '#fb7185' }}>{(currentData.deterministic.fitReturnRate * 100).toFixed(1)}%</strong>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#fcd34d', marginTop: '0.2rem' }}>
                    {currentData.deterministic.sizeChartSummary}
                  </div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: '700', marginBottom: '0.5rem' }}>🏬 VENDOR FIDELITY</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '700' }}>{currentData.deterministic.vendorName}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Vendor Return Rate: <strong>{(currentData.deterministic.vendorReturnRate * 100).toFixed(1)}%</strong>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Size Chart Type: <strong>{currentData.deterministic.sizeChartType}</strong>
                  </div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.75rem', color: '#fbbf24', fontWeight: '700', marginBottom: '0.5rem' }}>📍 DELIVERY FRICTION</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '700' }}>{currentData.city}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Prior Delivery Attempts: <strong>{currentData.deterministic.deliveryAttempts} attempts</strong>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#fb7185' }}>
                    COD Refusal Exposure: Elevated
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STAGE 1: 4-Domain Parallel AI Evidence */}
          {activeStage === 1 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <GitBranch size={20} color="#a855f7" />
                  <h3 style={{ fontSize: '1.15rem' }}>Stage 2: 4-Branch Concurrent LangChain Parallelization</h3>
                </div>
                <span className="badge badge-risk-low">PARALLEL THREADS: 4/4 COMPLETED (~2.2s)</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1rem' }}>
                {/* Branch 1 */}
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: 'var(--radius-sm)', padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#fb7185' }}>1. Customer Domain</span>
                    <span className="badge badge-risk-high" style={{ fontSize: '0.65rem' }}>HIGH RISK</span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                    {currentData.parallelEvidence.customer.summary}
                  </p>
                  <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Confidence: <strong>{currentData.parallelEvidence.customer.confidence * 100}%</strong>
                  </div>
                </div>

                {/* Branch 2 */}
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(192, 132, 252, 0.3)', borderRadius: 'var(--radius-sm)', padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#c084fc' }}>2. Product Fit NLP</span>
                    <span className="badge badge-risk-high" style={{ fontSize: '0.65rem' }}>FIT ANOMALY</span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                    {currentData.parallelEvidence.fit.summary}
                  </p>
                  <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Confidence: <strong>{currentData.parallelEvidence.fit.confidence * 100}%</strong>
                  </div>
                </div>

                {/* Branch 3 */}
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: 'var(--radius-sm)', padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#fcd34d' }}>3. Vendor Reliability</span>
                    <span className="badge badge-risk-medium" style={{ fontSize: '0.65rem' }}>IRREGULAR</span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                    {currentData.parallelEvidence.vendor.summary}
                  </p>
                  <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Confidence: <strong>{currentData.parallelEvidence.vendor.confidence * 100}%</strong>
                  </div>
                </div>

                {/* Branch 4 */}
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: 'var(--radius-sm)', padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#38bdf8' }}>4. Delivery Context</span>
                    <span className="badge badge-risk-medium" style={{ fontSize: '0.65rem' }}>FRICTION</span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                    {currentData.parallelEvidence.delivery.summary}
                  </p>
                  <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Confidence: <strong>{currentData.parallelEvidence.delivery.confidence * 100}%</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STAGE 2: Model 1 Scoring & Ambiguity Gate */}
          {activeStage === 2 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Bot size={20} color="#818cf8" />
                  <h3 style={{ fontSize: '1.15rem' }}>Stage 3: Model 1 Composite Scoring & Ambiguity Gating</h3>
                </div>
                <span className="badge badge-risk-high">EVALUATED BY GEMINI 2.5 FLASH ({currentData.model1Scoring.latencyMs}ms)</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 320px) 1fr', gap: '1.5rem', alignItems: 'center' }}>
                {/* Visual Risk Meter */}
                <div style={{ background: 'rgba(244, 63, 94, 0.08)', border: '1px solid rgba(244, 63, 94, 0.4)', borderRadius: 'var(--radius-md)', padding: '1.5rem', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: '#fb7185', fontWeight: '700', textTransform: 'uppercase' }}>
                    Composite RTO Probability
                  </span>
                  <div style={{ fontSize: '3rem', fontWeight: '900', color: '#f43f5e', margin: '0.5rem 0' }}>
                    {(currentData.model1Scoring.rtoRiskScore * 100).toFixed(0)}%
                  </div>
                  <span className="badge badge-risk-high" style={{ fontSize: '0.8rem', padding: '0.35rem 0.85rem' }}>
                    {currentData.model1Scoring.riskBand} RISK COHORT
                  </span>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
                    Confidence: <strong>{(currentData.model1Scoring.confidenceScore * 100).toFixed(0)}%</strong>
                  </div>
                </div>

                {/* Routing Gate Reasoning */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: 'var(--radius-sm)', padding: '1rem' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#a5b4fc', marginBottom: '0.25rem' }}>
                      AI Routing Gate Evaluation:
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: '1.45' }}>
                      {currentData.model1Scoring.routingTriggerReason}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.75rem' }}>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.65rem', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Payment Mode Check:</span>
                      <div style={{ fontWeight: '700', color: '#fb7185' }}>COD (High Exposure)</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.65rem', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Decision:</span>
                      <div style={{ fontWeight: '700', color: '#38bdf8' }}>ENGAGE MODEL 2 REASONING</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STAGE 3: Model 2 Deep Reasoning */}
          {activeStage === 3 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Cpu size={20} color="#38bdf8" />
                  <h3 style={{ fontSize: '1.15rem' }}>Stage 4: Model 2 Contextual Intervention Selection</h3>
                </div>
                <span className="badge badge-risk-low">MODEL: {currentData.model2Routing.modelName}</span>
              </div>

              {/* Controlled Allowlist Selection Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.65rem', marginBottom: '1rem' }}>
                {[
                  { id: 'FIT_GUIDANCE', label: 'FIT_GUIDANCE', desc: 'Pre-dispatch sizing check' },
                  { id: 'ADDRESS_CONFIRMATION', label: 'ADDRESS_CONFIRM', desc: 'Landmark verification' },
                  { id: 'DELIVERY_CONFIRMATION', label: 'DELIVERY_CONFIRM', desc: 'Availability & cash check' },
                  { id: 'RESCHEDULE', label: 'RESCHEDULE', desc: 'Preferred date selection' },
                  { id: 'ESCALATE', label: 'ESCALATE', desc: 'Manual CX phone call' },
                  { id: 'NO_ACTION', label: 'NO_ACTION', desc: 'Immediate dispatch' },
                ].map((item) => {
                  const isSelected = currentData.model2Routing.selectedIntervention === item.id;
                  return (
                    <div
                      key={item.id}
                      style={{
                        background: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid',
                        borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.75rem',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: '0.75rem', fontWeight: '800', color: isSelected ? '#a5b4fc' : 'var(--text-muted)' }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: isSelected ? '#ffffff' : 'var(--text-muted)', marginTop: '0.2rem' }}>
                        {item.desc}
                      </div>
                      {isSelected && (
                        <div style={{ marginTop: '0.35rem', fontSize: '0.65rem', background: 'var(--color-success)', color: '#000', borderRadius: '4px', fontWeight: '800', padding: '0.1rem' }}>
                          SELECTED WINNER
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Rationale Callout */}
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700' }}>MODEL 2 ACTION RATIONALE:</span>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: '0.25rem', lineHeight: '1.45' }}>
                  {currentData.model2Routing.actionRationale}
                </p>
              </div>
            </div>
          )}

          {/* STAGE 4: WhatsApp Message Simulation */}
          {activeStage === 4 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MessageSquare size={20} color="#10b981" />
                  <h3 style={{ fontSize: '1.15rem' }}>Stage 5: Live WhatsApp Concierge Interaction</h3>
                </div>
                <span className="badge badge-risk-low">OFFICIAL BUSINESS CHANNEL</span>
              </div>

              {/* WhatsApp Mock Chat Window */}
              <div
                style={{
                  maxWidth: '560px',
                  margin: '0 auto',
                  background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(9, 13, 22, 0.98) 100%)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                }}
              >
                {/* Outbound AI Message Bubble */}
                <div style={{ maxWidth: '85%', background: 'rgba(30, 41, 59, 0.9)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px 12px 12px 2px', padding: '0.85rem 1rem', marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.65rem', color: '#818cf8', fontWeight: '700', marginBottom: '0.2rem' }}>
                    Dhaga & Co. Concierge (Model 2 Generated)
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#f8fafc', lineHeight: '1.45' }}>
                    {currentData.whatsappInteraction.outboundMessage}
                  </p>
                  <div style={{ textAlign: 'right', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                    10:45 AM • Delivered
                  </div>
                </div>

                {/* Quick Reply Chips */}
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', margin: '0.75rem 0' }}>
                  {currentData.model2Routing.quickReplies.map((qr, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: '0.75rem',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(56, 189, 248, 0.4)',
                        color: '#38bdf8',
                        padding: '0.3rem 0.65rem',
                        borderRadius: 'var(--radius-full)',
                        fontWeight: '600',
                      }}
                    >
                      {qr}
                    </span>
                  ))}
                </div>

                {/* Inbound Customer Reply */}
                <div style={{ alignSelf: 'flex-end', maxWidth: '85%', background: 'rgba(16, 185, 129, 0.18)', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: '12px 12px 2px 12px', padding: '0.85rem 1rem', marginLeft: 'auto' }}>
                  <div style={{ fontSize: '0.65rem', color: '#34d399', fontWeight: '700', marginBottom: '0.2rem' }}>
                    {currentData.customerName} (WhatsApp Reply)
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#f8fafc', lineHeight: '1.45' }}>
                    "{currentData.whatsappInteraction.inboundCustomerReply}"
                  </p>
                  <div style={{ textAlign: 'right', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                    10:48 AM • Read
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STAGE 5: AI NLP Intent Classifier */}
          {activeStage === 5 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sparkles size={20} color="#fbbf24" />
                  <h3 style={{ fontSize: '1.15rem' }}>Stage 6: Real-Time Hinglish/English AI Intent Classification</h3>
                </div>
                <span className="badge badge-risk-low">CONFIDENCE: 95%</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700' }}>RAW INCOMING MESSAGE:</span>
                  <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#f8fafc', marginTop: '0.35rem', background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: '4px' }}>
                    "{currentData.whatsappInteraction.inboundCustomerReply}"
                  </div>

                  <div style={{ marginTop: '1rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700' }}>EXTRACTED INTENT:</span>
                    <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#38bdf8', marginTop: '0.2rem' }}>
                      {currentData.nlpClassification.classifiedIntent}
                    </div>
                  </div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700' }}>EXTRACTED ENTITIES:</span>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem' }}>
                    <span style={{ background: 'rgba(192, 132, 252, 0.2)', border: '1px solid #c084fc', color: '#c084fc', padding: '0.3rem 0.75rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '700' }}>
                      Requested Size: {currentData.nlpClassification.extractedEntities.requested_size}
                    </span>
                  </div>

                  <div style={{ marginTop: '1rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700' }}>SUGGESTED WORKFLOW TRANSITION:</span>
                    <div style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--color-success)', marginTop: '0.2rem' }}>
                      {currentData.nlpClassification.suggestedWorkflowAction}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STAGE 6: Closed-Loop Outcome & ROI */}
          {activeStage === 6 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <IndianRupee size={20} color="var(--color-success)" />
                  <h3 style={{ fontSize: '1.15rem', color: '#6ee7b7' }}>Stage 7: State Transition & Financial ROI Saved</h3>
                </div>
                <span className="badge badge-risk-low">DB COMMITTED & VERIFIED</span>
              </div>

              {/* Before vs After Card */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div style={{ background: 'rgba(244, 63, 94, 0.08)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: 'var(--radius-sm)', padding: '1.25rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#fb7185', fontWeight: '700' }}>WITHOUT INTERVENTION (BASELINE)</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#fb7185', marginTop: '0.35rem' }}>
                    Certain Doorstep RTO
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Wrong size M dispatched $\rightarrow$ Customer tries on, returns package $\rightarrow$ <strong>-₹120 logistics loss</strong>.
                  </p>
                </div>

                <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: 'var(--radius-sm)', padding: '1.25rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: '700' }}>WITH AI-CONCIERGE (INTERVENTION)</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--color-success)', marginTop: '0.35rem' }}>
                    {currentData.outcomeRoi.finalState}
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Size corrected to L at warehouse $\rightarrow$ Successful 1st attempt delivery $\rightarrow$ <strong>₹120 saved</strong>.
                  </p>
                </div>

                <div style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.4)', borderRadius: 'var(--radius-sm)', padding: '1.25rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#a5b4fc', fontWeight: '700' }}>FINANCIAL UNIT ROI</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#fbbf24', marginTop: '0.35rem' }}>
                    {currentData.outcomeRoi.netRoiMultiplier} ROI
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    AI Inference Cost: <strong>₹{currentData.outcomeRoi.aiCostInr}</strong> vs <strong>₹120 saved</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Raw JSON Debug Viewer Toggle */}
          {showJsonRaw && (
            <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: '700' }}>RAW TELEMETRY & STAGE DATA JSON:</span>
              <pre style={{ background: 'rgba(0,0,0,0.6)', padding: '1rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', color: '#a5b4fc', overflowX: 'auto', marginTop: '0.5rem', maxHeight: '200px' }}>
                {JSON.stringify(currentData, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Bottom Navigation & Action Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '1.25rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-subtle)',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          {/* Stepper buttons */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setActiveStage((prev) => Math.max(0, prev - 1))}
              disabled={activeStage === 0}
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
            >
              <ChevronLeft size={16} />
              <span>Previous Stage</span>
            </button>

            <button
              onClick={() => setActiveStage((prev) => Math.min(6, prev + 1))}
              disabled={activeStage === 6}
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
            >
              <span>Next Stage</span>
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Quick links to inspect in table or analytics */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => {
                onClose();
                if (onNavigateToOrders) onNavigateToOrders();
              }}
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
            >
              <span>Inspect in Orders Table</span>
            </button>

            <button
              onClick={() => {
                onClose();
                if (onNavigateToAnalytics) onNavigateToAnalytics();
              }}
              className="btn btn-primary"
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
            >
              <span>View Executive ROI Impact</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

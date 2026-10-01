import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import StatusBanner from './components/StatusBanner';
import Dashboard from './pages/Dashboard';
import RiskOrders from './pages/RiskOrders';
import InterventionsHub from './pages/InterventionsHub';
import Analytics from './pages/Analytics';
import ResilienceCostHub from './pages/ResilienceCostHub';
import PhasesView from './pages/PhasesView';
import OrderDetailModal from './components/OrderDetailModal';
import AutoDemoModal from './components/AutoDemoModal';
import api from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [systemStatus, setSystemStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [autoDemoOpen, setAutoDemoOpen] = useState(false);

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [stats, setStats] = useState(null);

  const [filter, setFilter] = useState({
    risk_band: undefined,
    payment_type: undefined,
    status: undefined,
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  const [selectedOrder, setSelectedOrder] = useState(null);

  // Check system health on mount
  useEffect(() => {
    async function fetchHealth() {
      try {
        const data = await api.getHealth();
        setSystemStatus(data);
      } catch (err) {
        console.warn('Backend server not reachable yet:', err.message);
        setSystemStatus({
          status: 'degraded',
          integrations: {
            supabase: { connected: false, message: 'Backend not reachable at http://localhost:5000' },
            openrouter: { configured: false },
          },
        });
      } finally {
        setStatusLoading(false);
      }
    }
    fetchHealth();
  }, []);

  // Fetch summary stats
  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await api.getOrderSummaryStats();
        setStats(data);
      } catch (err) {
        console.warn('Could not fetch summary stats:', err.message);
      }
    }
    fetchStats();
  }, [systemStatus]);

  // Fetch orders whenever filters or page changes
  useEffect(() => {
    async function fetchOrders() {
      setOrdersLoading(true);
      try {
        const data = await api.getOrders({
          page: pagination.page,
          limit: pagination.limit,
          risk_band: filter.risk_band,
          payment_type: filter.payment_type,
          status: filter.status,
        });
        setOrders(data.orders || []);
        if (data.pagination) {
          setPagination(data.pagination);
        }
      } catch (err) {
        console.warn('Could not fetch orders:', err.message);
        setOrders([]);
      } finally {
        setOrdersLoading(false);
      }
    }
    fetchOrders();
  }, [filter, pagination.page]);

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        systemStatus={systemStatus}
        onOpenAutoDemo={() => setAutoDemoOpen(true)}
      />

      <main style={{ maxWidth: '1440px', width: '100%', margin: '0 auto', padding: '1.5rem', flex: 1 }}>
        <StatusBanner systemStatus={systemStatus} loading={statusLoading} />

        {activeTab === 'dashboard' && (
          <Dashboard
            stats={stats}
            onNavigateToOrders={() => setActiveTab('orders')}
            onNavigateToAnalytics={() => setActiveTab('analytics')}
            onNavigateToInterventions={() => setActiveTab('interventions')}
            onOpenAutoDemo={() => setAutoDemoOpen(true)}
          />
        )}

        {activeTab === 'orders' && (
          <RiskOrders
            orders={orders}
            onViewOrder={(order) => setSelectedOrder(order)}
            loading={ordersLoading}
            filter={filter}
            setFilter={setFilter}
            pagination={pagination}
            onPageChange={handlePageChange}
          />
        )}

        {activeTab === 'interventions' && (
          <InterventionsHub
            orders={orders}
            onSelectOrder={(order) => setSelectedOrder(order)}
          />
        )}

        {activeTab === 'analytics' && <Analytics />}

        {activeTab === 'resilience' && <ResilienceCostHub />}

        {activeTab === 'phases' && <PhasesView />}
      </main>

      {/* 1-Click Auto Demo Modal */}
      <AutoDemoModal
        isOpen={autoDemoOpen}
        onClose={() => setAutoDemoOpen(false)}
        onNavigateToOrders={() => setActiveTab('orders')}
        onNavigateToAnalytics={() => setActiveTab('analytics')}
      />

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
}

import axios from 'axios';

const API_BASE = '/api';

const client = axios.create({
  baseURL: API_BASE,
  timeout: 90000, // 90s safety buffer for multi-model AI chains
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  // Health & Diagnostics
  async getHealth() {
    const res = await client.get('/health');
    return res.data;
  },

  // Orders
  async getOrders(params = {}) {
    const res = await client.get('/orders', { params });
    return res.data;
  },

  async getOrderSummaryStats() {
    const res = await client.get('/orders/stats/summary');
    return res.data;
  },

  async getOrderById(id) {
    const res = await client.get(`/orders/${id}`);
    return res.data;
  },

  // Risk & AI Inference (Phases 3, 4, 5, 6)
  async getOrderRiskFeatures(orderId) {
    const res = await client.get(`/risk/features/${orderId}`);
    return res.data;
  },

  async getRiskBaseline() {
    const res = await client.get('/risk/baseline');
    return res.data;
  },

  async evaluateOrder(orderId) {
    const res = await client.post(`/risk/evaluate/${orderId}`);
    return res.data;
  },

  async evaluateBatch(params = {}) {
    const res = await client.post('/risk/evaluate-batch', params);
    return res.data;
  },

  // Interventions & Simulated Customer Workflow (Phase 7)
  async getInterventionQueue(statusFilter) {
    const res = await client.get('/interventions/queue', {
      params: { status_filter: statusFilter },
    });
    return res.data;
  },

  async sendIntervention(orderId, customMessage) {
    const res = await client.post(`/interventions/send/${orderId}`, { customMessage });
    return res.data;
  },

  async simulateCustomerResponse(orderId, responseText) {
    const res = await client.post(`/interventions/simulate-response/${orderId}`, { responseText });
    return res.data;
  },

  async overrideIntervention(orderId, overrideData) {
    const res = await client.post(`/interventions/override/${orderId}`, overrideData);
    return res.data;
  },

  // Phase 8: Analytics & Outcome Tracking
  async getAnalyticsOverview() {
    const res = await client.get('/analytics/overview');
    return res.data;
  },

  // Phase 10 & 11: Resilience, Telemetry, Cost & Security
  async getTelemetry() {
    const res = await client.get('/resilience/telemetry');
    return res.data;
  },

  async getSecurityAudit() {
    const res = await client.get('/resilience/security-audit');
    return res.data;
  },

  async simulateFailure(failureType, orderId) {
    const res = await client.post('/resilience/simulate', { failureType, orderId });
    return res.data;
  },

  // Auto-Run 1-Click End-to-End Live Demo
  async runAutoDemo(scenario = 'fit_correction') {
    const res = await client.post('/risk/auto-demo', { scenario });
    return res.data;
  },
};

export default api;

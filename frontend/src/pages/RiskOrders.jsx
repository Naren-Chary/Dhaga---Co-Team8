import React, { useState } from 'react';
import { Filter, Search, Eye, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';

export default function RiskOrders({ orders, onViewOrder, loading, filter, setFilter, pagination, onPageChange }) {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="glass-card" style={{ padding: '1.5rem' }}>
      {/* Search and Filters Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '280px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '0.5rem 0.85rem',
            width: '100%',
          }}>
            <Search size={16} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search by Order ID or Customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                outline: 'none',
                width: '100%',
                fontSize: '0.875rem',
              }}
            />
          </div>
        </div>

        {/* Filter dropdowns */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <select
            value={filter.risk_band || ''}
            onChange={(e) => setFilter({ ...filter, risk_band: e.target.value || undefined })}
            style={{
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '0.5rem 0.85rem',
              fontSize: '0.85rem',
              outline: 'none',
            }}
          >
            <option value="">All Risk Bands</option>
            <option value="HIGH">High Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="LOW">Low Risk</option>
            <option value="UNKNOWN">Unassessed</option>
          </select>

          <select
            value={filter.payment_type || ''}
            onChange={(e) => setFilter({ ...filter, payment_type: e.target.value || undefined })}
            style={{
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '0.5rem 0.85rem',
              fontSize: '0.85rem',
              outline: 'none',
            }}
          >
            <option value="">All Payment Types</option>
            <option value="COD">COD Only</option>
            <option value="PREPAID">Prepaid</option>
          </select>

          <select
            value={filter.status || ''}
            onChange={(e) => setFilter({ ...filter, status: e.target.value || undefined })}
            style={{
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '0.5rem 0.85rem',
              fontSize: '0.85rem',
              outline: 'none',
            }}
          >
            <option value="">All Statuses</option>
            <option value="PLACED">Placed</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="RTO">RTO (Returned)</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>Order ID</th>
              <th style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>Customer</th>
              <th style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>Product & Size</th>
              <th style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>Amount</th>
              <th style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>Payment</th>
              <th style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>Risk Band</th>
              <th style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>Intervention</th>
              <th style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>Status</th>
              <th style={{ padding: '0.75rem 1rem', fontWeight: '600', textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                  Loading orders from Supabase...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No matching orders found.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr
                  key={order.id}
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '1rem', fontWeight: '600' }}>#{order.external_id}</td>
                  <td style={{ padding: '1rem' }}>
                    <div>{order.customers?.name || 'Customer'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.city || 'India'}</div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {order.products?.name || 'Product'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Size: {order.selected_size || 'N/A'} • {order.products?.category || ''}
                    </div>
                  </td>
                  <td style={{ padding: '1rem', fontWeight: '600' }}>₹{order.amount}</td>
                  <td style={{ padding: '1rem' }}>
                    <span className={`badge ${order.payment_type === 'COD' ? 'badge-cod' : 'badge-prepaid'}`}>
                      {order.payment_type}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span className={`badge badge-risk-${(order.risk_band || 'unknown').toLowerCase()}`}>
                      {order.risk_band || 'UNKNOWN'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.8rem', color: order.intervention_type ? '#818cf8' : 'var(--text-muted)' }}>
                    {order.intervention_type || 'None'}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: '500' }}>{order.status}</span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <button
                      onClick={() => onViewOrder(order)}
                      className="btn btn-secondary"
                      style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                    >
                      <Eye size={14} />
                      <span>Inspect</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pagination && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Showing Page {pagination.page} of {pagination.totalPages || 1} ({pagination.total} total orders)
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="btn btn-secondary"
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
            >
              <ChevronLeft size={16} />
              <span>Previous</span>
            </button>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="btn btn-secondary"
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
            >
              <span>Next</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

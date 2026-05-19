import React, { useState, useEffect } from 'react';
import ordersAPI from '../api/orders.api';
import '../styles/admin.css';

const AdminModal = ({ open, title, onClose, children }) => {
  if (!open) return null;
  return (
    <div className="admin-modal-backdrop" onMouseDown={onClose}>
      <div className="admin-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <h3>{title}</h3>
          <button className="admin-modal-close" onClick={onClose} type="button">
            <i className="fas fa-times" />
          </button>
        </div>
        <div className="admin-modal-body">{children}</div>
      </div>
    </div>
  );
};

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showDetails, setShowDetails] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await ordersAPI.getOrders();
      if (response.data?.success) setOrders(response.data.data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const openDetails = (order) => {
    setSelected(order);
    setShowDetails(true);
  };

  // اختياري: Confirm/Cancel إذا عندك ordersAPI.updateOrderStatus
  const updateStatus = async (order_id, status) => {
    try {
      if (!ordersAPI.updateOrderStatus) return;
      await ordersAPI.updateOrderStatus({ order_id, status });
      fetchOrders();
    } catch (e) {
      console.error("Update status error:", e);
    }
  };

  return (
    <main className="container admin-page">
      <h1>Manage Orders</h1>

      {loading ? (
        <div className="loading">Loading orders...</div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Phone</th>
              <th>Total</th>
              <th>Status</th>
              <th>Date</th>
              <th style={{textAlign:'right'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id}>
                <td>#{order.id}</td>
                <td>{order.name}</td>
                <td>{order.phone}</td>
                <td>{order.total_price} DH</td>
                <td><span className={`badge badge-${order.status}`}>{order.status}</span></td>
                <td>{new Date(order.created_at).toLocaleDateString()}</td>
                <td>
                  <div className="admin-actions-cell">
                    <button className="btn btn-primary btn-small" onClick={() => openDetails(order)} type="button">
                      Details
                    </button>

                    {/* اختياري */}
                    {ordersAPI.updateOrderStatus && (
                      <>
                        <button className="btn btn-success btn-small" onClick={() => updateStatus(order.id, "confirmed")} type="button">
                          Confirm
                        </button>
                        <button className="btn btn-danger btn-small" onClick={() => updateStatus(order.id, "cancelled")} type="button">
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* ✅ DETAILS MODAL */}
      <AdminModal
        open={showDetails}
        title={`Order #${selected?.id || ""} Details`}
        onClose={() => setShowDetails(false)}
      >
        {selected && (
          <div className="details-grid">
            <div className="details-box">
              <h4>Customer</h4>
              <div className="details-row"><b>Name</b><span>{selected.name}</span></div>
              <div className="details-row"><b>Phone</b><span>{selected.phone}</span></div>
              <div className="details-row"><b>City</b><span>{selected.city}</span></div>
              <div className="details-row"><b>Status</b><span>{selected.status}</span></div>
              <div className="details-row"><b>Total</b><span>{selected.total_price} DH</span></div>
            </div>

            <div className="details-box">
              <h4>Items</h4>
              {(selected.items || []).length === 0 ? (
                <div style={{ fontSize: 13, color: "#6b7280" }}>No items</div>
              ) : (
                <div style={{ display: "grid", gap: 8 }}>
                  {selected.items.map((it, idx) => (
                    <div key={idx} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 10 }}>
                      <div style={{ fontWeight: 800, fontSize: 13 }}>
                        {it.product_name || it.offer_title || `Item #${idx + 1}`}
                      </div>
                      <div style={{ fontSize: 13, color: "#6b7280" }}>
                        qty: {it.quantity} • price: {it.price} DH • type: {it.item_type}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </AdminModal>
    </main>
  );
};

export default AdminOrders;

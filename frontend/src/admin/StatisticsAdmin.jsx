import React, { useState, useEffect } from 'react';
import '../styles/admin.css';

const StatisticsAdmin = () => {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      const response = await fetch('https://allofice.xo.je/api/statistics.php', {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) setStatistics(data.data);
    } catch (err) {
      console.error('Error fetching statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <main className="container admin-page"><div className="loading">Loading statistics...</div></main>;
  }

  if (!statistics) {
    return <main className="container admin-page"><div className="error">Failed to load statistics</div></main>;
  }

  return (
    <main className="container admin-page">
      <h1>Business Statistics</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Users</h3>
          <p className="stat-value">{statistics.total_users}</p>
        </div>

        <div className="stat-card">
          <h3>Total Products</h3>
          <p className="stat-value">{statistics.total_products}</p>
        </div>

        <div className="stat-card">
          <h3>Total Orders</h3>
          <p className="stat-value">{statistics.total_orders}</p>
        </div>

        <div className="stat-card">
          <h3>Total Revenue</h3>
          <p className="stat-value">{statistics.total_revenue} DH</p>
        </div>
      </div>

      <div className="stats-section">
        <h2>Orders by Status</h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Count</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(statistics.orders_by_status || {}).map(([status, count]) => (
              <tr key={status}>
                <td>{status}</td>
                <td>{count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="stats-section">
        <h2>Products by Type</h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Count</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(statistics.products_by_type || {}).map(([type, count]) => (
              <tr key={type}>
                <td>{type}</td>
                <td>{count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="stats-section">
        <h2>Recent Orders</h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {(statistics.recent_orders || []).map(order => (
              <tr key={order.id}>
                <td>#{order.id}</td>
                <td>{order.name}</td>
                <td>{order.total_price} DH</td>
                <td><span className={`badge badge-${order.status}`}>{order.status}</span></td>
                <td>{new Date(order.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
};

export default StatisticsAdmin;

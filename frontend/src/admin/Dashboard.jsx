import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/admin.css';

const AdminDashboard = () => {
  return (
    <main className="container admin-page">
      <h1>Admin Dashboard</h1>

      <div className="admin-grid">
        <div className="admin-card">
          <i className="fas fa-box"></i>
          <h3>Products</h3>
          <p>Manage all products</p>
          <Link to="/admin/products" className="btn btn-primary">Go to Products</Link>
        </div>

        <div className="admin-card">
          <i className="fas fa-shopping-cart"></i>
          <h3>Orders</h3>
          <p>View and manage orders</p>
          <Link to="/admin/orders" className="btn btn-primary">Go to Orders</Link>
        </div>

        <div className="admin-card">
          <i className="fas fa-tag"></i>
          <h3>Offers</h3>
          <p>Create and manage offers</p>
          <Link to="/admin/offers" className="btn btn-primary">Go to Offers</Link>
        </div>

        <div className="admin-card">
          <i className="fas fa-chart-bar"></i>
          <h3>Statistics</h3>
          <p>View business statistics</p>
          <Link to="/admin/statistics" className="btn btn-primary">Go to Statistics</Link>
        </div>
      </div>
    </main>
  );
};

export default AdminDashboard;

import React, { useState, useEffect } from 'react';
import productsAPI from '../api/products.api';
import categoriesAPI from '../api/categories.api';
import '../styles/admin.css';

const API_BASE = "/api/";

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

const ProductsAdmin = () => {
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);

  // ✅ edit/details
  const [showEdit, setShowEdit] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selected, setSelected] = useState(null);
  const [detailsImages, setDetailsImages] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    product_type: 'office',
    quantity: ''
  });
  const [selectedFiles, setSelectedFiles] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    try {
      const productsResponse = await productsAPI.getProducts({
        type: '',        // أو 'office' أو 'printing'
        category_id: 0,
        search: '',
        limit: 100,
        offset: 0
      });
      console.log("one product:", productsResponse.data?.data?.[0]);

      if (productsResponse.data?.success) setProducts(productsResponse.data.data || []);

      const categoriesResponse = await categoriesAPI.getCategories();
      if (categoriesResponse.data?.success) setCategories(categoriesResponse.data.data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {

    setFormData({
      name: '',
      description: '',
      price: '',
      category_id: '',
      product_type: 'office',
      quantity: ''
    });

    setSelectedFiles([]);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setSelectedFiles(Array.from(e.target.files));
  };

  // ✅ CREATE
  const handleSubmit = async (e) => {
    e.preventDefault();
     setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', formData.name);
      fd.append('description', formData.description);
      fd.append('price', formData.price);
      fd.append('category_id', formData.category_id);
      fd.append('product_type', formData.product_type);
      fd.append('quantity', formData.quantity);

      selectedFiles.forEach(file => fd.append('images[]', file));

      await productsAPI.createProduct(fd);

      resetForm();
      setShowForm(false);
      fetchData();
    } catch (err) {
      console.error('Error creating product:', err);
    }finally{
       setSaving(false);
    }
  };

  // ✅ DELETE
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productsAPI.deleteProduct(id);
        fetchData();
      } catch (err) {
        console.error('Error deleting product:', err);
      }
    }
  };

  // ✅ DETAILS
  const openDetails = async (product) => {
    setSelected(product);
    setShowDetails(true);
    setDetailsImages([]);

    try {
      if (productsAPI.getImages) {
        const imgsRes = await productsAPI.getImages(product.id);
        const imgsRaw = imgsRes.data?.success ? imgsRes.data.data : imgsRes.data?.data;

        const arr = Array.isArray(imgsRaw) ? imgsRaw : [];

        // ✅ جمع paths اللي خاصنا نحيدو (main + images اللي جايين من list)
        const main = product.main_image ? String(product.main_image) : "";
        const fromList = Array.isArray(product.images) ? product.images.map(String) : [];
        const block = new Set([main, ...fromList].filter(Boolean));

        // ✅ خليه غير اللي ماشي مكرر
        const clean = arr.filter(im => !block.has(String(im.image_path)));

        setDetailsImages(clean);
      }
    } catch {
      setDetailsImages([]);
    }
  };


  // ✅ EDIT
  const openEdit = (product) => {
    setSelected(product);
    setFormData({
      name: product.name || '',
      description: product.description || '',
      price: product.price || '',
      category_id: product.category_id || '',
      product_type: product.product_type || 'office',
      quantity: product.quantity != null ? String(product.quantity) : 1
    });
    setSelectedFiles([]);
    setShowEdit(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
     setSaving(true);
    try {
      if (!productsAPI.updateProduct) {
        alert("productsAPI.updateProduct() ماكايناش عندك، صيفط ليا products.api.js باش نركبها");
        return;
      }

      const fd = new FormData();
      fd.append('id', selected.id);
      fd.append('name', formData.name);
      fd.append('description', formData.description);
      fd.append('price', formData.price);
      fd.append('category_id', formData.category_id);
      fd.append('product_type', formData.product_type);
      fd.append('quantity', formData.quantity);

      selectedFiles.forEach(file => fd.append('images[]', file));
      await productsAPI.updateProduct(fd);

      if (selectedFiles.length > 0) {
        await productsAPI.uploadImages(selected.id, selectedFiles);
      }

      setShowEdit(false);
      setSelected(null);
      resetForm();
      fetchData();
    } catch (err) {
      console.error('Error updating product:', err);
    }finally{
       setSaving(false);
    }
  };

  return (
    <main className="container admin-page">
      <h1>Manage Products</h1>

      <button onClick={() => { setShowForm(!showForm); if (!showForm) resetForm(); }} className="btn btn-success" type="button">
        {showForm ? 'Cancel' : 'Add New Product'}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="admin-form">
          <div className="form-group">
            <label>Product Name</label>
            <input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea name="description" value={formData.description} onChange={handleInputChange}></textarea>
          </div>

          <div className="form-group">
            <label>Price</label>
            <input type="number" name="price" value={formData.price} onChange={handleInputChange} step="0.01" required />
          </div>
          <div className="form-group">
            <label>Quantity</label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleInputChange}
              min="0"
              step="1"
              required
            />        
              </div>

          <div className="form-group">
            <label>Category</label>
            <select name="category_id" value={formData.category_id} onChange={handleInputChange}>
              <option value="">Select Category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Product Type</label>
            <select name="product_type" value={formData.product_type} onChange={handleInputChange}>
              <option value="office">Office Supplies</option>
              <option value="printing">Printing Services</option>
            </select>
          </div>

          <div className="form-group">
            <label>Product Images</label>
            <input type="file" multiple onChange={handleFileChange} accept="image/*" />
          </div>

          <button type="submit" className="btn btn-primary" disabled={saving}>
  {saving ? 'Creating...' : 'Create Product'}</button>
        </form>
      )}

      {loading ? (
        <div className="loading">Loading products...</div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Price</th>
              <th>quantity</th>
              <th>Category</th>
              <th>Type</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.id}>
                <td>{product.id}</td>
                <td>{product.name}</td>
                <td>{product.price} DH</td>
                <td>{product.quantity ?? 0}</td>
                <td>{product.category_name}</td>
                <td>{product.product_type}</td>
                <td>
                  <div className="admin-actions-cell">
                    <button className="btn btn-primary btn-small" onClick={() => openDetails(product)} type="button">Details</button>
                    <button className="btn btn-success btn-small" onClick={() => openEdit(product)} type="button">Edit</button>
                    <button onClick={() => handleDelete(product.id)} className="btn btn-danger btn-small" type="button">Delete</button>
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
        title={`Product Details #${selected?.id || ""}`}
        onClose={() => setShowDetails(false)}
      >
        {selected && (
          <div className="details-grid">
            <div className="details-box">
              <h4>Info</h4>
              <div className="details-row"><b>Name</b><span>{selected.name}</span></div>
              <div className="details-row"><b>Category</b><span>{selected.category_name || selected.category_id || "—"}</span></div>
              <div className="details-row"><b>Type</b><span>{selected.product_type}</span></div>
              <div className="details-row"><b>Price</b><span>{selected.price} DH</span></div>
              <div className="details-row"><b>Quantity</b><span>{selected.quantity ?? 0}</span></div>
              <div className="details-row"><b>Description</b><span>{selected.description || "—"}</span></div>
            </div>

            <div className="details-box">
              <h4>Images</h4>
              <div className="details-images">
                {selected.main_image ? (
                  <img src={`${API_BASE}/uploads/products/${selected.main_image}`} alt="main" />
                ) : null}

                {detailsImages.map((img, idx) => (
                  <img
                    key={img.id || idx}
                    src={`${API_BASE}/uploads/products/${img.image_path}`}
                    alt={`img-${idx}`}
                  />
                ))}
              </div>
              {!selected.main_image && detailsImages.length === 0 && (
                <div style={{ fontSize: 13, color: "#6b7280" }}>No images</div>
              )}
            </div>
          </div>
        )}
      </AdminModal>

      {/* ✅ EDIT MODAL */}
      <AdminModal
        open={showEdit}
        title={`Edit Product #${selected?.id || ""}`}
        onClose={() => { setShowEdit(false); setSelected(null); resetForm(); }}
      >
        <form onSubmit={handleUpdate} className="admin-form">
          <div className="form-group">
            <label>Product Name</label>
            <input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea name="description" value={formData.description} onChange={handleInputChange}></textarea>
          </div>

          <div className="form-group">
            <label>Price</label>
            <input type="number" name="price" value={formData.price} onChange={handleInputChange} step="0.01" required />
          </div>
          <div className="form-group">
            <label>quantity</label>
            <input type="number" name="quantity" value={formData.quantity} onChange={handleInputChange} step="0.01" required />
          </div>

          <div className="form-group">
            <label>Category</label>
            <select name="category_id" value={formData.category_id} onChange={handleInputChange}>
              <option value="">Select Category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Product Type</label>
            <select name="product_type" value={formData.product_type} onChange={handleInputChange}>
              <option value="office">Office Supplies</option>
              <option value="printing">Printing Services</option>
            </select>
          </div>

          <div className="form-group">
            <label>New Images (optional)</label>
            <input type="file" multiple onChange={handleFileChange} accept="image/*" />
          </div>

          <button type="submit" className="btn btn-primary">Update</button>
        </form>
      </AdminModal>
    </main>
  );
};

export default ProductsAdmin;

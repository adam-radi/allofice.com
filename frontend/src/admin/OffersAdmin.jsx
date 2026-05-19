import React, { useEffect, useMemo, useState } from "react";
import offersAPI from "../api/offers.api";
import productsAPI from "../api/products.api";
import "../styles/admin.css";

const API_BASE = "https://allofice.xo.je/api";

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

const AdminOffers = () => {
  const [saving, setSaving] = useState(false);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  // products for select
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);

  // UI
  const [showForm, setShowForm] = useState(false);

  // ✅ edit/details
  const [showEdit, setShowEdit] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selected, setSelected] = useState(null);

  // mode
  const [offerMode, setOfferMode] = useState("product"); // product | other
  const [selectedProductId, setSelectedProductId] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    discount_percentage: "",
    offer_type: "office", // office | printing
    price: "",
    quantity: "",
    start_date: "",
    end_date: "",
  });

  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    fetchOffers();
    fetchProducts();
  }, []);

  const resetForm = () => {
    setOfferMode("product");
    setSelectedProductId("");
    setFormData({
      title: "",
      description: "",
      discount_percentage: "",
      offer_type: "office",
      price: "",
      quantity: "",
      start_date: "",
      end_date: "",
    });
    setSelectedFile(null);
  };

  const fetchProducts = async () => {
    setProductsLoading(true);
    try {
      const res = await productsAPI.getProducts({ limit: 500, offset: 0 });
      if (res.data?.success) setProducts(res.data.data || []);
      else setProducts(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (e) {
      console.error("Error fetching products:", e);
    } finally {
      setProductsLoading(false);
    }
  };

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const response = await offersAPI.getOffers({ limit: 100, offset: 0 });

      if (response.data?.success) {
        setOffers(response.data.data || []);
      } else {
        const raw = response.data?.data || [];
        setOffers(Array.isArray(raw) ? raw : []);
      }
    } catch (err) {
      console.error("Error fetching offers:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files?.[0] || null);
  };

  const onChangeMode = (mode) => {
    setOfferMode(mode);

    // mode=product => نخلي price/qty يجيبو من product
    if (mode === "product") {
      setFormData((p) => ({
        ...p,
        offer_type: p.offer_type || "office",
        price: p.price || "",
        quantity: p.quantity || "",
      }));
    } else {
      // mode=other => نخلي user يعمر price/qty
      setSelectedProductId("");
      setFormData((p) => ({
        ...p,
        price: "",
        quantity: "",
      }));
    }
  };

  const onSelectProduct = (e) => {
    const pid = e.target.value;
    setSelectedProductId(pid);

    const p = products.find((x) => String(x.id) === String(pid));
    if (!p) return;

    setFormData((prev) => ({
      ...prev,
      offer_type: p.product_type || "office",
      price: p.price != null ? String(p.price) : "",
      quantity: p.quantity != null ? String(p.quantity) : "0",
      // ✅ auto-fill title/desc ولكن تقدر تبدلهم
      title: prev.title?.trim() ? prev.title : (p.name || ""),
      description: prev.description?.trim() ? prev.description : (p.description || ""),
    }));
  };

  // ✅ price preview (front only)
  const priceAfterDiscount = useMemo(() => {
    const p = Number(formData.price || 0);
    const d = Number(formData.discount_percentage || 0);
    if (!p) return 0;
    if (!d || d <= 0) return p;
    return Math.max(0, p - (p * d) / 100);
  }, [formData.price, formData.discount_percentage]);

  // ✅ CREATE
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // validation basics
      if (!formData.title.trim()) return alert("Title is required");
      if (!formData.offer_type) return alert("Offer type is required");

      if (offerMode === "product") {
        if (!selectedProductId) return alert("Select a product first");
      } else {
        // other
        if (!formData.price || Number(formData.price) <= 0) return alert("Price is required");
        if (formData.quantity === "" || Number(formData.quantity) < 0) return alert("Quantity is required");
      }

      const fd = new FormData();
      fd.append("title", formData.title);
      fd.append("description", formData.description);
      fd.append("discount_percentage", formData.discount_percentage || "0");
      fd.append("offer_type", formData.offer_type);
      fd.append("start_date", formData.start_date);
      fd.append("end_date", formData.end_date);

      if (offerMode === "product") {
        fd.append("product_id", selectedProductId);
        // backend ديالك كيدير price/quantity null فهاد الحالة
      } else {
        fd.append("product_id", "");
        fd.append("price", formData.price);
        fd.append("quantity", formData.quantity);
      }

      if (selectedFile) fd.append("image", selectedFile);

      await offersAPI.createOffer(fd);

      resetForm();
      setShowForm(false);
      fetchOffers();
    } catch (err) {
      console.error("Error creating offer:", err);
    } finally {
      setSaving(false);
    }
  };

  // ✅ DELETE
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this offer?")) {
      try {
        await offersAPI.deleteOffer(id);
        fetchOffers();
      } catch (err) {
        console.error("Error deleting offer:", err);
      }
    }
  };

  // ✅ DETAILS
  const openDetails = (offer) => {
    setSelected(offer);
    setShowDetails(true);
  };
  const isLinkedToProduct = (offer) => Number(offer?.product_id) > 0;

  // ✅ EDIT
  const openEdit = (offer) => {
    setSelected(offer);

    const mode = isLinkedToProduct(offer) ? "product" : "other";
    setOfferMode(mode);
    setSelectedProductId(isLinkedToProduct(offer) ? String(offer.product_id) : "");

    setFormData({
      title: offer.title || "",
      description: offer.description || "",
      discount_percentage: offer.discount_percentage || "",
      offer_type: offer.offer_type || "office",
      // إذا product offer نعرض price/qty من joined product_price فقط للعرض
      price: mode === "product"
        ? (offer.product_price != null ? String(offer.product_price) : "")
        : (offer.price != null ? String(offer.price) : ""),
      quantity: mode === "product"
        ? (offer.quantity != null ? String(offer.quantity) : "")
        : (offer.quantity != null ? String(offer.quantity) : ""),
      start_date: offer.start_date || "",
      end_date: offer.end_date || "",
    });

    setSelectedFile(null);
    setShowEdit(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // حسب backend ديالك updateOffer كيدير غير title/desc/discount/dates
      await offersAPI.updateOffer(selected.id, {
        id: selected.id,
        title: formData.title,
        description: formData.description,
        discount_percentage: formData.discount_percentage,
        start_date: formData.start_date,
        end_date: formData.end_date,
      });

      setShowEdit(false);
      setSelected(null);
      resetForm();
      fetchOffers();
    } catch (err) {
      console.error("Error updating offer:", err);
    } finally { setSaving(false); }
  };

  return (
    <main className="container admin-page">
      <h1>Manage Offers</h1>

      <button
        onClick={() => {
          setShowForm(!showForm);
          if (!showForm) resetForm();
        }}
        className="btn btn-success"
        type="button"
      >
        {showForm ? "Cancel" : "Add New Offer"}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="admin-form" style={{ marginTop: 14 }}>
          {/* MODE */}
          <div className="form-grid">
            <div className="form-group">
              <label>Offer Mode</label>
              <select
                value={offerMode}
                onChange={(e) => onChangeMode(e.target.value)}
                name="offerMode"
              >
                <option value="product">Linked to Product</option>
                <option value="other">Other (manual)</option>
              </select>
            </div>

            {offerMode === "product" ? (
              <div className="form-group">
                <label>Select Product</label>
                <select value={selectedProductId} onChange={onSelectProduct} disabled={productsLoading}>
                  <option value="">{productsLoading ? "Loading..." : "Choose product..."}</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      #{p.id} • {p.name} • {p.price} DH
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="form-group">
                <label>Offer Type</label>
                <select name="offer_type" value={formData.offer_type} onChange={handleInputChange}>
                  <option value="office">Office</option>
                  <option value="printing">Printing</option>
                </select>
              </div>
            )}
          </div>

          {/* TITLE + DISCOUNT */}
          <div className="form-grid">
            <div className="form-group">
              <label>Title *</label>
              <input type="text" name="title" value={formData.title} onChange={handleInputChange} required />
            </div>

            <div className="form-group">
              <label>Discount Percentage *</label>
              <input
                type="number"
                name="discount_percentage"
                value={formData.discount_percentage}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                required
              />
            </div>
          </div>

          {/* DESCRIPTION */}
          <div className="form-group">
            <label>Description</label>
            <textarea name="description" value={formData.description} onChange={handleInputChange} />
          </div>

          {/* AUTO INFO */}
          {offerMode === "product" && (
            <div className="form-grid">
              <div className="form-group">
                <label>Offer Type (auto)</label>
                <input value={formData.offer_type} readOnly />
              </div>
              <div className="form-group">
                <label>Product Price (auto)</label>
                <input value={formData.price || ""} readOnly placeholder="—" />
              </div>
              <div className="form-group">
                <label>Product Quantity (auto)</label>
                <input value={formData.quantity || ""} readOnly placeholder="—" />
              </div>
              <div className="form-group">
                <label>Price After Discount (preview)</label>
                <input value={priceAfterDiscount ? `${priceAfterDiscount} DH` : ""} readOnly placeholder="—" />
              </div>
            </div>
          )}

          {/* MANUAL INFO (OTHER) */}
          {offerMode === "other" && (
            <div className="form-grid">
              <div className="form-group">
                <label>Price *</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  required
                />
              </div>
              <div className="form-group">
                <label>Quantity *</label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  step="1"
                  min="0"
                  required
                />
              </div>
              <div className="form-group">
                <label>Price After Discount (preview)</label>
                <input value={priceAfterDiscount ? `${priceAfterDiscount} DH` : ""} readOnly placeholder="—" />
              </div>
            </div>
          )}

          {/* DATES */}
          <div className="form-grid">
            <div className="form-group">
              <label>Start Date</label>
              <input type="date" name="start_date" value={formData.start_date} onChange={handleInputChange} />
            </div>

            <div className="form-group">
              <label>End Date</label>
              <input type="date" name="end_date" value={formData.end_date} onChange={handleInputChange} />
            </div>
          </div>

          {/* IMAGE */}
          <div className="form-group">
            <label>Offer Image</label>
            <input type="file" onChange={handleFileChange} accept="image/*" />
          </div>

          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Creating...' : 'Create Offer'}

          </button>
        </form>
      )}

      {loading ? (
        <div className="loading">Loading offers...</div>
      ) : (
        <table className="admin-table" style={{ marginTop: 14 }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Mode</th>
              <th>Discount</th>
              <th>Start</th>
              <th>End</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {offers.map((offer) => (
              <tr key={offer.id}>
                <td>{offer.id}</td>
                <td>{offer.title}</td>
                <td>
                  <span className="badge">
                    {isLinkedToProduct(offer) ? "product" : "other"}
                  </span>
                </td>
                <td>{offer.discount_percentage}%</td>
                <td>{offer.start_date || "N/A"}</td>
                <td>{offer.end_date || "N/A"}</td>
                <td>
                  <div className="admin-actions-cell">
                    <button className="btn btn-primary btn-small" onClick={() => openDetails(offer)} type="button">
                      Details
                    </button>
                    <button className="btn btn-success btn-small" onClick={() => openEdit(offer)} type="button">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(offer.id)} className="btn btn-danger btn-small" type="button">
                      Delete
                    </button>
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
        title={`Offer Details #${selected?.id || ""}`}
        onClose={() => setShowDetails(false)}
      >
        {selected && (
          <div className="details-grid">
            <div className="details-box">
              <h4>Info</h4>
              <div className="details-row"><b>Title</b><span>{selected.title}</span></div>
              <div className="details-row"><b>Mode</b><span>{isLinkedToProduct(selected) ? "product" : "other"}</span></div>
              <div className="details-row"><b>Type</b><span>{selected.offer_type}</span></div>
              <div className="details-row"><b>Discount</b><span>{selected.discount_percentage}%</span></div>
              <div className="details-row"><b>Start</b><span>{selected.start_date || "—"}</span></div>
              <div className="details-row"><b>End</b><span>{selected.end_date || "—"}</span></div>
              <div className="details-row"><b>Description</b><span>{selected.description || "—"}</span></div>

              {isLinkedToProduct(selected) ? (

                <>
                  <div className="details-row"><b>Product</b><span>#{selected.product_id} • {selected.product_name || "—"}</span></div>
                  <div className="details-row"><b>Product Price</b><span>{selected.product_price != null ? `${selected.product_price} DH` : "—"}</span></div>
                </>
              ) : (
                <>
                  <div className="details-row"><b>Price</b><span>{selected.price != null ? `${selected.price} DH` : "—"}</span></div>
                  <div className="details-row"><b>Quantity</b><span>{selected.quantity != null ? selected.quantity : "—"}</span></div>
                </>
              )}
            </div>

            <div className="details-box">
              <h4>Image</h4>
              {selected.image_path ? (
                <div className="details-images" style={{ gridTemplateColumns: "repeat(2,1fr)" }}>
                  <img src={`${API_BASE}/uploads/offers/${selected.image_path}`} alt="offer" />
                </div>
              ) : (
                <div style={{ fontSize: 13, color: "#6b7280" }}>No image</div>
              )}
            </div>
          </div>
        )}
      </AdminModal>

      {/* ✅ EDIT MODAL */}
      <AdminModal
        open={showEdit}
        title={`Edit Offer #${selected?.id || ""}`}
        onClose={() => { setShowEdit(false); setSelected(null); resetForm(); }}
      >
        <form onSubmit={handleUpdate} className="admin-form">
          <div className="form-group">
            <label>Offer Title</label>
            <input type="text" name="title" value={formData.title} onChange={handleInputChange} required />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea name="description" value={formData.description} onChange={handleInputChange}></textarea>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Discount Percentage</label>
              <input type="number" name="discount_percentage" value={formData.discount_percentage} onChange={handleInputChange} step="0.01" required />
            </div>

            <div className="form-group">
              <label>Offer Type (read only)</label>
              <input value={formData.offer_type} readOnly />
            </div>
          </div>

          {/* عرض info فقط */}
          {offerMode === "product" ? (
            <div className="form-grid">
              <div className="form-group">
                <label>Linked Product</label>
                <input value={selectedProductId ? `#${selectedProductId}` : "—"} readOnly />
              </div>
              <div className="form-group">
                <label>Product Price</label>
                <input value={formData.price || ""} readOnly />
              </div>
            </div>
          ) : (
            <div className="form-grid">
              <div className="form-group">
                <label>Price</label>
                <input value={formData.price || ""} readOnly />
              </div>
              <div className="form-group">
                <label>Quantity</label>
                <input value={formData.quantity || ""} readOnly />
              </div>
            </div>
          )}

          <div className="form-grid">
            <div className="form-group">
              <label>Start Date</label>
              <input type="date" name="start_date" value={formData.start_date} onChange={handleInputChange} />
            </div>

            <div className="form-group">
              <label>End Date</label>
              <input type="date" name="end_date" value={formData.end_date} onChange={handleInputChange} />
            </div>
          </div>

          <button type="submit" className="btn btn-primary">Update</button>
        </form>
      </AdminModal>
    </main>
  );
};

export default AdminOffers;

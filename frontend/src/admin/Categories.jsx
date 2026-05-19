import React, { useEffect, useMemo, useState } from "react";
import categoriesAPI from "../api/categories.api";
import "../styles/admin.css";

const CategoriesAdmin = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState("all"); // all | office | printing
  const [error, setError] = useState("");

  // Form (add/edit)
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", type: "office" });

  // Details modal
  const [details, setDetails] = useState(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await categoriesAPI.getCategories(
        typeFilter === "all" ? null : typeFilter
      );

      if (res.data?.success) {
        setCategories(res.data.data || []);
      } else {
        setError(res.data?.message || "Failed to load categories");
      }
    } catch (e) {
      setError(e.response?.data?.message || e.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line
  }, [typeFilter]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return categories;

    return categories.filter((c) => {
      const name = String(c.name || "").toLowerCase();
      const slug = String(c.slug || "").toLowerCase();
      const desc = String(c.description || "").toLowerCase();
      const type = String(c.type || "").toLowerCase();
      return name.includes(s) || slug.includes(s) || desc.includes(s) || type.includes(s);
    });
  }, [categories, q]);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", description: "", type: "office" });
    setShowForm(true);
  };

  const openEdit = (cat) => {
    setEditing(cat);
    setForm({
      name: cat?.name || "",
      description: cat?.description || "",
      type: cat?.type || "office",
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm({ name: "", description: "", type: "office" });
  };

  const handleDelete = async (cat) => {
    if (!window.confirm(`Delete category "${cat?.name}" ?`)) return;
    setError("");
    try {
      const res = await categoriesAPI.deleteCategory(cat.id);
      if (!res.data?.success) throw new Error(res.data?.message || "Delete failed");
      await fetchCategories();
    } catch (e) {
      setError(e.response?.data?.message || e.message || "Delete failed");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");

    const name = (form.name || "").trim();
    const description = (form.description || "").trim();
    const type = form.type || "office";

    if (!name) {
      setError("Name is required");
      return;
    }

    try {
      if (editing?.id) {
        const res = await categoriesAPI.updateCategory({
          id: editing.id,
          name,
          description,
          type,
        });
        if (!res.data?.success) throw new Error(res.data?.message || "Update failed");
      } else {
        const res = await categoriesAPI.createCategory({
          name,
          description,
          type,
        });
        if (!res.data?.success) throw new Error(res.data?.message || "Create failed");
      }

      await fetchCategories();
      closeForm();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Save failed");
    }
  };

  const openDetails = async (cat) => {
    setError("");
    try {
      const res = await categoriesAPI.getCategory({ id: cat.id });
      const one = res.data?.success ? res.data.data : cat;
      setDetails(one);
    } catch {
      setDetails(cat);
    }
  };

  const closeDetails = () => setDetails(null);

  return (
    
    <main className="admin-page">
      <div className="admin-shell">
        {/* HEADER */}
        <div className="admin-head">
          <div>
            <h1 className="admin-title">Manage Categories</h1>
            <p className="admin-sub">Add, edit, delete and view category details.</p>
          </div>

          <div className="admin-actions">
            <div className="admin-search">
              <i className="fas fa-search" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name / slug / description / type..."
              />
            </div>

            {/* type filter */}
            <select
              className="a-btn a-btn-soft"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{ padding: "10px 12px" }}
            >
              <option value="all">All Types</option>
              <option value="office">Office</option>
              <option value="printing">Printing</option>
            </select>

            <button className="a-btn a-btn-success" onClick={openAdd}>
              <i className="fas fa-plus" />
              Add Category
            </button>
          </div>
        </div>

        {/* CARD */}
        <div className="admin-cardbox">
          <div className="admin-card-hd">
            <h2>Categories</h2>
            <span className="badge">{filtered.length} items</span>
          </div>

          <div className="admin-card-bd">
            {error && <div className="admin-error">{error}</div>}

            {loading ? (
              <div className="admin-loading">Loading...</div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: 80 }}>ID</th>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Slug</th>
                    <th>Description</th>
                    <th style={{ width: 260, textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ padding: 14, color: "var(--text-soft)" }}>
                        No categories found.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((cat) => (
                      <tr key={cat.id}>
                        <td>{cat.id}</td>
                        <td style={{ fontWeight: 900 }}>{cat.name}</td>

                        <td>
                          <span className="badge">
                            {cat.type === "printing" ? "Printing" : "Office"}
                          </span>
                        </td>

                        <td style={{ color: "var(--text-soft)" }}>{cat.slug || "—"}</td>

                        <td style={{ color: "var(--text-soft)" }}>
                          {(cat.description || "").slice(0, 60)}
                          {(cat.description || "").length > 60 ? "..." : ""}
                        </td>

                        <td>
                          <div className="admin-actions-cell">
                            <button className="a-btn a-btn-soft a-btn-sm" onClick={() => openDetails(cat)}>
                              <i className="fas fa-eye" /> Details
                            </button>

                            <button className="a-btn a-btn-primary a-btn-sm" onClick={() => openEdit(cat)}>
                              <i className="fas fa-pen" /> Edit
                            </button>

                            <button className="a-btn a-btn-danger a-btn-sm" onClick={() => handleDelete(cat)}>
                              <i className="fas fa-trash" /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* FORM MODAL */}
        {showForm && (
          <div className="admin-modal-backdrop" onMouseDown={closeForm}>
            <div className="admin-modal" onMouseDown={(e) => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h3>{editing ? `Edit Category #${editing.id}` : "Add Category"}</h3>
                <button className="admin-modal-close" onClick={closeForm}>
                  ✕
                </button>
              </div>

              <div className="admin-modal-body">
                <form className="admin-form" onSubmit={handleSave}>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Name *</label>
                      <input
                        value={form.name}
                        onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                        placeholder="Office Supplies"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Type *</label>
                      <select
                        value={form.type}
                        onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                        required
                      >
                        <option value="office">Office</option>
                        <option value="printing">Printing</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label>Slug</label>
                      <input value={editing?.slug || ""} readOnly placeholder="Auto-generated" />
                    </div>

                    <div className="form-group">
                      <label>ID</label>
                      <input value={editing?.id || ""} readOnly placeholder="Auto" />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                      placeholder="Optional description..."
                    />
                  </div>

                  <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                    <button type="button" className="a-btn a-btn-soft" onClick={closeForm}>
                      Cancel
                    </button>
                    <button type="submit" className="a-btn a-btn-success">
                      <i className="fas fa-save" />
                      {editing ? "Save Changes" : "Create"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* DETAILS MODAL */}
        {details && (
          <div className="admin-modal-backdrop" onMouseDown={closeDetails}>
            <div className="admin-modal" onMouseDown={(e) => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h3>Category Details</h3>
                <button className="admin-modal-close" onClick={closeDetails}>
                  ✕
                </button>
              </div>

              <div className="admin-modal-body">
                <div className="details-grid">
                  <div className="details-box">
                    <h4>Basic</h4>

                    <div className="details-row">
                      <span>ID</span>
                      <strong>#{details.id}</strong>
                    </div>

                    <div className="details-row">
                      <span>Name</span>
                      <strong>{details.name || "—"}</strong>
                    </div>

                    <div className="details-row">
                      <span>Type</span>
                      <strong>{details.type === "printing" ? "Printing" : "Office"}</strong>
                    </div>

                    <div className="details-row">
                      <span>Slug</span>
                      <strong style={{ color: "var(--text-soft)" }}>{details.slug || "—"}</strong>
                    </div>
                  </div>

                  <div className="details-box">
                    <h4>Description</h4>
                    <div style={{ color: "var(--text-soft)", fontSize: 13, lineHeight: 1.6 }}>
                      {details.description?.trim() ? details.description : "No description."}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
                  <button className="a-btn a-btn-soft" onClick={closeDetails}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default CategoriesAdmin;

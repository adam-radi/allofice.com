import React, { useEffect, useMemo, useState } from "react";
import ordersAPI from "../api/orders.api";
import { useCart } from "../context/CartContext";
import "../styles/orders.css";

const money = (n) => `${Number(n || 0).toFixed(2)} DH`;

const statusLabel = (s) => {
  const v = String(s || "pending").toLowerCase();
  if (v === "confirmed") return "confirmed";
  if (v === "cancelled") return "cancelled";
  return "pending";
};

export default function Orders() {
  const { addToCart } = useCart();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [filter, setFilter] = useState("all"); // all | pending | confirmed | cancelled
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setErr("");
        const res = await ordersAPI.getOrders();
        const data = res.data?.success ? res.data.data : res.data?.data;
        setOrders(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        setErr("Failed to load your orders.");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const filtered = useMemo(() => {
    if (filter === "all") return orders;
    return orders.filter((o) => statusLabel(o.status) === filter);
  }, [orders, filter]);

  const onToggle = (id) => setOpenId((prev) => (prev === id ? null : id));

  const onReorder = (o) => {
    const items = Array.isArray(o.items) ? o.items : [];
    if (!items.length) return;

    items.forEach((it) => {
      // ✅ نحاولو نبنيو object مناسب للـCart بلا ما نبدلو backend
      const cartItem = {
        id: it.product_id ? Number(it.product_id) : `offer-${it.offer_id}`,
        name: it.product_name || it.offer_title || "Item",
        price: Number(it.price || 0),
        product_type: it.item_type?.includes("offer") ? "offer" : "product",

        // باش تقدر تميّز فالcheckout
        product_id: it.product_id ? Number(it.product_id) : null,
        offer_id: it.offer_id ? Number(it.offer_id) : null,
        item_type: it.item_type,
      };

      // CartContext ديالك ممكن يقبل (item, qty) أو item فقط
      try {
        addToCart(cartItem, Number(it.quantity || 1));
      } catch {
        addToCart(cartItem);
      }
    });
  };

  if (loading) return <div className="orders-wrap">Loading...</div>;
  if (err) return <div className="orders-wrap">{err}</div>;

  return (
    <div className="orders-wrap">
      <div className="orders-head">
        <h1 className="orders-title">My Orders</h1>

        <div className="orders-filters">
          {["all", "pending", "confirmed", "cancelled"].map((k) => (
            <button
              key={k}
              type="button"
              className={`of-btn ${filter === k ? "active" : ""}`}
              onClick={() => setFilter(k)}
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="orders-empty">No orders to show.</div>
      ) : (
        <div className="orders-list">
          {filtered.map((o) => {
            const st = statusLabel(o.status);
            const opened = openId === o.id;

            const items = Array.isArray(o.items) ? o.items : [];
            const itemsCount = items.reduce((sum, it) => sum + Number(it.quantity || 0), 0);

            return (
              <div className="order-card" key={o.id}>
                <div className="order-headRow">
                  <div className="order-left">
                    <div className="order-id">Order #{o.id}</div>
                    <div className="order-sub">
                      <span className="order-date">
                        {o.created_at ? new Date(o.created_at).toLocaleString() : ""}
                      </span>
                      <span className="order-dot">•</span>
                      <span className="order-count">{itemsCount} items</span>
                    </div>
                  </div>

                  <div className="order-right">
                    <span className={`order-status status-${st}`}>{st}</span>
                    <div className="order-total">{money(o.total_price)}</div>
                  </div>
                </div>

                <div className="order-mini">
                  <div><strong>City:</strong> {o.city || "-"}</div>
                  <div><strong>Phone:</strong> {o.phone || "-"}</div>
                </div>

                <div className="order-actions">
                  <button className="od-btn" type="button" onClick={() => onToggle(o.id)}>
                    {opened ? "Hide details" : "View details"}
                  </button>

                  <button className="od-btn od-primary" type="button" onClick={() => onReorder(o)}>
                    Reorder
                  </button>
                </div>

                {opened && (
                  <div className="order-details">
                    <div className="od-head">Items</div>

                    <div className="od-items">
                      {items.map((it, idx) => {
                        const name = it.product_name || it.offer_title || "Item";
                        const qty = Number(it.quantity || 0);
                        const price = Number(it.price || 0);
                        const sub = qty * price;

                        return (
                          <div className="od-item" key={idx}>
                            <div className="od-name">
                              {name}
                              <span className="od-type">({it.item_type})</span>
                            </div>
                            <div className="od-qty">x{qty}</div>
                            <div className="od-price">{money(price)}</div>
                            <div className="od-sub">{money(sub)}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

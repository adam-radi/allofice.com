import React, { useMemo } from "react";
import "../styles/cart.css";

const API_BASE = "https://allofice.xo.je/api";

// ✅ normalize image (نفس فكرة checkout)
const fixImage = (raw, folder = "products") => {
  if (!raw) return "";

  const s = String(raw).trim();

  // full url
  if (s.startsWith("http://") || s.startsWith("https://")) return s;

  // starts with /uploads/...
  if (s.startsWith("/uploads/")) return `${API_BASE}${s}`;

  // starts with uploads/...
  if (s.startsWith("uploads/")) return `${API_BASE}/${s}`;

  // filename فقط
  return `${API_BASE}/uploads/${folder}/${encodeURIComponent(s)}`;
};

const CartItem = ({ item, onUpdateQuantity, onRemove }) => {
  const isOffer = Boolean(item?.offer_id); // ✅ offer اذا فيه offer_id

  // ✅ id اللي غادي نرسل لل remove/update
  const actionId = useMemo(() => {
    // offer → "offer-12"
    if (isOffer) return `offer-${item.offer_id}`;
    // product → 5
    return item.id;
  }, [isOffer, item]);
const imgSrc =
  item?.offer_id
    ? (item?.image_path
        ? `${API_BASE}/uploads/offers/${item.image_path}`
        : "/assets/hero-2.png")
    : (item?.main_image
        ? `${API_BASE}/uploads/products/${item.main_image}`
        : "/assets/hero-2.png");

  const title = item?.name || item?.title || item?.product_name || item?.offer_title || "Item";
  const price = Number(item?.price || 0);
  const qty = Math.max(1, Number(item?.quantity || 1));

  return (
    <div className="cart-item">
      <div className="item-image">
        {imgSrc ? (
          <img src={imgSrc} alt={title} />
        ) : (
          <img src="/assets/hero-2.png" alt={title} />
        )}
      </div>

      <div className="item-details">
        <h3>{title}</h3>

        {/* ✅ label صغير باش تعرف واش offer ولا product */}
        <p style={{ margin: 0, fontSize: 12, opacity: 0.7 }}>
          {isOffer ? "Offer" : "Product"}
        </p>

        <p className="price">{price ? `${price} DH` : "—"}</p>
      </div>

      <div className="item-quantity">
        <button onClick={() => onUpdateQuantity(actionId, qty - 1)}>-</button>

        <input
          type="number"
          value={qty}
          onChange={(e) => onUpdateQuantity(actionId, parseInt(e.target.value || "1", 10))}
          min="1"
        />

        <button onClick={() => onUpdateQuantity(actionId, qty + 1)}>+</button>
      </div>

      <div className="item-total">
        <p>{(price * qty).toFixed(2)} DH</p>
      </div>

      <button className="remove-btn" onClick={() => onRemove(actionId)}>
        <i className="fas fa-trash">X</i>
      </button>
    </div>
  );
};

export default CartItem;

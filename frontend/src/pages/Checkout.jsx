import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import ordersAPI from "../api/orders.api";
import productsAPI from "../api/products.api";
import offersAPI from "../api/offers.api";
import "../styles/checkout.css";

const Checkout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [sp] = useSearchParams();
    const API_BASE = "https://allofice.xo.je/api";

    const fixImage = (raw, folder = "products") => {
        if (!raw) return "";

        const s = String(raw).trim();

        // full url
        if (s.startsWith("http://") || s.startsWith("https://")) return s;

        // starts with /uploads/...
        if (s.startsWith("/uploads/")) return `${API_BASE}${s}`;

        // starts with uploads/...
        if (s.startsWith("uploads/")) return `${API_BASE}/${s}`;

        // :8000/... (ناقص http://localhost)
        if (s.startsWith(":8000/")) return `http://localhost${s}`;
        // already contains uploads/products or uploads/offers
        if (s.includes("uploads/products/") || s.includes("uploads/offers/")) {
            if (s.startsWith("/")) return `${API_BASE}${s}`;
            return `${API_BASE}/${s}`;
        }

        // starts with products/filename or offers/filename
        if (s.startsWith("products/") || s.startsWith("offers/")) {
            return `${API_BASE}/uploads/${s}`;
        }

        // filename فقط
        return `${API_BASE}/uploads/${folder}/${encodeURIComponent(s)}`;
    };
    const qpProductId = Number(sp.get("product_id") || 0);
    const qpOfferId = Number(sp.get("offer_id") || 0);
    const qpQty = Math.max(1, Number(sp.get("qty") || 1));
    const buyNowFinal =
        location.state?.buyNow ||
        ((qpProductId || qpOfferId)
            ? { items: [{ product_id: qpProductId || null, offer_id: qpOfferId || null, quantity: qpQty }] }
            : null);
    const { cart, getTotalPrice, clearCart } = useCart();
    const { user, isAuthenticated, updateProfile, guestCheckout, checkAuth } = useAuth();
    const [resolvedItems, setResolvedItems] = useState([]);

    const buyNow =
        location.state?.buyNow ||
        (qpProductId || qpOfferId
            ? { items: [{ product_id: qpProductId || null, offer_id: qpOfferId || null, quantity: qpQty }] }
            : null);

    const isBuyNow = Boolean(buyNowFinal?.items?.length);
    // ✅ Query params fallback (Instagram/FB direct link)



    // ✅ واش جاينا من URL ؟

    // ✅ final "BuyNow" source: state OR url

    const [loading, setLoading] = useState(false);
    const [savingProfile, setSavingProfile] = useState(false);

    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [showCompleteProfile, setShowCompleteProfile] = useState(false);
    const normalizeItemsForBackend = (items) => {
        const toInt = (v) => {
            if (v === null || v === undefined) return 0;
            if (typeof v === "number") return v;

            const s = String(v).trim();

            if (s.startsWith("offer-")) {
                const n = Number(s.replace("offer-", ""));
                return Number.isFinite(n) ? n : 0;
            }

            if (s.includes("-")) {
                const last = s.split("-").pop();
                const n = Number(last);
                return Number.isFinite(n) ? n : 0;
            }

            const n = Number(s);
            return Number.isFinite(n) ? n : 0;
        };

        return (items || [])
            .map((it) => {
                const quantity = Math.max(1, Number(it?.quantity || 1));

                const offer_id = toInt(it?.offer_id) || toInt(it?.offerId);

                const explicitProduct =
                    toInt(it?.product_id) || toInt(it?.productId);

                // ✅ إذا كان offer-only: عندو offer_id وماعندوش product_id => ماتاخدش product_id من id
                const isOfferOnly = offer_id > 0 && !explicitProduct;

                const product_id = isOfferOnly
                    ? 0
                    : (explicitProduct ||
                        (String(it?.id || "").startsWith("offer-") ? 0 : toInt(it?.id)));

                const obj = { quantity };
                if (product_id > 0) obj.product_id = product_id;
                if (offer_id > 0) obj.offer_id = offer_id;

                return obj;
            })
            .filter((x) => x.quantity > 0 && (x.product_id || x.offer_id));
    };

    const checkoutItems = useMemo(() => {
        if (isBuyNow) {
            return normalizeItemsForBackend(buyNowFinal?.items || []);
        }
        return normalizeItemsForBackend(cart || []);
    }, [isBuyNow, buyNowFinal, cart]);

    const totalDisplay = useMemo(() => {
        if (!isBuyNow) return `${Number(getTotalPrice() || 0).toFixed(2)} DH`;
        return "—";
    }, [isBuyNow, getTotalPrice]);

    const [formData, setFormData] = useState({
        name: user?.name || "",
        phone: user?.phone || "",
        city: user?.city || "",
    });
    const depProductId = qpProductId;
    const depOfferId = qpOfferId;
    const depQty = qpQty;
    const cartDep = JSON.stringify(cart.map(x => [x.id, x.offer_id, x.quantity]));

    useEffect(() => {
        const run = async () => {
            try {
                // source: buyNow items OR cart items (باش نقدر نجيب offer_id)
                const sourceItems = isBuyNow ? (buyNowFinal?.items || []) : (cart || []);

                // كنحولهم ل format موحّد
                const items = normalizeItemsForBackend(sourceItems);

                // إذا ماكاين حتى offer ولا product → وقف
                if (!items.length) {
                    setResolvedItems([]);
                    return;
                }

                const results = await Promise.all(
                    items.map(async (it) => {
                        const qty = Math.max(1, Number(it?.quantity || 1));

                        // ✅ 1) PRODUCT + OFFER (product_offer)
                        // ✅ 1) PRODUCT + OFFER (product_offer)
                        if (it?.product_id && it?.offer_id) {
                            const [pRes, oRes] = await Promise.all([
                                productsAPI.getProduct({ id: Number(it.product_id) }),
                                offersAPI.getOffer(Number(it.offer_id)),
                            ]);

                            const p = pRes?.data?.data || pRes?.data?.product || pRes?.data || {};
                            const o = oRes?.data?.data || oRes?.data?.offer || oRes?.data || {};

                            const discount = Number(o?.discount_percentage || 0);
                            const basePrice = Number(p?.price || 0);

                            // unit = price ديال offer أو product
                            let unit = Number(o?.price ?? basePrice ?? 0);

                            // apply discount إذا كان موجود
                            if (Number(o?.discount_percentage) > 0) {
                                unit = unit * (1 - Number(o.discount_percentage) / 100);
                            }

                            // تأكد من أن unit رقم صحيح
                            unit = Number.isFinite(unit) ? unit : 0;
                            // ✅ هنا التغيير: الصورة ديال offer إلا كانت، إلا لا رجّع product
                            const img =
                                o?.image_path
                                    ? `${API_BASE}/uploads/offers/${o.image_path}`
                                    : (p?.main_image ? `${API_BASE}/uploads/products/${p.main_image}` : "");

                            return {
                                ...p,
                                offer_id: Number(it.offer_id),
                                product_id: Number(it.product_id),
                                offer_title: o?.title,
                                discount_percentage: discount,

                                quantity: qty,
                                __type: "product_offer",
                                __image: img,                 // ✅ دابا كيقدر يجي offer image
                                __unit: Number.isFinite(unit) ? unit : 0,
                                __category: p?.category_name || "",
                            };
                        }


                        if (it?.offer_id) {
                            const res = await offersAPI.getOffer(Number(it.offer_id));
                            const o = res?.data?.data || res?.data?.offer || res?.data || {};

                            const qty = Math.max(1, Number(it?.quantity || 1));

                            let unit = Number(o?.price ?? 0);

                            // ✅ طبق الخصم إذا موجود
                            if (Number(o?.discount_percentage) > 0) {
                                unit = unit * (1 - Number(o.discount_percentage) / 100);
                            }

                            const img = o?.image_path ? `${API_BASE}/uploads/offers/${o.image_path}` : "";

                            return {
                                ...o,
                                offer_id: Number(it.offer_id),
                                quantity: qty,
                                __type: "offer",
                                __image: img,
                                __unit: Number.isFinite(unit) ? unit : 0,
                                __category: "Offer",
                            };
                        }
                        // ✅ 2) PRODUCT فقط
                        if (it?.product_id) {
                            const res = await productsAPI.getProduct({ id: Number(it.product_id) });
                            const p = res?.data?.data || res?.data?.product || res?.data || {};

                            const img = p?.main_image ? `${API_BASE}/uploads/products/${p.main_image}` : "";

                            return {
                                ...p,
                                product_id: Number(it.product_id),
                                quantity: qty,
                                __type: "product",
                                __image: img,
                                __unit: Number(p?.price || 0),
                            };
                        }

                        // ✅ 3) OFFER فقط (other_offer)


                        return null;
                    })

                );

                setResolvedItems(results.filter(Boolean));
            } catch {
                setResolvedItems([]);
            }
        };

        run();
    }, [isBuyNow, depProductId, depOfferId, depQty, cartDep]);

    useEffect(() => {
        setFormData({
            name: user?.name || "",
            phone: user?.phone || "",
            city: user?.city || "",
        });
    }, [user]);

    const [profileEmail, setProfileEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");

    useEffect(() => {
        if (!isBuyNow && cart.length === 0) {
            setError("Your cart is empty. Please add items before checkout.");
        }
    }, [isBuyNow, cart.length]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((p) => ({ ...p, [name]: value }));
    };
    const calculateUnitPrice = (item) => {
        // 1️⃣ offer + product
        if (item?.__unit !== undefined) {
            return Number(item.__unit) || 0;
        }

        // 2️⃣ offer فقط
        if (item?.offer_id) {
            const base = Number(item?.price ?? item?.__unit ?? 0);
            const discount = Number(item?.discount_percentage ?? 0);
            return base * (1 - discount / 100);
        }

        // 3️⃣ product فقط
        if (item?.product_id) {
            return Number(item?.price ?? item?.__unit ?? 0);
        }

        return 0;
    };

    const getUnit = (item) => {
        // 1️⃣ أهم حاجة: إلا كان محسوب قبل (__unit)
        if (item?.__unit !== undefined) {
            return Number(item.__unit) || 0;
        }

        // 2️⃣ إلا كان offer مرتبط بمنتج
        if (item?.offer_id && item?.discount_percentage) {
            const base = Number(item?.price || 0);
            const discount = Number(item?.discount_percentage || 0);

            if (discount > 0) {
                return base - (base * discount / 100);
            }

            return base;
        }

        // 3️⃣ product عادي
        if (item?.product_id) {
            return Number(item?.price || 0);
        }

        return 0;
    };
    const orderItemsTotal = useMemo(() => {

        return (resolvedItems || []).reduce((acc, x) => {
            const qty = Math.max(1, Number(x?.quantity || 1));
            const unit = calculateUnitPrice(x);
            return acc + (Number.isFinite(unit) ? unit : 0) * qty;
        }, 0);


    }, [resolvedItems]);



    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        if (!resolvedItems.length) {
            setError("Please wait, items are loading...");
            setLoading(false);
            return;
        }
        try {
            const itemsPayload = resolvedItems.map(item => ({
                product_id: item.product_id || undefined,
                offer_id: item.offer_id || undefined,
                quantity: Number(item.quantity || 1),
                unit_price: Number(item.__unit || 0),
            }));

            const totalPayload = itemsPayload.reduce(
                (acc, it) => acc + (Number(it.unit_price) * Number(it.quantity)),
                0
            );
            // ✅ 1) ORDER FIRST (ديما)
            const payload = {
                items: itemsPayload,
                name: formData.name.trim(),
                phone: formData.phone.trim(),
                city: formData.city.trim(),
                total: totalPayload,
            };

            const response = await ordersAPI.createOrder(payload);

            if (!response.data?.success) {
                setError(response.data?.message || "Failed to place order.");
                return;
            }

            alert("✅ Your order has been placed successfully!");
            if (!isBuyNow) clearCart();

            // ✅ الجديد: ناخدو account_status من backend
            const accountStatus = response.data?.data?.account_status;
            if (accountStatus === "logged_in") {
                setTimeout(() => navigate("/"), 800);
                return;
            }

            if (accountStatus === "existing_account") {
                alert("Ce numero existe ,vous pouvez donc vous connect pour consulter vos commandes");
                navigate("/login", {
                    state: {
                        phone: payload.phone,
                        from: location.pathname
                    }
                });

                return;
            }
      
            // 🆕 user جديد
            if (accountStatus === "needs_complete_profile") {

                setShowCompleteProfile(true);
                return;
            }

            // ✅ user logged in
            
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Failed to place order.");
        } finally {
            setLoading(false);
        }
    };
    const handleCompleteProfile = async (e) => {
        e.preventDefault();
        setError("");
        setSavingProfile(true);

        try {
            if (!profileEmail) {
                setError("Email is required to complete your account.");
                setSavingProfile(false);
                return;
            }

            await updateProfile({
                email: profileEmail,
                newPassword: newPassword || "",
            });

            setSuccessMsg("✅ Account completed successfully!");
            setShowCompleteProfile(false);
            setTimeout(() => navigate("/"), 900);
        } catch (err) {
            setError(err.message || "Failed to update profile.");
        } finally {
            setSavingProfile(false);
        }
    };


    const getImg = (item) => {
        // 1) إذا كانت جاهزة
        if (item?.__image) return item.__image;

        // 2) Offer: image_path
        if (item?.__type === "offer" || item?.offer_id) {
            if (item?.image_path) return item.image_path; // filename أو path
            if (item?.image) return item.image;
        }

        // 3) Product: main_image
        if (item?.main_image) return item.main_image;

        // 4) fallbacks
        return (
            item?.image_url ||
            item?.thumbnail ||
            item?.cover ||
            item?.images?.[0]?.url ||
            item?.images?.[0] ||
            ""
        );
    };


    const getCategory = (item) =>
        item?.__category ||
        item?.category_name ||
        item?.category?.name ||
        item?.categoryName ||
        item?.cat_name ||
        "";

    const getTitle = (item) =>
        item?.name || item?.title || item?.product_name || item?.offer_title || "Item";
   
   
    const renderItemsList = () => {
        const source = resolvedItems || [];

        return source.map((item, idx) => {
           
            const rawImg = getImg(item);
            const folder = (item?.__type === "offer" || item?.offer_id) ? "offers" : "products";
            const img = fixImage(rawImg, folder);
            const title = getTitle(item);
            const category = getCategory(item);

            const qty = Math.max(1, Number(item?.quantity || 1));
            const unit = getUnit(item);
            const lineTotal = unit * qty;
        
            return (
                <div key={item?.id || item?.offer_id || idx} className="checkout-item checkout-item--rich">
                    <div className="item-thumb">
                        {img ? <img src={img} alt={title} /> : <div className="item-thumb-ph" />}
                    </div>

                    <div className="item-info">
                        <h3>title : {title}</h3>
                        <div className="item-meta">
                            <div className="item-line"> category : {category ? <span className="item-cat"> {category}</span> : null}</div>
                            <div className="item-qty">Quantity : {qty}</div>
                            <div className="item-unit">price : {unit ? `${unit.toFixed(2)} DH` : ""}</div>
                            <div className="item-line">price to pay : {unit ? `${lineTotal.toFixed(2)} DH` : "... DH"}</div>

                        </div>
                    </div>


                </div>
            );
        });
    };
    if (!isBuyNow && cart.length === 0) {
        return (
            <main className="checkout-page">
                <div className="checkout-wrap">
                    <div className="error">Your cart is empty. Please add items before checkout.</div>
                </div>
            </main>
        );
    }

    return (
        <main className="checkout-page">
            <div className="checkout-wrap">
                <div className="checkout-head">
                    <div>
                        <h1>Checkout</h1>
                        <p>Confirm your delivery info and place your order.</p>
                    </div>
                    <span className="ck-badge">{isBuyNow ? "Buy Now" : "Cart"}</span>
                </div>

                <div className="checkout-layout">
                    {/* LEFT */}
                    <div className="ck-card">
                        <div className="ck-title ck-title--top">
                            <div className="ck-title-left">
                                <h2>Order Items</h2>
                                <div className="ck-total-top">
                                    <span>Total</span>
                                    <strong>{orderItemsTotal.toFixed(2)} DH</strong>
                                </div>
                            </div>

                            <span className="ck-badge">{isBuyNow ? "Buy Now" : "Cart"}</span>
                        </div>

                        <div className="items-list items-list--vh">
                            {renderItemsList()}
                        </div>

                    </div>

                    {/* RIGHT */}
                    <div className="ck-card">
                        <div className="ck-title">
                            <h2>Delivery Information</h2>
                            <span className="ck-badge">Secure</span>
                        </div>

                        {error && <div className="error">{error}</div>}
                        {successMsg && <div className="success">{successMsg}</div>}

                        {!showCompleteProfile && (
                            <form onSubmit={handleSubmit} className="checkout-form">
                                <div className="form-group">
                                    <label>Full Name *</label>
                                    <input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
                                </div>

                                <div className="form-group">
                                    <label>Phone *</label>
                                    <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} required />
                                </div>

                                <div className="form-group">
                                    <label>City *</label>
                                    <input type="text" name="city" value={formData.city} onChange={handleInputChange} required />
                                </div>

                                <button type="submit" className="place-order-btn" disabled={loading || resolvedItems.length === 0}>
                                    {loading ? "Processing..." : "Place Order"}
                                </button>
                            </form>
                        )}

                        {showCompleteProfile && (
                            <div style={{ marginTop: 12 }}>
                                <div className="info-box" style={{ marginBottom: 12 }}>
                                    ✅ Your order is confirmed. <br />
                                    Add your email to complete your account. <br />
                                    <strong>Note:</strong> Your current password is your phone number.
                                </div>

                                <form onSubmit={handleCompleteProfile} className="checkout-form">
                                    <div className="form-group">
                                        <label>Full Name</label>
                                        <input type="text" value={formData.name} readOnly />
                                    </div>

                                    <div className="form-group">
                                        <label>Phone (your current password)</label>
                                        <input type="text" value={formData.phone} readOnly />
                                    </div>

                                    <div className="form-group">
                                        <label>City</label>
                                        <input type="text" value={formData.city} readOnly />
                                    </div>

                                    <div className="form-group">
                                        <label>Email *</label>
                                        <input
                                            type="email"
                                            value={profileEmail}
                                            onChange={(e) => setProfileEmail(e.target.value)}
                                            placeholder="you@example.com"
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>New Password (optional)</label>
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Leave empty to keep phone password"
                                        />
                                    </div>

                                    <button type="submit" className="place-order-btn" disabled={savingProfile}>
                                        {savingProfile ? "Saving..." : "Save"}
                                    </button>

                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        style={{ marginTop: 10 }}
                                        onClick={() => navigate("/")}
                                        disabled={savingProfile}
                                    >
                                        Skip
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
};

export default Checkout;

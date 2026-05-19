import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import productsAPI from "../api/products.api";
import offersAPI from "../api/offers.api";
import { useCart } from "../context/CartContext";
import "../styles/product-details.css";

// ✅ عدّل هاد BASE حسب backend ديالك
const API_BASE = "https://allofice.xo.je/api";

const ProductDetails = () => {
    const navigate = useNavigate();
    const { addToCart } = useCart();

    // ✅ params مرة وحدة
    const params = useParams();

    const extractId = (slugId) => {
        // كيجيب الرقم اللي من بعد آخر "-"
        if (!slugId) return 0;
        const parts = String(slugId).split("-");
        const last = parts[parts.length - 1];
        const n = Number(last);
        return Number.isFinite(n) ? n : 0;
    };
    // product route:
    // /products_details/:type/:catSlug-:catId/:productSlug-:productId
    // offer route:
    // /products_details/offer/:offerSlug-:offerId
    const pid = extractId(params.productSlugId);
    const oid = extractId(params.offerSlugId);
    // ✅ route recognition
    const isOfferRoute = params.type === "offer" || Boolean(params.offerSlugId);

    console.log("DETAILS PARAMS =>", params);
    console.log("isOfferRoute:", isOfferRoute, "pid:", pid, "oid:", oid);

    // ✅ IDs (productId / offerId)

    // Data
    const [item, setItem] = useState(null);
    const [offerMeta, setOfferMeta] = useState(null);
    const [images, setImages] = useState([]);
    const [selectedImage, setSelectedImage] = useState(0);

    // UI
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [toast, setToast] = useState("");
    const [expanded, setExpanded] = useState(false);
    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(""), 2500);
    };

    // ✅ image helpers (fallback محلي)
    const imgFromProduct = (p) => {
        if (!p) return '/assets/hero-2.png';
        if (p.main_image) return `${API_BASE}/uploads/products/${p.main_image}`;
        return '/assets/hero-2.png';
    };

    const imgFromOffer = (o) => {
        if (!o) return '/assets/hero-2.png';
        if (o.image_path) return `${API_BASE}/uploads/offers/${o.image_path}`;
        return '/assets/hero-2.png';
    };

    useEffect(() => {
        const run = async () => {
            try {
                setLoading(true);
                setError("");
                setItem(null);
                setOfferMeta(null);
                setImages([]);
                setSelectedImage(0);
                setQuantity(1);

                // =========================
                // ✅ CASE 1: OFFER ROUTE
                // =========================
                if (isOfferRoute) {
                    if (!oid) {
                        setError("Offer id is missing.");
                        return;
                    }

                    const offerRes = await offersAPI.getOffer(oid);
                    const raw = offerRes.data?.success ? offerRes.data.data : offerRes.data?.data;
                    const offer = Array.isArray(raw) ? raw[0] : raw;

                    if (!offer) {
                        setError("Offer not found.");
                        return;
                    }

                    setOfferMeta(offer);

                    // ✅ إذا offer مرتبطة بمنتج
                    if (offer.product_id) {
                        const prodRes = await productsAPI.getProduct({ id: Number(offer.product_id) });
                        const prodRaw = prodRes.data?.success ? prodRes.data.data : prodRes.data?.data;
                        const product = Array.isArray(prodRaw) ? prodRaw[0] : prodRaw;

                        if (product) {
                            setItem(product);

                            try {
                                const imgsRes = await productsAPI.getImages(Number(product.id));
                                const imgs = imgsRes.data?.success ? imgsRes.data.data : imgsRes.data?.data;
                                const productImgs = Array.isArray(imgs) ? imgs : [];

                                // ✅ خلي offer image ديما لولا (إلا كاينة)
                                const offerImg = offer?.image_path
                                    ? [{ id: `offer-${offer.id}`, image_path: offer.image_path, __from: "offer" }]
                                    : [];

                                setImages([...offerImg, ...productImgs]);
                                setSelectedImage(0); // ✅ يبدأ ب offer image
                            } catch {
                                const offerImg = offer?.image_path
                                    ? [{ id: `offer-${offer.id}`, image_path: offer.image_path, __from: "offer" }]
                                    : [];
                                setImages(offerImg);
                                setSelectedImage(0);
                            }
                            return;

                        }
                    }

                    // ✅ offer standalone -> item وهمي
                    setItem({
                        id: `offer-${offer.id}`,
                        name: offer.title,
                        description: offer.description,
                        price: offer.price ?? offer.product_price ?? 0,
                        product_type: offer.offer_type,
                        category_name: "Offer",
                        main_image: null,
                    });

                    setImages([{ id: 1, image_path: offer.image_path, __from: "offer" }]);
                    return;
                }

                // =========================
                // ✅ CASE 2: PRODUCT ROUTE
                // =========================
                if (!pid) {
                    setError("Product id is missing.");
                    return;
                }

                const prodRes = await productsAPI.getProduct({ id: pid });
                const prodRaw = prodRes.data?.success ? prodRes.data.data : prodRes.data?.data;
                const product = Array.isArray(prodRaw) ? prodRaw[0] : prodRaw;

                if (!product) {
                    setError("Product not found.");
                    return;
                }

                setItem(product);

                try {
                    const imgsRes = await productsAPI.getImages(pid);
                    const imgs = imgsRes.data?.success ? imgsRes.data.data : imgsRes.data?.data;
                    setImages(Array.isArray(imgs) ? imgs : []);
                } catch {
                    setImages([]);
                }
            } catch (e) {
                console.error(e);
                setError("Failed to load details. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        run();
    }, [isOfferRoute, pid, oid]);

    const displayPrice = useMemo(() => {
        if (isOfferRoute) {
            const fp = Number(offerMeta?.final_price ?? offerMeta?.price ?? offerMeta?.product_price ?? 0);
            return `${fp.toFixed(2)} DH`;
        }
        const p = Number(item?.price ?? 0);
        return `${p.toFixed(2)} DH`;
    }, [isOfferRoute, item, offerMeta]);

    const displayDescription = useMemo(() => {
        if (!item && !offerMeta) return "";

        // جرّب حقول محتملة فالمنتج
        const pDesc =
            item?.description ||
            item?.desc ||
            item?.details ||
            item?.product_description ||
            "";

        // جرّب حقول محتملة فالعرض
        const oDesc =
            offerMeta?.description ||
            offerMeta?.desc ||
            offerMeta?.details ||
            "";

        // إذا كان offer route و product description خاوية → خد ديال offer
        return (pDesc && pDesc.trim()) ? pDesc : oDesc;
    }, [item, offerMeta]);

    const currentImageSrc = useMemo(() => {
        if (!item) return '/assets/hero-2.png';

        if (images.length > 0) {
            const img = images[selectedImage];

            if (img?.__from === "offer") return imgFromOffer(offerMeta);

            if (img?.image_path) return `${API_BASE}/uploads/products/${img.image_path}`;
        }

        if (offerMeta && !offerMeta.product_id) return imgFromOffer(offerMeta);

        return imgFromProduct(item);
    }, [item, images, selectedImage, offerMeta]);

    const onAddToCart = () => {
        if (isOfferRoute) {
            const offerId = Number(offerMeta?.id || oid || 0);
            if (!offerId) return;

            const cartItem = {
                id: `offer-${offerId}`,          // ✅ key واضح
                offer_id: offerId,
                product_id: offerMeta?.product_id ? Number(offerMeta.product_id) : null,

                name: offerMeta?.title || item?.name || "Offer",
                description: offerMeta?.description || "",
                price: Number(offerMeta?.final_price ?? offerMeta?.price ?? offerMeta?.product_price ?? 0),

                product_type: offerMeta?.offer_type || item?.product_type || "office",
                __type: "offer",
                image_path: offerMeta?.image_path || null,
                discount_percentage: offerMeta?.discount_percentage || 0,
            };

            try { addToCart(cartItem, quantity); } catch { addToCart(cartItem); }
            return showToast("Offer added to cart ✅");
        }

        // product route
        try { addToCart(item, quantity); } catch { addToCart(item); }
        showToast("Added to cart ✅");
    };

    const buildCheckoutUrl = ({ product_id = null, offer_id = null, quantity = 1 }) => {
        const params = new URLSearchParams();
        if (product_id) params.set("product_id", String(product_id));
        if (offer_id) params.set("offer_id", String(offer_id));
        params.set("qty", String(Math.max(1, Number(quantity || 1))));
        return `/checkout?${params.toString()}`;
    };

    const handleOrderNow = () => {
        const qty = Math.max(1, Number(quantity || 1));

        // ✅ OFFER ROUTE
        if (isOfferRoute) {
            const offerId = Number(offerMeta?.id || oid || 0);
            if (!offerId) return;

            // offer linked to product
            if (offerMeta?.product_id) {
                const productId = Number(offerMeta.product_id || 0);
                if (!productId) return;

                // ✅ link قابل يجي من instagram
                return navigate(buildCheckoutUrl({ product_id: productId, offer_id: offerId, quantity: qty }));
            }

            // offer standalone
            return navigate(buildCheckoutUrl({ offer_id: offerId, quantity: qty }));
        }

        // ✅ PRODUCT ROUTE
        const productId = Number(pid || item?.id || 0);
        if (!productId) return;

        // ✅ link قابل يجي من instagram
        return navigate(buildCheckoutUrl({ product_id: productId, quantity: qty }));
    };
    const originalPrice = useMemo(() => {
        if (!isOfferRoute) return null;

        return (
            Number(offerMeta?.product_price) ||
            Number(offerMeta?.price) ||
            Number(item?.price) ||
            null
        );
    }, [isOfferRoute, offerMeta, item]);

    const discountedPrice = useMemo(() => {
        if (!isOfferRoute) return null;

        const price =
            Number(offerMeta?.product_price) ||
            Number(offerMeta?.price) ||
            Number(item?.price) ||
            0;

        const discount = Number(offerMeta?.discount_percentage) || 0;

        if (!discount) return price;

        return price - (price * discount / 100);
    }, [isOfferRoute, offerMeta, item]);

    if (loading) {
        return (
            <main className="pd-page">
                <div className="pd-shell">
                    <div className="pd-loading">Loading...</div>
                </div>
            </main>
        );
    }

    if (error || !item) {
        return (
            <main className="pd-page">
                <div className="pd-shell">
                    <button className="pd-back" type="button" onClick={() => navigate(-1)}>
                        <i className="fas fa-arrow-left" /> Back
                    </button>
                    <div className="pd-error">
                        <h2>Oops</h2>
                        <p>{error || "Not found"}</p>
                        <Link to="/products/office" className="pd-btn pd-btn-primary">
                            Go to products
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="pd-page">
            <div className="pd-shell">
                {/* Top bar */}
                <div className="pd-top">
                    <button className="pd-back" type="button" onClick={() => navigate(-1)}>
                        <i className="fas fa-arrow-left" /> Back
                    </button>

                    <div className="pd-tags">
                        {item.product_type && (
                            <span className="pd-pill">
                                {item.product_type === "printing" ? "Printing" : "Office"}
                            </span>
                        )}

                        {item.category_name && <span className="pd-pill pd-pill-soft">{item.category_name}</span>}

                        {offerMeta?.discount_percentage && Number(offerMeta.discount_percentage) > 0 && (
                            <span className="pd-pill pd-pill-accent">-{offerMeta.discount_percentage}% OFF</span>
                        )}
                    </div>
                </div>

                {/* Layout */}
                <section className="pd-grid">
                    {/* Gallery */}
                    <div className="pd-gallery">
                        {/* ✅ Thumbs (صغار كاملين) */}
                        {images.length > 0 && (
                            <div className="pd-thumbs pd-thumbs-top">
                                {images.map((img, idx) => {
                                    const src =
                                        img?.__from === "offer"
                                            ? imgFromOffer(offerMeta)
                                            : img?.image_path
                                                ? `${API_BASE}/uploads/products/${img.image_path}`
                                                : imgFromProduct(item);

                                    return (
                                        <button
                                            key={img.id || idx}
                                            type="button"
                                            className={`pd-thumb ${idx === selectedImage ? "active" : ""}`}
                                            onClick={() => setSelectedImage(idx)}
                                            title="View image"
                                        >
                                            <img src={src} alt={`${item.name || "Product"} ${idx + 1}`} />
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* ✅ Main image (كبيرة) */}
                        <div className="pd-mainimg">
                            <img src={currentImageSrc} alt={item.name || item.title || "Product"} />
                        </div>
                    </div>


                    {/* Content */}
                    <div className="pd-info">
                        <h1 className="pd-title">{item.name || item.title}</h1>

                        {offerMeta?.title && offerMeta?.product_id && (
                            <p className="pd-offerline">
                                Offer: <strong>{offerMeta.title}</strong>
                            </p>
                        )}

                        <div className="pd-priceRow">

                            {/* ✅ PRODUCT NORMAL */}
                            {!isOfferRoute && (
                                <div className="pd-price">{displayPrice}</div>
                            )}

                            {/* ✅ OFFER ROUTE */}
                            {isOfferRoute && (
                                <>
                                    {originalPrice && originalPrice !== discountedPrice && (
                                        <div className="pd-price pd-price-old">
                                            {originalPrice.toFixed(2)} DH
                                        </div>
                                    )}

                                    <div className="pd-price pd-price-new">
                                        {discountedPrice.toFixed(2)} DH
                                    </div>
                                </>
                            )}
                            {offerMeta?.end_date && (
                                <div className="pd-note">
                                    Ends: {new Date(offerMeta.end_date).toLocaleDateString()}
                                </div>
                            )}
                        </div>

                        <p className="pd-desc">
                            {displayDescription.length <= 250
                                ? displayDescription
                                : expanded
                                    ? displayDescription
                                    : displayDescription.slice(0, 250)}

                            {displayDescription.length > 250 && !expanded && (
                                <>
                                    ...{" "}
                                    <span
                                        className="pd-more"
                                        onClick={() => setExpanded(true)}
                                    >
                                        plus
                                    </span>
                                </>
                            )}
                        </p>
                        {/* Actions */}
                        {/* Actions */}
                        <div className="pd-actions">
                            <div className="pd-qty">
                                <span>Qty</span>
                                <div className="pd-qtyCtrls">
                                    <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>−</button>
                                    <input
                                        value={quantity}
                                        onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                                        type="number"
                                        min="1"
                                    />
                                    <button type="button" onClick={() => setQuantity((q) => q + 1)}>+</button>
                                </div>
                            </div>

                            <div className="pd-actionBtns">
                                <button className="pd-btn pd-btn-primary" type="button" onClick={onAddToCart}>
                                    <i className="fas fa-cart-plus" /> Add to cart
                                </button>

                                {/* ✅ Order Now */}

                                <button
                                    className="pd-btn pd-btn-outline"
                                    type="button"
                                    onClick={handleOrderNow}
                                >
                                    <i className="fas fa-bolt" /> Order Now
                                </button>

                            </div>
                        </div>


                        {/* Extra info box */}
                        <div className="pd-box">
                            <h3>Details</h3>
                            <ul>
                                <li>
                                    <strong>Type:</strong>{" "}
                                    {item.product_type ? (item.product_type === "printing" ? "Printing" : "Office") : "—"}
                                </li>
                                <li>
                                    <strong>Category:</strong> {item.category_name || "—"}
                                </li>
                                <li>
                                    <strong>Price:</strong>{" "}

                                    {!isOfferRoute && (
                                        <span>{displayPrice}</span>
                                    )}

                                    {isOfferRoute && (
                                        <>


                                            <span style={{ fontWeight: "bold", color: "#100c0c" }}>
                                                {discountedPrice.toFixed(2)} DH
                                            </span>
                                        </>
                                    )}
                                </li>
                                {offerMeta?.offer_mode && (
                                    <li>
                                        <strong>Offer mode:</strong>{" "}
                                        {offerMeta.offer_mode === "product" ? "Linked to product" : "Standalone"}
                                    </li>
                                )}
                            </ul>
                        </div>

                        {toast && <div className="pd-toast">{toast}</div>}
                    </div>
                </section>
            </div >
        </main >
    );
};

export default ProductDetails;

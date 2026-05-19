import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import productsAPI from "../api/products.api";
import "../styles/carousel.css";

const ProductsCarousel = ({
    type = "office",
    title = " Office Products",
    limit = 10,
    viewAllLink = null,
}) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const trackRef = useRef(null);

    const UPLOADS = useMemo(() => "https://allofice.xo.je/api/uploads/products/"
        , []);
    const slugify = (s = "") =>
        s.toString().trim().toLowerCase()
            .replace(/[\s_]+/g, "-")
            .replace(/[^a-z0-9-]/g, "")
            .replace(/-+/g, "-");

    const detailsPath = ({ type, categoryName, categoryId, productName, productId }) => {
        const catSlug = slugify(categoryName || "category");
        const catId = Number(categoryId) || 0;

        const pSlug = slugify(productName || "product");
        const pId = Number(productId) || 0;

        return `/products_details/${type}/${catSlug}-${catId}/${pSlug}-${pId}`;
    };

    useEffect(() => {
        let mounted = true;

        const load = async () => {
            try {
                setLoading(true);
                const res = await productsAPI.getProducts({ type, limit, offset: 0 });
                if (!mounted) return;

                if (res.data?.success) setItems(res.data.data || []);
                else setItems([]);
            } catch (e) {
                console.log(e);
                if (mounted) setItems([]);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        load();
        return () => {
            mounted = false;
        };
    }, [type, limit]);

    const scrollByCards = (dir = "right") => {
        const el = trackRef.current;
        if (!el) return;

        const card = el.querySelector(".ao-card");
        const cardWidth = card ? card.getBoundingClientRect().width : 260;
        const gap = 16; // must match CSS gap
        const amount = cardWidth + gap;

        el.scrollBy({
            left: dir === "left" ? -amount * 2 : amount * 2,
            behavior: "smooth",
        });
    };

    if (loading) {
        return (
            <section className="ao-carousel">
                <div className="ao-carousel__head">
                    <h2 className="ao-carousel__title">{title}</h2>
                    <div className="ao-skeleton-pill" />
                </div>
                <div className="ao-skeleton-row">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="ao-skeleton-card" />
                    ))}
                </div>
            </section>
        );
    }

    if (!items.length) return null;

    return (
        <section className="ao-carousel">
            <div className="ao-carousel__head">
                <h2 className="ao-carousel__title">{title}</h2>

                <Link
                    className="ao-carousel__link"
                    to={viewAllLink || `/products/${type}`}

                >
                    View all
                    <span className="ao-arrow">→</span>
                </Link>
            </div>

            <div className="ao-carousel__wrap">
                <button
                    className="ao-nav ao-nav--left"
                    onClick={() => scrollByCards("left")}
                    aria-label="Scroll left"
                    type="button"
                >

                </button>

                <div className="ao-track" ref={trackRef}>
                    {items.map((p) => {
                        const img = p.main_image
                            ? `${UPLOADS}${p.main_image}`
                            : "https://via.placeholder.com/480x480?text=ALLOFFICE";

                        return (
                            <article key={p.id} className={`ao-card ${p.quantity <= 0 ? 'ao-card--disabled' : ''}`}>
                                <Link
                                    to={p.quantity > 0 ? detailsPath({
                                        type: p.product_type || type,
                                        categoryName: p.category_name || "category",
                                        categoryId: p.category_id || 0,
                                        productName: p.name,
                                        productId: p.id,
                                    }) : '#'}
                                    className="ao-card__link"
                                >
                                    <div className="ao-card__media">
                                        <img src={img} alt={p.name} loading="lazy" />
                                        {/* badge مثال (اختياري): */}
                                        {/* <span className="ao-badge">New</span> */}
                                        {p.quantity <= 0 && <span className="ao-badge ao-badge--sold">Out of stock</span>}

                                    </div>

                                    <div className="ao-card__body">
                                        <h3 className="ao-card__name"> {(p.name || '...').length > 20
                                                    ? (p.name).slice(0, 20) + '…'
                                                    : p.name}</h3>

                                        <p className="ao-card__meta">
                                            <span className="ao-card__cat">
                                                 {(p.category_name || '...').length > 20
                                                    ? (p.category_name).slice(0, 20) + '…'
                                                    : p.category_name}
                                            </span>
                                            <span className="ao-dot">•</span>
                                            <span className="ao-card__type">{p.product_type}</span>
                                        </p>

                                        <div className="ao-card__foot">
                                            <span className="ao-card__price">{p.price} DH</span>
                                            <span className="ao-card__cta">
                                                Details <span className="ao-arrow">→</span>
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            </article>
                        );
                    })}
                </div>

                <button
                    className="ao-nav ao-nav--right"
                    onClick={() => scrollByCards("right")}
                    aria-label="Scroll right"
                    type="button"
                >

                </button>
            </div>
        </section>
    );
};

export default ProductsCarousel;

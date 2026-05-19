import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import offersAPI from "../api/offers.api";
import "../styles/offers.css";

const API_BASE = "https://allofice.xo.je/api";

const slugify = (s = "") =>
  s
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-");

const offerLink = (o) => `/products_details/offer/${slugify(o.title)}-${o.id}`;

const Offers = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // pagination
  const [page, setPage] = useState(1);
  const limit = 12;

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        setLoading(true);
        setError("");

        const offset = (page - 1) * limit;

        const res = await offersAPI.getOffers({ limit, offset })
          ;

        if (res.data?.success) setOffers(res.data.data || []);
        else setOffers(res.data?.data || []);
      } catch (e) {
        console.error(e);
        setError("Failed to load offers. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
  }, [page]);

  const totalShownText = useMemo(() => {
    if (loading) return "Loading...";
    if (offers.length === 0) return "0 offers";
    return `${offers.length} offers`;
  }, [offers.length, loading]);

  const imgSrc = (o) => {
    if (o?.image_path) return `${API_BASE}/uploads/offers/${o.image_path}`;
    return "https://via.placeholder.com/800x600?text=ALLOFFICE+OFFER";
  };

  const badgeText = (o) => {
    if (o?.discount_percentage && Number(o.discount_percentage) > 0) {
      return `-${o.discount_percentage}%`;
    }
    return "OFFER";
  };

  return (
    <main className="offers-page">
      {/* HERO */}
      <div className="offers-hero">
        <div className="offers-hero-inner">
          <div className="offers-hero-left">
            <h1 className="offers-title">Special Offers</h1>
            <p className="offers-subtitle">
              Discover limited-time deals on office supplies and printing services.
            </p>

            <div className="offers-meta">
              <span className="meta-pill">{totalShownText}</span>
              <span className="meta-pill meta-pill-accent">Updated regularly</span>
            </div>
          </div>

          <div className="offers-hero-right">
            <Link to="/products/office" className="pill-btn">
              Shop Office
            </Link>
            <Link to="/products/printing" className="pill-btn pill-btn-ghost">
              Shop Printing
            </Link>
          </div>
        </div>
      </div>

      <div className="offers-shell">
        {error && <div className="alert">{error}</div>}

        {loading ? (
          <div className="offers-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="offer-card skeleton">
                <div className="offer-image" />
                <div className="offer-info">
                  <div className="sk-line w-70" />
                  <div className="sk-line w-45" />
                  <div className="sk-line w-90" />
                </div>
              </div>
            ))}
          </div>
        ) : offers.length === 0 ? (
          <div className="empty-state">
            <h3>No offers available</h3>
            <p>Come back later for new deals.</p>
            <Link className="pill-btn pill-btn-ghost" to="/products/office">
              Browse Products
            </Link>
          </div>
        ) : (
          <>
            <div className="offers-grid">
              {offers.map((o) => {
                const isSoldOut =
                  (o.offer_mode === "product" && Number(o.product_quantity) <= 0) ||
                  (o.offer_mode === "other" && Number(o.quantity) <= 0);
                return (
                  <article
                    key={o.id}
                    className={`offer-card ${isSoldOut ? "offer-card--soldout" : ""}`}
                  >
                    {isSoldOut ? (
                      <div className="product-image-wrap">
                        <img src={imgSrc(o)} alt={o.title} loading="lazy" />

                        {isSoldOut && (
                          <span className="stock-badge">
                            OUT OF STOCK
                          </span>
                        )}
                        {o.offer_type && (
                          <span className="type-badge">
                            {o.offer_type === "printing" ? "Printing" : "Office"}
                          </span>
                        )}
                      </div>

                    ) : (

                      <Link to={offerLink(o)} className="offer-image-wrap">
                        <img src={imgSrc(o)} alt={o.title} loading="lazy" />

                        <span className="discount-badge">{badgeText(o)}</span>

                        {o.offer_type && (
                          <span className="type-badge">
                            {o.offer_type === "printing" ? "Printing" : "Office"}
                          </span>
                        )}
                      </Link>
                    )}

                    <div className="offer-info">
                      <h3 className="offer-title"> {(o.title || '...').length > 20
                        ? (o.title).slice(0, 20) + '…'
                        : o.title}</h3>

                      <div className="offer-meta-row">
                        <span className="offer-mode">
                          {o.offer_mode === "product" ? "Linked to product" : "Standalone"}
                        </span>

                        {o.price ? (
                          <span className="offer-price">{o.price} DH</span>
                        ) : o.product_price ? (
                          <span className="offer-price">{o.product_price} DH</span>
                        ) : (
                          <span className="offer-price"></span>
                        )}
                      </div>

                      <p className="offer-desc">
                        {(o.description || 'No description provided.').length > 40
                          ? (o.description).slice(0, 40) + '…'
                          : o.description}
                      </p>

                      <div className="offer-actions">
                        {!isSoldOut && (
                          <Link to={offerLink(o)} className="btn-primary">
                            View Offer
                          </Link>
                        )}

                        <Link
                          to={o.offer_type === "printing" ? "/products/printing" : "/products/office"}
                          className="btn-secondary"
                        >
                          Browse {o.offer_type === "printing" ? "Printing" : "Office"}
                        </Link>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>

            {/* Pagination */}
            <div className="pager">
              <button
                type="button"
                className="pager-btn"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <i className="fas fa-chevron-left"></i> Prev
              </button>

              <span className="pager-page">Page {page}</span>

              <button
                type="button"
                className="pager-btn"
                disabled={offers.length < limit}
                onClick={() => setPage((p) => p + 1)}
              >
                Next <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
};

export default Offers;

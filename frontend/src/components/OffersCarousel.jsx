import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import offersAPI from "../api/offers.api";
import "../styles/carousel.css";

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

const offerImg = (offer) => {
  if (offer?.image_path) return `${API_BASE}/uploads/offers/${offer.image_path}`;
  return "https://via.placeholder.com/800x600?text=ALLOFFICE+Offer";
};
const OffersCarousel = ({ title = "Latest Offers", limit = 10 }) => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ ref بدل querySelector باش ما يوقعش مشكل فكثر من carousel
  const trackRef = useRef(null);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        setLoading(true);
        const res = await offersAPI.getOffers({ limit, offset: 0 })
          ;
        if (res.data?.success) setOffers(res.data.data || []);
        else setOffers(res.data?.data || []);
      } catch (e) {
        console.error("Error fetching offers:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
  }, [limit]);

  const scroll = (dir) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -340 : 340, behavior: "smooth" });
  };

  if (loading) {
    return (
      <section className="ao-carousel">
        <div className="ao-carousel__head">
          <h2 className="ao-carousel__title">{title}</h2>
          <span className="ao-skeleton-pill" />
        </div>

        <div className="ao-skeleton-row">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="ao-skeleton-card" />
          ))}
        </div>
      </section>
    );
  }

  if (offers.length === 0) return null;

  return (
    <section className="ao-carousel">
      <div className="ao-carousel__head">
        <h2 className="ao-carousel__title">{title}</h2>

        <Link to="/offers" className="ao-carousel__link">
          View All <span className="ao-arrow">→</span>
        </Link>
      </div>

      <div className="ao-carousel__wrap">
        <button
          className="ao-nav ao-nav--left"
          onClick={() => scroll("left")}
          type="button"
          aria-label="Scroll left"
        >

        </button>

        <div className="ao-track" ref={trackRef}>
          {offers.map((offer) => {
            const typeLabel = offer.offer_type === "printing" ? "Printing" : "Office";
            const modeLabel = offer.offer_mode === "product" ? "Product Offer" : "Special Offer";
            const hasDiscount = Number(offer.discount_percentage) > 0;
            const priceAfterDiscount = Number(offer.price || 0) * (1 - (Number(offer.discount_percentage || 0) / 100));

            return (
              <div key={offer.id} className={`ao-card ${offer.quantity <= 0 ? 'ao-card--disabled' : ''}`}>
                <Link to={offer.quantity > 0 ? offerLink(offer) : '#'} className={`ao-card__link ${offer.quantity <= 0 ? 'disabled-link' : ''}`}>
                  <div className="ao-card__media">
                    <img src={offerImg(offer)} alt={offer.title} loading="lazy" />

                    {/* badge discount */}
                    {hasDiscount && (
                      <span className="ao-badge ao-badge--discount">-{offer.discount_percentage}%</span>
                    )}

                    {/* badge sold out */}
                    {offer.quantity !== undefined && offer.quantity <= 0 && (
                      <span className="ao-badge ao-badge--sold">Out of stock</span>
                    )}
                  </div>

                  <div className="ao-card__body">
                    <h3 className="ao-card__name">
                       {(offer.title || '...').length > 20
                                                    ? (offer.title).slice(0, 20) + '…'
                                                    : offer.title}
                    </h3>

                    <div className="ao-card__meta">
                      <span>{typeLabel}</span>
                      <span className="ao-dot">•</span>
                      <span>{modeLabel}</span>
                    </div>

                    <div className="ao-card__foot">
                      {/* original price small */}
                      {offer.price && (
                        <div className="ao-card__price ao-card__price--original">
                          {offer.price} DH
                        </div>
                      )}

                      {/* discounted price bigger */}
                      {offer.price && (
                        <div className="ao-card__price ao-card__price--discount">
                          {Math.round(priceAfterDiscount)} DH
                        </div>
                      )}

                      <div className="ao-card__cta">
                        View <i className="fas fa-arrow-right"></i>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>

        <button
          className="ao-nav ao-nav--right"
          onClick={() => scroll("right")}
          type="button"
          aria-label="Scroll right"
        >
        </button>
      </div>
    </section>
  );
};

export default OffersCarousel;

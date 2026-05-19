import React from "react";
import "../styles/about-section.css";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
export default function AboutSection(
  {
    image = "/assets/hero-2.png",
    title = "ALLOFFICE : Everything for your office & printing",
    subtitle = "We provide office supplies, printing services, and fast delivery with a clean, modern shopping experience.",
  }) {
  const navigate = useNavigate();
  const [openInfo, setOpenInfo] = useState(null);
  return (
    <section className="ao-about">
      <div className="ao-about__container">
        <div className="ao-about__content">
          <span className="ao-about__badge">Our Services</span>
          <h2 className="ao-about__title">{title}</h2>
          <p className="ao-about__subtitle">{subtitle}</p>

          <div className="ao-about__grid">

            {/* card 1 */}
            <div
              className="ao-about__card"
              onClick={() => navigate("/products/office")}
            >
              <div className="ao-about__icon">📦</div>
              <h3>Office Products</h3>
              <p>Notebooks, pens, folders, printers...</p>
            </div>

            {/* card 2 */}
            <div
              className="ao-about__card"
              onClick={() => navigate("/products/printing")}
            >
              <div className="ao-about__icon">🖨️</div>
              <h3>Printing Services</h3>
              <p>Business cards, posters, flyers...</p>
            </div>

            {/* card 3 */}
            <div
              className="ao-about__card"
              onClick={() => setOpenInfo("ordering")}
            >
              <div className="ao-about__icon">⚡</div>
              <h3>Fast Ordering</h3>
              <p>Simple checkout with smooth experience.</p>
            </div>

            {/* card 4 */}
            <div
              className="ao-about__card"
              onClick={() => setOpenInfo("quality")}
            >
              <div className="ao-about__icon">✅</div>
              <h3>Quality & Support</h3>
              <p>Trusted quality and quick support.</p>
            </div>

          </div>
        </div>

        <div className="ao-about__visual">
          <div className="ao-about__decor ao-about__decor--one" />
          <div className="ao-about__decor ao-about__decor--two" />

          <div className="ao-about__imageWrap">
            <img src={image} alt="ALLOFFICE services" className="ao-about__image" />
          </div>

          <div className="ao-about__mini">
            <div className="ao-about__miniItem">
              <span className="ao-about__miniNum">100+</span>
              <span className="ao-about__miniText">Products</span>
            </div>
            <div className="ao-about__miniItem">
              <span className="ao-about__miniNum">24/7</span>
              <span className="ao-about__miniText">Access</span>
            </div>
            <div className="ao-about__miniItem">
              <span className="ao-about__miniNum">Top</span>
              <span className="ao-about__miniText">Quality</span>
            </div>
          </div>
        </div>
      </div>
      {openInfo && (
        <div className="ao-modal">
          <div className="ao-modal-content">

            <button
              className="ao-modal-close"
              onClick={() => setOpenInfo(null)}
            >
              ✖
            </button>

            {openInfo === "ordering" && (
              <>
                <h2>Fast Ordering</h2>
                <p>
                  Our platform allows quick ordering without complications.
                  You can buy as guest or user, track your orders,
                  and enjoy a smooth checkout process.
                </p>
              </>
            )}

            {openInfo === "quality" && (
              <>
                <h2>Quality & Support</h2>
                <p>
                  We ensure high quality products with careful packaging.
                  Our team is ready to help you with any issue or question.
                </p>
              </>
            )}

          </div>
        </div>
      )}
    </section>

  );
}

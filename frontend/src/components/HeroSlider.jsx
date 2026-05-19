import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import offersAPI from '../api/offers.api';
import '../styles/sliders.css';
const UnifiedSlider = () => {
    const [offers, setOffers] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);

    const minSwipeDistance = 30;
    const onTouchStart = (e) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;

        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) {
            // slide next
            setCurrentIndex((prev) => (prev + 1) % allSlides.length);
        }

        if (isRightSwipe) {
            // slide prev
            setCurrentIndex((prev) =>
                prev === 0 ? allSlides.length - 1 : prev - 1
            );
        }
    };
    // 1. Fetch Offers from API
    useEffect(() => {
        const fetchOffers = async () => {
            try {
                const response = await offersAPI.getOffers(3, 0); // Get latest 3 offers
                if (response.data.success) {
                    setOffers(response.data.data);
                }
            } catch (err) {
                console.error('Error fetching offers:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchOffers();
    }, []);

    // 2. Prepare all slides (Hero + Offers)

    // ✅ حيد Form من import

    const API_BASE = "https://allofice.xo.je/api/";
    const offerImg = (p) => (p ? `${API_BASE}/uploads/offers/${p}` : "/assets/hero-2.jpg");

    // ...
    const heroSlide = {
        type: 'hero',
        image: '/assets/hero-1.png',
        title: 'Welcome to ALLOFFICE',
        subtitle: 'Everything you need for your office & printing',
        buttonText: 'Create Your Account',
        action: () => navigate('/register')
    };

    const slugify = (s = "") =>
        s
            .toString()
            .trim()
            .toLowerCase()
            .replace(/[\s_]+/g, "-")
            .replace(/[^a-z0-9-]/g, "")
            .replace(/-+/g, "-");

    const offerSlides = offers.slice(0, 3).map(offer => ({
        type: 'offer',
        image: offerImg(offer.image_path),
        title: (offer.title||'...').slice(0,25),
        subtitle: `${offer.discount_percentage}% OFF — ${offer.description.slice(0, 30) + '...'}`,
        buttonText: 'View Offer',
        action: () => navigate(`/products_details/offer/${slugify(offer.title)}-${offer.id}`)
    }));

    const allSlides = [heroSlide, ...offerSlides];

    // 3. Auto-slide logic
    useEffect(() => {
        if (allSlides.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % allSlides.length);
        }, 7000);

        return () => clearInterval(interval);
    }, [allSlides.length]);
    const onMouseDown = (e) => {
        setTouchStart(e.clientX);
    };

    const onMouseUp = (e) => {
        setTouchEnd(e.clientX);

        const distance = touchStart - e.clientX;

        if (distance > minSwipeDistance) {
            setCurrentIndex((prev) => (prev + 1) % allSlides.length);
        }

        if (distance < -minSwipeDistance) {
            setCurrentIndex((prev) =>
                prev === 0 ? allSlides.length - 1 : prev - 1
            );
        }
    };
    if (loading) return <div className="slider-loader"><i className="fas fa-spinner fa-spin"></i></div>;

    return (
        <section
            className="unified-slider"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onMouseDown={onMouseDown}
            onMouseUp={onMouseUp}
        >            {allSlides.map((slide, index) => (
            <div
                key={index}
                className={`slide-item ${index === currentIndex ? 'active' : ''}`}
                style={{ backgroundImage: `url(${slide.image})` }}
            >
                <div className="slide-overlay" />

                <div className="slide-content">
                    {slide.type === 'offer' && <span className="offer-badge">Special Offer</span>}
                    <h1 className="slide-title">{slide.title}</h1>
                    <p className="slide-subtitle">{slide.subtitle}</p>

                    {/* Only show button for Hero (if not auth) or for all Offers */}
                    <div className="slide-actions">
                        {(slide.type === 'offer' || (slide.type === 'hero' && !isAuthenticated)) && (
                            <button className="slide-btn primary" onClick={slide.action}>
                                {slide.buttonText} <i className="fas fa-arrow-right"></i>
                            </button>
                        )}


                    </div>

                </div>
            </div>
        ))}

            {/* Navigation Dots */}
            {allSlides.length > 1 && (
                <div className="slider-dots">
                    {allSlides.map((_, index) => (
                        <button
                            key={index}
                            className={`dot ${index === currentIndex ? 'active' : ''}`}
                            onClick={() => setCurrentIndex(index)}
                        ></button>
                    ))}
                </div>
            )}

        </section>
    );
};

export default UnifiedSlider;
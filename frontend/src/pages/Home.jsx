import React from 'react';
import HeroSlider from '../components/HeroSlider';
import ProductsCarousel from '../components/ProductsCarousel';
import PrintingCarousel from '../components/PrintingCarousel';
import OffersCarousel from '../components/OffersCarousel';
import AboutSection from '../components/AboutSection';
import ZigzagShowcase from '../components/ZigzagShowcase';
const Home = () => {
    return (
        <main className="container">
            <HeroSlider />
            <ZigzagShowcase />
            <ProductsCarousel type="office" title="Latest Office Products" />
            <PrintingCarousel />
            <OffersCarousel />
            <AboutSection image={"/assets/hero-2.png"} />

        </main>
    );
};

export default Home;

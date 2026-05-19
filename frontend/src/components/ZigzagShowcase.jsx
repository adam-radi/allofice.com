import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

// ✅ استعمل APIs ديالك إذا عندك نفس الأسماء
import productsAPI from "../api/products.api";
import offersAPI from "../api/offers.api";

import "../styles/zigzagShowcase.css";

// ✅ نفس السياق ديالك
const API_BASE = "https://allofice.xo.je/api";

// ✅ يجيب origin باش نبنيو image urls


export default function ZigzagShowcase() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  // ✅ “featured” item لكل نوع
  const [officeFeatured, setOfficeFeatured] = useState(null);
  const [printingFeatured, setPrintingFeatured] = useState(null);
  const [offerFeatured, setOfferFeatured] = useState(null);

  // ✅ قائمة صغيرة “من نفس النوع” (اختياري)
  const [officeList, setOfficeList] = useState([]);
  const [printingList, setPrintingList] = useState([]);
  const [offersList, setOffersList] = useState([]);

  const goProductDetails = (type) => {
   

    // ✅ نفس route اللي كنت كتستعمل: /products_details/:type/:catSlug-:catId/:productSlug-:productId
    navigate(`/products/${type}`);
  };

  const goOffersPage = () => {
    // ✅ بدلها بالroute اللي عندك فمشروعك
    navigate(`/offers`);
  };

  useEffect(() => {
    let alive = true;

    const run = async () => {
      try {
        setLoading(true);

        // ✅ 1) office products (خد أول واحد + شوية لائحة)
        // إذا عندك filter بالـ type فـ backend خليه، إلا ماعندكش نقدروا نعدلو بعد
        const officeRes = await productsAPI.getProducts({ type: "office", limit: 6, offset: 0 });
        const officeData = officeRes?.data?.products || officeRes?.data || [];
        const officeArr = Array.isArray(officeData) ? officeData : [];

        // ✅ 2) printing products
        const printingRes = await productsAPI.getProducts({ type: "printing", limit: 6, offset: 0 });
        const printingData = printingRes?.data?.products || printingRes?.data || [];
        const printingArr = Array.isArray(printingData) ? printingData : [];

        // ✅ 3) offers
        const offersRes = await offersAPI.getOffers({ limit: 6, offset: 0 });
        const offersData = offersRes?.data?.offers || offersRes?.data || [];
        const offersArr = Array.isArray(offersData) ? offersData : [];

        if (!alive) return;

        setOfficeFeatured(officeArr[0] || null);
        setPrintingFeatured(printingArr[0] || null);
        setOfferFeatured(offersArr[0] || null);
        
        setOfficeList(officeArr.slice(0, 5));
        setPrintingList(printingArr.slice(0, 5));
        setOffersList(offersArr.slice(0, 5));
        
      } catch (e) {
        console.error("ZigzagShowcase error:", e);
      } finally {
        if (alive) setLoading(false);
      }
    };

    run();
    return () => {
      alive = false;
    };
  }, []);

  const sections = useMemo(() => {
    return [
      {
        id: "office",
        title: "Office Essentials",
        subtitle: "Outils de bureau, tout ce que vous consommez quotitdiennement dans votre bereau ou  votre bibliotheque par exemple  chaise de bureau , bureau , armoire, impression , papier,en un ou en gros",
        featured: "un imprimante et un cartouch",
        list:  "chaise de bureau , bureau , armoire, impression",
        buttonText: "View all",
        onClick: () => goProductDetails("office"),
        image: "/assets/office.png" ,
        reverse: false,
      },
      {
        id: "printing",
        title: "Printing & Supplies",
        subtitle: "Explorez la section Impressions, tout sur l'impression sur demande, comme l'impression sur des vêtements, sur des pots, du papier, des cartes, des offres, des accessoires.",
        featured: "Imprimer sur le sweat",
        list: " l'impression sur des vêtements, sur des pots, du papier, des cartes...",
        buttonText: "View all",
        onClick: () => goProductDetails("printing"),
        image:"/assets/printing.png" ,
        reverse: true,
      },
      {
        id: "offers",
        title: "Special Offers",
        subtitle: "La section des offres est un bureau ou un produit typographique qui se présente sous la forme d'offres avec un temps limité, ou en tant que produits distincts et tout nouveaux en tant qu'offre spéciale...",
        featured:"Offre pour chaise et bureau",
        list:"Packs, remise sur le produit, remise sur l'impression..." ,
        buttonText: "View all",
        onClick: () => goOffersPage(),
        image: "/assets/ofres.png",
        reverse: false,
        isOffer: true,
      },
    ];
  }, []);

  return (
    <section className="zigzag-wrap">
      <div className="zigzag-inner">
        <h2 className="zigzag-heading">Discover ALLOFFICE</h2>
        <p className="zigzag-desc">Vous pouvez rapidement explorer tous nos services en parcourant les articles suivant et vous pouvez choisir ce que vous convient le mieux pour voir les details</p>

        {sections.map((s) => (
          <div
            key={s.id}
            className={`zigzag-row ${s.reverse ? "is-reverse" : ""}`}
          >
            <div className="zigzag-media">
              <div className="zigzag-imgBox">
                {loading ? (
                  <div className="zigzag-skeleton" />
                ) : s.image ? (
                  <img className="zigzag-img" src={s.image} alt={s.title} />
                ) : (
                  <div className="zigzag-emptyImg">No image</div>
                )}
              </div>
            </div>

            <div className="zigzag-content">
              <div className="zigzag-kicker">{s.title}</div>

              <h3 className="zigzag-title">{s.featured}</h3>
              <p className="zigzag-subtitle">{s.subtitle}</p>

              <div className="zigzag-featured">
                <div className="zigzag-featuredTitle">
                  {loading ? "Loading..." : (s.isOffer)}
                </div>

                <div className="zigzag-featuredMeta">
                  {loading ? (
                    ""
                  ) : s.isOffer ? (
                    <>
                      <span className="pill">Offer</span>
                      <span className="meta">Discount: -30 %</span>
                    </>
                  ) : (
                    <>
                      <span className="pill">Product</span>
                      <span className="meta">Stock: infini </span>
                    </>
                  )}
                </div>
              </div>

              <div className="zigzag-listTitle">Top items:</div>
              <ul className="zigzag-list">{s.list}
               
              </ul>

              <button
                className="zigzag-btn"
                onClick={s.onClick}
                disabled={loading }
                type="button"
              >
                {s.buttonText}
                <span className="arrow">→</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

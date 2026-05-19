import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import productsAPI from "../api/products.api";
import categoriesAPI from "../api/categories.api";
import { useCart } from "../context/CartContext";
import "../styles/products.css";

// ✅ عدّل هاد BASE حسب السيرفر ديالك (الأفضل: http://localhost:8000)
const API_BASE = "https://allofice.xo.je/api";

const slugify = (s = "") =>
    s
        .toString()
        .trim()
        .toLowerCase()
        .replace(/[\s_]+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .replace(/-+/g, "-");

const parseCategoryId = (slugId) => {
    if (!slugId) return 0;
    const parts = slugId.split("-");
    const last = parts[parts.length - 1];
    const id = parseInt(last, 10);
    return Number.isNaN(id) ? 0 : id;
};

const buildCategorySlugId = (cat) => `${slugify(cat.slug || cat.name)}-${cat.id}`;

const buildCategorySlugIdFromProduct = (product, categories) => {
    const catId = Number(product?.category_id) || 0;
    if (!catId) return { catSlug: "category", catId: 0 };

    const cat = categories.find((c) => Number(c.id) === catId);
    const catSlug = slugify(cat?.slug || cat?.name || product?.category_name || "category");
    return { catSlug, catId };
};

const buildProductSlugIdFromProduct = (product) => {
    const productId = Number(product?.id) || 0;
    const productSlug = slugify(product?.slug || product?.name || "product");
    return { productSlug, productId };
};

const clampType = (t) => (t === "printing" || t === "office" ? t : "office");

const Products = () => {
    const { type: typeParam, categorySlugId } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();

    const [searchParams] = useSearchParams();
    const urlSearch = searchParams.get("search") || "";

    // URL source of truth
    const urlType = clampType(typeParam);
    const urlCategoryId = parseCategoryId(categorySlugId);
    const isCategoryMode = Boolean(urlCategoryId); // ✅ إلا كاينة category فالـURL = هي اللي خدامة
    const issearchMode = Boolean(urlSearch); // ✅ إلا كاينة category فالـURL = هي اللي خدامة
    const istypeMode = Boolean(urlType); // ✅ إلا كاينة category فالـURL = هي اللي خدامة

    // data
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);

    // ui
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // pagination
    const [page, setPage] = useState(1);
    const limit = 12;

    // reset page when filters change
    useEffect(() => {
        setPage(1);
    }, [urlType, urlCategoryId]);

    // fetch categories once
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await categoriesAPI.getCategories();
                if (res.data?.success) setCategories(res.data.data || []);
                else setCategories(res.data?.data || res.data || []);
            } catch (e) {
                console.error(e);
            }
        };
        fetchCategories();
    }, []);

    // fetch products
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                setError("");

                const offset = (page - 1) * limit;

                const res = await productsAPI.getProducts({
                    type: isCategoryMode || issearchMode ? undefined : urlType,           // ✅ إلا category خدامة => type ماشي خدام
                    category_id: issearchMode ? 0 : urlCategoryId,      // ✅ إلا type خدام => category = 0
                    search: isCategoryMode ? undefined : urlSearch,
                    limit,
                    offset,
                });



                if (res.data?.success) setProducts(Array.isArray(res.data.data) ? res.data.data : []);
                else setProducts(Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : []);
            } catch (e) {
                console.error(e);
                setError("Failed to load products. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();

    }, [urlType, urlCategoryId, urlSearch, page]);

    // helpers
    const activeCategory = useMemo(() => {
        if (!urlCategoryId) return null;
        return categories.find((c) => Number(c.id) === Number(urlCategoryId)) || null;
    }, [categories, urlCategoryId]);

    const totalShownText = useMemo(() => {
        if (loading) return "Loading...";
        if (products.length === 0) return "0 results";
        return `${products.length} results`;
    }, [products.length, loading]);

    // ✅ build URL without search
    const buildPathFromFilters = ({ nextType, nextCategoryId }) => {
        const t = clampType(nextType ?? urlType);
        const cId = Number(nextCategoryId ?? urlCategoryId) || 0;

        let path = `/products/${t}`;

        if (cId) {
            const cat = categories.find((x) => Number(x.id) === Number(cId));
            const slugId = cat ? buildCategorySlugId(cat) : `category-${cId}`;
            path += `/${slugId}`;
        }

        return path;
    };

    // actions
    const onChangeType = (nextType) => {
        if (!nextType) return; // ✅ باش "All Types" مايدير والو
        setPage(1);
        navigate(`/products/${nextType}`); // ✅ كتحيد category من URL => كتولي type mode
    };

    const onChangeCategory = (nextCategoryId) => {
        setPage(1);

        const cId = Number(nextCategoryId) || 0;
        if (!cId) {
            navigate(`/products/${urlType}`); // ✅ رجع type mode
            return;
        }

        const cat = categories.find((x) => Number(x.id) === Number(cId));
        const slugId = cat ? buildCategorySlugId(cat) : `category-${cId}`;

        navigate(`/products/${urlType}/${slugId}`); // ✅ كيبقى type فالـURL ولكن ماكنطبقوش فالفetch
    };


    const clearAll = () => {
        setPage(1);
        navigate(`/products/${urlType}`);
    };

    const imgSrc = (p) => {
        if (p?.main_image) return `${API_BASE}/uploads/products/${p.main_image}`;
        return "https://via.placeholder.com/600x600?text=ALLOFFICE";
    };

    // ✅ details link SEO
    const productLink = (p) => {
        const t = urlType;
        const { catSlug, catId } = buildCategorySlugIdFromProduct(p, categories);
        const { productSlug, productId } = buildProductSlugIdFromProduct(p);

        return `/products_details/${t}/${catSlug}-${catId}/${productSlug}-${productId}`;
    };

    return (
        <main className="products-page">
            {/* HERO */}
            <div className="products-hero">
                <div className="products-hero-inner">
                    <div className="products-hero-left">
                        <h1 className="products-title">
                            {urlType === "printing" ? "Printing Services" : "Office Products"}
                        </h1>

                        <p className="products-subtitle">
                            Clean browsing experience with quick filters and modern layout.
                        </p>

                        <div className="products-meta">
                            <span className="meta-pill">{totalShownText}</span>
                            {activeCategory && (
                                <span className="meta-pill meta-pill-accent">
                                    Category: {activeCategory.name}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="products-hero-right">
                        <button className="pill-btn" onClick={() => onChangeType("office")} type="button">
                            Office
                        </button>
                        <button className="pill-btn" onClick={() => onChangeType("printing")} type="button">
                            Printing
                        </button>
                        <button className="pill-btn pill-btn-ghost" onClick={clearAll} type="button">
                            Reset
                        </button>
                    </div>
                </div>
            </div>

            {/* ✅ FILTERS TOP (2 columns in one row) */}
            <div className="products-shell">
                <div className="filters-card">
                    <div className="filters-head">
                        <h3>Filters</h3>
                        <button className="link-btn" onClick={clearAll} type="button">
                            Clear
                        </button>
                    </div>

                    {/* ✅ سطر واحد: نص Type / نص Category */}
                    <div className="filters-grid">
                        {/* TYPE */}
                        <div className="filter-group">
                            <label>Type</label>
                            <select value={isCategoryMode ? "" : urlType} onChange={(e) => onChangeType(e.target.value)}>
                                <option value="" disabled>All Types</option>
                                <option value="office">Office Supplies</option>
                                <option value="printing">Printing Services</option>
                            </select>

                        </div>

                        {/* CATEGORY */}
                        <div className="filter-group">
                            <label>Category</label>
                            <select
                                value={isCategoryMode ? (urlCategoryId || 0) : 0}
                                onChange={(e) => onChangeCategory(Number(e.target.value) || 0)}
                            >
                                <option value={0}>All Categories</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* ✅ chips تحت filters */}
                    {categories.length > 0 && (
                        <div className="chips">
                            {categories.slice(0, 10).map((cat) => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    className={`chip ${Number(urlCategoryId) === Number(cat.id) ? "active" : ""}`}
                                    onClick={() => onChangeCategory(cat.id)}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* PRODUCTS */}
                <section className="products-main">
                    {error && <div className="alert">{error}</div>}

                    {loading ? (
                        <div className="products-grid">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="product-card skeleton">
                                    <div className="product-image" />
                                    <div className="product-info">
                                        <div className="sk-line w-70" />
                                        <div className="sk-line w-45" />
                                        <div className="sk-line w-90" />
                                        <div className="sk-line w-60" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : products.length === 0 ? (
                        <div className="empty-state">
                            <h3>No products found</h3>
                            <p>Try changing Type or Category.</p>
                            <button className="pill-btn pill-btn-ghost" onClick={clearAll} type="button">
                                Reset Filters
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="products-grid">
                                {products.map((product) => {
                                    const isSoldOut = Number(product.quantity) <= 0;
                                    return (

                                        <article key={product.id} className={`product-card ${isSoldOut ? "product-card--soldout" : ""}`}>
                                            {isSoldOut ? (
                                                <div className="product-image-wrap">
                                                    <img src={imgSrc(product)} alt={product.name} loading="lazy" />
                                                    {isSoldOut && (
                                                        <span className="stock-badge">
                                                            OUT OF STOCK
                                                        </span>
                                                    )}
                                                    {product.product_type && (
                                                        <span className="type-badge">
                                                            {product.product_type === "printing" ? "Printing" : "Office"}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (

                                                <Link to={productLink(product)} className="product-image-wrap">
                                                    <img src={imgSrc(product)} alt={product.name} loading="lazy" />
                                                    {isSoldOut && (
                                                        <span className="stock-badge">
                                                            OUT OF STOCK
                                                        </span>
                                                    )}
                                                    {product.product_type && (
                                                        <span className="type-badge">
                                                            {product.product_type === "printing" ? "Printing" : "Office"}
                                                        </span>
                                                    )}
                                                </Link>
                                            )}

                                            <div className="product-info"><h3 className="product-name">
                                                {(product.name || '...').length > 20
                                                    ? (product.name).slice(0, 20) + '…'
                                                    : product.name}
                                            </h3>
                                                <div className="product-meta-row">
                                                    <span className="product-cat">{product.category_name || "..."}</span>
                                                    <span className="product-price">{product.price} DH</span>
                                                </div>

                                                <p className="product-desc">
                                                     {(product.description || '...').length > 40
                                                    ? (product.description).slice(0, 40) + '…'
                                                    : product.description}
                                                </p>

                                                <div className="product-actions">
                                                    <Link to={productLink(product)} className="btn-primary">
                                                        More Info <i className="fas fa-arrow-right"></i>
                                                    </Link>

                                                    {/* ✅ بدل Same Category -> Add To Cart */}
                                                    <button
                                                        type="button"
                                                        className="btn-secondary"
                                                        onClick={() => !isSoldOut && addToCart(product)}
                                                        disabled={isSoldOut}
                                                    >
                                                        <i className="fas fa-cart-plus"></i> Add to Cart
                                                    </button>
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
                                    disabled={products.length < limit}
                                    onClick={() => setPage((p) => p + 1)}
                                >
                                    Next <i className="fas fa-chevron-right"></i>
                                </button>
                            </div>
                        </>
                    )}
                </section>
            </div>
        </main>
    );
};

export default Products;

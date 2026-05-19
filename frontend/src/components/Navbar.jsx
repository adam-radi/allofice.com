import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import categoriesAPI from '../api/categories.api';
import ordersAPI from '../api/orders.api';
import '../styles/navbar.css';


const slugify = (s = '') =>
    s
        .toString()
        .trim()
        .toLowerCase()
        .replace(/[\s_]+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-');

const Navbar = () => {
    const { user, isAuthenticated, logout } = useAuth();
    const isAdmin = isAuthenticated && user?.role === "admin";
    // كافي
    const { getTotalItems } = useCart();
    const navigate = useNavigate();
    const location = useLocation();


    const [categories, setCategories] = useState([]);
    const [showProductsMenu, setShowProductsMenu] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState(null);
    const [showHamburger, setShowHamburger] = useState(false);

    // ✅ type الافتراضي
    const [activeType, setActiveType] = useState('office');


    const [pendingOrders, setPendingOrders] = useState(0);

    useEffect(() => {
        if (isAdmin) fetchPendingOrders();
    }, [isAdmin]);

    const fetchPendingOrders = async () => {
        try {
            const res = await ordersAPI.getPendingOrdersCount();
            if (res.success) setPendingOrders(res.data.count || 0);
        } catch (e) {
            console.error("Failed fetching pending orders", e);
        }
    };
    // ✅ نحدد activeType من URL إلا كان /products/:type...
    useEffect(() => {
        const parts = location.pathname.split('/').filter(Boolean);
        if (parts[0] === 'products' && (parts[1] === 'office' || parts[1] === 'printing')) {
            setActiveType(parts[1]);
        }
    }, [location.pathname]);

    // Fetch categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await categoriesAPI.getCategories();
                const data = res.data?.data ?? res.data ?? [];
                setCategories(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error('Failed to fetch categories', error);
            }
        };
        fetchCategories();
    }, []);

    const safeCategories = Array.isArray(categories) ? categories : [];


    const handleLogout = async () => {
        try {
            await logout();
            setShowHamburger(false);
            navigate('/');
        } catch (error) {
            console.error('Logout failed', error);
        }
    };

    // ✅ Search على structure الجديد
    const handleSearch = (e) => {
        if (e) e.preventDefault();
        const q = searchQuery.trim();
        if (!q) return;

        navigate(`/products/${activeType}?search=${encodeURIComponent(q)}`);
        setSearchQuery('');
        setShowHamburger(false);
    };

    // ✅ Category على structure الجديد
    const handleCategoryClick = (cat) => {
        const base = slugify(cat.slug || cat.name) || "category";
        const slugId = `${base}-${cat.id}`;

        setActiveCategory(cat.id);
        setShowHamburger(false);
        navigate(`/products/${activeType}/${slugId}`);
    };

    // ✅ Type pages

    const isAdminNav = isAdmin;

    return (
        <nav className="navbar">
            <div className="navbar-container">
                {/* LEFT: burger (mobile) + logo */}
                <div className="navbar-left">
                    {/* ✅ Burger: غير فالموبايل و فليسار */}
                    <button
                        className="mobile-burger-left"
                        onClick={() => setShowHamburger(true)}
                        type="button"
                        aria-label="Open menu"
                    >
                        <i className="fas fa-bars"><img src='/assets/main-menu.png' /></i>
                    </button>

                    {/* LOGO */}
                    <Link to="/" className="navbar-logo" onClick={() => setShowHamburger(false)}>
                        <i className="fas fa-briefcase"></i>  <img src='/assets/logo.jpeg' alt='ALLOFICE' className='logo' />
                    </Link>
                </div>

                <div className="navbar-menu">
                    {!isAdminNav ? (
                        <>
                            <Link to="/" className="nav-link">Home</Link>

                            <div className="nav-dropdown"
                                onMouseEnter={() => setShowProductsMenu(true)}
                                onMouseLeave={() => setShowProductsMenu(false)} >
                                <button className="nav-link dropdown-btn">
                                    Products
                                    <i className={`fas fa-chevron-down ${showProductsMenu ? 'fa-rotate-180' : ''}`}>
                                    </i>
                                </button> {
                                    showProductsMenu && (
                                        <div className="dropdown-menu">
                                            <Link to="/products/office" className="dropdown-item">Office Supplies</Link>
                                            <Link to="/products/printing" className="dropdown-item">Printing Services</Link>
                                        </div>)}
                            </div>


                            <Link to="/offers" className="nav-link">Offers</Link>

                            {isAuthenticated && !isAdmin && (
                                <Link to="/orders" className="nav-link">Orders</Link>
                            )}

                            <form className="search-box" onSubmit={handleSearch}>
                                <input
                                    type="text"
                                    placeholder={`Search in ${activeType}...`}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <button type="submit">
                                    <i className="fas fa-search"> <img src='/assets/search.png' /></i>
                                </button>
                            </form>

                            <Link to="/cart" className="nav-link cart-link">
                                <i className="fas fa-shopping-cart"></i>
                                <span>Cart</span>
                                {getTotalItems() > 0 && (
                                    <span className="cart-count">{getTotalItems()}</span>
                                )}
                            </Link>

                        </>
                    ) : (
                        <>
                            {/* ✅ Admin Navbar */}
                            <Link to="/" className="nav-link">Home</Link>
                            <Link to="/admin/Dashboard" className="nav-link">Dashboard</Link>
                            <Link to="/admin/products" className="nav-link">Products</Link>
                            <Link to="/admin/orders" className="nav-link orders-link">Orders {pendingOrders > 0 && (
                                <span className="badge badge-red">{pendingOrders}</span>
                            )}</Link>
                            <Link to="/admin/offers" className="nav-link">Offers</Link>
                            <Link to="/admin/categories" className="nav-link">Categories</Link>
                            <Link to="/admin/statistics" className="nav-link">Statistics</Link>

                            {/* ✅ Search غير مرة وحدة (admin search) */}
                            <form className="search-box" onSubmit={handleSearch}>
                                <input
                                    type="text"
                                    placeholder="Search admin..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <button type="submit"><i className="fas fa-search"> <img src='/assets/search.png' /></i></button>
                            </form>
                        </>
                    )}
                </div>
                <div>

                    <form onSubmit={handleSearch} className="search-box-mobile">
                        <input
                            type="text"
                            placeholder={`Search in ${activeType}...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button type="submit">
                            <i className="fas fa-search">  <img src="/assets/search.png" alt="search" /></i>
                        </button>
                    </form>
                </div>
                {/* RIGHT SIDE */}
                <div className="nav-right">
                    {/* ✅ خلي auth يبقى فالديسكتوب، فالموبايل غادي نخبيه بالـCSS */}
                    <div className="auth-section auth-desktop">
                        {isAuthenticated ? (
                            <div className="user-actions">




                                <div className="">
                                    <button onClick={handleLogout} className="nav-link login-btn" type="button">
                                        <i className="fas fa-sign-out-alt"></i> logout
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="guest-actions">
                                <Link to="/login" className="nav-link login-btn">Login</Link>
                                <Link to="/register" className="nav-link login-btn">Register</Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Categories Navbar */}
            <div className="categories-navbar">
                <div className="categories-container">

                    {safeCategories.map(cat => (
                        <button
                            key={cat.id}
                            className={`category-item ${activeCategory === cat.id ? 'active' : ''}`}
                            onClick={() => handleCategoryClick(cat)}
                            type="button"
                        >
                            {cat.name}
                        </button>
                    ))}


                </div>
            </div>

            {/* Hamburger Sidebar */}
            {
                showHamburger && (
                    <>
                        <div className="sidebar-overlay" onClick={() => setShowHamburger(false)}>
                        </div>

                        <div className="hamburger-sidebar">
                            <div className="sidebar-header">
                                <h3>Menu</h3>
                                <button className="close-btn" onClick={() => setShowHamburger(false)} type="button">
                                    &times;
                                </button>
                            </div>

                            <div className="sidebar-content">
                                {!isAdminNav ? (
                                    <>
                                        <div className="sidebar-content">
                                            {/* ✅ menu links ديال الموبايل */}
                                            <Link className="dropdown-item" to="/" onClick={() => setShowHamburger(false)}>Home</Link>


                                            <Link to="/products/office" className="dropdown-item">Office Supplies</Link>
                                            <Link to="/products/printing" className="dropdown-item">Printing Services</Link>


                                            <Link className="dropdown-item" to="/offers" onClick={() => setShowHamburger(false)}>Offers</Link>

                                            {isAuthenticated && !isAdmin && (
                                                <Link className="dropdown-item" to="/orders" onClick={() => setShowHamburger(false)}>Orders</Link>
                                            )}

                                            <Link className="dropdown-item" to="/cart" onClick={() => setShowHamburger(false)}>
                                                Cart ({getTotalItems()})
                                            </Link>




                                            {!isAuthenticated ? (
                                                <>
                                                    <Link className="nav-link login-btn" to="/login" onClick={() => setShowHamburger(false)}>
                                                        Login
                                                    </Link>
                                                    <Link className="nav-link login-btn" to="/register" onClick={() => setShowHamburger(false)}>
                                                        Register
                                                    </Link>
                                                </>
                                            ) : (
                                                <button className="nav-link login-btn" onClick={handleLogout} type="button">
                                                    Logout
                                                </button>
                                            )}

                                            <div className="sidebar-divider"></div>

                                            <h4 className="sidebar-subtitle">Categories</h4>

                                            {/* ✅ categories buttons */}
                                            {safeCategories.map(cat => (
                                                <button
                                                    key={cat.id}
                                                    className={`category-item ${activeCategory === cat.id ? 'active' : ''}`}
                                                    onClick={() => handleCategoryClick(cat)}
                                                    type="button"
                                                >
                                                    {cat.name}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <Link className="sidebar-link" to="/" onClick={() => setShowHamburger(false)}>Admin Home</Link>
                                        <Link className="sidebar-link" to="/admin/products" onClick={() => setShowHamburger(false)}>Products</Link>
                                        <Link className="sidebar-link" to="/admin/orders" onClick={() => setShowHamburger(false)}>Orders {pendingOrders > 0 && (
                                            <span className="badge badge-red">{pendingOrders}</span>
                                        )}</Link>
                                        <Link className="sidebar-link" to="/admin/offers" onClick={() => setShowHamburger(false)}>Offers</Link>
                                        <Link className="sidebar-link" to="/admin/categories" onClick={() => setShowHamburger(false)}>Categories</Link>
                                        <Link className="sidebar-link" to="/admin/statistics" onClick={() => setShowHamburger(false)}>Statistics</Link>



                                        <button className="nav-link login-btn" onClick={handleLogout} type="button">
                                            Logout
                                        </button>
                                    </>
                                )}
                            </div>

                        </div>
                    </>
                )
            }
        </nav >
    );
};

export default Navbar;

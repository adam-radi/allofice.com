import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ForgotPassword from "./pages/ForgotPassword";

// Pages
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import Offers from "./pages/Offers";
import Login from "./pages/Login";
import Register from "./pages/Register";

// Admin Pages
import AdminDashboard from "./admin/Dashboard";
import AdminProducts from "./admin/ProductsAdmin";
import AdminOrders from "./admin/OrdersAdmin";
import AdminOffers from "./admin/OffersAdmin";
import AdminStatistics from "./admin/StatisticsAdmin";
import AdminCategories from "./admin/Categories"
// Styles
import "./styles/main.css";
import ScrollToTop from "./ScrollToTop";
function App() {
    return (
        <Router>
            <AuthProvider>
                <CartProvider>
                    <div className="app">

                        <Navbar />
                        <ScrollToTop />
                        <Routes>
                            {/* ✅ Public */}
                            <Route path="/" element={<Home />} />

                            {/* Products list */}
                            <Route path="/products/:type" element={<Products />} />
                            <Route path="/products/:type/:categorySlugId" element={<Products />} />

                            {/* ✅ Product details */}
                            <Route
                                path="/products_details/:type/:catSlugId/:productSlugId"
                                element={<ProductDetails />}
                            />

                            {/* ✅ Offer details */}
                            <Route
                                path="/products_details/offer/:offerSlugId"
                                element={<ProductDetails />}
                            />
                            <Route path="/forgot-password" element={<ForgotPassword />} />

                            {/* Cart / checkout */}
                            <Route path="/cart" element={<Cart />} />
                            <Route path="/checkout" element={<Checkout />} />

                            {/* Offers page */}
                            <Route path="/offers" element={<Offers />} />

                            {/* Auth */}
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />

                            {/* ✅ Protected user */}
                            <Route
                                path="/orders"
                                element={
                                    <ProtectedRoute>
                                        <Orders />
                                    </ProtectedRoute>
                                }
                            />

                            {/* ✅ Protected admin */}
                            <Route
                                path="/admin/dashboard"
                                element={
                                    <ProtectedRoute adminOnly>
                                        <AdminDashboard />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/admin/categories"
                                element={
                                    <ProtectedRoute adminOnly>
                                        <AdminCategories />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/admin/products"
                                element={
                                    <ProtectedRoute adminOnly>
                                        <AdminProducts />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/admin/orders"
                                element={
                                    <ProtectedRoute adminOnly>
                                        <AdminOrders />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/admin/offers"
                                element={
                                    <ProtectedRoute adminOnly>
                                        <AdminOffers />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/admin/statistics"
                                element={
                                    <ProtectedRoute adminOnly>
                                        <AdminStatistics />
                                    </ProtectedRoute>
                                }
                            />

                            {/* ✅ 404 لازم تكون آخر وحدة */}
                            <Route path="*" element={<div>404 Not Found</div>} />
                        </Routes>

                        <Footer />
                    </div>
                </CartProvider>
            </AuthProvider>
        </Router>
    );
}

export default App;

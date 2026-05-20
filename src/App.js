import React from "react";
import { BrowserRouter as Router, Link, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import "./styles/auth.css";

function AccountPage() {
    const { user, logout, isAdmin } = useAuth();

    const handleLogout = async () => {
        await logout();
    };

    return (
        <main className="container auth-page">
            <div className="auth-container">
                <div className="auth-card">
                    <h1 className="auth-title">Authenticated Session</h1>
                    <div className="auth-summary">
                        <p><strong>Name:</strong> {user?.name || "Unknown"}</p>
                        <p><strong>Phone:</strong> {user?.phone || "Unknown"}</p>
                        <p><strong>Role:</strong> {isAdmin ? "admin" : "user"}</p>
                    </div>
                    <div className="auth-actions">
                        <button type="button" className="auth-btn" onClick={handleLogout}>
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}

function LandingPage() {
    const { isAuthenticated, isAdmin } = useAuth();

    return (
        <main className="container auth-page">
            <div className="auth-container">
                <div className="auth-card">
                    <h1 className="auth-title">Allofice Authentication Module</h1>
                    <p className="auth-link">
                        This repository contains only the frontend authentication flow.
                    </p>
                    <div className="auth-actions">
                        {isAuthenticated ? (
                            <Link to="/account" className="auth-btn auth-btn-link">
                                Open {isAdmin ? "Admin" : "User"} Session
                            </Link>
                        ) : (
                            <>
                                <Link to="/login" className="auth-btn auth-btn-link">Login</Link>
                                <Link to="/register" className="auth-btn auth-btn-link secondary">Register</Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}

function App() {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route
                        path="/account"
                        element={
                            <ProtectedRoute>
                                <AccountPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route path="*" element={<LandingPage />} />
                </Routes>
            </AuthProvider>
        </Router>
    );
}

export default App;

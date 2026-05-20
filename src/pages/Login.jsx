import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/auth.css";

const PHONE_REGEX = /^[0-9+\s()-]{8,20}$/;

const sanitizePhone = (value) => value.replace(/\s+/g, " ").trim();

const getRedirectTarget = (user, from) => {
    if (from?.pathname) {
        return `${from.pathname}${from.search || ""}${from.hash || ""}`;
    }

    return user?.role === "admin" ? "/account" : "/account";
};

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, user, isAuthenticated, loading: authLoading } = useAuth();
    const [formData, setFormData] = useState({ phone: "", password: "" });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const from = location.state?.from;
    const redirectTarget = useMemo(() => getRedirectTarget(user, from), [user, from]);

    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            navigate(redirectTarget, { replace: true });
        }
    }, [authLoading, isAuthenticated, navigate, redirectTarget]);

    const validateForm = () => {
        const phone = sanitizePhone(formData.phone);
        const password = formData.password.trim();

        if (!phone || !password) {
            return "Please fill in both phone number and password.";
        }

        if (!PHONE_REGEX.test(phone)) {
            return "Please enter a valid phone number.";
        }

        if (password.length < 6) {
            return "Password must be at least 6 characters.";
        }

        return "";
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (error) setError("");
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        setSubmitting(true);
        try {
            const result = await login(sanitizePhone(formData.phone), formData.password);
            navigate(getRedirectTarget(result?.data, from), { replace: true });
        } catch (err) {
            setError(err.message || "Login failed");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <main className="container auth-page">
            <div className="auth-container">
                <div className="auth-card">
                    <h1 className="auth-title">Login</h1>

                    {error && <div className="error-msg">{error}</div>}

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <label>Phone Number</label>
                            <input
                                type="tel"
                                name="phone"
                                placeholder="Enter your phone"
                                value={formData.phone}
                                onChange={handleChange}
                                autoComplete="tel"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Password</label>
                            <input
                                type="password"
                                name="password"
                                placeholder="Enter your password"
                                value={formData.password}
                                onChange={handleChange}
                                autoComplete="current-password"
                                required
                            />
                        </div>

                        <button type="submit" className="auth-btn" disabled={submitting || authLoading}>
                            {submitting ? "Logging in..." : "Login"}
                        </button>
                    </form>

                    <p className="auth-link">
                        <Link to="/forgot-password">Forgot your password?</Link>
                    </p>
                    <p className="auth-link">
                        Don't have an account? <Link to="/register">Register here</Link>
                    </p>
                </div>
            </div>
        </main>
    );
};

export default Login;

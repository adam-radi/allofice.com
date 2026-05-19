import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/auth.css';

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [formData, setFormData] = useState({ phone: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // ===== Frontend validation =====
        if (!formData.phone || !formData.password) {
            setError('Please fill in all required fields.');
            setLoading(false);
            return;
        }

        // ===== Backend login =====
        try {
            await login(formData.phone, formData.password);
            navigate('/'); // redirect only if login succeeded
        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'Login failed';
            setError(msg);
        } finally {
            setLoading(false);
        }


        // ===== Backend login =====
        try {
            await login(formData.phone, formData.password);
            navigate('/'); // redirect only if login succeeded
        } catch (err) {
            // show proper error
            const msg = err.response?.data?.message || err.message || 'Login failed';
            setError(msg);
        } finally {
            setLoading(false); // 🔹 always stop loading
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
                                type="text"
                                name="phone"
                                placeholder="Enter your phone"
                                value={formData.phone}
                                onChange={handleChange}
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
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn  auth-btn"
                            disabled={loading}
                        >
                            {loading ? 'Logging in...' : 'Login'}
                        </button>
                    </form>
                    <p className="auth-link">
                        <Link to="/forgot-password"> Mot de passe oublie</Link>
                    </p>
                    <p className="auth-link">
                        Don't have an account? <Link to="/register">Register here</Link>
                    </p>

                    {/* Optional demo info */}

                </div>
            </div>
        </main>
    );
};

export default Login;
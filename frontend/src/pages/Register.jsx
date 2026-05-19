import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/auth.css';


const Register = () => {
    const navigate = useNavigate();
    const { registerManual } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        city: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // ===== Frontend validation =====
        if (!formData.name || !formData.email || !formData.password || !formData.phone || !formData.city) {
            setError('Please fill in all required fields.');
            return;
        }

        // تحقق من شكل البريد الإلكتروني
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError('Please enter a valid email address.');
            return;
        }

        // تحقق من طول كلمة المرور
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        setLoading(true);
        // ==============================
        try {
            await registerManual(
                formData.name,
                formData.email,
                formData.password,
                formData.phone,
                formData.city
            );
            // بعد تسجيل النجاح، نبدل صفحة home
            navigate('/');
        } catch (err) {
            // رسائل الأخطاء من backend مباشرة
            const msg = err.response?.data?.message || err.message;

            if (msg === 'Email already exists') {
                setError('This email is already registered. Please login or use another email.');
            } else if (msg && msg.includes('Phone already exists')) {
                setError('This phone number is already registered. Please login or use another phone.');
            } else {
                setError(msg || 'Registration failed');
            }
        } finally {
            setLoading(false);
        }
    };


    return (
        <main className="container auth-page">
            <div className="auth-container">
                <div className="auth-card">
                    <h1 className="auth-title">Register</h1>

                    {error && <div className="error-msg">{error}</div>}

                    <form onSubmit={handleSubmit} className="auth-form">

                        <div className="form-group">
                            <label>Full Name</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                placeholder="Enter your full name"
                            />
                        </div>

                        <div className="form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                placeholder="Enter your email"
                            />
                        </div>

                        <div className="form-group">
                            <label>Password</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                placeholder="Enter your password"
                            />
                        </div>

                        <div className="form-group">
                            <label>Phone</label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="Enter your phone number"
                            />
                        </div>

                        <div className="form-group">
                            <label>City</label>
                            <input
                                type="text"
                                name="city"
                                value={formData.city}
                                onChange={handleChange}
                                placeholder="Enter your city"
                            />
                        </div>
                        <button
                            type="submit"
                            className="auth-btn"
                            disabled={loading}
                        >
                            {loading ? (
                                <><i className="fas fa-circle-notch fa-spin"></i> Creating...</>
                            ) : (
                                'Create Account'
                            )}
                        </button>
                    </form >

                    <p className="auth-link">
                        Already have an account? <Link to="/login">Login here</Link>
                    </p>
                </div >
            </div >
        </main >
    );
};

export default Register;





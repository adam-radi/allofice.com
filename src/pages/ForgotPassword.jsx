import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import authAPI from "../api/auth.api";

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    email: "",
    phone: "",
    newPassword: ""
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  /* STEP 1 VERIFY */
  const verifyUser = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const res = await authAPI.verifyReset({
        email: form.email,
        phone: form.phone
      });

      if (res.data.success) {
        setStep(2);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Error");
    }
  };

  /* STEP 2 RESET PASSWORD */
  const resetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      await authAPI.resetPassword({
        email: form.email,
        phone: form.phone,
        newPassword: form.newPassword
      });

      setSuccess("Password updated successfully.");
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Error");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <h2 className="auth-title">Forgot Password</h2>

          {error && <div className="error-msg">{error}</div>}
          {success && <div className="error-msg" style={{ background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' }}>{success}</div>}

          {step === 1 && (
            <form className="auth-form" onSubmit={verifyUser}>
              <div className="form-group">
                <label>Email</label>
                <input
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone</label>
                <input
                  name="phone"
                  type="text"
                  placeholder="Enter your phone"
                  onChange={handleChange}
                  required
                />
              </div>

              <button type="submit" className="auth-btn">Verify</button>
            </form>
          )}

          {step === 2 && (
            <form className="auth-form" onSubmit={resetPassword}>
              <div className="form-group">
                <label>New Password</label>
                <input
                  name="newPassword"
                  type="password"
                  placeholder="Enter new password"
                  onChange={handleChange}
                  required
                />
              </div>

              <button type="submit" className="auth-btn">Reset Password</button>
            </form>
          )}

          <div className="auth-link">
            <Link to="/login">Back to Login</Link>
          </div>
        </div>
      </div>
    </div>
  );

};

export default ForgotPassword;

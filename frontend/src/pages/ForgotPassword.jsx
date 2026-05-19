import React, { useState } from "react";
import authAPI from "../api/auth.api";
import { useNavigate } from "react-router-dom";
const ForgotPassword = () => {

  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    email: "",
    phone: "",
    newPassword: ""
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  /* STEP 1 VERIFY */
  const verifyUser = async (e) => {

    e.preventDefault();

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
  const navigate=useNavigate();
  /* STEP 2 RESET PASSWORD */
  const resetPassword = async (e) => {

    e.preventDefault();

    try {

      await authAPI.resetPassword({
        email: form.email,
        phone: form.phone,
        newPassword: form.newPassword
      });

      setSuccess("Password updated successfully");
      alert("Password updated successfully");
     navigate('/');
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
            <a href="/login">Back to Login</a>
          </div>
        </div>
      </div>
    </div>
  );

};

export default ForgotPassword;
import React, { useState } from "react";
import axios from "axios";

const api = axios.create({
  baseURL: "https://mywebsite-im3c.onrender.com",
  headers: {
    "Content-Type": "application/json"
  }
});

function ForgotPassword({ setMode }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleResetRequest = async () => {
    if (!email) {
      alert("Please enter your email address.");
      return;
    }

    setLoading(true);
    setMessage("");
    
    try {

      const res = await api.post("/api/forgot-password", {
        email: email.trim().toLowerCase(),
      });

      if (res.data.success) {
        setMessage("A password reset link/OTP has been sent to your email.");
  
      }
    } catch (err) {
      const data = err.response?.data;
      alert(data?.message || "Failed to process request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="floating-card">
        <h1 className="title">Reset Password</h1>
        <p className="subtitle">Enter your email to receive reset instructions</p>

        <div className="input-group">
          <input
            type="email"
            value={email}
            placeholder="Email Address"
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
            onKeyPress={(e) => e.key === 'Enter' && handleResetRequest()}
          />
        </div>

        {message && <p style={{ color: 'green', fontSize: '0.9rem', marginBottom: '10px' }}>{message}</p>}

        <button
          type="button"
          className="button"
          onClick={handleResetRequest}
          disabled={loading}
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>

        <p className="register-text">
          Remember your password?{" "}
          <span className="link-text" onClick={() => setMode("login")}>
            Back to Login
          </span>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;

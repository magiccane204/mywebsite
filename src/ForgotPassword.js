import React, { useState } from "react";
import axios from "axios";

const api = axios.create({
  baseURL: "https://mywebsite-im3c.onrender.com",
  headers: {
    "Content-Type": "application/json"
  }
});

function ForgotPassword({ setMode }) {
  const [step, setStep] = useState(1); 
  
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleRequestOtp = async () => {
    if (!email) {
      alert("Please enter your email address.");
      return;
    }

    setLoading(true);
    setMessage("");
    
    try {
      const res = await api.post("/api/forgot-password", { email: email.trim().toLowerCase() });
      if (res.data.success) {
        setMessage("An OTP has been sent to your email.");
        setStep(2); 
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to process request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!otp || !newPassword) {
      alert("Please enter the OTP and your new password.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/api/reset-password", {
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        newPassword: newPassword.trim()
      });

      if (res.data.success) {
        alert("Password updated successfully! Please login with your new password.");
        setMode("login"); 
      }
    } catch (err) {
      alert(err.response?.data?.message || "Invalid OTP or request failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="floating-card">
        <h1 className="title">Reset Password</h1>
        
        {step === 1 ? (
          <>
            <p className="subtitle">Enter your email to receive an OTP</p>
            <div className="input-group">
              <input
                type="email"
                value={email}
                placeholder="Email Address"
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                onKeyPress={(e) => e.key === 'Enter' && handleRequestOtp()}
              />
            </div>
            {message && <p style={{ color: 'green', fontSize: '0.9rem', marginBottom: '10px' }}>{message}</p>}
            
            <button type="button" className="button" onClick={handleRequestOtp} disabled={loading}>
              {loading ? "Sending..." : "Send Reset OTP"}
            </button>
          </>
        ) : (
          <>
            <p className="subtitle">Enter the OTP sent to {email}</p>
            <div className="input-group">
              <input
                type="text"
                value={otp}
                placeholder="6-Digit OTP"
                onChange={(e) => setOtp(e.target.value)}
                className="input-field"
              />
              <input
                type="password"
                value={newPassword}
                placeholder="New Password"
                onChange={(e) => setNewPassword(e.target.value)}
                className="input-field"
                onKeyPress={(e) => e.key === 'Enter' && handleResetPassword()}
              />
            </div>
            
            <button type="button" className="button" onClick={handleResetPassword} disabled={loading}>
              {loading ? "Updating..." : "Update Password"}
            </button>
          </>
        )}

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

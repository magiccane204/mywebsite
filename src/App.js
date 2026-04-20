import React, { useState, useEffect } from "react";
import axios from "axios";

import Signup from "./SignUp.js";
import Otp from "./otp.js";
import Dashboard from "./Dashboard.js";
import ForgotPassword from "./ForgotPassword.js"; 

import "./App.css";

const api = axios.create({
  baseURL: "https://mywebsite-im3c.onrender.com",
  headers: {
    "Content-Type": "application/json"
  }
});

function App() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    async function loadUser() {
      try {
        const res = await api.get("/api/me");
        
        if (res.data.DarkMode) {
          document.body.classList.add("dark-theme");
        } else {
          document.body.classList.remove("dark-theme");
        }
        setMode("crm");
      } catch (err) {
        console.error("Session expired.");
        localStorage.removeItem("token");
        setMode("login");
      }
    }
    loadUser();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Please enter credentials.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/api/login", {
        email: email.trim().toLowerCase(),
        password: password.trim()
      });

      if (res.data.success) {
        localStorage.setItem("otp_email", email.trim().toLowerCase());
        setMode("otp");
      }
    } catch (err) {
      const data = err.response?.data;
      if (data?.notVerified) {
        alert("Account not activated. Redirecting to verification...");
        setMode("signup");
      } else {
        alert(data?.message || "Invalid Email or Password");
      }
    } finally {
      setLoading(false);
    }
  };

  
  if (mode === "signup") return <Signup setMode={setMode} />;
  
  if (mode === "otp") {
    return <Otp setMode={setMode} email={localStorage.getItem("otp_email")} />;
  }

  if (mode === "forgot_password") return <ForgotPassword setMode={setMode} />;

  if (mode === "crm") return <Dashboard setMode={setMode} />;

  
  return (
    <div className="auth-page">
      <div className="floating-card">
        <div className="profile-wrapper">
          <img
            src="/user.png" 
            alt="Profile"
            className="profile-img"
          />
        </div>

        <h1 className="title">Welcome Back</h1>
        <p className="subtitle">Login to continue</p>

        <div className="input-group">
          <input
            type="email"
            value={email}
            placeholder="Email Address"
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
          />
          <input
            type="password"
            value={password}
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
            className="input-field"
            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
          />
          
          <div className="forgot-password-container" style={{ textAlign: 'right', marginTop: '5px' }}>
            <span 
              className="link-text" 
              onClick={() => setMode("forgot_password")}
              style={{ fontSize: '0.85rem', cursor: 'pointer' }}
            >
              Forgot Password?
            </span>
          </div>
        </div>

        <button
          type="button"
          className="button"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "Authenticating..." : "Login"}
        </button>

        <p className="register-text">
          Not registered?{" "}
          <span className="link-text" onClick={() => setMode("signup")}>
            Register Now
          </span>
        </p>
      </div>
    </div>
  );
}

export default App;

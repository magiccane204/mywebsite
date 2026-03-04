import { useState, useEffect } from "react";
import Signup from "./SignUp.js";
import Otp from "./otp.js";
import CRM from "./CRM.js";
import axios from "axios";
import "./App.css";

const api = axios.create({
  baseURL: "https://mywebsite-im3c.onrender.com",
  headers: {
    "Content-Type": "application/json",
  },
});

function App() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setMode("crm");
    }
  }, []);

  const handleLogin = async () => {
    if (!email || !password) return;

    try {
     const res = await api.post("/api/login", {
  email: email.trim().toLowerCase(),
  password: password.trim()
});
      if (res.data.success) {
        // 🔥 CRITICAL FIX
        localStorage.setItem("otp_email", email);
        setMode("otp");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (mode === "signup") return <Signup setMode={setMode} />;
  if (mode === "otp") return <Otp setMode={setMode} />;
  if (mode === "crm") return <CRM setMode={setMode} />;

  return (
    <div className="floating-card">
      <img
        src="/user.png"
        alt="profile pic"
        style={{ width: 150, height: 150, borderRadius: "50%" }}
      />

      <h1>Login</h1>

      <input
        type="email"
        value={email}
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        value={password}
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
      />

      <button type="button" className="button" onClick={handleLogin}>
        Login
      </button>

      <p style={{ marginTop: "15px" }}>
        Not registered?{" "}
        <span
          style={{ color: "blue", cursor: "pointer" }}
          onClick={() => setMode("signup")}
        >
          Register Now
        </span>
      </p>
    </div>
  );
}

export default App;

import { useState, useEffect } from "react";
import Signup from "./SignUp";
import Otp from "./Otp";
import CRM from "./CRM";
import api from "./api";
import "./App.css";

function App() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // ONLY trust JWT, nothing else
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) setMode("crm");
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    try {
      const res = await api.post("/login", { email, password });

      if (res.data.success) {
        setMode("otp"); // 🔑 OTP SENT BY BACKEND
      } else {
        alert("Invalid credentials");
      }
    } catch (err) {
      console.log(err.response);
      alert("Login failed");
    }
  };

  if (mode === "signup") return <Signup setMode={setMode} />;
  if (mode === "otp") return <Otp Email={email} setMode={setMode} />;
  if (mode === "crm") return <CRM setMode={setMode} />;

  return (
    <div className="floating-card">
      <h1>Login</h1>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={handleLogin}>Login</button>

      <p>
        Don’t have an account?{" "}
        <span style={{ color: "blue", cursor: "pointer" }} onClick={() => setMode("signup")}>
          Sign Up
        </span>
      </p>
    </div>
  );
}

export default App;

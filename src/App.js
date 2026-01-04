import { useState, useEffect } from "react";
import Signup from "./SignUp";
import Otp from "./Otp";
import CRM from "./CRM";
import api from "./api"; // IMPORTANT
import "./App.css";

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
    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    try {
      const res = await api.post("/login", { email, password });

      if (res.data.success) {
        localStorage.setItem("loggedInUser", email);
        setMode("otp"); // ✅ GO TO OTP PAGE
      } else {
        alert("Invalid credentials");
      }
    } catch (err) {
      console.log(err.response);
      alert("Invalid credentials or try again");
    }
  };

  if (mode === "signup") return <Signup setMode={setMode} />;
  if (mode === "otp") return <Otp Email={email} setMode={setMode} />;
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

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          width: "100%",
          margin: "10px 0",
        }}
      >
        <label style={{ display: "flex", alignItems: "center" }}>
          <input type="checkbox" style={{ marginRight: "5px" }} />
          Remember me?
        </label>

        <span
          style={{ color: "blue", cursor: "pointer" }}
          onClick={() => setMode("signup")}
        >
          Forgot Password?
        </span>
      </div>

      <button
        className="button"
        onClick={handleLogin}
        style={{ backgroundColor: "#ffffff", color: "#000000" }}
      >
        Login
      </button>

      <p style={{ marginTop: "15px" }}>
        Don’t have an account?{" "}
        <span
          style={{ color: "blue", cursor: "pointer" }}
          onClick={() => setMode("signup")}
        >
          Sign Up
        </span>
      </p>
    </div>
  );
}

export default App;

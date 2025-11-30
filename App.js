import { useState, useEffect } from "react";
import Signup from "./SignUp";
import Otp from "./otp";
import CRM from "./CRM";
import axios from "axios";
import "./App.css";

function App() {
  const [mode, setMode] = useState("login"); 
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn");
    if (loggedIn === "true") {
      setMode("crm");
    }
  }, []);


  const handleLogin = async () => {
    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    try {
      await axios.post("http://localhost:5002/login", { email, password });

   
      localStorage.setItem("loggedInUser", email);

     
      await axios.post("http://localhost:5002/send-otp", { email, password });

      setMode("otp");
    } catch (err) {
      if (err.response?.status === 401) alert("Invalid credentials.");
      else alert("Server error. Try again later.");
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

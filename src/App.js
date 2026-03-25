import { useState, useEffect } from "react";
import Signup from "./SignUp.js";
import Otp from "./otp.js";
import CRM from "./CRM.js";
import axios from "axios";
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

useEffect(() => {

const token = localStorage.getItem("token");

if (!token) return;

api.defaults.headers.common["Authorization"] = "Bearer " + token;

async function loadUser() {

  try {

    const res = await api.get("/api/me");

    if (res.data.DarkMode) {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }

    setMode("crm");

  } catch (err) {

    console.log("Session invalid");
    localStorage.removeItem("token");

  }

}

loadUser();

}, []);

const handleLogin = async () => {


if (!email || !password) {
  alert("Enter email and password");
  return;
}

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

    alert("Account not activated. Please create your password.");
    setMode("signup");

  } else {

    alert(data?.message || "Login failed");

  }

}


};

if (mode === "signup") return <Signup setMode={setMode} />;

if (mode === "otp")
return (
<Otp
setMode={setMode}
email={localStorage.getItem("otp_email")}
/>
);

if (mode === "crm") return <CRM setMode={setMode} api={api} />;

return (
  <div className="auth-page">

    <div className="floating-card">

      <div className="profile-wrapper">
        <img
          src="/user.png"
          alt="profile pic"
          className="profile-img"
        />
      </div>

      <h1 className="title">Welcome Back</h1>
      <p className="subtitle">Login to continue</p>

      <input
        type="email"
        value={email}
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
        className="input"
      />

      <input
        type="password"
        value={password}
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
        className="input"
      />

      <button
        type="button"
        className="button"
        onClick={handleLogin}
      >
        Login
      </button>

      <p className="register-text">
        Not registered?
        <span onClick={() => setMode("signup")}>
          Register Now
        </span>
      </p>

    </div>

  </div>
);

}

export default App;

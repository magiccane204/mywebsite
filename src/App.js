/* ... your imports stay the same ... */

function App() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false); // Added loading state

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    async function loadUser() {
      try {
        const res = await api.get("/api/me");
        // Apply dark mode to body
        if (res.data.DarkMode) {
          document.body.classList.add("dark-theme");
        } else {
          document.body.classList.remove("dark-theme");
        }
        setMode("crm");
      } catch (err) {
        localStorage.removeItem("token");
        setMode("login");
      }
    }
    loadUser();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Please enter both email and password");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/api/login", {
        email: email.trim().toLowerCase(),
        password: password.trim()
      });

      if (res.data.success) {
        // Store email for the OTP component to use
        localStorage.setItem("otp_email", email.trim().toLowerCase());
        setMode("otp");
      }
    } catch (err) {
      const data = err.response?.data;
      if (data?.notVerified) {
        alert("Account not activated. Redirecting to signup...");
        setMode("signup");
      } else {
        alert(data?.message || "Invalid credentials");
      }
    } finally {
      setLoading(false);
    }
  };

  // --- ROUTING LOGIC ---
  if (mode === "signup") return <Signup setMode={setMode} />;
  
  if (mode === "otp") {
    return <Otp setMode={setMode} email={localStorage.getItem("otp_email")} />;
  }

  if (mode === "crm") return <Dashboard setMode={setMode} />;

  // --- LOGIN UI ---
  return (
    <div className="auth-page">
      <div className="floating-card">
        <div className="profile-wrapper">
          <img
            src="/user.png" 
            alt="User Profile"
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

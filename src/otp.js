import { useEffect, useState } from "react";
import api from "./api";
import "./Otp.css";

function Otp({ setMode }) {
  const [otp, setOtp] = useState("");
  const [expiresIn, setExpiresIn] = useState(300);
  const [loading, setLoading] = useState(false);

  // 🔥 ALWAYS read email from localStorage
  const email = localStorage.getItem("otp_email");

  // countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setExpiresIn((v) => (v > 0 ? v - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const verifyOtp = async () => {
    if (!otp) return alert("Enter OTP");
    if (!email) return alert("Email missing. Please login again.");

    setLoading(true);
    try {
      const res = await api.post("/api/verify-otp", {
        email,
        otp: String(otp),
      });

      if (res.data.success) {
        localStorage.setItem("token", res.data.token);
        localStorage.removeItem("otp_email"); // cleanup
        setMode("crm");
      } else {
        alert("Invalid OTP");
      }
    } catch (err) {
      alert("OTP expired or invalid");
    } finally {
      setLoading(false);
    }
  };

  const format = (s) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="OB">
      <h2>OTP Verification</h2>
      <p>
        OTP sent to <b>{email}</b>
      </p>

      <input
        type="number"
        placeholder="Enter OTP"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
      />

      <p>Expires in {format(expiresIn)}</p>

      <button onClick={verifyOtp} disabled={loading || expiresIn <= 0}>
        Verify OTP
      </button>
    </div>
  );
}

export default Otp;

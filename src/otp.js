import { useEffect, useState } from "react";
import api from "./api.js";
import "./Otp.css";

function Otp({ setMode }) {

  const [otp, setOtp] = useState("");
  const [expiresIn, setExpiresIn] = useState(300);
  const [loading, setLoading] = useState(false);

  // always read email
  const email = localStorage.getItem("otp_email");

  // countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setExpiresIn((v) => (v > 0 ? v - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const verifyOtp = async () => {

    if (!otp.trim()) {
      alert("Enter OTP");
      return;
    }

    if (!email) {
      alert("Email missing. Please login again.");
      return;
    }

    if (expiresIn <= 0) {
      alert("OTP expired. Please login again.");
      return;
    }

    setLoading(true);

    try {

      const res = await api.post("/api/verify-otp", {
        email: email.toLowerCase(),
        otp: otp.trim(),
      });

      if (res.data.success) {

        localStorage.setItem("token", res.data.token);
        localStorage.removeItem("otp_email");

        setMode("crm");

      } else {

        alert(res.data.message || "Invalid OTP");

      }

    } catch (err) {

      alert(err.response?.data?.message || "OTP expired or invalid");

    } finally {

      setLoading(false);

    }

  };

  const format = (s) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
return (
  <div className="otp-container">
    <div className="otp-box">

      <h2>OTP Verification</h2>

      <p>
        OTP sent to <b>{email}</b>
      </p>

      <input
        className="input"
        type="text"
        placeholder="Enter 6 digit OTP"
        value={otp}
        maxLength={6}
        onChange={(e) => setOtp(e.target.value)}
      />

      <p className="otp-subtext">
        Expires in {format(expiresIn)}
      </p>

      <button
        onClick={verifyOtp}
        disabled={loading || expiresIn <= 0}
      >
        {loading ? "Verifying..." : "Verify OTP"}
      </button>

    </div>
  </div>
);
}

export default Otp;


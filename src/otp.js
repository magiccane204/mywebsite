import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Otp.css";

function Otp({ Email, setMode }) {
  const [userOtp, setUserOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const [expiresIn, setExpiresIn] = useState(0);
  const [resendIn, setResendIn] = useState(0);

  /* ================== COUNTDOWN TIMER ================== */
  useEffect(() => {
    if (expiresIn <= 0 && resendIn <= 0) return;

    const timer = setInterval(() => {
      setExpiresIn((prev) => (prev > 0 ? prev - 1 : 0));
      setResendIn((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresIn, resendIn]);

  /* ================== VERIFY OTP ================== */
  const verifyOtp = async () => {
    if (!userOtp) {
      alert("Please enter OTP");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post("/verify-otp", {
        email: Email,
        otp: userOtp,
      });

      if (res.data.success) {
        localStorage.setItem("token", res.data.token);
        alert("OTP verified successfully!");
        setMode("crm");
      } else {
        alert("Invalid OTP");
      }
    } catch {
      alert("OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  /* ================== RESEND OTP ================== */
  const resendOtp = async () => {
    if (resendIn > 0) return;

    setLoading(true);
    try {
      const res = await axios.post("/send-otp", { email: Email });

      if (res.data.success) {
        setExpiresIn(res.data.expiresIn);
        setResendIn(res.data.resendIn);
        alert("OTP resent");
      }
    } catch (err) {
      if (err.response?.status === 429) {
        setExpiresIn(err.response.data.expiresIn);
        setResendIn(err.response.data.retryAfter);
      } else {
        alert("Failed to resend OTP");
      }
    } finally {
      setLoading(false);
    }
  };

  /* ================== FORMAT TIME ================== */
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="OB">
      <h2>OTP Verification</h2>
      <p>
        OTP sent to <b>{Email}</b>
      </p>

      <input
        className="input"
        type="number"
        placeholder="Enter OTP"
        value={userOtp}
        onChange={(e) => setUserOtp(e.target.value)}
      />

      {expiresIn > 0 && (
        <p style={{ color: "gray" }}>
          OTP expires in <b>{formatTime(expiresIn)}</b>
        </p>
      )}

      <button onClick={verifyOtp} disabled={loading || expiresIn <= 0}>
        {loading ? "Verifying..." : "Verify OTP"}
      </button>

      <p style={{ marginTop: "10px" }}>
        {resendIn > 0 ? (
          <span style={{ color: "gray" }}>
            Resend OTP in <b>{resendIn}s</b>
          </span>
        ) : (
          <span
            style={{ color: "blue", cursor: "pointer" }}
            onClick={resendOtp}
          >
            Resend OTP
          </span>
        )}
      </p>
    </div>
  );
}

export default Otp;

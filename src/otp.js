import React, { useEffect, useState } from "react";
import api from "./api";
import "./Otp.css";

function Otp({ Email, setMode }) {
  const [userOtp, setUserOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const [expiresIn, setExpiresIn] = useState(300); // 5 min
  const [resendIn, setResendIn] = useState(30);   // 30 sec

  /* ================== COUNTDOWN ================== */
  useEffect(() => {
    const timer = setInterval(() => {
      setExpiresIn((v) => (v > 0 ? v - 1 : 0));
      setResendIn((v) => (v > 0 ? v - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  /* ================== VERIFY OTP ================== */
  const verifyOtp = async () => {
    if (!userOtp) {
      alert("Enter OTP");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/verify-otp", {
        email: Email,
        otp: userOtp,
      });

      if (res.data.success) {
        localStorage.setItem("token", res.data.token);
        setMode("crm");
      } else {
        alert("Invalid OTP");
      }
    } catch (err) {
      console.log(err.response);
      alert("Invalid or expired OTP");
    } finally {
      setLoading(false);
    }
  };

  /* ================== RESEND OTP ================== */
  const resendOtp = async () => {
    if (resendIn > 0) return;

    setLoading(true);
    try {
      const res = await api.post("/send-otp", {
        email: Email,
      });

      setExpiresIn(res.data.expiresIn);
      setResendIn(res.data.resendIn);
    } catch (err) {
      // IMPORTANT FIX: OTP WAS SENT BUT BACKEND RETURNED COOLDOWN
      if (err.response?.data?.expiresIn) {
        setExpiresIn(err.response.data.expiresIn);
        setResendIn(err.response.data.retryAfter || 0);
        return;
      }

      console.log(err.response);
      alert("Could not resend OTP");
    } finally {
      setLoading(false);
    }
  };

  /* ================== TIME FORMAT ================== */
  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="OB">
      <h2>OTP Verification</h2>
      <p>OTP sent to <b>{Email}</b></p>

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

      <button
        onClick={verifyOtp}
        disabled={loading || expiresIn <= 0}
      >
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

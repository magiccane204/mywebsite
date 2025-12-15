import React, { useState } from "react";
import axios from "axios";
import "./Otp.css";

function Otp({ Email, setMode }) {
  const [userOtp, setUserOtp] = useState("");
  const [loading, setLoading] = useState(false);

  // VERIFY OTP
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
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("loggedInUser", Email);
        alert("OTP verified successfully!");
        setMode("crm");
      } else {
        alert("Invalid OTP. Try again.");
      }
    } catch (err) {
      alert("Verification failed. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  // RESEND OTP
  const resendOtp = async () => {
    setLoading(true);

    try {
      await axios.post("/send-otp", { email: Email });
      alert("OTP resent successfully!");
    } catch (err) {
      alert("Failed to resend OTP. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="OB">
      <h2>OTP Verification</h2>
      <p>Enter the OTP sent to <b>{Email}</b></p>

      <input
        className="input"
        type="number"
        placeholder="Enter OTP"
        value={userOtp}
        onChange={(e) => setUserOtp(e.target.value)}
      />

      <button onClick={verifyOtp} disabled={loading}>
        {loading ? "Verifying..." : "Verify OTP"}
      </button>

      <p style={{ marginTop: "10px" }}>
        Didn’t receive OTP?{" "}
        <span
          style={{ color: "blue", cursor: "pointer" }}
          onClick={resendOtp}
        >
          Resend OTP
        </span>
      </p>
    </div>
  );
}

export default Otp;

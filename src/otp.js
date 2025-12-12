import React, { useState } from "react";
import axios from "axios";
import "./Otp.css";

function Otp({ Email, setMode }) {
  const [userOtp, setUserOtp] = useState("");

  // ✅ Verify OTP
  const verifyOtp = async () => {
    if (!userOtp) {
      alert("Please enter OTP");
      return;
    }

    try {
      const res = await axios.post("http://localhost:5002/verify-otp", {
        email: Email,
        otp: userOtp,
      });

      if (res.data.success) {
        // ✅ Store login persistence
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("loggedInUser", Email);

        alert("OTP verified successfully!");
        setMode("crm");
      } else {
        alert(res.data.message || "Invalid OTP, please try again.");
      }
    } catch (err) {
      alert("Verification failed. Please try again later.");
    }
  };

  // ✅ Resend OTP
  const resendOtp = async () => {
    try {
      await axios.post("http://localhost:5002/send-otp", { email: Email });
      alert("OTP resent successfully!");
    } catch {
      alert("Failed to resend OTP. Try again later.");
    }
  };

  return (
    <div className="OB">
      <p>OTP Verification</p>
      <p>Enter OTP sent to {Email}</p>
      <input
        className="input"
        type="number"
        value={userOtp}
        onChange={(e) => setUserOtp(e.target.value)}
        placeholder="Enter OTP"
      />
      <button onClick={verifyOtp}>Verify</button>
      <p>
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

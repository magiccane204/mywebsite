import { useEffect, useState } from "react";
import api from "./api";
import "./Otp.css";

function Otp({ Email, setMode }) {
  const [otp, setOtp] = useState("");
  const [expiresIn, setExpiresIn] = useState(300);
  const [resendIn, setResendIn] = useState(30);
  const [loading, setLoading] = useState(false);

  // Countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setExpiresIn((v) => (v > 0 ? v - 1 : 0));
      setResendIn((v) => (v > 0 ? v - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const verifyOtp = async () => {
    if (!otp) return alert("Enter OTP");

    setLoading(true);
    try {
      const res = await api.post("/verify-otp", {
        email: Email,
        otp,
      });

      if (res.data.success) {
        localStorage.setItem("token", res.data.token);
        setMode("crm"); // ✅ LOGIN COMPLETE
      } else {
        alert("Invalid OTP");
      }
    } catch (err) {
      console.log(err.response);
      alert("OTP expired or invalid");
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (resendIn > 0) return;

    setLoading(true);
    try {
      const res = await api.post("/send-otp", { email: Email });
      setExpiresIn(res.data.expiresIn);
      setResendIn(res.data.resendIn);
    } catch (err) {
      if (err.response?.data?.expiresIn) {
        setExpiresIn(err.response.data.expiresIn);
        setResendIn(err.response.data.resendIn || 0);
        return;
      }
      console.log(err.response);
      alert("Could not resend OTP");
    } finally {
      setLoading(false);
    }
  };

  const format = (s) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="OB">
      <h2>OTP Verification</h2>
      <p>OTP sent to <b>{Email}</b></p>

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

      {resendIn > 0 ? (
        <p>Resend in {resendIn}s</p>
      ) : (
        <p style={{ color: "blue", cursor: "pointer" }} onClick={resendOtp}>
          Resend OTP
        </p>
      )}
    </div>
  );
}

export default Otp;

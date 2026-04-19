import React, { useState, useEffect } from "react";
import api from "./api";

const Payroll = ({ user }) => {
  const [employees, setEmployees] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [payrollHistory, setPayrollHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [markedToday, setMarkedToday] = useState(false);

  const isAdmin = user?.Role === "Admin" || user?.Role === "SuperAdmin";
  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (isAdmin) {
      fetchEmployees();
    } else {
      // If regular employee, they are their own selected profile
      fetchProfileData(user.Email);
    }
  }, [isAdmin, user]);

  const fetchEmployees = async () => {
    try {
      const res = await api.get("/api/Employees");
      setEmployees(res.data);
    } catch (err) {
      console.error("Failed to fetch employees", err);
    }
  };

  const fetchProfileData = async (email) => {
    setLoading(true);
    try {
      const [attRes, payRes] = await Promise.all([
        api.get(`/api/attendance?email=${email}`),
        api.get(`/api/payroll?email=${email}`)
      ]);
      setAttendance(attRes.data);
      setPayrollHistory(payRes.data);
      
      // Check if already marked present today
      const marked = attRes.data.some(record => record.Date === todayStr);
      setMarkedToday(marked);
    } catch (err) {
      console.error("Failed to fetch profile data", err);
    }
    setLoading(false);
  };

  const handleSelectEmployee = (emp) => {
    setSelectedProfile(emp);
    fetchProfileData(emp.Email);
  };

  const markPresent = async () => {
    try {
      await api.post("/api/attendance/mark");
      setMarkedToday(true);
      fetchProfileData(user.Email); // Refresh list
    } catch (err) {
      alert(err.response?.data?.message || "Failed to mark attendance.");
    }
  };

  const processPayment = async (method) => {
    if (!selectedProfile) return;
    
    // Default to the employee's base salary from their profile
    const amount = selectedProfile.Salary || 0;
    
    if (amount <= 0) {
      alert("Employee salary is not set properly.");
      return;
    }

    if (!window.confirm(`Process payment of ₹${amount} via ${method} for ${selectedProfile.Name}?`)) return;

    try {
      await api.post("/api/payroll/pay", {
        targetEmail: selectedProfile.Email,
        amount: amount,
        method: method
      });
      alert("Payment processed successfully!");
      fetchProfileData(selectedProfile.Email); // Refresh history
    } catch (err) {
      alert("Failed to process payment.");
    }
  };

  return (
    <div style={{ display: "flex", gap: "24px", height: "100%" }}>
      {/* LEFT COLUMN: Admin Employee List */}
      {isAdmin && (
        <div style={{ 
          width: "300px", 
          background: "var(--bg-card)", 
          border: "1px solid var(--border)", 
          borderRadius: "14px",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden"
        }}>
          <div style={{ padding: "20px", borderBottom: "1px solid var(--border)" }}>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800 }}>Staff Directory</h3>
            <p style={{ fontSize: "12px", color: "var(--text-dim)", margin: "4px 0 0" }}>Select profile for payroll</p>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "10px" }}>
            {employees.map(emp => (
              <div 
                key={emp._id}
                onClick={() => handleSelectEmployee(emp)}
                style={{
                  padding: "12px 16px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  marginBottom: "8px",
                  background: selectedProfile?._id === emp._id ? "rgba(124, 58, 237, 0.1)" : "transparent",
                  border: `1px solid ${selectedProfile?._id === emp._id ? "var(--accent)" : "transparent"}`,
                  transition: "all 0.2s"
                }}
              >
                <div style={{ fontWeight: 700, fontSize: "14px" }}>{emp.Name}</div>
                <div style={{ fontSize: "12px", color: "var(--text-dim)" }}>{emp["Applied Position"]}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RIGHT COLUMN: Profile Details & Actions */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "24px" }}>
        
        {/* Profile Header */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "14px", padding: "30px" }}>
          {isAdmin && !selectedProfile ? (
            <div style={{ color: "var(--text-dim)", textAlign: "center", padding: "40px 0" }}>
              Select an employee from the directory to view payroll and attendance.
            </div>
          ) : (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h2 style={{ fontSize: "24px", fontWeight: 800, margin: "0 0 8px 0" }}>
                  {isAdmin ? selectedProfile?.Name : user?.Name}
                </h2>
                <p style={{ margin: 0, color: "var(--text-dim)", fontWeight: 600 }}>
                  {isAdmin ? selectedProfile?.Email : user?.Email} • {isAdmin ? selectedProfile?.["Applied Position"] : user?.Role}
                </p>
                {isAdmin && selectedProfile && (
                  <div style={{ marginTop: "16px", display: "inline-block", padding: "6px 12px", background: "var(--bg-viewport)", borderRadius: "6px", border: "1px solid var(--border)", fontWeight: 700 }}>
                    Base Salary: ₹{selectedProfile.Salary?.toLocaleString()}
                  </div>
                )}
              </div>

              {/* Action Buttons based on Role */}
              <div style={{ display: "flex", gap: "12px", flexDirection: "column", alignItems: "flex-end" }}>
                {!isAdmin ? (
                  <button 
                    onClick={markPresent}
                    disabled={markedToday}
                    style={{
                      padding: "12px 24px",
                      background: markedToday ? "var(--bg-viewport)" : "var(--accent)",
                      color: markedToday ? "var(--text-dim)" : "#fff",
                      border: markedToday ? "1px solid var(--border)" : "none",
                      borderRadius: "8px",
                      fontWeight: 700,
                      cursor: markedToday ? "not-allowed" : "pointer"
                    }}
                  >
                    {markedToday ? "✓ Marked Present Today" : "✋ Mark as Present"}
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={() => processPayment("Cash/Cheque")}
                      style={{
                        padding: "12px 24px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: "8px", fontWeight: 700, cursor: "pointer", width: "100%"
                      }}
                    >
                      💵 Pay by Cash / Cheque
                    </button>
                    <button 
                      disabled
                      style={{
                        padding: "12px 24px", background: "var(--bg-viewport)", color: "var(--text-dim)", border: "1px dashed var(--border)", borderRadius: "8px", fontWeight: 700, cursor: "not-allowed", opacity: 0.6, width: "100%"
                      }}
                    >
                      💳 Pay Online <span style={{ fontSize: "10px", marginLeft: "4px" }}>(Coming Soon)</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Data Tables */}
        {(!isAdmin || selectedProfile) && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
            
            {/* Attendance Log */}
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "14px", overflow: "hidden" }}>
              <div style={{ padding: "20px", borderBottom: "1px solid var(--border)", fontWeight: 800 }}>Attendance Log</div>
              <div style={{ padding: "20px", maxHeight: "300px", overflowY: "auto" }}>
                {attendance.length === 0 ? <p style={{ color: "var(--text-dim)" }}>No records found.</p> : (
                  attendance.map(att => (
                    <div key={att._id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                      <span style={{ fontWeight: 600 }}>{att.Date}</span>
                      <span style={{ color: "#10b981", fontWeight: 700, fontSize: "12px", background: "#10b98120", padding: "4px 8px", borderRadius: "4px" }}>
                        {att.Status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Payroll History */}
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "14px", overflow: "hidden" }}>
              <div style={{ padding: "20px", borderBottom: "1px solid var(--border)", fontWeight: 800 }}>Salary Disbursements</div>
              <div style={{ padding: "20px", maxHeight: "300px", overflowY: "auto" }}>
                {payrollHistory.length === 0 ? <p style={{ color: "var(--text-dim)" }}>No payroll history.</p> : (
                  payrollHistory.map(pay => (
                    <div key={pay._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>₹{pay.Amount.toLocaleString()}</div>
                        <div style={{ fontSize: "11px", color: "var(--text-dim)" }}>{new Date(pay.Date).toLocaleDateString()}</div>
                      </div>
                      <span style={{ color: "var(--accent)", fontWeight: 700, fontSize: "12px", border: "1px solid var(--border)", padding: "4px 8px", borderRadius: "4px" }}>
                        {pay.Method}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default Payroll;

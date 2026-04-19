import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";

const api = axios.create({ baseURL: "/api" });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

function LeaveManagement() {
  const [leaves, setLeaves] = useState([]);
  const [formData, setFormData] = useState({ Date: "", Reason: "" });
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(true);

  const userRole = localStorage.getItem("userRole");

  const fetchLeaves = useCallback(async () => {
    try {
      const res = await api.get("/leaves");
      setLeaves(res.data);
    } catch (err) {
      console.error("Failed to fetch leaves", err);
    }
  }, []);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/leaves", formData);
      setFormData({ Date: "", Reason: "" });
      await fetchLeaves();
      alert("Leave applied successfully!");
    } catch (err) {
      alert("Error applying for leave.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (leaveId, newStatus) => {
    setUpdatingId(leaveId);
    try {
      await api.put(`/leaves/status/${leaveId}`, { status: newStatus });
      await fetchLeaves();
    } catch (err) {
      alert("Failed to update status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const themeStyles = {
    background: isDarkMode ? "#0b0a1a" : "#f1f5f9",
    cardBg: isDarkMode ? "#12112a" : "#ffffff",
    border: isDarkMode ? "1px solid #7c3aed" : "1px solid #ddd",
    text: isDarkMode ? "#f8fafc" : "#1e293b",
    inputBg: isDarkMode ? "#0b0a1a" : "#fff",
    tableRow: isDarkMode ? "transparent" : "#f8fafc",
    subText: isDarkMode ? "#94a3b8" : "#64748b",
    accent: "#7c3aed"
  };

  return (
    <div className="leave-mgmt-wrapper">
      <style>{`
        .leave-mgmt-wrapper { 
            min-height: 100vh; 
            background: ${themeStyles.background}; 
            padding: 40px; 
            color: ${themeStyles.text}; 
            font-family: 'Inter', sans-serif;
            transition: all 0.3s ease;
        }
        .theme-toggle {
            position: absolute;
            top: 20px;
            right: 40px;
            padding: 8px 16px;
            border-radius: 20px;
            cursor: pointer;
            background: ${themeStyles.accent};
            color: white;
            border: none;
            font-size: 12px;
            font-weight: bold;
        }
        .leave-form-card, .leave-table-card { 
            background: ${themeStyles.cardBg}; 
            border: ${themeStyles.border}; 
            padding: 30px; 
            border-radius: 12px; 
            margin-bottom: 30px; 
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        .form-grid { display: grid; grid-template-columns: 1fr 2fr 150px; gap: 20px; align-items: flex-end; }
        .input-group label { font-size: 11px; font-weight: 800; color: ${themeStyles.subText}; text-transform: uppercase; margin-bottom: 8px; display: block; }
        .leave-input { 
            background: ${themeStyles.inputBg}; 
            border: 1px solid ${isDarkMode ? '#2d2b55' : '#cbd5e1'}; 
            color: ${themeStyles.text}; 
            padding: 12px; 
            border-radius: 8px; 
            width: 100%; 
            box-sizing: border-box; 
        }
        .custom-table { width: 100%; border-collapse: collapse; }
        .custom-table th { 
            text-align: left; 
            padding: 18px 15px; 
            font-size: 11px; 
            color: ${themeStyles.subText}; 
            text-transform: uppercase; 
            border-bottom: 2px solid ${isDarkMode ? '#2d2b55' : '#e2e8f0'}; 
        }
        .custom-table td { 
            padding: 15px; 
            font-size: 14px; 
            border-bottom: 1px solid ${isDarkMode ? '#1e1c3a' : '#f1f5f9'}; 
            color: ${themeStyles.text}; 
            background: ${themeStyles.tableRow};
        }
        .status-badge { padding: 6px 14px; border-radius: 20px; font-size: 10px; font-weight: 800; text-transform: uppercase; display: inline-block; min-width: 80px; text-align: center; }
        .status-submitted { background: rgba(59, 130, 246, 0.15); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3); }
        .status-approved { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
        .status-rejected { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }
        .action-btn { border: none; padding: 10px 16px; border-radius: 8px; cursor: pointer; font-size: 10px; font-weight: 900; text-transform: uppercase; transition: all 0.2s ease; }
        .btn-submit { background: #7c3aed; color: white; width: 100%; padding: 14px; }
        .btn-approve { background: #10b981; color: white; margin-right: 8px; }
        .btn-reject { background: #ef4444; color: white; }
        .action-btn:hover { transform: translateY(-2px); filter: brightness(1.1); }
        .action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>

      <button className="theme-toggle" onClick={toggleTheme}>
        {isDarkMode ? "LIGHT MODE" : "DARK MODE"}
      </button>

      <div className="leave-form-card">
        <h3 style={{marginTop: 0, marginBottom: '20px'}}>Apply for Leave</h3>
        <form onSubmit={handleSubmit} className="form-grid">
          <div className="input-group">
            <label>Leave Date</label>
            <input 
              type="date" 
              className="leave-input" 
              value={formData.Date} 
              onChange={(e) => setFormData({...formData, Date: e.target.value})} 
              required 
            />
          </div>
          <div className="input-group">
            <label>Reason for Absence</label>
            <input 
              type="text" 
              className="leave-input" 
              placeholder="e.g. Family Emergency" 
              value={formData.Reason} 
              onChange={(e) => setFormData({...formData, Reason: e.target.value})} 
              required 
            />
          </div>
          <button type="submit" className="action-btn btn-submit" disabled={loading}>
            {loading ? "PROCESSING..." : "SUBMIT"}
          </button>
        </form>
      </div>

      <div className="leave-table-card">
        <h3 style={{marginTop: 0, marginBottom: '20px'}}>Leave History & Requests</h3>
        <table className="custom-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Employee Email</th>
              <th>Reason</th>
              <th>Status</th>
              {(userRole === "Admin" || userRole === "SuperAdmin") && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {leaves.map((leave) => (
              <tr key={leave._id}>
                <td style={{fontWeight: 'bold'}}>{leave.Date}</td>
                <td style={{color: themeStyles.subText}}>{leave.EmployeeEmail}</td>
                <td>{leave.Reason}</td>
                <td>
                  <span className={`status-badge status-${(leave.Status || 'submitted').toLowerCase()}`}>
                    {leave.Status || 'Submitted'}
                  </span>
                </td>
                {(userRole === "Admin" || userRole === "SuperAdmin") && (
                  <td>
                    {(!leave.Status || leave.Status === "Submitted") ? (
                      <div style={{display: 'flex'}}>
                        <button 
                          disabled={updatingId === leave._id}
                          onClick={() => handleStatusUpdate(leave._id, 'Approved')} 
                          className="action-btn btn-approve">
                          Approve
                        </button>
                        <button 
                          disabled={updatingId === leave._id}
                          onClick={() => handleStatusUpdate(leave._id, 'Rejected')} 
                          className="action-btn btn-reject">
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span style={{color: themeStyles.subText, fontSize: '11px', fontStyle: 'italic'}}>Processed</span>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default LeaveManagement;

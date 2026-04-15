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
  
  // Get user role from local storage or your auth state
  // This assumes you save the role during login
  const userRole = localStorage.getItem("role"); 

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
      fetchLeaves();
      alert("Leave applied successfully!");
    } catch (err) {
      alert("Error applying for leave.");
    } finally {
      setLoading(false);
    }
  };

  // --- NEW: Admin Action Handler ---
  const handleStatusUpdate = async (leaveId, newStatus) => {
    try {
      await api.put(`/leaves/status/${leaveId}`, { status: newStatus });
      fetchLeaves(); // Refresh list to show new status
    } catch (err) {
      alert("Failed to update status. Check permissions.");
    }
  };

  return (
    <div className="leave-mgmt-container">
      <style>{`
        .leave-mgmt-container { padding: 40px; color: #e2e8f0; }
        .leave-form-card, .leave-table-card { 
          background: #1a1935; border: 1px solid #2d2b55; 
          padding: 30px; border-radius: 20px; margin-bottom: 30px; 
        }
        .form-grid { display: grid; grid-template-columns: 1fr 2fr 150px; gap: 20px; align-items: flex-end; }
        .input-group label { font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 8px; display: block; }
        .leave-input { background: #0b0a1a; border: 1px solid #2d2b55; color: white; padding: 12px; border-radius: 8px; width: 100%; box-sizing: border-box; }
        
        .custom-table { width: 100%; border-collapse: collapse; color: #f8fafc; }
        .custom-table th { text-align: left; padding: 15px; font-size: 11px; color: #94a3b8; text-transform: uppercase; border-bottom: 1px solid #2d2b55; }
        .custom-table td { padding: 15px; font-size: 14px; border-bottom: 1px solid #2d2b55; color: #cbd5e1; }
        
        .status-badge { padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: bold; text-transform: uppercase; }
        .status-submitted { background: rgba(59, 130, 246, 0.2); color: #3b82f6; }
        .status-approved { background: rgba(16, 185, 129, 0.2); color: #10b981; }
        .status-rejected { background: rgba(239, 68, 68, 0.2); color: #ef4444; }

        .admin-actions { display: flex; gap: 8px; }
        .action-btn { border: none; padding: 6px 10px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: bold; transition: 0.2s; }
        .btn-approve { background: #10b981; color: white; }
        .btn-reject { background: #ef4444; color: white; }
        .action-btn:hover { opacity: 0.8; transform: translateY(-1px); }
      `}</style>

      <div className="leave-form-card">
        <h3>Apply for Leave</h3>
        <form onSubmit={handleSubmit} className="form-grid">
          <div className="input-group">
            <label>Leave Date</label>
            <input type="date" className="leave-input" value={formData.Date} onChange={(e) => setFormData({...formData, Date: e.target.value})} required />
          </div>
          <div className="input-group">
            <label>Reason</label>
            <input type="text" className="leave-input" placeholder="e.g. Sick Leave" value={formData.Reason} onChange={(e) => setFormData({...formData, Reason: e.target.value})} required />
          </div>
          <button type="submit" className="apply-btn" style={{background: '#7c3aed', color: 'white', padding: '12px', border: 'none', borderRadius: '8px', cursor: 'pointer'}} disabled={loading}>
            {loading ? "..." : "Submit"}
          </button>
        </form>
      </div>

      <div className="leave-table-card">
        <h3>Leave History & Requests</h3>
        <table className="custom-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Employee</th>
              <th>Reason</th>
              <th>Status</th>
              {(userRole === "Admin" || userRole === "SuperAdmin") && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {leaves.map((leave) => (
              <tr key={leave._id}>
                <td>{leave.Date}</td>
                <td>{leave.EmployeeEmail}</td>
                <td>{leave.Reason}</td>
                <td>
                  <span className={`status-badge status-${(leave.Status || 'submitted').toLowerCase()}`}>
                    {leave.Status || 'Submitted'}
                  </span>
                </td>
                {(userRole === "Admin" || userRole === "SuperAdmin") && (
                  <td>
                    <div className="admin-actions">
                      <button onClick={() => handleStatusUpdate(leave._id, 'Approved')} className="action-btn btn-approve">Approve</button>
                      <button onClick={() => handleStatusUpdate(leave._id, 'Rejected')} className="action-btn btn-reject">Reject</button>
                    </div>
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

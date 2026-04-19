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
      fetchLeaves();
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

  return (
    <div className="leave-mgmt-container">
      <style>{`
        .leave-mgmt-container { 
          padding: 40px; 
          color: #f8fafc; 
          font-family: sans-serif; 
          background-color: #0b0a1a;
          min-height: 100vh;
        }
        .leave-form-card, .leave-table-card { 
          background: #12112a; 
          border: 1px solid #8b5cf6; 
          padding: 30px; 
          border-radius: 20px; 
          margin-bottom: 30px; 
        }
        .form-grid { display: grid; grid-template-columns: 1fr 2fr 150px; gap: 20px; align-items: flex-end; }
        .input-group label { font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 8px; display: block; }
        .leave-input { background: #0b0a1a; border: 1px solid #8b5cf6; color: white; padding: 12px; border-radius: 8px; width: 100%; box-sizing: border-box; }
        
        .table-wrapper {
          border: 1px solid #8b5cf6;
          border-radius: 12px;
          overflow: hidden;
        }
        .custom-table { 
          width: 100%; 
          border-collapse: collapse; 
          table-layout: auto; 
        }
        .custom-table th, .custom-table td {
          border: 1px solid #8b5cf6;
          padding: 15px;
        }
        .custom-table th { 
          text-align: left; 
          font-size: 11px; 
          color: #94a3b8; 
          text-transform: uppercase; 
          background-color: #12112a;
        }
        .custom-table td { 
          font-size: 14px; 
          color: #e2e8f0; 
          vertical-align: middle;
          background-color: #12112a;
        }
        .custom-table tr:hover td {
          background-color: #1a1935;
        }
        
        .status-badge { padding: 6px 14px; border-radius: 20px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; display: inline-block; min-width: 80px; text-align: center; }
        .status-submitted { background: rgba(59, 130, 246, 0.15); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3); }
        .status-approved { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
        .status-rejected { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }

        .admin-actions { display: flex; gap: 8px; justify-content: flex-start; }
        .action-btn { border: none; padding: 10px 16px; border-radius: 8px; cursor: pointer; font-size: 10px; font-weight: 900; text-transform: uppercase; transition: all 0.2s ease; display: flex; align-items: center; justify-content: center; }
        .btn-approve { background: #10b981; color: white; box-shadow: 0 4px 14px 0 rgba(16, 185, 129, 0.3); }
        .btn-reject { background: #ef4444; color: white; box-shadow: 0 4px 14px 0 rgba(239, 68, 68, 0.3); }
        .action-btn:hover:not(:disabled) { transform: translateY(-2px); filter: brightness(1.1); }
        .action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>

      <div className="leave-form-card">
        <h3>Apply for Leave</h3>
        <form onSubmit={handleSubmit} className="form-grid">
          <div className="input-group">
            <label>Leave Date</label>
            <input type="date" className="leave-input" value={formData.Date} onChange={(e) => setFormData({...formData, Date: e.target.value})} required />
          </div>
          <div className="input-group">
            <label>Reason for Absence</label>
            <input type="text" className="leave-input" placeholder="e.g. Family Emergency" value={formData.Reason} onChange={(e) => setFormData({...formData, Reason: e.target.value})} required />
          </div>
          <button type="submit" className="action-btn" style={{background: '#8b5cf6', padding: '12px', width: '100%'}} disabled={loading}>
            {loading ? "WAIT..." : "SUBMIT"}
          </button>
        </form>
      </div>

      <div className="leave-table-card">
        <h3>Leave History & Requests</h3>
        <div className="table-wrapper">
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
                  <td style={{color: '#94a3b8'}}>{leave.EmployeeEmail}</td>
                  <td>{leave.Reason}</td>
                  <td>
                    <span className={`status-badge status-${(leave.Status || 'submitted').toLowerCase()}`}>
                      {leave.Status || 'Submitted'}
                    </span>
                  </td>
                  {(userRole === "Admin" || userRole === "SuperAdmin") && (
                    <td>
                      {(!leave.Status || leave.Status === "Submitted") ? (
                        <div className="admin-actions">
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
                        <span style={{color: '#94a3b8', fontSize: '11px', fontStyle: 'italic'}}>Processed</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default LeaveManagement;

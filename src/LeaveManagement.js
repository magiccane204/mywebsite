import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";

// 1. Setup API with FIXED baseURL
// By using "/api", it correctly targets your Express routes without doubling the prefix
const api = axios.create({
  baseURL: "/api"
});

// Interceptor to attach the token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

function LeaveManagement() {
  const [leaves, setLeaves] = useState([]);
  const [formData, setFormData] = useState({ Date: "", Reason: "" });
  const [loading, setLoading] = useState(false);

  // 2. FETCH LEAVES - Path changed from "/api/leaves" to "/leaves"
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

  // 3. SUBMIT LEAVE REQUEST - Path changed from "/api/leaves" to "/leaves"
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/leaves", formData);
      setFormData({ Date: "", Reason: "" }); // Reset form
      fetchLeaves(); // Refresh list
      alert("Leave applied successfully!");
    } catch (err) {
      alert("Error applying for leave. Please check all fields.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="leave-mgmt-container">
      <style>{`
        .leave-mgmt-container { padding: 40px; }
        
        /* FORM STYLING */
        .leave-form-card { 
          background: #1a1935; border: 1px solid #2d2b55; 
          padding: 30px; border-radius: 20px; margin-bottom: 30px; 
        }
        .form-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 20px; align-items: flex-end; }
        .input-group { display: flex; flex-direction: column; gap: 8px; }
        .input-group label { font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; }
        
        .leave-input { 
          background: #0b0a1a; border: 1px solid #2d2b55; color: white; 
          padding: 12px; border-radius: 8px; outline: none; 
        }
        .leave-input:focus { border-color: #7c3aed; }

        .apply-btn { 
          background: #7c3aed; color: white; border: none; 
          padding: 12px; border-radius: 8px; font-weight: bold; 
          cursor: pointer; transition: 0.3s;
        }
        .apply-btn:hover { background: #6d28d9; }

        /* TABLE STYLING */
        .leave-table-card { background: #1a1935; border: 1px solid #2d2b55; border-radius: 20px; overflow: hidden; }
        .table-header { padding: 20px 25px; border-bottom: 1px solid #2d2b55; }
        
        .custom-table { width: 100%; border-collapse: collapse; }
        .custom-table th { text-align: left; padding: 15px 25px; font-size: 11px; color: #64748b; text-transform: uppercase; }
        .custom-table td { padding: 18px 25px; font-size: 14px; border-bottom: 1px solid #2d2b55; }
        
        .status-badge { 
          background: rgba(16, 185, 129, 0.1); color: #10b981; 
          padding: 5px 12px; border-radius: 20px; font-size: 11px; font-weight: bold; 
        }
      `}</style>

      {/* --- SECTION 1: APPLY LEAVE --- */}
      <div className="leave-form-card">
        <h3 style={{marginBottom: '20px'}}>Apply for Leave</h3>
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
              placeholder="e.g. Family Emergency, Sick Leave"
              value={formData.Reason}
              onChange={(e) => setFormData({...formData, Reason: e.target.value})}
              required
            />
          </div>
          <button type="submit" className="apply-btn" disabled={loading}>
            {loading ? "Processing..." : "Submit Application"}
          </button>
        </form>
      </div>

      {/* --- SECTION 2: LEAVE HISTORY --- */}
      <div className="leave-table-card">
        <div className="table-header">
          <h3>Leave History & Requests</h3>
        </div>
        <table className="custom-table">
          <thead>
            <tr>
              <th>Request Date</th>
              <th>Employee Email</th>
              <th>Reason</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {leaves.length > 0 ? leaves.map((leave) => (
              <tr key={leave._id}>
                <td style={{fontWeight: '700'}}>{leave.Date}</td>
                <td style={{color: '#94a3b8'}}>{leave.EmployeeEmail}</td>
                <td>{leave.Reason}</td>
                <td><span className="status-badge">Submitted</span></td>
              </tr>
            )) : (
              <tr>
                <td colSpan="4" style={{textAlign: 'center', color: '#64748b', padding: '40px'}}>
                  No leave records found in the system.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default LeaveManagement;

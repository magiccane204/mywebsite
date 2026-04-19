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
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const userRole = localStorage.getItem("userRole");

  const fetchLeaves = useCallback(async () => {
    try {
      const res = await api.get("/leaves");
      setLeaves(res.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.Date) return;
    setLoading(true);
    try {
      await api.post("/leaves", formData);
      setFormData({ Date: "", Reason: "" });
      fetchLeaves();
    } catch (err) {
      console.error(err);
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
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }
    
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isSelected = formData.Date === dateStr;
      
      days.push(
        <div 
          key={d} 
          className={`calendar-day ${isSelected ? 'selected' : ''}`}
          onClick={() => setFormData({...formData, Date: dateStr})}
        >
          {d}
        </div>
      );
    }
    return days;
  };

  const changeMonth = (offset) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1));
  };

  return (
    <div id="leave-module-root" className="leave-mgmt-container">
      <style>{`
        #leave-module-root { 
          padding: 40px; 
          color: #f8fafc; 
          font-family: sans-serif; 
          background-color: #0b0a1a; 
          min-height: 100vh;
          box-sizing: border-box;
          width: 100%;
        }
        #leave-module-root * { box-sizing: border-box; }
        #leave-module-root .leave-form-card, 
        #leave-module-root .leave-table-card { 
          background: #12112a; 
          border: 1px solid #8b5cf6; 
          padding: 30px; 
          border-radius: 20px; 
          margin-bottom: 30px; 
        }
        #leave-module-root .form-layout { display: flex; gap: 30px; flex-wrap: wrap; align-items: flex-start; }
        #leave-module-root .calendar-section { flex: 0 0 350px; border: 1px solid #8b5cf6; border-radius: 15px; padding: 20px; background: #0b0a1a; }
        #leave-module-root .calendar-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        #leave-module-root .month-year-display { text-align: center; line-height: 1.2; }
        #leave-module-root .month-year-display div:first-child { font-weight: 900; color: #8b5cf6; text-transform: uppercase; font-size: 14px; }
        #leave-module-root .month-year-display div:last-child { font-weight: bold; color: #f8fafc; font-size: 16px; }
        #leave-module-root .nav-btn { background: #12112a; border: 1px solid #8b5cf6; color: #8b5cf6; cursor: pointer; border-radius: 8px; width: 35px; height: 35px; display: flex; align-items: center; justify-content: center; font-weight: bold; transition: 0.2s; }
        #leave-module-root .nav-btn:hover { background: #8b5cf6; color: white; }
        #leave-module-root .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 5px; text-align: center; }
        #leave-module-root .weekday { font-size: 11px; color: #94a3b8; font-weight: bold; padding-bottom: 15px; }
        #leave-module-root .calendar-day { aspect-ratio: 1/1; display: flex; align-items: center; justify-content: center; cursor: pointer; border-radius: 50%; font-size: 13px; transition: 0.2s; border: 1px solid transparent; }
        #leave-module-root .calendar-day:hover:not(.empty) { background: rgba(139, 92, 246, 0.2); border-color: #8b5cf6; }
        #leave-module-root .calendar-day.selected { background: #8b5cf6; color: white; font-weight: bold; box-shadow: 0 0 10px rgba(139, 92, 246, 0.5); }
        #leave-module-root .details-section { flex: 1; min-width: 300px; display: flex; flex-direction: column; gap: 20px; }
        #leave-module-root .input-group label { font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 8px; display: block; }
        #leave-module-root .leave-input { background: #0b0a1a; border: 1px solid #8b5cf6; color: white; padding: 12px; border-radius: 8px; width: 100%; box-sizing: border-box; }
        #leave-module-root .table-wrapper { border: 1px solid #8b5cf6; border-radius: 12px; overflow: hidden; }
        #leave-module-root .custom-table { width: 100%; border-collapse: collapse; }
        #leave-module-root .custom-table th, 
        #leave-module-root .custom-table td { border: 1px solid #8b5cf6; padding: 15px; }
        #leave-module-root .custom-table th { text-align: left; font-size: 11px; color: #94a3b8; text-transform: uppercase; background-color: #12112a; }
        #leave-module-root .custom-table td { font-size: 14px; color: #e2e8f0; background-color: #12112a; }
        #leave-module-root .status-badge { padding: 6px 14px; border-radius: 20px; font-size: 10px; font-weight: 800; text-transform: uppercase; display: inline-block; min-width: 80px; text-align: center; }
        #leave-module-root .status-approved { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
        #leave-module-root .status-rejected { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }
        #leave-module-root .action-btn { border: none; padding: 12px; border-radius: 8px; cursor: pointer; font-size: 10px; font-weight: 900; text-transform: uppercase; transition: 0.2s; }
        #leave-module-root .btn-primary { background: #8b5cf6; color: white; width: 100%; }
        #leave-module-root .btn-approve { background: #10b981; color: white; margin-right: 5px; }
        #leave-module-root .btn-reject { background: #ef4444; color: white; }
      `}</style>

      <div className="leave-form-card">
        <h3 style={{ marginBottom: '25px' }}>Apply for Leave</h3>
        <form onSubmit={handleSubmit} className="form-layout">
          <div className="calendar-section">
            <div className="calendar-header">
              <button type="button" className="nav-btn" onClick={() => changeMonth(-1)}>{"<"}</button>
              <div className="month-year-display">
                <div>{currentMonth.toLocaleString('default', { month: 'long' })}</div>
                <div>{currentMonth.getFullYear()}</div>
              </div>
              <button type="button" className="nav-btn" onClick={() => changeMonth(1)}>{">"}</button>
            </div>
            <div className="calendar-grid">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="weekday">{d}</div>)}
              {renderCalendar()}
            </div>
          </div>

          <div className="details-section">
            <div className="input-group">
              <label>Selected Leave Date</label>
              <input type="text" className="leave-input" value={formData.Date} readOnly placeholder="Select a date from calendar" />
            </div>
            <div className="input-group">
              <label>Reason for Absence</label>
              <textarea 
                className="leave-input" 
                style={{ height: '145px', resize: 'none' }} 
                placeholder="Briefly explain your reason for leave..."
                value={formData.Reason}
                onChange={(e) => setFormData({...formData, Reason: e.target.value})}
                required
              />
            </div>
            <button type="submit" className="action-btn btn-primary" disabled={loading}>
              {loading ? "SENDING REQUEST..." : "SUBMIT LEAVE APPLICATION"}
            </button>
          </div>
        </form>
      </div>

      <div className="leave-table-card">
        <h3 style={{ marginBottom: '20px' }}>Leave History & Requests</h3>
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
                  <td style={{ fontWeight: 'bold' }}>{leave.Date}</td>
                  <td style={{ color: '#94a3b8' }}>{leave.EmployeeEmail}</td>
                  <td>{leave.Reason}</td>
                  <td>
                    <span className={`status-badge status-${(leave.Status || 'submitted').toLowerCase()}`}>
                      {leave.Status || 'Submitted'}
                    </span>
                  </td>
                  {(userRole === "Admin" || userRole === "SuperAdmin") && (
                    <td>
                      {(!leave.Status || leave.Status === "Submitted") ? (
                        <div style={{ display: 'flex' }}>
                          <button onClick={() => handleStatusUpdate(leave._id, 'Approved')} className="action-btn btn-approve">Approve</button>
                          <button onClick={() => handleStatusUpdate(leave._id, 'Rejected')} className="action-btn btn-reject">Reject</button>
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '11px', fontStyle: 'italic' }}>Processed</span>
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

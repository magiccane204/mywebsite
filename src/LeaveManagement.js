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
  const [formData, setFormData] = useState({ startDate: "", endDate: "", Reason: "" });
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
    if (!formData.startDate || !formData.endDate) return;
    setLoading(true);
    try {
      const dateRange = `${formData.startDate} to ${formData.endDate}`;
      await api.post("/leaves", { Date: dateRange, Reason: formData.Reason });
      setFormData({ startDate: "", endDate: "", Reason: "" });
      fetchLeaves();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDateClick = (dateStr) => {
    if (!formData.startDate || (formData.startDate && formData.endDate)) {
      setFormData({ ...formData, startDate: dateStr, endDate: "" });
    } else {
      if (new Date(dateStr) < new Date(formData.startDate)) {
        setFormData({ ...formData, startDate: dateStr, endDate: "" });
      } else {
        setFormData({ ...formData, endDate: dateStr });
      }
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
      
      let className = "calendar-day";
      if (dateStr === formData.startDate) className += " selected start-date";
      if (dateStr === formData.endDate) className += " selected end-date";
      if (formData.startDate && formData.endDate && 
          new Date(dateStr) > new Date(formData.startDate) && 
          new Date(dateStr) < new Date(formData.endDate)) {
        className += " in-range";
      }
      
      days.push(
        <div 
          key={d} 
          className={className}
          onClick={() => handleDateClick(dateStr)}
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
          color: #1e293b; 
          font-family: 'Inter', sans-serif; 
          background-color: #f8fafc; 
          min-height: 100vh; 
          box-sizing: border-box; 
          width: 100%; 
        }
        #leave-module-root * { box-sizing: border-box; }
        #leave-module-root h3 { color: #0f172a; font-weight: 700; font-size: 1.1rem; }
        
        #leave-module-root .leave-form-card, #leave-module-root .leave-table-card { 
          background: #ffffff; 
          border: 1px solid #e2e8f0; 
          padding: 30px; 
          border-radius: 20px; 
          margin-bottom: 30px; 
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
        }
        
        #leave-module-root .form-layout { display: flex; gap: 30px; flex-wrap: wrap; align-items: flex-start; }
        
        #leave-module-root .calendar-section { flex: 0 0 350px; border: 1px solid #e2e8f0; border-radius: 15px; padding: 20px; background: #ffffff; }
        #leave-module-root .calendar-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        #leave-module-root .month-year-display { text-align: center; line-height: 1.2; }
        #leave-module-root .month-year-display div:first-child { font-weight: 800; color: #a855f7; text-transform: uppercase; font-size: 14px; }
        #leave-module-root .nav-btn { background: #f1f5f9; border: 1px solid #e2e8f0; color: #64748b; cursor: pointer; border-radius: 8px; width: 35px; height: 35px; display: flex; align-items: center; justify-content: center; font-weight: bold; transition: all 0.2s; }
        #leave-module-root .nav-btn:hover { background: #e2e8f0; color: #0f172a; }
        
        #leave-module-root .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 5px; text-align: center; }
        #leave-module-root .weekday { font-size: 11px; color: #94a3b8; font-weight: 700; padding-bottom: 15px; text-transform: uppercase; }
        #leave-module-root .calendar-day { aspect-ratio: 1/1; display: flex; align-items: center; justify-content: center; cursor: pointer; border-radius: 8px; font-size: 13px; transition: 0.2s; color: #334155; }
        #leave-module-root .calendar-day:hover:not(.empty) { background: #f1f5f9; }
        #leave-module-root .calendar-day.selected { background: #a855f7; color: white; font-weight: 700; }
        #leave-module-root .calendar-day.in-range { background: #f3e8ff; border-radius: 0; color: #7e22ce; }
        
        #leave-module-root .details-section { flex: 1; min-width: 300px; display: flex; flex-direction: column; gap: 20px; }
        #leave-module-root .date-inputs { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        #leave-module-root .input-group label { font-size: 12px; font-weight: 600; color: #475569; margin-bottom: 8px; display: block; }
        #leave-module-root .leave-input { background: #f8fafc; border: 1px solid #e2e8f0; color: #1e293b; padding: 12px; border-radius: 12px; width: 100%; transition: border 0.2s; }
        #leave-module-root .leave-input:focus { border-color: #a855f7; outline: none; }
        
        #leave-module-root .table-wrapper { border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
        #leave-module-root .custom-table { width: 100%; border-collapse: collapse; background: white; }
        #leave-module-root .custom-table th, #leave-module-root .custom-table td { border: 1px solid #e2e8f0; padding: 15px; }
        #leave-module-root .custom-table th { text-align: left; font-size: 11px; color: #64748b; text-transform: uppercase; background-color: #f1f5f9; font-weight: 700; }
        #leave-module-root .custom-table td { font-size: 14px; color: #334155; }
        
        #leave-module-root .status-badge { padding: 6px 14px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; display: inline-block; min-width: 80px; text-align: center; }
        #leave-module-root .status-approved { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
        #leave-module-root .status-rejected { background: #fee2e2; color: #b91c1c; border: 1px solid #fecaca; }
        #leave-module-root .status-submitted { background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; }

        #leave-module-root .action-btn { border: none; padding: 12px; border-radius: 12px; cursor: pointer; font-size: 12px; font-weight: 700; transition: all 0.2s; }
        #leave-module-root .btn-primary { background: #a855f7; color: white; width: 100%; box-shadow: 0 4px 14px 0 rgba(168, 85, 247, 0.39); }
        #leave-module-root .btn-primary:hover { background: #9333ea; transform: translateY(-1px); }
        
        #leave-module-root .btn-approve { background: #22c55e; color: white; margin-right: 5px; }
        #leave-module-root .btn-reject { background: #ef4444; color: white; }
      `}</style>

      <div className="leave-form-card">
        <h3>Apply for Vacation / Leave</h3>
        <form onSubmit={handleSubmit} className="form-layout">
          <div className="calendar-section">
            <div className="calendar-header">
              <button type="button" className="nav-btn" onClick={() => changeMonth(-1)}>{"<"}</button>
              <div className="month-year-display">
                <div>{currentMonth.toLocaleString('default', { month: 'long' })}</div>
                <div style={{fontSize: '14px', color: '#64748b'}}>{currentMonth.getFullYear()}</div>
              </div>
              <button type="button" className="nav-btn" onClick={() => changeMonth(1)}>{">"}</button>
            </div>
            <div className="calendar-grid">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="weekday">{d}</div>)}
              {renderCalendar()}
            </div>
          </div>

          <div className="details-section">
            <div className="date-inputs">
              <div className="input-group">
                <label>From Date</label>
                <input type="text" className="leave-input" value={formData.startDate} readOnly placeholder="Select start" />
              </div>
              <div className="input-group">
                <label>To Date</label>
                <input type="text" className="leave-input" value={formData.endDate} readOnly placeholder="Select end" />
              </div>
            </div>
            <div className="input-group">
              <label>Reason for Absence</label>
              <textarea 
                className="leave-input" 
                style={{ height: '110px', resize: 'none' }} 
                placeholder="Briefly describe the reason for your leave request..."
                value={formData.Reason}
                onChange={(e) => setFormData({...formData, Reason: e.target.value})}
                required
              />
            </div>
            <button type="submit" className="action-btn btn-primary" disabled={loading}>
              {loading ? "PROCESSING..." : "SUBMIT LEAVE REQUEST"}
            </button>
          </div>
        </form>
      </div>

      <div className="leave-table-card">
        <h3>Leave History & Requests</h3>
        <div className="table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Date / Range</th>
                <th>Employee Email</th>
                <th>Reason</th>
                <th>Status</th>
                {(userRole === "Admin" || userRole === "SuperAdmin") && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {leaves.map((leave) => (
                <tr key={leave._id}>
                  <td style={{ fontWeight: '600' }}>{leave.Date}</td>
                  <td style={{ color: '#64748b' }}>{leave.EmployeeEmail}</td>
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
                        <span style={{ color: '#94a3b8', fontSize: '12px', fontStyle: 'italic' }}>Processed</span>
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

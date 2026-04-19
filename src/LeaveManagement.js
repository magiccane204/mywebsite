import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";

const api = axios.create({ baseURL: "/api" });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

function LeaveManagement({ user, isDarkMode }) {
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
        <div key={d} className={className} onClick={() => handleDateClick(dateStr)}>
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
    <div id="leave-module-root" className={`leave-mgmt-container ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <style>{`
        #leave-module-root { padding: 20px 0; width: 100%; }
        #leave-module-root * { box-sizing: border-box; }
        
        .dark-mode {
          --bg-main: #0b0a1a;
          --bg-card: #12112a;
          --text-main: #ffffff;
          --text-dim: #94a3b8;
          --accent-purple: #8b5cf6;
        }
        
        .light-mode {
          --bg-main: #f8fafc;
          --bg-card: #ffffff;
          --text-main: #0f172a;
          --text-dim: #64748b;
          --accent-purple: #a855f7;
        }

        #leave-module-root .leave-form-card, #leave-module-root .leave-table-card { 
          background: var(--bg-card); 
          border: 1px solid var(--accent-purple); 
          padding: 30px; 
          border-radius: 20px; 
          margin-bottom: 30px; 
        }
        
        #leave-module-root .form-layout { display: flex; gap: 30px; flex-wrap: wrap; }
        #leave-module-root .calendar-section { flex: 0 0 350px; border: 1px solid var(--accent-purple); border-radius: 15px; padding: 20px; background: var(--bg-main); }
        
        #leave-module-root .calendar-day { aspect-ratio: 1/1; display: flex; align-items: center; justify-content: center; cursor: pointer; border-radius: 8px; font-size: 13px; color: var(--text-main); }
        #leave-module-root .calendar-day.selected { background: var(--accent-purple); color: white; font-weight: 700; }
        #leave-module-root .calendar-day.in-range { background: rgba(139, 92, 246, 0.2); border-radius: 0; }
        
        #leave-module-root .leave-input { background: var(--bg-main); border: 1px solid var(--accent-purple); color: var(--text-main); padding: 12px; border-radius: 12px; width: 100%; }
        
        /* RESTORED PURPLE TABLE DESIGN */
        #leave-module-root .table-wrapper { 
          border: 1px solid var(--accent-purple); 
          border-radius: 12px; 
          overflow: hidden; 
        }
        #leave-module-root .custom-table { 
          width: 100%; 
          border-collapse: collapse; 
          background: var(--bg-card); 
        }
        #leave-module-root .custom-table th, 
        #leave-module-root .custom-table td { 
          border: 1px solid var(--accent-purple); 
          padding: 18px 15px; 
          color: var(--text-main);
          text-align: center;
        }
        #leave-module-root .custom-table th { 
          font-size: 11px; 
          color: var(--text-dim); 
          text-transform: uppercase; 
          background: var(--bg-main); 
          font-weight: 800;
          letter-spacing: 1px;
        }
        
        #leave-module-root .status-approved { background: rgba(34, 197, 94, 0.1); color: #22c55e; border: 1px solid #22c55e; padding: 6px 14px; border-radius: 20px; font-weight: 800; font-size: 10px; text-transform: uppercase; display: inline-block; }
        #leave-module-root .status-rejected { background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid #ef4444; padding: 6px 14px; border-radius: 20px; font-weight: 800; font-size: 10px; text-transform: uppercase; display: inline-block; }
        #leave-module-root .status-submitted { background: rgba(56, 189, 248, 0.1); color: #38bdf8; border: 1px solid #38bdf8; padding: 6px 14px; border-radius: 20px; font-weight: 800; font-size: 10px; text-transform: uppercase; display: inline-block; }

        #leave-module-root .btn-primary { background: var(--accent-purple); color: white; border: none; padding: 14px; border-radius: 12px; font-weight: 800; cursor: pointer; width: 100%; }
      `}</style>

      <div className="leave-form-card">
        <h3 style={{ marginBottom: '25px', color: 'var(--text-main)', fontWeight: 800 }}>Apply for Leave</h3>
        <form onSubmit={handleSubmit} className="form-layout">
          <div className="calendar-section">
            <div className="calendar-header" style={{display:'flex', justifySpaceBetween:'center', alignItems:'center', marginBottom:'15px', justifyContent: 'space-between'}}>
              <button type="button" onClick={() => changeMonth(-1)} style={{background:'none', border:'none', color:'var(--accent-purple)', cursor:'pointer', fontSize:'18px', fontWeight: 'bold'}}>❮</button>
              <div className="month-year-display" style={{textAlign:'center'}}>
                <div style={{fontWeight: 800, color: 'var(--accent-purple)', textTransform: 'uppercase'}}>{currentMonth.toLocaleString('default', { month: 'long' })}</div>
                <div style={{color:'var(--text-dim)', fontSize:'12px'}}>{currentMonth.getFullYear()}</div>
              </div>
              <button type="button" onClick={() => changeMonth(1)} style={{background:'none', border:'none', color:'var(--accent-purple)', cursor:'pointer', fontSize:'18px', fontWeight: 'bold'}}>❯</button>
            </div>
            <div className="calendar-grid" style={{display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:'5px'}}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} style={{fontSize:'10px', color:'var(--text-dim)', textAlign:'center', fontWeight:800}}>{d}</div>)}
              {renderCalendar()}
            </div>
          </div>

          <div className="details-section" style={{flex: 1, display: 'flex', flexDirection: 'column', gap: '20px'}}>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px'}}>
              <div className="input-group">
                <label style={{fontSize:'11px', fontWeight:800, color:'var(--text-dim)', display:'block', marginBottom:'8px'}}>FROM</label>
                <input type="text" className="leave-input" value={formData.startDate} readOnly />
              </div>
              <div className="input-group">
                <label style={{fontSize:'11px', fontWeight:800, color:'var(--text-dim)', display:'block', marginBottom:'8px'}}>TO</label>
                <input type="text" className="leave-input" value={formData.endDate} readOnly />
              </div>
            </div>
            <div className="input-group">
              <label style={{fontSize:'11px', fontWeight:800, color:'var(--text-dim)', display:'block', marginBottom:'8px'}}>REASON</label>
              <textarea 
                className="leave-input" 
                style={{height:'115px', resize:'none'}} 
                value={formData.Reason} 
                onChange={(e) => setFormData({...formData, Reason: e.target.value})} 
                required 
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "SENDING..." : "SUBMIT REQUEST"}
            </button>
          </div>
        </form>
      </div>

      <div className="leave-table-card">
        <h3 style={{ marginBottom: '25px', color: 'var(--text-main)', fontWeight: 800 }}>Leave History & Requests</h3>
        <div className="table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Date Range</th>
                <th>Reason</th>
                <th>Status</th>
                {(userRole === "Admin" || userRole === "SuperAdmin") && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {leaves.map((leave) => (
                <tr key={leave._id}>
                  <td style={{fontWeight: 800, color: 'var(--text-main)'}}>{leave.Date}</td>
                  <td style={{color:'var(--text-main)'}}>{leave.Reason}</td>
                  <td>
                    <span className={`status-${(leave.Status || 'submitted').toLowerCase()}`}>
                      {leave.Status || 'Submitted'}
                    </span>
                  </td>
                  {(userRole === "Admin" || userRole === "SuperAdmin") && (
                    <td>
                      {(!leave.Status || leave.Status === "Submitted") ? (
                        <div style={{display:'flex', gap:'8px', justifyContent: 'center'}}>
                          <button onClick={() => handleStatusUpdate(leave._id, 'Approved')} style={{background:'#22c55e', color:'white', border:'none', padding:'8px 15px', borderRadius:'8px', cursor:'pointer', fontWeight:800}}>Approve</button>
                          <button onClick={() => handleStatusUpdate(leave._id, 'Rejected')} style={{background:'#ef4444', color:'white', border:'none', padding:'8px 15px', borderRadius:'8px', cursor:'pointer', fontWeight:800}}>Reject</button>
                        </div>
                      ) : <span style={{fontSize:'11px', color:'var(--text-dim)', fontStyle:'italic'}}>Processed</span>}
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

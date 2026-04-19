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
          --bg-card: #161533;
          --bg-input: #0b0a1a;
          --text-main: #ffffff;
          --text-dim: #94a3b8;
          --border: #2d2b55;
          --shadow: 0 10px 30px rgba(0,0,0,0.4);
        }
        
        .light-mode {
          --bg-card: #ffffff;
          --bg-input: #f8fafc;
          --text-main: #0f172a;
          --text-dim: #64748b;
          --border: #e2e8f0;
          --shadow: 0 4px 15px rgba(0,0,0,0.05);
        }

        #leave-module-root .leave-form-card, #leave-module-root .leave-table-card { 
          background: var(--bg-card); border: 1px solid var(--border); 
          padding: 30px; border-radius: 20px; margin-bottom: 30px; box-shadow: var(--shadow);
        }
        
        #leave-module-root .form-layout { display: flex; gap: 30px; flex-wrap: wrap; }
        #leave-module-root .calendar-section { flex: 0 0 350px; border: 1px solid var(--border); border-radius: 15px; padding: 20px; background: var(--bg-input); }
        #leave-module-root .month-year-display div:first-child { font-weight: 800; color: #7c3aed; text-transform: uppercase; font-size: 14px; }
        
        #leave-module-root .calendar-day { aspect-ratio: 1/1; display: flex; align-items: center; justify-content: center; cursor: pointer; border-radius: 8px; font-size: 13px; color: var(--text-main); }
        #leave-module-root .calendar-day.selected { background: #7c3aed; color: white; font-weight: 700; }
        #leave-module-root .calendar-day.in-range { background: rgba(124, 58, 237, 0.2); border-radius: 0; color: #7c3aed; }
        
        #leave-module-root .leave-input { background: var(--bg-input); border: 1px solid var(--border); color: var(--text-main); padding: 12px; border-radius: 12px; width: 100%; }
        #leave-module-root .custom-table { width: 100%; border-collapse: collapse; background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
        #leave-module-root .custom-table th, #leave-module-root .custom-table td { border: 1px solid var(--border); padding: 15px; }
        #leave-module-root .custom-table th { text-align: left; font-size: 11px; color: var(--text-dim); text-transform: uppercase; background: var(--bg-input); }
        
        #leave-module-root .status-approved { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; padding: 5px 12px; border-radius: 20px; font-weight: 700; font-size: 10px; }
        #leave-module-root .status-rejected { background: #fee2e2; color: #b91c1c; border: 1px solid #fecaca; padding: 5px 12px; border-radius: 20px; font-weight: 700; font-size: 10px; }
        #leave-module-root .btn-primary { background: #7c3aed; color: white; border: none; padding: 14px; border-radius: 12px; font-weight: 800; cursor: pointer; width: 100%; margin-top: 10px; }
      `}</style>

      <div className="leave-form-card">
        <h3 style={{ marginBottom: '20px', color: 'var(--text-main)' }}>Leave & Vacation Request</h3>
        <form onSubmit={handleSubmit} className="form-layout">
          <div className="calendar-section">
            <div className="calendar-header" style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
              <button type="button" onClick={() => changeMonth(-1)} style={{background:'none', border:'none', color:'#7c3aed', cursor:'pointer', fontSize:'18px'}}>❮</button>
              <div className="month-year-display" style={{textAlign:'center'}}>
                <div>{currentMonth.toLocaleString('default', { month: 'long' })}</div>
                <div style={{color:'var(--text-dim)', fontSize:'12px'}}>{currentMonth.getFullYear()}</div>
              </div>
              <button type="button" onClick={() => changeMonth(1)} style={{background:'none', border:'none', color:'#7c3aed', cursor:'pointer', fontSize:'18px'}}>❯</button>
            </div>
            <div className="calendar-grid" style={{display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:'5px'}}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} style={{fontSize:'10px', color:'var(--text-dim)', textAlign:'center', fontWeight:700}}>{d}</div>)}
              {renderCalendar()}
            </div>
          </div>

          <div className="details-section" style={{flex: 1, display: 'flex', flexDirection: 'column', gap: '20px'}}>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px'}}>
              <div className="input-group">
                <label style={{fontSize:'11px', fontWeight:700, color:'var(--text-dim)', display:'block', marginBottom:'8px'}}>FROM</label>
                <input type="text" className="leave-input" value={formData.startDate} readOnly placeholder="Select start date" />
              </div>
              <div className="input-group">
                <label style={{fontSize:'11px', fontWeight:700, color:'var(--text-dim)', display:'block', marginBottom:'8px'}}>TO</label>
                <input type="text" className="leave-input" value={formData.endDate} readOnly placeholder="Select end date" />
              </div>
            </div>
            <div className="input-group">
              <label style={{fontSize:'11px', fontWeight:700, color:'var(--text-dim)', display:'block', marginBottom:'8px'}}>REASON</label>
              <textarea 
                className="leave-input" 
                style={{height:'100px', resize:'none'}} 
                value={formData.Reason} 
                onChange={(e) => setFormData({...formData, Reason: e.target.value})} 
                placeholder="Reason for absence..."
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
        <h3 style={{ marginBottom: '20px', color: 'var(--text-main)' }}>History & Requests</h3>
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
                <td style={{fontWeight:700}}>{leave.Date}</td>
                <td style={{color:'var(--text-dim)'}}>{leave.Reason}</td>
                <td><span className={`status-${(leave.Status || 'submitted').toLowerCase()}`}>{leave.Status || 'Submitted'}</span></td>
                {(userRole === "Admin" || userRole === "SuperAdmin") && (
                  <td>
                    {(!leave.Status || leave.Status === "Submitted") ? (
                      <div style={{display:'flex', gap:'8px'}}>
                        <button onClick={() => handleStatusUpdate(leave._id, 'Approved')} style={{background:'#22c55e', color:'white', border:'none', padding:'6px 12px', borderRadius:'8px', cursor:'pointer', fontWeight:700}}>✓</button>
                        <button onClick={() => handleStatusUpdate(leave._id, 'Rejected')} style={{background:'#ef4444', color:'white', border:'none', padding:'6px 12px', borderRadius:'8px', cursor:'pointer', fontWeight:700}}>✕</button>
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
  );
}

export default LeaveManagement;

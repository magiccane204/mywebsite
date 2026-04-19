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
  
  // Modal states
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showHrModal, setShowHrModal] = useState(false);
  
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
        setTimeout(() => setShowCalendarModal(false), 300); // Auto-close after selection
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

  const changeMonth = (offset) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1));
  };

  // Helper to check if a calendar date is within an approved/submitted leave
  const isDateTaken = (dateStr) => {
    return leaves.some(leave => {
      if (leave.Status === 'Rejected') return false;
      const parts = leave.Date.split(' to ');
      if (parts.length === 2) {
        return dateStr >= parts[0] && dateStr <= parts[1];
      }
      return dateStr === leave.Date;
    });
  };

  // HR Analytics calculation
  const generateHrSummary = () => {
    const summary = {};
    leaves.forEach(leave => {
      if (leave.Status === 'Rejected') return;
      
      // Assumes backend populates employeeName. Fallback for now.
      const empName = leave.employeeName || leave.userId || "Current Employee"; 
      
      const parts = leave.Date.split(' to ');
      let days = 1;
      
      if (parts.length === 2) {
        const start = new Date(parts[0]);
        const end = new Date(parts[1]);
        days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      }

      if (!summary[empName]) {
        summary[empName] = { totalDays: 0, deduction: 0 };
      }
      summary[empName].totalDays += days;
      // Rough calculation: assuming 1 day = 3.33% of a 30 day month salary
      summary[empName].deduction = ((summary[empName].totalDays / 30) * 100).toFixed(2);
    });
    return summary;
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
      
      const isTaken = isDateTaken(dateStr);
      if (isTaken) className += " taken-date";
      
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
          {isTaken && <span className="taken-dot"></span>}
        </div>
      );
    }
    return days;
  };

  return (
    <div id="leave-module-root" className={`leave-mgmt-container ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <style>{`
        #leave-module-root { padding: 20px 0; width: 100%; position: relative; }
        #leave-module-root * { box-sizing: border-box; }
        
        .dark-mode {
          --bg-main: #0b0a1a;
          --bg-card: #12112a;
          --text-main: #ffffff;
          --text-dim: #94a3b8;
          --accent-purple: #8b5cf6;
          --modal-overlay: rgba(0, 0, 0, 0.7);
        }
        
        .light-mode {
          --bg-main: #f8fafc;
          --bg-card: #ffffff;
          --text-main: #0f172a;
          --text-dim: #64748b;
          --accent-purple: #a855f7;
          --modal-overlay: rgba(15, 23, 42, 0.5);
        }

        #leave-module-root .leave-form-card, #leave-module-root .leave-table-card { 
          background: var(--bg-card); 
          border: 1px solid var(--accent-purple); 
          padding: 30px; 
          border-radius: 20px; 
          margin-bottom: 30px; 
        }
        
        #leave-module-root .header-flex { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
        #leave-module-root .form-layout { display: flex; flex-direction: column; gap: 20px; }
        
        #leave-module-root .leave-input { background: var(--bg-main); border: 1px solid var(--accent-purple); color: var(--text-main); padding: 12px; border-radius: 12px; width: 100%; }
        #leave-module-root .btn-primary { background: var(--accent-purple); color: white; border: none; padding: 14px; border-radius: 12px; font-weight: 800; cursor: pointer; width: 100%; transition: opacity 0.2s;}
        #leave-module-root .btn-primary:hover { opacity: 0.9; }
        #leave-module-root .btn-secondary { background: transparent; color: var(--accent-purple); border: 2px dashed var(--accent-purple); padding: 14px; border-radius: 12px; font-weight: 800; cursor: pointer; width: 100%; text-align: center; }
        #leave-module-root .btn-hr { background: rgba(139, 92, 246, 0.1); color: var(--accent-purple); border: 1px solid var(--accent-purple); padding: 8px 16px; border-radius: 8px; font-weight: 800; cursor: pointer; }

        /* Modal Styles */
        #leave-module-root .custom-modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: var(--modal-overlay); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
        #leave-module-root .custom-modal-content { background: var(--bg-card); border: 1px solid var(--accent-purple); border-radius: 20px; padding: 30px; width: 100%; max-width: 450px; position: relative; max-height: 90vh; overflow-y: auto; }
        #leave-module-root .modal-close { position: absolute; top: 20px; right: 20px; background: none; border: none; color: var(--text-dim); font-size: 24px; cursor: pointer; }

        /* Calendar Styles within Modal */
        #leave-module-root .calendar-day { aspect-ratio: 1/1; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; border-radius: 8px; font-size: 13px; color: var(--text-main); position: relative; }
        #leave-module-root .calendar-day.selected { background: var(--accent-purple); color: white; font-weight: 700; }
        #leave-module-root .calendar-day.in-range { background: rgba(139, 92, 246, 0.2); border-radius: 0; }
        #leave-module-root .calendar-day.taken-date { background: rgba(148, 163, 184, 0.1); opacity: 0.7; }
        #leave-module-root .taken-dot { width: 4px; height: 4px; background: var(--accent-purple); border-radius: 50%; margin-top: 2px; }
        
        #leave-module-root .table-wrapper { border: 1px solid var(--accent-purple); border-radius: 12px; overflow: hidden; }
        #leave-module-root .custom-table { width: 100%; border-collapse: collapse; background: var(--bg-card); }
        #leave-module-root .custom-table th, #leave-module-root .custom-table td { border: 1px solid var(--accent-purple); padding: 18px 15px; color: var(--text-main); text-align: center; }
        #leave-module-root .custom-table th { font-size: 11px; color: var(--text-dim); text-transform: uppercase; background: var(--bg-main); font-weight: 800; letter-spacing: 1px; }
        
        #leave-module-root .status-approved { background: rgba(34, 197, 94, 0.1); color: #22c55e; border: 1px solid #22c55e; padding: 6px 14px; border-radius: 20px; font-weight: 800; font-size: 10px; text-transform: uppercase; display: inline-block; }
        #leave-module-root .status-rejected { background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid #ef4444; padding: 6px 14px; border-radius: 20px; font-weight: 800; font-size: 10px; text-transform: uppercase; display: inline-block; }
        #leave-module-root .status-submitted { background: rgba(56, 189, 248, 0.1); color: #38bdf8; border: 1px solid #38bdf8; padding: 6px 14px; border-radius: 20px; font-weight: 800; font-size: 10px; text-transform: uppercase; display: inline-block; }
      `}</style>

      {/* --- FORM SECTION --- */}
      <div className="leave-form-card">
        <h3 style={{ marginBottom: '25px', color: 'var(--text-main)', fontWeight: 800 }}>Apply for Leave</h3>
        <form onSubmit={handleSubmit} className="form-layout">
          
          <button type="button" className="btn-secondary" onClick={() => setShowCalendarModal(true)}>
            {formData.startDate && formData.endDate 
              ? `Selected: ${formData.startDate} to ${formData.endDate}` 
              : "📅 Click to Select Dates"}
          </button>

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
        </form>
      </div>

      {/* --- TABLE SECTION --- */}
      <div className="leave-table-card">
        <div className="header-flex">
          <h3 style={{ color: 'var(--text-main)', fontWeight: 800, margin: 0 }}>Leave History & Requests</h3>
          {(userRole === "Admin" || userRole === "SuperAdmin") && (
            <button className="btn-hr" onClick={() => setShowHrModal(true)}>
              📊 HR Dashboard
            </button>
          )}
        </div>
        
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

      {/* --- CALENDAR POPUP MODAL --- */}
      {showCalendarModal && (
        <div className="custom-modal-overlay" onClick={() => setShowCalendarModal(false)}>
          <div className="custom-modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowCalendarModal(false)}>×</button>
            <h3 style={{ marginTop: 0, color: 'var(--text-main)', fontWeight: 800 }}>Select Dates</h3>
            
            <div className="calendar-header" style={{display:'flex', alignItems:'center', marginBottom:'20px', justifyContent: 'space-between', padding: '10px 0'}}>
              <button type="button" onClick={() => changeMonth(-1)} style={{background:'none', border:'none', color:'var(--accent-purple)', cursor:'pointer', fontSize:'20px', fontWeight: 'bold'}}>❮</button>
              <div className="month-year-display" style={{textAlign:'center'}}>
                <div style={{fontWeight: 800, color: 'var(--accent-purple)', textTransform: 'uppercase', fontSize: '16px'}}>{currentMonth.toLocaleString('default', { month: 'long' })}</div>
                <div style={{color:'var(--text-dim)', fontSize:'13px'}}>{currentMonth.getFullYear()}</div>
              </div>
              <button type="button" onClick={() => changeMonth(1)} style={{background:'none', border:'none', color:'var(--accent-purple)', cursor:'pointer', fontSize:'20px', fontWeight: 'bold'}}>❯</button>
            </div>
            
            <div style={{display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:'8px', marginBottom: '10px'}}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} style={{fontSize:'11px', color:'var(--text-dim)', textAlign:'center', fontWeight:800}}>{d}</div>)}
            </div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:'8px'}}>
              {renderCalendar()}
            </div>
            
            <div style={{marginTop: '25px', display: 'flex', gap: '15px', fontSize: '12px', color: 'var(--text-dim)', justifyContent: 'center'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
                <span style={{width: '12px', height: '12px', background: 'var(--accent-purple)', borderRadius: '3px'}}></span> Selected
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
                <span className="taken-dot"></span> Already Booked
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- HR DASHBOARD POPUP MODAL --- */}
      {showHrModal && (
        <div className="custom-modal-overlay" onClick={() => setShowHrModal(false)}>
          <div className="custom-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <button className="modal-close" onClick={() => setShowHrModal(false)}>×</button>
            <h3 style={{ marginTop: 0, color: 'var(--text-main)', fontWeight: 800 }}>HR Analytics & Deductions</h3>
            <p style={{ color: 'var(--text-dim)', fontSize: '13px', marginBottom: '20px' }}>
              Overview of approved/pending holidays and estimated salary impact (based on a 30-day billing cycle).
            </p>
            
            <div className="table-wrapper">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Employee / User</th>
                    <th>Total Days Off</th>
                    <th>Est. Deduction</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(generateHrSummary()).map(([emp, stats]) => (
                    <tr key={emp}>
                      <td style={{fontWeight: 800, color: 'var(--text-main)'}}>{emp}</td>
                      <td style={{color: 'var(--text-main)'}}>{stats.totalDays} Days</td>
                      <td style={{color: '#ef4444', fontWeight: 800}}>-{stats.deduction}%</td>
                    </tr>
                  ))}
                  {Object.keys(generateHrSummary()).length === 0 && (
                    <tr><td colSpan="3" style={{color: 'var(--text-dim)'}}>No leave data to calculate.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LeaveManagement;

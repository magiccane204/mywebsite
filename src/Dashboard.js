import React, { useState, useEffect, useMemo } from "react";
import GoogleMapReact from "google-map-react";

/** * --- SUB-COMPONENTS ---
 * These represent the different views of your application. 
 * In a real project, these would be in separate files.
 */

const CRM = () => (
  <div className="view-container">
    <div className="view-header">
      <h2>Customer Relationship Management</h2>
      <p>Manage your leads, deals, and customer interactions in one place.</p>
    </div>
    <div className="placeholder-content">
      <div className="table-mock">
        <div className="table-header">
          <span>Name</span><span>Status</span><span>Value</span><span>Last Contact</span>
        </div>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="table-row">
            <span>Client {i}</span>
            <span className="status-pill">Active</span>
            <span>$4,500</span>
            <span>2 days ago</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const Employee = () => (
  <div className="view-container">
    <div className="view-header">
      <h2>Employee Directory</h2>
      <button className="action-btn">+ Add Employee</button>
    </div>
    <div className="employee-grid">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} className="emp-card">
          <div className="emp-avatar"></div>
          <h4>Staff Member {i}</h4>
          <p>Department of Operations</p>
        </div>
      ))}
    </div>
  </div>
);

const TasksWorkspace = () => (
  <div className="view-container">
    <div className="view-header">
      <h2>Project Workspace</h2>
    </div>
    <div className="kanban-board">
      <div className="kanban-col">
        <h3>To Do</h3>
        <div className="kanban-item">Design Sidebar UI</div>
        <div className="kanban-item">Fix Syntax Errors</div>
      </div>
      <div className="kanban-col">
        <h3>In Progress</h3>
        <div className="kanban-item">Dashboard Integration</div>
      </div>
      <div className="kanban-col">
        <h3>Done</h3>
        <div className="kanban-item">Setup React Project</div>
      </div>
    </div>
  </div>
);

const Reports = () => (
  <div className="view-container">
    <div className="view-header">
      <h2>System Reports</h2>
    </div>
    <div className="report-list">
      <div className="report-item">Quarterly Revenue.pdf <span>Download</span></div>
      <div className="report-item">Employee Performance.xlsx <span>Download</span></div>
      <div className="report-item">Marketing Reach Q1.pdf <span>Download</span></div>
    </div>
  </div>
);

const Settings = () => (
  <div className="view-container">
    <div className="view-header">
      <h2>Settings</h2>
    </div>
    <div className="settings-form">
      <div className="form-group">
        <label>System Theme</label>
        <select><option>Light</option><option>Dark</option></select>
      </div>
      <div className="form-group">
        <label>Notifications</label>
        <input type="checkbox" defaultChecked />
      </div>
    </div>
  </div>
);

const ChatWidget = () => (
  <div className="chat-fab" title="Open Chat">
    <span role="img" aria-label="chat">💬</span>
  </div>
);

/**
 * --- MAIN DASHBOARD COMPONENT ---
 */
function Dashboard({ setMode }) {
  // --- UI STATES ---
  const [activePage, setActivePage] = useState("dashboard");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  
  // --- DATA STATES ---
  const [weather, setWeather] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [news, setNews] = useState([]);
  const [coords, setCoords] = useState({ lat: 19.076, lng: 72.877 });
  const [totalEmployees, setTotalEmployees] = useState(124);
  const [isLoading, setIsLoading] = useState(true);

  // --- RECENT UPDATES FEED ---
  const notifications = useMemo(() => [
    { id: 1, text: "New lead assigned to John Doe", time: "5m ago" },
    { id: 2, text: "Server maintenance scheduled", time: "2h ago" },
    { id: 3, text: "Payroll processing completed", time: "5h ago" },
    { id: 4, text: "New feature 'Collapse' deployed", time: "1d ago" },
  ], []);

  // --- EFFECTS ---

  // Live Clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch all dashboard data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Parallel fetching for performance
        await Promise.all([
          getWeather(),
          getStocks(),
          getNews(),
          getLocation()
        ]);
      } catch (err) {
        console.error("Dashboard data load error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- API CALLS ---

  const getWeather = async () => {
    try {
      const res = await fetch(
        "https://api.openweathermap.org/data/2.5/weather?q=Mumbai&appid=3de55583c5dce6d3730d5e7629577229&units=metric"
      );
      const data = await res.json();
      if (data.main) setWeather(data);
    } catch {}
  };

  const getStocks = async () => {
    try {
      const symbols = ["RELIANCE.BSE", "TCS.BSE"];
      const results = [];
      for (let s of symbols) {
        const res = await fetch(
          `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${s}&apikey=G8ZS20Q0VEL14JQ7`
        );
        const data = await res.json();
        if (data["Global Quote"]) {
          results.push({
            name: s.split(".")[0],
            price: data["Global Quote"]["05. price"],
            change: data["Global Quote"]["09. change"]
          });
        }
      }
      setStocks(results);
    } catch {
      setStocks([{ name: "Market Data", price: "Live", change: "+0.00" }]);
    }
  };

  const getNews = async () => {
    try {
      const res = await fetch("https://api.spaceflightnewsapi.net/v4/articles/?limit=5");
      const data = await res.json();
      setNews(data.results || []);
    } catch {}
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => console.log("Location access denied")
      );
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    if (setMode) setMode("login");
  };

  // --- COMPONENTS ---

  const SidebarItem = ({ id, icon, label }) => (
    <button 
      className={`sidebar-btn ${activePage === id ? "active" : ""}`}
      onClick={() => setActivePage(id)}
      title={isCollapsed ? label : ""}
    >
      <span className="icon">{icon}</span>
      {!isCollapsed && <span className="label">{label}</span>}
    </button>
  );

  const MapMarker = () => (
    <div className="map-marker-pin">
      <span>📍 Office</span>
    </div>
  );

  return (
    <div className="app-shell">
      {/* CRITICAL FIX: CSS styles to handle the layout, full-height sidebar, 
        and the collapsible functionality.
      */}
      <style>{`
        :root {
          --primary: #7c3aed;
          --sidebar-bg: #1e1b4b;
          --sidebar-hover: rgba(255, 255, 255, 0.1);
          --content-bg: #f3f4f6;
          --white: #ffffff;
          --sidebar-w: 260px;
          --sidebar-w-collapsed: 80px;
        }

        .app-shell {
          display: flex;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          font-family: 'Inter', sans-serif;
          background: var(--content-bg);
        }

        /* SIDEBAR */
        .sidebar {
          width: ${isCollapsed ? 'var(--sidebar-w-collapsed)' : 'var(--sidebar-w)'};
          height: 100vh;
          background: var(--sidebar-bg);
          display: flex;
          flex-direction: column;
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          color: #a5b4fc;
          flex-shrink: 0;
          z-index: 100;
        }

        .sidebar-header {
          padding: 20px;
          display: flex;
          align-items: center;
          justify-content: ${isCollapsed ? 'center' : 'space-between'};
          height: 80px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .logo-box img {
          max-height: 40px;
          display: ${isCollapsed ? 'none' : 'block'};
        }

        .toggle-arrow {
          background: rgba(255,255,255,0.1);
          border: none;
          color: white;
          border-radius: 4px;
          cursor: pointer;
          width: 30px;
          height: 30px;
        }

        .nav-items {
          flex: 1;
          padding: 20px 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .sidebar-btn {
          width: 100%;
          border: none;
          background: transparent;
          color: inherit;
          padding: 16px ${isCollapsed ? '0' : '24px'};
          display: flex;
          align-items: center;
          justify-content: ${isCollapsed ? 'center' : 'flex-start'};
          cursor: pointer;
          transition: 0.2s;
        }

        .sidebar-btn:hover {
          background: var(--sidebar-hover);
          color: white;
        }

        .sidebar-btn.active {
          background: var(--primary);
          color: white;
          box-shadow: inset 4px 0 0 white;
        }

        .sidebar-btn .icon { font-size: 20px; }
        .sidebar-btn .label { margin-left: 16px; font-weight: 500; font-size: 15px; }

        .logout-box {
          border-top: 1px solid rgba(255,255,255,0.05);
          padding: 10px 0;
        }

        /* MAIN CONTENT */
        .main-content {
          flex: 1;
          height: 100vh;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }

        .top-bar {
          background: var(--white);
          height: 70px;
          padding: 0 40px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #e5e7eb;
          position: sticky;
          top: 0;
          z-index: 50;
        }

        .time-display {
          font-weight: 700;
          color: #374151;
          font-family: monospace;
          background: #f1f5f9;
          padding: 5px 12px;
          border-radius: 6px;
        }

        /* DASHBOARD GRID */
        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 24px;
          padding: 40px;
        }

        .card {
          background: var(--white);
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .card h3 {
          margin: 0 0 15px 0;
          font-size: 0.8rem;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .big-text {
          font-size: 2.5rem;
          font-weight: 800;
          margin: 10px 0;
          color: #111827;
        }

        .map-wrapper {
          height: 280px;
          width: 100%;
          border-radius: 8px;
          overflow: hidden;
          margin-top: 15px;
          background: #e2e8f0;
        }

        .stock-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #f3f4f6;
        }

        .news-link {
          display: block;
          padding: 10px;
          margin: 5px 0;
          background: #f9fafb;
          border-radius: 6px;
          text-decoration: none;
          color: #4b5563;
          font-size: 0.85rem;
        }

        .news-link:hover { background: #f3f4f6; color: var(--primary); }

        .chat-fab {
          position: fixed;
          bottom: 30px;
          right: 30px;
          width: 60px;
          height: 60px;
          background: var(--primary);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 24px;
          cursor: pointer;
          box-shadow: 0 10px 15px -3px rgba(124, 58, 237, 0.4);
        }

        /* VIEW CONTAINER */
        .view-container { padding: 40px; }
        .view-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
        .action-btn { background: var(--primary); color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; }
        
        .map-marker-pin {
          background: #ef4444;
          color: white;
          padding: 5px 10px;
          border-radius: 20px;
          white-space: nowrap;
          transform: translate(-50%, -100%);
          font-weight: bold;
          font-size: 12px;
          border: 2px solid white;
        }
      `}</style>

      {/* SIDEBAR NAVIGATION - FULL HEIGHT */}
      <aside className="sidebar">
        <div className="sidebar-header">
          {!isCollapsed && (
            <div className="logo-box">
              <img src="D&T.png" alt="Company Logo" />
            </div>
          )}
          <button className="toggle-arrow" onClick={() => setIsCollapsed(!isCollapsed)}>
            {isCollapsed ? "→" : "←"}
          </button>
        </div>

        <nav className="nav-items">
          <SidebarItem id="dashboard" icon="🏠" label="Home" />
          <SidebarItem id="crm" icon="📊" label="Analytics" />
          <SidebarItem id="employees" icon="👥" label="Employees" />
          <SidebarItem id="workspace" icon="💼" label="Workspace" />
          <SidebarItem id="reports" icon="📈" label="Reports" />
          <SidebarItem id="settings" icon="⚙️" label="Settings" />
        </nav>

        <div className="logout-box">
          <button className="sidebar-btn" onClick={handleLogout} style={{ color: '#f87171' }}>
            <span className="icon">⏻</span>
            {!isCollapsed && <span className="label">Logout</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT VIEW */}
      <main className="main-content">
        <header className="top-bar">
          <div className="page-title">
            <h2 style={{ fontSize: '1.2rem', margin: 0, color: '#1f2937' }}>
              {activePage.charAt(0).toUpperCase() + activePage.slice(1)} Dashboard
            </h2>
          </div>
          <div className="time-display">{currentTime}</div>
          <div className="user-profile" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ textAlign: 'right', display: isCollapsed ? 'none' : 'block' }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold' }}>Admin User</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Premium Tier</div>
            </div>
            <div style={{ width: 40, height: 40, background: '#e2e8f0', borderRadius: '50%', border: '2px solid white' }}></div>
          </div>
        </header>

        <div className="scroll-content">
          {activePage === "dashboard" ? (
            <div className="dashboard-container">
              {isLoading ? (
                <div style={{ padding: '100px', textAlign: 'center', color: 'var(--primary)', fontWeight: 'bold' }}>
                  Updating Real-time Intelligence...
                </div>
              ) : (
                <div className="dashboard-grid">
                  
                  {/* Weather Card */}
                  <div className="card">
                    <h3>Environment</h3>
                    {weather ? (
                      <div>
                        <div className="big-text">{Math.round(weather.main.temp)}°C</div>
                        <p style={{ color: '#6b7280', textTransform: 'capitalize' }}>
                          {weather.weather[0].description} in Mumbai
                        </p>
                      </div>
                    ) : <p>Weather Loading...</p>}
                  </div>

                  {/* Stock Card */}
                  <div className="card">
                    <h3>Market Insights</h3>
                    {stocks.map((s, i) => (
                      <div key={i} className="stock-row">
                        <span style={{ fontWeight: '600' }}>{s.name}</span>
                        <span style={{ color: s.change?.includes('+') ? '#059669' : '#dc2626' }}>
                          ₹{s.price}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Workforce Card */}
                  <div className="card">
                    <h3>Workforce Strength</h3>
                    {/* FIXED: Added quotes around var(--primary) to avoid the syntax error */}
                    <div className="big-text" style={{ color: 'var(--primary)' }}>
                      {totalEmployees}
                    </div>
                    <p style={{ color: '#6b7280' }}>Active personnel tracked across 5 regions</p>
                  </div>

                  {/* Recent Activity Logs */}
                  <div className="card" style={{ gridRow: 'span 2' }}>
                    <h3>System Activity</h3>
                    {notifications.map(n => (
                      <div key={n.id} style={{ marginBottom: '18px', paddingBottom: '10px', borderBottom: '1px solid #f3f4f6' }}>
                        <div style={{ fontWeight: '500', fontSize: '0.9rem' }}>{n.text}</div>
                        <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '4px' }}>{n.time}</div>
                      </div>
                    ))}
                  </div>

                  {/* Space News Card */}
                  <div className="card">
                    <h3>Industry Intelligence</h3>
                    {news.slice(0, 4).map((n, i) => (
                      <a key={i} href={n.url} target="_blank" rel="noreferrer" className="news-link">
                        • {n.title.substring(0, 50)}...
                      </a>
                    ))}
                  </div>

                  {/* HQ Map Card - Spans 2 columns */}
                  <div className="card" style={{ gridColumn: 'span 2' }}>
                    <h3>Logistics Visualization</h3>
                    <div className="map-wrapper">
                      <GoogleMapReact
                        bootstrapURLKeys={{ key: "YOUR_GOOGLE_MAPS_API_KEY" }}
                        defaultCenter={coords}
                        defaultZoom={15}
                      >
                        <MapMarker lat={coords.lat} lng={coords.lng} />
                      </GoogleMapReact>
                    </div>
                  </div>

                </div>
              )}
              
              <div style={{ padding: '0 40px 40px', textAlign: 'right' }}>
                <button 
                  className="action-btn" 
                  onClick={() => setActivePage('crm')}
                  style={{ padding: '15px 30px', fontWeight: 'bold' }}
                >
                  Enter Full CRM Access →
                </button>
              </div>
            </div>
          ) : (
            <div className="subview-area">
              {activePage === "crm" && <CRM />}
              {activePage === "employees" && <Employee />}
              {activePage === "workspace" && <TasksWorkspace />}
              {activePage === "reports" && <Reports />}
              {activePage === "settings" && <Settings />}
            </div>
          )}
        </div>

        <ChatWidget />
      </main>
    </div>
  );
}

export default Dashboard;

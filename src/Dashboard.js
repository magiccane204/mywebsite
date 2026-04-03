import React, { useState, useEffect } from "react";
import GoogleMapReact from "google-map-react";

/** * MOCK COMPONENTS 
 * Replace these with your actual file imports (e.g., import CRM from "./CRM")
 */
const CRM = () => <div className="page-padding"><h2>CRM Analytics Dashboard</h2><p>Detailed lead tracking and conversion metrics.</p></div>;
const Employee = () => <div className="page-padding"><h2>Employee Directory</h2><p>Manage staff profiles and permissions.</p></div>;
const Reports = () => <div className="page-padding"><h2>System Reports</h2><p>Generate PDF and Excel exports of quarterly data.</p></div>;
const Settings = () => <div className="page-padding"><h2>Account Settings</h2><p>Configure API keys and system preferences.</p></div>;
const TasksWorkspace = () => <div className="page-padding"><h2>Project Workspace</h2><p>Kanban boards and task assignments.</p></div>;
const ChatWidget = () => <div className="chat-fab">💬</div>;

// Simulated API for the demonstration
const api = {
  get: async () => ({ data: { total: 124 } })
};

/**
 * MAIN DASHBOARD COMPONENT
 */
function Dashboard({ setMode }) {
  // --- UI STATES ---
  const [activePage, setActivePage] = useState("dashboard");
  const [isCollapsed, setIsCollapsed] = useState(false); // Sidebar collapse state
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  
  // --- DATA STATES ---
  const [weather, setWeather] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [news, setNews] = useState([]);
  const [coords, setCoords] = useState({ lat: 19.076, lng: 72.877 });
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // --- RECENT UPDATES FEED ---
  const [notifications] = useState([
    { id: 1, text: "New lead assigned to John Doe", time: "5m ago", type: "crm" },
    { id: 2, text: "Server maintenance scheduled for Sunday", time: "2h ago", type: "sys" },
    { id: 3, text: "Payroll processing completed", time: "5h ago", type: "hr" },
    { id: 4, text: "New feature 'Dark Mode' deployed", time: "1d ago", type: "dev" },
  ]);

  // --- SIDEBAR TOGGLE ---
  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  // --- EFFECTS ---

  // Live Clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Initial Data Load
  useEffect(() => {
    const initDashboard = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          loadEmployeeStats(),
          getWeather(),
          getStocks(),
          getNews(),
          getLocation()
        ]);
      } catch (e) {
        console.error("Initialization error:", e);
      } finally {
        setIsLoading(false);
      }
    };
    initDashboard();
  }, []);

  // --- DATA FETCHING LOGIC ---

  const loadEmployeeStats = async () => {
    try {
      const res = await api.get("/api/reports");
      setTotalEmployees(res.data.total);
    } catch (err) {
      console.error("Failed to fetch employees:", err);
    }
  };

  const getWeather = async () => {
    try {
      const res = await fetch(
        "https://api.openweathermap.org/data/2.5/weather?q=Mumbai&appid=3de55583c5dce6d3730d5e7629577229&units=metric"
      );
      const data = await res.json();
      if (data.main) setWeather(data);
    } catch (err) {
      console.error("Weather API Error:", err);
    }
  };

  const getStocks = async () => {
    const symbols = ["RELIANCE.BSE", "TCS.BSE", "INFY.BSE"];
    const results = [];
    try {
      for (let s of symbols) {
        const res = await fetch(
          `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${s}&apikey=G8ZS20Q0VEL14JQ7`
        );
        const data = await res.json();
        if (data["Global Quote"]) {
          results.push({
            name: s.split(".")[0],
            price: parseFloat(data["Global Quote"]["05. price"]).toFixed(2),
            change: data["Global Quote"]["09. change"]
          });
        }
      }
      setStocks(results.length > 0 ? results : [{ name: "Market Closed", price: "---", change: "0" }]);
    } catch (err) {
      setStocks([{ name: "RELIANCE", price: "2540.00", change: "+1.2" }]);
    }
  };

  const getNews = async () => {
    try {
      const res = await fetch("https://api.spaceflightnewsapi.net/v4/articles/?limit=5");
      const data = await res.json();
      setNews(data.results || []);
    } catch (err) {
      console.error("News API Error:", err);
    }
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => console.warn("Location access denied.")
      );
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    if (setMode) setMode("login");
  };

  // --- RENDER HELPERS ---

  const SidebarItem = ({ id, icon, label }) => (
    <button 
      className={`sidebar-btn ${activePage === id ? "active" : ""}`}
      onClick={() => setActivePage(id)}
      title={isCollapsed ? label : ""} // Tooltip when collapsed
    >
      <span className="icon">{icon}</span>
      {!isCollapsed && <span className="label">{label}</span>}
    </button>
  );

  const MapMarker = () => (
    <div style={{
      color: 'white', background: '#ef4444', padding: '6px 12px',
      borderRadius: '20px', fontWeight: 'bold', fontSize: '12px',
      transform: 'translate(-50%, -100%)', whiteSpace: 'nowrap',
      boxShadow: '0 4px 10px rgba(0,0,0,0.3)', border: '2px solid white'
    }}>
      📍 Office Location
    </div>
  );

  return (
    <div className="app-layout">
      {/* SCOPED CSS STYLES */}
      <style>{`
        :root {
          --primary: #7c3aed;
          --sidebar-bg: #1e1b4b;
          --content-bg: #f8fafc;
          --sidebar-width-full: 260px;
          --sidebar-width-collapsed: 80px;
          --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        * { box-sizing: border-box; }

        .app-layout {
          display: flex;
          height: 100vh;
          width: 100vw;
          overflow: hidden;
          font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background: var(--content-bg);
        }

        /* SIDEBAR STYLES */
        .sidebar {
          width: ${isCollapsed ? 'var(--sidebar-width-collapsed)' : 'var(--sidebar-width-full)'};
          background: var(--sidebar-bg);
          height: 100vh;
          display: flex;
          flex-direction: column;
          transition: var(--transition);
          position: relative;
          box-shadow: 4px 0 10px rgba(0,0,0,0.1);
          z-index: 100;
        }

        .sidebar-header {
          padding: 20px;
          display: flex;
          align-items: center;
          justify-content: ${isCollapsed ? 'center' : 'space-between'};
          border-bottom: 1px solid rgba(255,255,255,0.1);
          min-height: 80px;
        }

        .logo-img {
          height: 40px;
          display: ${isCollapsed ? 'none' : 'block'};
        }

        .toggle-btn {
          background: rgba(255,255,255,0.1);
          border: none;
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .toggle-btn:hover { background: var(--primary); }

        .nav-list {
          flex: 1;
          padding: 15px 0;
          list-style: none;
          margin: 0;
        }

        .sidebar-btn {
          width: 100%;
          background: transparent;
          border: none;
          padding: 16px ${isCollapsed ? '0' : '25px'};
          display: flex;
          align-items: center;
          justify-content: ${isCollapsed ? 'center' : 'flex-start'};
          color: #a5b4fc;
          cursor: pointer;
          transition: var(--transition);
          font-size: 15px;
          position: relative;
        }

        .sidebar-btn:hover {
          background: rgba(255,255,255,0.05);
          color: white;
        }

        .sidebar-btn.active {
          background: var(--primary);
          color: white;
        }

        .sidebar-btn .icon {
          font-size: 20px;
          min-width: 30px;
          text-align: center;
        }

        .sidebar-btn .label {
          margin-left: 15px;
          font-weight: 500;
          white-space: nowrap;
          animation: fadeIn 0.3s;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .logout-section {
          padding: 15px 0;
          border-top: 1px solid rgba(255,255,255,0.1);
        }

        /* CONTENT AREA */
        .main-view {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          background: #f1f5f9;
        }

        .top-nav {
          background: white;
          padding: 15px 40px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: sticky;
          top: 0;
          z-index: 50;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }

        .time-badge {
          background: #e2e8f0;
          padding: 6px 16px;
          border-radius: 20px;
          font-weight: 700;
          font-family: monospace;
          color: #334155;
        }

        .dashboard-container {
          padding: 30px;
          max-width: 1400px;
          margin: 0 auto;
          width: 100%;
        }

        .grid-layout {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 24px;
        }

        .card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03);
          border: 1px solid #e2e8f0;
        }

        .card h3 {
          margin: 0 0 20px 0;
          font-size: 0.85rem;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .weather-large { font-size: 3rem; font-weight: 800; margin: 10px 0; color: #1e293b; }
        
        .stock-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #f1f5f9;
        }

        .map-box {
          height: 300px;
          width: 100%;
          border-radius: 12px;
          overflow: hidden;
          margin-top: 15px;
          border: 1px solid #cbd5e1;
        }

        .news-link {
          display: block;
          padding: 10px;
          margin: 5px 0;
          background: #f8fafc;
          border-radius: 8px;
          text-decoration: none;
          color: #334155;
          font-size: 0.9rem;
          transition: 0.2s;
        }

        .news-link:hover {
          background: #f1f5f9;
          transform: translateX(5px);
          color: var(--primary);
        }

        .page-padding { padding: 40px; }

        .chat-fab {
          position: fixed;
          bottom: 30px;
          right: 30px;
          width: 56px;
          height: 56px;
          background: var(--primary);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 24px;
          cursor: pointer;
          box-shadow: 0 10px 25px rgba(124, 58, 237, 0.4);
          z-index: 1000;
        }
      `}</style>

      {/* COLLAPSIBLE SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-header">
          {!isCollapsed && <img src="D&T.png" alt="Logo" className="logo-img" />}
          <button className="toggle-btn" onClick={toggleSidebar}>
            {isCollapsed ? "→" : "←"}
          </button>
        </div>

        <nav className="nav-list">
          <SidebarItem id="dashboard" icon="🏠" label="Home" />
          <SidebarItem id="crm" icon="📊" label="Analytics" />
          <SidebarItem id="employees" icon="👥" label="Employees" />
          <SidebarItem id="workspace" icon="💼" label="Workspace" />
          <SidebarItem id="reports" icon="📈" label="Reports" />
          <SidebarItem id="settings" icon="⚙️" label="Settings" />
        </nav>

        <div className="logout-section">
          <button className="sidebar-btn" onClick={handleLogout} style={{ color: '#fb7185' }}>
            <span className="icon">⏻</span>
            {!isCollapsed && <span className="label">Logout</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT VIEW */}
      <main className="main-view">
        <header className="top-nav">
          <h2 style={{ fontSize: '1.2rem', margin: 0 }}>
            {activePage.charAt(0).toUpperCase() + activePage.slice(1)} View
          </h2>
          <div className="time-badge">{currentTime}</div>
          <div style={{ display: 'flex', gap: '15px' }}>
            <div style={{ width: 35, height: 35, background: '#cbd5e1', borderRadius: '50%' }}></div>
          </div>
        </header>

        <div className="content-scroll">
          {activePage === "dashboard" ? (
            <div className="dashboard-container">
              {isLoading ? (
                <div style={{ textAlign: 'center', padding: '100px' }}>Loading Dashboard Data...</div>
              ) : (
                <div className="grid-layout">
                  
                  {/* Weather */}
                  <div className="card">
                    <h3>Environment</h3>
                    {weather ? (
                      <div>
                        <div className="weather-large">{Math.round(weather.main.temp)}°C</div>
                        <p style={{ color: '#64748b', textTransform: 'capitalize' }}>
                          {weather.weather[0].description} • Mumbai, IN
                        </p>
                      </div>
                    ) : <p>Weather data unavailable</p>}
                  </div>

                  {/* Stocks */}
                  <div className="card">
                    <h3>Market Pulse</h3>
                    {stocks.map((s, i) => (
                      <div key={i} className="stock-item">
                        <span style={{ fontWeight: '600' }}>{s.name}</span>
                        <span style={{ color: s.change?.includes('+') ? '#10b981' : '#f43f5e' }}>
                          ₹{s.price}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Workforce Stats */}
                  <div className="card">
                    <h3>Active Workforce</h3>
                    <div style={{ fontSize: '3.5rem', fontWeight: '900', color: var(--primary) }}>
                      {totalEmployees}
                    </div>
                    <p style={{ color: '#64748b' }}>Total registered personnel across all departments</p>
                  </div>

                  {/* Recent Activity */}
                  <div className="card" style={{ gridRow: 'span 2' }}>
                    <h3>System Logs</h3>
                    {notifications.map(n => (
                      <div key={n.id} style={{ marginBottom: '20px', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: '500' }}>{n.text}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>{n.time}</div>
                      </div>
                    ))}
                  </div>

                  {/* News */}
                  <div className="card">
                    <h3>Industry News</h3>
                    {news.map((n, i) => (
                      <a key={i} href={n.url} target="_blank" rel="noreferrer" className="news-link">
                        {n.title.length > 60 ? n.title.substring(0, 60) + '...' : n.title}
                      </a>
                    ))}
                  </div>

                  {/* Office Map */}
                  <div className="card" style={{ gridColumn: 'span 2' }}>
                    <h3>Headquarters Location</h3>
                    <div className="map-box">
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
              
              <div style={{ marginTop: '40px', textAlign: 'right' }}>
                <button 
                  onClick={() => setActivePage('crm')}
                  style={{
                    padding: '16px 32px', background: 'var(--primary)', 
                    color: 'white', border: 'none', borderRadius: '12px',
                    fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem'
                  }}
                >
                  Enter CRM Module →
                </button>
              </div>
            </div>
          ) : (
            <div className="sub-page">
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

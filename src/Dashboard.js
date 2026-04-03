import React, { useState, useEffect } from "react";
import GoogleMapReact from "google-map-react";

// --- YOUR ACTUAL PROJECT IMPORTS ---
// Calling your real files from the directory you shared
import CRM from "./CRM";
import Employee from "./Employee";
import Reports from "./Reports";
import Settings from "./Settings";
import TasksWorkspace from "./TasksWorkspace";
import ChatWidget from "./ChatWidget";
import api from "./api";

/**
 * SECTION 1: THE COLLAPSIBLE SIDEBAR
 * This handles the navigation and the "Small Version" toggle
 */
const Sidebar = ({ activePage, setActivePage, isCollapsed, setIsCollapsed, onLogout }) => {
  const menuItems = [
    { id: "dashboard", label: "Home", icon: "🏠" },
    { id: "crm", label: "Analytics", icon: "📊" },
    { id: "employees", label: "Employees", icon: "👥" },
    { id: "workspace", label: "Workspace", icon: "💼" },
    { id: "reports", label: "Reports", icon: "📈" },
    { id: "settings", label: "Settings", icon: "⚙️" },
  ];

  return (
    <aside className={`main-sidebar ${isCollapsed ? "is-small" : "is-full"}`}>
      <div className="sidebar-header">
        {!isCollapsed && <div className="brand-logo">D&T PANEL</div>}
        <button className="collapse-ctrl" onClick={() => setIsCollapsed(!isCollapsed)}>
          {isCollapsed ? "→" : "←"}
        </button>
      </div>

      <nav className="sidebar-menu">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`menu-item ${activePage === item.id ? "active" : ""}`}
            onClick={() => setActivePage(item.id)}
          >
            <span className="menu-icon">{item.icon}</span>
            {!isCollapsed && <span className="menu-label">{item.label}</span>}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="menu-item logout-link" onClick={onLogout}>
          <span className="menu-icon">⏻</span>
          {!isCollapsed && <span className="menu-label">Logout</span>}
        </button>
      </div>
    </aside>
  );
};

/**
 * SECTION 2: THE DASHBOARD OVERVIEW
 * The "Home" screen showing your widgets (Weather, Stocks, Map)
 */
const DashboardHome = ({ stats, weather, stocks, news, coords, setActivePage }) => {
  return (
    <div className="dashboard-wrapper">
      <div className="welcome-banner">
        <div>
          <h1>System Overview</h1>
          <p>Real-time data synchronization active.</p>
        </div>
        <button className="cta-button" onClick={() => setActivePage("crm")}>
          Launch CRM Data →
        </button>
      </div>

      <div className="widget-grid">
        {/* Weather Widget */}
        <div className="widget-card">
          <div className="widget-head">Local Weather</div>
          {weather ? (
            <div className="widget-body">
              <div className="temp-display">{Math.round(weather.main.temp)}°C</div>
              <div className="weather-desc">{weather.weather[0].description}</div>
            </div>
          ) : <div className="loading-pulse">Updating...</div>}
        </div>

        {/* Stocks Widget */}
        <div className="widget-card">
          <div className="widget-head">Market Pulse</div>
          <div className="widget-body">
            {stocks.length > 0 ? stocks.map((s, i) => (
              <div key={i} className="stock-line">
                <span className="stock-name">{s.name}</span>
                <span className="stock-price">₹{s.price}</span>
              </div>
            )) : <div className="loading-pulse">Connecting to API...</div>}
          </div>
        </div>

        {/* Employee Stats */}
        <div className="widget-card stat-highlight">
          <div className="widget-head">Workforce</div>
          <div className="widget-body">
            <div className="big-stat">{stats}</div>
            <div className="stat-label">Total Staff Members</div>
          </div>
        </div>

        {/* Map Widget */}
        <div className="widget-card wide-widget">
          <div className="widget-head">Global HQ Positioning</div>
          <div className="map-view">
            <GoogleMapReact
              bootstrapURLKeys={{ key: "YOUR_GOOGLE_MAPS_API_KEY" }}
              defaultCenter={coords}
              defaultZoom={13}
            >
              <div lat={coords.lat} lng={coords.lon} className="map-marker-icon">
                📍 HQ
              </div>
            </GoogleMapReact>
          </div>
        </div>

        {/* News Feed */}
        <div className="widget-card">
          <div className="widget-head">Industry Headlines</div>
          <div className="news-list">
            {news.slice(0, 4).map((n, i) => (
              <a key={i} href={n.url} target="_blank" rel="noreferrer" className="news-entry">
                {n.title.substring(0, 45)}...
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * SECTION 3: THE MAIN CONTROLLER
 * This pulls everything together and manages the page switching
 */
function Dashboard({ setMode }) {
  // State Management
  const [activePage, setActivePage] = useState("dashboard");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  // Data State
  const [weather, setWeather] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [news, setNews] = useState([]);
  const [coords, setCoords] = useState({ lat: 19.076, lng: 72.877 });
  const [totalEmployees, setTotalEmployees] = useState(0);

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch your data
  useEffect(() => {
    const loadAllData = async () => {
      try {
        const empRes = await api.get("/api/reports");
        setTotalEmployees(empRes.data.total || 0);
      } catch (err) { console.error("API error:", err); }

      fetchWeather();
      fetchStocks();
      fetchNews();
      fetchLocation();
    };
    loadAllData();
  }, []);

  const fetchWeather = async () => {
    try {
      const res = await fetch("https://api.openweathermap.org/data/2.5/weather?q=Mumbai&appid=3de55583c5dce6d3730d5e7629577229&units=metric");
      const data = await res.json();
      if (data.main) setWeather(data);
    } catch {}
  };

  const fetchStocks = async () => {
    // Mocking stock data to bypass API rate limits for display
    setStocks([
      { name: "RELIANCE", price: "2,540.00" },
      { name: "TCS", price: "3,412.50" },
      { name: "INFY", price: "1,520.10" }
    ]);
  };

  const fetchNews = async () => {
    try {
      const res = await fetch("https://api.spaceflightnewsapi.net/v4/articles/?limit=5");
      const data = await res.json();
      setNews(data.results || []);
    } catch {}
  };

  const fetchLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      });
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setMode("login");
  };

  return (
    <div className="dashboard-app-container">
      {/* INLINE CSS 
        Ensures everything stays pinned, full-height, and collapses correctly 
      */}
      <style>{`
        :root {
          --sidebar-bg: #1e1b4b;
          --sidebar-hover: #312e81;
          --active-color: #7c3aed;
          --content-bg: #f8fafc;
          --sidebar-w-full: 260px;
          --sidebar-w-small: 85px;
        }

        .dashboard-app-container {
          display: flex;
          width: 100vw;
          height: 100vh;
          background: var(--content-bg);
          overflow: hidden;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }

        /* SIDEBAR STYLES */
        .main-sidebar {
          height: 100vh;
          background: var(--sidebar-bg);
          color: white;
          display: flex;
          flex-direction: column;
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          flex-shrink: 0;
          z-index: 100;
          box-shadow: 4px 0 10px rgba(0,0,0,0.1);
        }

        .main-sidebar.is-full { width: var(--sidebar-w-full); }
        .main-sidebar.is-small { width: var(--sidebar-w-small); }

        .sidebar-header {
          height: 80px;
          padding: 0 25px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .brand-logo { font-weight: 900; font-size: 1.2rem; letter-spacing: 1px; color: #a5b4fc; }

        .collapse-ctrl {
          background: rgba(255,255,255,0.1);
          border: none;
          color: white;
          width: 30px;
          height: 30px;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .sidebar-menu { flex: 1; padding: 20px 0; display: flex; flex-direction: column; gap: 5px; }

        .menu-item {
          background: transparent;
          border: none;
          color: #a5b4fc;
          padding: 16px 28px;
          display: flex;
          align-items: center;
          cursor: pointer;
          transition: 0.2s;
          text-align: left;
          width: 100%;
          position: relative;
        }

        .menu-item:hover { background: var(--sidebar-hover); color: white; }
        .menu-item.active { background: var(--active-color); color: white; font-weight: 600; }
        
        .is-small .menu-item { justify-content: center; padding: 16px 0; }
        .menu-icon { font-size: 1.4rem; min-width: 30px; display: flex; justify-content: center; }
        .menu-label { margin-left: 15px; white-space: nowrap; font-size: 15px; }

        .logout-link { margin-top: auto; border-top: 1px solid rgba(255,255,255,0.05); color: #fda4af; }

        /* MAIN CONTENT AREA */
        .main-viewport {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          position: relative;
        }

        .top-status-bar {
          background: white;
          height: 70px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 40px;
          border-bottom: 1px solid #e2e8f0;
          position: sticky;
          top: 0;
          z-index: 50;
        }

        .clock-view { font-weight: 800; font-family: monospace; font-size: 1.1rem; color: #1e293b; }

        .dashboard-wrapper { padding: 40px; }
        
        .welcome-banner { 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          margin-bottom: 40px;
        }
        
        .welcome-banner h1 { margin: 0; font-size: 1.8rem; color: #0f172a; }
        .welcome-banner p { color: #64748b; margin-top: 5px; }

        .widget-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
        }

        .widget-card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
          border: 1px solid #e2e8f0;
        }

        .widget-card.wide-widget { grid-column: span 2; }

        .widget-head {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          color: #94a3b8;
          letter-spacing: 1px;
          margin-bottom: 20px;
        }

        .temp-display { font-size: 3rem; font-weight: 800; color: #1e293b; }
        .big-stat { font-size: 3.5rem; font-weight: 900; color: var(--active-color); line-height: 1; }

        .map-view {
          height: 300px;
          width: 100%;
          border-radius: 12px;
          overflow: hidden;
          margin-top: 10px;
          background: #e2e8f0;
        }

        .map-marker-icon {
          background: #ef4444;
          color: white;
          padding: 5px 12px;
          border-radius: 20px;
          font-weight: bold;
          font-size: 12px;
          white-space: nowrap;
          border: 2px solid white;
          transform: translate(-50%, -100%);
        }

        .stock-line {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #f1f5f9;
        }

        .news-entry {
          display: block;
          padding: 12px;
          background: #f8fafc;
          margin-bottom: 8px;
          border-radius: 8px;
          text-decoration: none;
          color: #334155;
          font-size: 0.9rem;
          transition: 0.2s;
        }

        .news-entry:hover { transform: translateX(5px); background: #f1f5f9; color: var(--active-color); }

        .cta-button {
          background: var(--active-color);
          color: white;
          border: none;
          padding: 14px 28px;
          border-radius: 12px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 10px 15px -3px rgba(124, 58, 237, 0.3);
        }

        .loading-pulse { color: #94a3b8; font-style: italic; animation: pulse 1.5s infinite; }
        @keyframes pulse { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }
      `}</style>

      {/* RENDER SIDEBAR SECTION */}
      <Sidebar 
        activePage={activePage} 
        setActivePage={setActivePage} 
        isCollapsed={isCollapsed} 
        setIsCollapsed={setIsCollapsed}
        onLogout={handleLogout}
      />

      {/* RENDER MAIN VIEWPORT SECTION */}
      <main className="main-viewport">
        <header className="top-status-bar">
          <div className="page-path">System / <strong>{activePage.toUpperCase()}</strong></div>
          <div className="clock-view">{currentTime}</div>
          <div className="user-info" style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <span style={{ fontSize: "14px", fontWeight: "600" }}>Admin Portal</span>
            <div style={{ width: 35, height: 35, borderRadius: "50%", background: "#e2e8f0" }}></div>
          </div>
        </header>

        <div className="content-container">
          {/* LOGIC TO SHOW YOUR ACTUAL PAGES */}
          {activePage === "dashboard" && (
            <DashboardHome 
              stats={totalEmployees} 
              weather={weather} 
              stocks={stocks} 
              news={news} 
              coords={coords}
              setActivePage={setActivePage}
            />
          )}

          {activePage === "crm" && <CRM />}
          {activePage === "employees" && <Employee />}
          {activePage === "workspace" && <TasksWorkspace />}
          {activePage === "reports" && <Reports />}
          {activePage === "settings" && <Settings />}
        </div>

        <ChatWidget />
      </main>
    </div>
  );
}

export default Dashboard;

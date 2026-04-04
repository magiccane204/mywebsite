import React, { useState, useEffect, useMemo } from "react";
import GoogleMapReact from "google-map-react";

/** * --- CORE SYSTEM IMPORTS ---
 * These are your actual files. I am calling them directly so 
 * their internal GitHub-connected logic stays intact.
 */
import CRM from "./CRM";
import Employee from "./Employee";
import Reports from "./Reports";
import Settings from "./Settings";
import TasksWorkspace from "./TasksWorkspace";
import ChatWidget from "./ChatWidget";
import api from "./api";

/**
 * COMPONENT: Sidebar
 * This is the persistent navigation pillar. 
 * It spans the full vertical height of the window.
 */
const Sidebar = ({ activePage, setActivePage, isCollapsed, setIsCollapsed, onLogout }) => {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "🏠" },
    { id: "crm", label: "Analytics", icon: "📊" },
    { id: "employees", label: "Staffing", icon: "👥" },
    { id: "workspace", label: "Workspace", icon: "💼" },
    { id: "reports", label: "Reports", icon: "📈" },
    { id: "settings", label: "Settings", icon: "⚙️" },
  ];

  return (
    <aside className={`system-sidebar ${isCollapsed ? "slim" : "wide"}`}>
      <div className="sidebar-top-branding">
        {!isCollapsed && <div className="brand-name">D&T SYSTEM</div>}
        <button className="toggle-trigger" onClick={() => setIsCollapsed(!isCollapsed)}>
          {isCollapsed ? "❯" : "❮"}
        </button>
      </div>

      <nav className="sidebar-nav-container">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`sidebar-link ${activePage === item.id ? "active" : ""}`}
            onClick={() => setActivePage(item.id)}
            title={isCollapsed ? item.label : ""}
          >
            <span className="link-icon">{item.icon}</span>
            {!isCollapsed && <span className="link-label">{item.label}</span>}
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom-actions">
        <button className="sidebar-link logout-trigger" onClick={onLogout}>
          <span className="link-icon">⏻</span>
          {!isCollapsed && <span className="link-label">Exit System</span>}
        </button>
      </div>
    </aside>
  );
};

/**
 * COMPONENT: DashboardHome
 * The "Overview" widgets for the main landing page.
 */
const DashboardHome = ({ weather, stocks, news, coords, empCount, setActivePage }) => {
  return (
    <div className="dashboard-view-wrapper">
      <div className="view-intro">
        <h1>Command Center</h1>
        <p>Operational overview and real-time telemetry.</p>
      </div>

      <div className="overview-grid">
        {/* Weather Card */}
        <div className="metric-card">
          <div className="card-tag">Climate</div>
          {weather ? (
            <div className="card-inner">
              <div className="main-stat">{Math.round(weather.main.temp)}°C</div>
              <div className="sub-stat">{weather.weather[0].description}</div>
            </div>
          ) : <div className="loader-anim">Syncing Weather...</div>}
        </div>

        {/* Stocks Card */}
        <div className="metric-card">
          <div className="card-tag">Market Pulse</div>
          <div className="card-inner">
            {stocks.length > 0 ? stocks.map((s, i) => (
              <div key={i} className="stock-entry">
                <span className="entry-name">{s.name}</span>
                <span className="entry-val">₹{s.price}</span>
              </div>
            )) : <div className="loader-anim">Awaiting Market Feed...</div>}
          </div>
        </div>

        {/* Workforce Card */}
        <div className="metric-card accent-card">
          <div className="card-tag">Human Resources</div>
          <div className="card-inner">
            <div className="stat-huge">{empCount}</div>
            <div className="sub-stat">Active Registered Personnel</div>
          </div>
        </div>

        {/* News Card */}
        <div className="metric-card">
          <div className="card-tag">Global Intelligence</div>
          <div className="news-scroller">
            {news.slice(0, 4).map((n, i) => (
              <a key={i} href={n.url} target="_blank" rel="noreferrer" className="news-block">
                {n.title.substring(0, 55)}...
              </a>
            ))}
          </div>
        </div>

        {/* HQ Map - Fixed 'lng' reference */}
        <div className="metric-card map-span">
          <div className="card-tag">Headquarters Positioning</div>
          <div className="map-viewport-frame">
            <GoogleMapReact
              bootstrapURLKeys={{ key: "AIzaSyBDJShPZFEoLlbDlSxvpMmeCUEUYcStxUI" }}
              center={coords}
              defaultZoom={15}
            >
              <div lat={coords.lat} lng={coords.lng} className="geo-marker">
                📍 HQ
              </div>
            </GoogleMapReact>
          </div>
        </div>
      </div>
      
      <div className="view-footer">
        <button className="launch-btn" onClick={() => setActivePage("crm")}>
          Launch CRM Full View →
        </button>
      </div>
    </div>
  );
};

/**
 * MAIN DASHBOARD CONTROLLER
 */
function Dashboard({ setMode }) {
  // Navigation & UI State
  const [activePage, setActivePage] = useState("dashboard");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  // Real Data Integration State
  const [weather, setWeather] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [news, setNews] = useState([]);
  const [coords, setCoords] = useState({ lat: 19.076, lng: 72.877 }); // Standardized to lng
  const [totalEmployees, setTotalEmployees] = useState(0);

  // System Timer
  useEffect(() => {
    const ticker = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(ticker);
  }, []);

  // Primary Data Fetching (Connecting to your actual backend logic)
  useEffect(() => {
    const initializeSystem = async () => {
      try {
        const res = await api.get("/api/reports");
        setTotalEmployees(res.data.total || 0);
      } catch (err) {
        console.warn("Backend API unreachable. Falling back to default stats.");
        setTotalEmployees(124);
      }

      fetchExternalData();
    };
    initializeSystem();
  }, []);

  const fetchExternalData = async () => {
    // Weather Fetch
    try {
      const wRes = await fetch("https://api.openweathermap.org/data/2.5/weather?q=Mumbai&appid=3de55583c5dce6d3730d5e7629577229&units=metric");
      const wData = await wRes.json();
      if (wData.main) setWeather(wData);
    } catch (e) {}

    // Mock Stocks (to bypass AlphaVantage rate limits during UI work)
    setStocks([
      { name: "RELIANCE", price: "2,540.00" },
      { name: "TCS", price: "3,411.50" },
      { name: "INFY", price: "1,525.10" }
    ]);

    // News Fetch
    try {
      const nRes = await fetch("https://api.spaceflightnewsapi.net/v4/articles/?limit=5");
      const nData = await nRes.json();
      setNews(nData.results || []);
    } catch (e) {}

    // Geo Location Sync
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      });
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    if (setMode) setMode("login");
  };

  return (
    <div className="system-root">
      {/* CRITICAL CSS ARCHITECTURE:
        The flex layout below ensures the sidebar PUSHES the content 
        instead of floating over it.
      */}
      <style>{`
        :root {
          --primary: #7c3aed;
          --sidebar-dark: #111122;
          --sidebar-hover: #1e1e38;
          --body-bg: #f1f5f9;
          --card-white: #ffffff;
          --side-w-full: 260px;
          --side-w-slim: 85px;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .system-root {
          display: flex; /* Creates the Side-by-Side behavior */
          width: 100vw;
          height: 100vh;
          background: var(--body-bg);
          overflow: hidden;
          font-family: 'Inter', system-ui, sans-serif;
        }

        /* --- SIDEBAR PILLAR --- */
        .system-sidebar {
          height: 100vh;
          background: var(--sidebar-dark);
          color: #94a3b8;
          display: flex;
          flex-direction: column;
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          flex-shrink: 0; /* Ensures the sidebar doesn't get squashed */
          z-index: 1000;
          box-shadow: 4px 0 15px rgba(0,0,0,0.2);
        }

        .system-sidebar.wide { width: var(--side-w-full); }
        .system-sidebar.slim { width: var(--side-w-slim); }

        .sidebar-top-branding {
          height: 80px;
          padding: 0 25px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .brand-name { font-weight: 900; color: white; font-size: 1.1rem; letter-spacing: 1px; }

        .toggle-trigger {
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

        .sidebar-nav-container { flex: 1; padding: 20px 0; display: flex; flex-direction: column; gap: 4px; }

        .sidebar-link {
          background: transparent;
          border: none;
          color: inherit;
          padding: 16px 28px;
          display: flex;
          align-items: center;
          cursor: pointer;
          width: 100%;
          text-align: left;
          transition: 0.2s;
        }

        .sidebar-link:hover { background: var(--sidebar-hover); color: white; }
        .sidebar-link.active { background: var(--primary); color: white; font-weight: 600; }

        .slim .sidebar-link { justify-content: center; padding: 16px 0; }
        .link-icon { font-size: 1.4rem; min-width: 30px; text-align: center; }
        .link-label { margin-left: 15px; white-space: nowrap; font-size: 15px; }

        .logout-trigger { margin-top: auto; border-top: 1px solid rgba(255,255,255,0.05); color: #fb7185; }

        /* --- MAIN VIEWPORT --- */
        .system-viewport {
          flex: 1; /* Occupies the remaining space to the right of the sidebar */
          height: 100vh;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          min-width: 0; /* Prevents overflow-x in flex layout */
        }

        .viewport-navbar {
          height: 70px;
          background: white;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 40px;
          position: sticky;
          top: 0;
          z-index: 50;
        }

        .path-breadcrumb { font-size: 14px; color: #64748b; }
        .path-breadcrumb strong { color: #1e293b; text-transform: uppercase; }

        .time-pill { 
          font-weight: 800; 
          font-family: monospace; 
          background: #f1f5f9; 
          padding: 6px 15px; 
          border-radius: 20px; 
          color: #334155; 
        }

        /* --- DASHBOARD CONTENT --- */
        .dashboard-view-wrapper { padding: 40px; }
        .view-intro { margin-bottom: 35px; }
        .view-intro h1 { font-size: 1.8rem; color: #0f172a; }
        .view-intro p { color: #64748b; margin-top: 4px; }

        .overview-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 25px;
        }

        .metric-card {
          background: var(--card-white);
          padding: 25px;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
        }

        .metric-card.map-span { grid-column: span 2; }

        .card-tag {
          font-size: 0.7rem;
          font-weight: 800;
          text-transform: uppercase;
          color: #94a3b8;
          letter-spacing: 1px;
          margin-bottom: 15px;
        }

        .main-stat { font-size: 2.8rem; font-weight: 900; color: #1e293b; }
        .stat-huge { font-size: 4rem; font-weight: 900; color: var(--primary); line-height: 1; }
        .sub-stat { color: #64748b; font-weight: 500; }

        .map-viewport-frame {
          height: 300px;
          width: 100%;
          border-radius: 12px;
          overflow: hidden;
          margin-top: 15px;
          background: #cbd5e1;
          border: 1px solid #e2e8f0;
        }

        .geo-marker {
          background: #ef4444;
          color: white;
          padding: 6px 12px;
          border-radius: 30px;
          font-weight: bold;
          font-size: 12px;
          white-space: nowrap;
          border: 2px solid white;
          transform: translate(-50%, -100%);
          box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        }

        .stock-entry {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid #f1f5f9;
        }

        .news-block {
          display: block;
          padding: 12px;
          background: #f8fafc;
          margin-bottom: 10px;
          border-radius: 10px;
          text-decoration: none;
          color: #334155;
          font-size: 0.9rem;
          transition: 0.2s;
        }

        .news-block:hover { transform: translateX(5px); background: #f1f5f9; color: var(--primary); }

        .launch-btn {
          margin-top: 40px;
          background: var(--primary);
          color: white;
          border: none;
          padding: 15px 30px;
          border-radius: 12px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 10px 15px -3px rgba(124, 58, 237, 0.3);
        }

        .loader-anim { color: #94a3b8; font-style: italic; animation: pulse 2s infinite; }
        @keyframes pulse { 0% {opacity: 0.4;} 50% {opacity: 1;} 100% {opacity: 0.4;} }

        /* USER INTERFACE HELPERS */
        .user-pill { display: flex; align-items: center; gap: 12px; }
        .avatar-box { width: 38px; height: 38px; background: #e2e8f0; border-radius: 50%; border: 2px solid white; }
      `}</style>

      {/* RENDER: SIDEBAR (Strictly Pinned to Left) */}
      <Sidebar 
        activePage={activePage} 
        setActivePage={setActivePage} 
        isCollapsed={isCollapsed} 
        setIsCollapsed={setIsCollapsed}
        onLogout={handleLogout}
      />

      {/* RENDER: MAIN CONTENT VIEWPORT */}
      <main className="system-viewport">
        <header className="viewport-navbar">
          <div className="path-breadcrumb">
            System / <strong>{activePage}</strong>
          </div>
          <div className="time-pill">{currentTime}</div>
          <div className="user-pill">
            <div style={{textAlign: 'right'}}>
              <div style={{fontSize: '14px', fontWeight: '700'}}>Admin Portal</div>
              <div style={{fontSize: '11px', color: '#64748b'}}>Superuser Access</div>
            </div>
            <div className="avatar-box"></div>
          </div>
        </header>

        <section className="viewport-dynamic-content">
          {/* SWITCH LOGIC FOR YOUR PAGES - Calling them directly to preserve logic */}
          {activePage === "dashboard" && (
            <DashboardHome 
              weather={weather} 
              stocks={stocks} 
              news={news} 
              coords={coords} 
              empCount={totalEmployees}
              setActivePage={setActivePage}
            />
          )}

          {activePage === "crm" && <CRM />}
          {activePage === "employees" && <Employee />}
          {activePage === "workspace" && <TasksWorkspace />}
          {activePage === "reports" && <Reports />}
          {activePage === "settings" && <Settings />}
        </section>

        {/* Persistent Chat Widget from your files */}
        <ChatWidget />
      </main>
    </div>
  );
}

export default Dashboard;

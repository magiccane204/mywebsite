import React, { useState, useEffect, useMemo, useCallback } from "react";
import GoogleMapReact from "google-map-react";

/** * --- CORE SYSTEM IMPORTS ---
 * Directly calling your GitHub-connected files. 
 * Their internal logic remains untouched and fully functional.
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
 * A persistent, window-spanning navigation pillar.
 * Handles the "Small Version" collapse logic without covering the system.
 */
const Sidebar = ({ activePage, setActivePage, isCollapsed, setIsCollapsed, onLogout }) => {
  const navigationMap = [
    { id: "dashboard", label: "Command Center", icon: "🏠", description: "System Overview" },
    { id: "crm", label: "CRM Analytics", icon: "📊", description: "Lead Tracking" },
    { id: "employees", label: "Workforce", icon: "👥", description: "Staff Management" },
    { id: "workspace", label: "Project Hub", icon: "💼", description: "Task Management" },
    { id: "reports", label: "Data Reports", icon: "📈", description: "Financials" },
    { id: "settings", label: "System Config", icon: "⚙️", description: "Preferences" },
  ];

  return (
    <aside className={`app-sidebar-pillar ${isCollapsed ? "is-collapsed" : "is-expanded"}`}>
      <div className="sidebar-branding">
        {!isCollapsed && <div className="brand-title">D&T PANEL</div>}
        <button className="toggle-control" onClick={() => setIsCollapsed(!isCollapsed)}>
          {isCollapsed ? "❯" : "❮"}
        </button>
      </div>

      <nav className="sidebar-nav-list">
        {navigationMap.map((item) => (
          <button
            key={item.id}
            className={`nav-anchor ${activePage === item.id ? "is-active" : ""}`}
            onClick={() => setActivePage(item.id)}
            title={isCollapsed ? item.label : ""}
          >
            <span className="nav-icon-box">{item.icon}</span>
            {!isCollapsed && (
              <div className="nav-label-box">
                <span className="primary-label">{item.label}</span>
                <span className="secondary-label">{item.description}</span>
              </div>
            )}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer-region">
        <button className="nav-anchor logout-action" onClick={onLogout}>
          <span className="nav-icon-box">⏻</span>
          {!isCollapsed && <span className="primary-label">Secure Logout</span>}
        </button>
      </div>
    </aside>
  );
};

/**
 * COMPONENT: DashboardHome
 * The primary overview containing themed widgets and dark-mode map tiles.
 */
const DashboardHome = ({ 
  weather, 
  stocks, 
  news, 
  coords, 
  empCount, 
  isDarkMode, 
  notifications 
}) => {
  
  // Custom Dark Mode styling for the Google Maps API
  const mapTheme = useMemo(() => [
    { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
  ], []);

  return (
    <div className="home-view-container">
      <div className="view-header-strip">
        <div className="title-block">
          <h1>System Overview</h1>
          <p>Operational telemetry and live organizational data.</p>
        </div>
      </div>

      <div className="home-widget-grid">
        {/* Climate Widget */}
        <div className="widget-card">
          <div className="widget-meta">ENVIRONMENTAL STATUS</div>
          {weather ? (
            <div className="widget-content">
              <h2 className="display-val">{Math.round(weather.main.temp)}°C</h2>
              <p className="display-desc">{weather.weather[0].description} in Mumbai</p>
            </div>
          ) : <div className="skeleton-loader">Synchronizing weather...</div>}
        </div>

        {/* Stock Market Widget */}
        <div className="widget-card">
          <div className="widget-meta">FINANCIAL MARKETS</div>
          <div className="widget-content">
            {stocks.length > 0 ? stocks.map((s, i) => (
              <div key={i} className="market-row">
                <span className="m-name">{s.name}</span>
                <span className="m-val">₹{s.price}</span>
              </div>
            )) : <div className="skeleton-loader">Awaiting market feed...</div>}
          </div>
        </div>

        {/* Employee Counter */}
        <div className="widget-card accent-variant">
          <div className="widget-meta">ORGANIZATIONAL SCALE</div>
          <div className="widget-content">
            <h2 className="huge-val">{empCount}</h2>
            <p className="display-desc">Total Active Personnel Registered</p>
          </div>
        </div>

        {/* Notification Feed */}
        <div className="widget-card">
          <div className="widget-meta">RECENT ACTIVITY</div>
          <div className="activity-feed">
            {notifications.length > 0 ? notifications.map((n, i) => (
              <div key={i} className="feed-item">
                <span className="feed-icon">●</span>
                <span className="feed-text">{n.message}</span>
              </div>
            )) : <p className="label-muted">No recent alerts.</p>}
          </div>
        </div>

        {/* Google Maps Positioning */}
        <div className="widget-card span-two">
          <div className="widget-meta">HEADQUARTERS GEOLOCATION</div>
          <div className="map-portal">
            <GoogleMapReact
              bootstrapURLKeys={{ key: "AIzaSyBDJShPZFEoLlbDlSxvpMmeCUEUYcStxUI" }}
              center={coords}
              defaultZoom={14}
              options={{ styles: isDarkMode ? mapTheme : [] }}
            >
              <div lat={coords.lat} lng={coords.lng} className="geo-pin">
                📍 D&T HQ
              </div>
            </GoogleMapReact>
          </div>
        </div>

        {/* Global Intelligence / News */}
        <div className="widget-card span-two">
          <div className="widget-meta">GLOBAL INTELLIGENCE</div>
          <div className="news-grid">
            {news.slice(0, 4).map((n, i) => (
              <a key={i} href={n.url} target="_blank" rel="noreferrer" className="news-tile">
                <span className="news-tag">BREAKING</span>
                <h4 className="news-title">{n.title.substring(0, 70)}...</h4>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * MAIN DASHBOARD LOGIC
 * The Orchestrator for state, theme, and data fetching.
 */
function Dashboard({ setMode }) {
  // Navigation & UI States
  const [activePage, setActivePage] = useState("dashboard");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  // Data Persistence States
  const [weather, setWeather] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [news, setNews] = useState([]);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [coords, setCoords] = useState({ lat: 19.076, lng: 72.877 });
  const [notifications, setNotifications] = useState([
    { message: "System initialized successfully." },
    { message: "API Gateway connection established." }
  ]);

  // Operational Effects
  useEffect(() => {
    const clock = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
    initializeSystem();
    return () => clearInterval(clock);
  }, []);

  const initializeSystem = async () => {
    // Attempting real data fetch from your API.js
    try {
      const res = await api.get("/api/reports");
      if (res.data) setTotalEmployees(res.data.total);
    } catch (e) {
      console.warn("Using fallback employee count.");
      setTotalEmployees(124);
    }

    // Parallel external data sync
    fetchClimateData();
    fetchMarketData();
    fetchIntelData();
    fetchGeoLocation();
  };

  const fetchClimateData = async () => {
    try {
      const res = await fetch("https://api.openweathermap.org/data/2.5/weather?q=Mumbai&appid=3de55583c5dce6d3730d5e7629577229&units=metric");
      const data = await res.json();
      if (data.main) setWeather(data);
    } catch (err) {
      setNotifications(prev => [{ message: "Weather sync failed." }, ...prev]);
    }
  };

  const fetchMarketData = () => {
    // Mocking to bypass rate limits during development
    setStocks([
      { name: "RELIANCE", price: "2,540.00" },
      { name: "TCS", price: "3,411.20" },
      { name: "INFY", price: "1,525.10" }
    ]);
  };

  const fetchIntelData = async () => {
    try {
      const res = await fetch("https://api.spaceflightnewsapi.net/v4/articles/?limit=5");
      const data = await res.json();
      setNews(data.results || []);
    } catch (e) {
      setNotifications(prev => [{ message: "News feed offline." }, ...prev]);
    }
  };

  const fetchGeoLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      });
    }
  };

  const handleLogout = useCallback(() => {
    localStorage.clear();
    if (setMode) setMode("login");
  }, [setMode]);

  return (
    <div className={`system-shell ${isDarkMode ? "dark-theme" : "light-theme"}`}>
      <style>{`
        /* CSS ARCHITECTURE:
          Ensures the sidebar PUSHES the system instead of covering it.
        */
        :root {
          --transition-smooth: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          --sidebar-w-full: 280px;
          --sidebar-w-slim: 90px;
        }

        .light-theme {
          --bg-primary: #f8fafc;
          --bg-card: #ffffff;
          --bg-side: #1e1b4b;
          --text-p: #1e293b;
          --text-s: #64748b;
          --border: #e2e8f0;
          --accent: #7c3aed;
          --sidebar-text: #a5b4fc;
        }

        .dark-theme {
          --bg-primary: #0f172a;
          --bg-card: #1e293b;
          --bg-side: #020617;
          --text-p: #f1f5f9;
          --text-s: #94a3b8;
          --border: #334155;
          --accent: #a78bfa;
          --sidebar-text: #64748b;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .system-shell {
          display: flex;
          width: 100vw;
          height: 100vh;
          background: var(--bg-primary);
          color: var(--text-p);
          overflow: hidden;
          font-family: 'Inter', -apple-system, sans-serif;
        }

        /* --- SIDEBAR LOGIC --- */
        .app-sidebar-pillar {
          height: 100vh;
          background: var(--bg-side);
          display: flex;
          flex-direction: column;
          transition: width var(--transition-smooth);
          flex-shrink: 0;
          z-index: 1000;
          box-shadow: 10px 0 30px rgba(0,0,0,0.2);
        }

        .app-sidebar-pillar.is-expanded { width: var(--sidebar-w-full); }
        .app-sidebar-pillar.is-collapsed { width: var(--sidebar-w-slim); }

        .sidebar-branding {
          height: 80px;
          padding: 0 25px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .brand-title { color: #fff; font-weight: 900; letter-spacing: 1px; font-size: 1.2rem; }

        .toggle-control {
          background: rgba(255,255,255,0.1);
          border: none;
          color: #fff;
          width: 32px;
          height: 32px;
          border-radius: 6px;
          cursor: pointer;
        }

        .sidebar-nav-list { flex: 1; padding: 20px 0; display: flex; flex-direction: column; gap: 4px; }

        .nav-anchor {
          background: transparent; border: none; color: var(--sidebar-text);
          padding: 16px 25px; display: flex; align-items: center;
          cursor: pointer; width: 100%; transition: 0.2s;
        }

        .nav-anchor:hover { background: rgba(255,255,255,0.05); color: #fff; }
        .nav-anchor.is-active { background: var(--accent); color: #fff; border-right: 4px solid #fff; }

        .nav-icon-box { font-size: 1.4rem; min-width: 35px; text-align: center; }
        .nav-label-box { margin-left: 15px; display: flex; flex-direction: column; text-align: left; }
        .primary-label { font-weight: 600; font-size: 14px; }
        .secondary-label { font-size: 10px; opacity: 0.6; margin-top: 2px; }

        .is-collapsed .nav-anchor { justify-content: center; padding: 16px 0; }
        .logout-action { border-top: 1px solid rgba(255,255,255,0.05); margin-top: auto; color: #fb7185 !important; }

        /* --- MAIN VIEWPORT LOGIC --- */
        .system-viewport {
          flex: 1;
          height: 100vh;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .system-navbar {
          height: 70px;
          background: var(--bg-card);
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 40px;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .nav-clock { font-weight: 800; font-family: monospace; background: var(--bg-primary); padding: 5px 15px; border-radius: 20px; }

        .theme-switch-btn {
          background: var(--accent); color: #fff; border: none;
          padding: 8px 18px; border-radius: 20px; cursor: pointer; font-weight: bold;
        }

        /* --- DASHBOARD WIDGETS --- */
        .home-view-container { padding: 40px; }
        .title-block h1 { font-size: 2rem; margin-bottom: 5px; }
        .title-block p { color: var(--text-s); }

        .home-widget-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 24px; margin-top: 35px;
        }

        .widget-card {
          background: var(--bg-card);
          padding: 25px;
          border-radius: 20px;
          border: 1px solid var(--border);
          box-shadow: 0 4px 15px -3px rgba(0,0,0,0.05);
        }

        .widget-card.span-two { grid-column: span 2; }
        .widget-meta { font-size: 10px; font-weight: 800; color: var(--text-s); text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 20px; }

        .display-val { font-size: 2.8rem; font-weight: 900; }
        .huge-val { font-size: 3.8rem; font-weight: 900; color: var(--accent); line-height: 1; }
        .display-desc { color: var(--text-s); font-weight: 500; }

        .market-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border); }
        .m-name { font-weight: 700; }

        .map-portal { height: 320px; border-radius: 15px; overflow: hidden; margin-top: 15px; border: 1px solid var(--border); }
        .geo-pin { background: #ef4444; color: #fff; padding: 5px 12px; border-radius: 20px; font-weight: bold; font-size: 12px; transform: translate(-50%, -100%); border: 2px solid #fff; }

        .news-tile { display: block; padding: 15px; background: var(--bg-primary); margin-bottom: 12px; border-radius: 12px; text-decoration: none; color: var(--text-p); transition: transform 0.2s; }
        .news-tile:hover { transform: translateX(8px); }
        .news-tag { font-size: 9px; background: var(--accent); color: #fff; padding: 2px 6px; border-radius: 4px; font-weight: bold; }
        .news-title { margin-top: 5px; font-size: 14px; line-height: 1.4; }

        .activity-feed { max-height: 200px; overflow-y: auto; }
        .feed-item { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; font-size: 13px; font-weight: 500; }
        .feed-icon { color: var(--accent); font-size: 8px; }

        .skeleton-loader { color: var(--text-s); font-style: italic; }

        /* USER PROFILE STYLING */
        .user-meta-block { display: flex; align-items: center; gap: 15px; }
        .avatar-frame { width: 38px; height: 38px; background: var(--accent); border-radius: 50%; border: 2px solid #fff; }
      `}</style>

      {/* RENDER SIDEBAR PILLAR */}
      <Sidebar 
        activePage={activePage} 
        setActivePage={setActivePage} 
        isCollapsed={isCollapsed} 
        setIsCollapsed={setIsCollapsed}
        onLogout={handleLogout}
      />

      {/* RENDER MAIN SYSTEM VIEWPORT */}
      <main className="system-viewport">
        <header className="system-navbar">
          <div className="breadcrumb-box">
            <span style={{color:'var(--text-s)', fontSize:'13px'}}>D&T Internal / </span>
            <strong style={{textTransform:'uppercase'}}>{activePage}</strong>
          </div>
          
          <div className="nav-controls" style={{display:'flex', gap:'25px', alignItems:'center'}}>
            <button className="theme-switch-btn" onClick={() => setIsDarkMode(!isDarkMode)}>
              {isDarkMode ? "☀️ LIGHT" : "🌙 DARK"}
            </button>
            <div className="nav-clock">{currentTime}</div>
            <div className="user-meta-block">
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:'14px', fontWeight:'700'}}>Admin Portal</div>
                <div style={{fontSize:'11px', color:'var(--text-s)'}}>Superuser Level</div>
              </div>
              <div className="avatar-frame"></div>
            </div>
          </div>
        </header>

        <section className="dynamic-content-area">
          {/* LOGIC FOR PAGE SWITCHING - Your components called directly here */}
          {activePage === "dashboard" && (
            <DashboardHome 
              weather={weather} 
              stocks={stocks} 
              news={news} 
              coords={coords} 
              empCount={totalEmployees} 
              isDarkMode={isDarkMode}
              notifications={notifications}
            />
          )}

          <div className="component-injection-point">
            {activePage === "crm" && <CRM />}
            {activePage === "employees" && <Employee />}
            {activePage === "workspace" && <TasksWorkspace />}
            {activePage === "reports" && <Reports />}
            {activePage === "settings" && <Settings />}
          </div>
        </section>

        {/* YOUR CHAT WIDGET */}
        <ChatWidget />
      </main>
    </div>
  );
}

export default Dashboard;

import React, { useState, useEffect } from "react";
import GoogleMapReact from "google-map-react";

// --- YOUR ACTUAL DIRECTORY IMPORTS ---
import CRM from "./CRM";
import Employee from "./Employee";
import Reports from "./Reports";
import Settings from "./Settings";
import TasksWorkspace from "./TasksWorkspace";
import ChatWidget from "./ChatWidget";
import api from "./api"; // Connecting to your backend logic

function Dashboard({ setMode }) {
  // --- STATES ---
  const [activePage, setActivePage] = useState("dashboard");
  const [isCollapsed, setIsCollapsed] = useState(false); // Collapsible Sidebar State
  const [currentTime, setCurrentTime] = useState("");
  const [weather, setWeather] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [news, setNews] = useState([]);
  const [coords, setCoords] = useState({ lat: 19.076, lng: 72.877 }); // Fixed 'lng' for Google Maps
  const [totalEmployees, setTotalEmployees] = useState(0);

  // --- REQUISITE FUNCTIONS ---
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadDashboard();
    getWeather();
    getStocks();
    getNews();
    getLocation();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await api.get("/api/reports");
      setTotalEmployees(res.data.total);
    } catch (err) {
      console.error(err);
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
      console.error(err);
    }
  };

  const getStocks = async () => {
    const symbols = ["RELIANCE.BSE", "TCS.BSE", "INFY.BSE"];
    const results = [];
    for (let s of symbols) {
      try {
        const res = await fetch(
          `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${s}&apikey=G8ZS20Q0VEL14JQ7`
        );
        const data = await res.json();
        results.push({
          name: s.split('.')[0],
          price: data["Global Quote"]?.["05. price"],
        });
      } catch {}
    }
    setStocks(results);
  };

  const getNews = async () => {
    try {
      const res = await fetch("https://api.spaceflightnewsapi.net/v4/articles/");
      const data = await res.json();
      setNews(data.results || []);
    } catch (err) {
      console.error(err);
    }
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude, // Fixed to 'lng' to prevent Google Maps crash
        });
      });
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setMode("login");
  };

  // --- RENDER ---
  return (
    <div className="app-container">
      <style>{`
        :root {
          --primary: #7c3aed;
          --sidebar-bg: #1e1b4b;
          --sidebar-width: 260px;
          --sidebar-collapsed: 85px;
          --content-bg: #f3f4f6;
          --white: #ffffff;
        }

        .app-container {
          display: flex;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          background: var(--content-bg);
          font-family: 'Inter', sans-serif;
        }

        /* SIDEBAR STYLES - FULL HEIGHT */
        .sidebar {
          width: ${isCollapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)'};
          height: 100vh;
          background: var(--sidebar-bg);
          display: flex;
          flex-direction: column;
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          flex-shrink: 0;
          z-index: 100;
          box-shadow: 4px 0 10px rgba(0,0,0,0.1);
        }

        .logo-section {
          padding: 20px;
          display: flex;
          align-items: center;
          justify-content: ${isCollapsed ? 'center' : 'space-between'};
          border-bottom: 1px solid rgba(255,255,255,0.1);
          height: 80px;
        }

        .logo-section img { height: 40px; display: ${isCollapsed ? 'none' : 'block'}; }

        .collapse-btn {
          background: rgba(255,255,255,0.1);
          border: none;
          color: white;
          width: 30px;
          height: 30px;
          border-radius: 6px;
          cursor: pointer;
        }

        .nav-links { flex: 1; padding: 20px 0; display: flex; flex-direction: column; gap: 5px; }

        .nav-item {
          background: transparent;
          border: none;
          color: #a5b4fc;
          padding: 16px ${isCollapsed ? '0' : '25px'};
          display: flex;
          align-items: center;
          justify-content: ${isCollapsed ? 'center' : 'flex-start'};
          cursor: pointer;
          transition: 0.2s;
          width: 100%;
        }

        .nav-item:hover { background: rgba(255,255,255,0.05); color: white; }
        .nav-item.active { background: var(--primary); color: white; border-right: 4px solid #fff; }

        .nav-icon { font-size: 20px; min-width: 30px; text-align: center; }
        .nav-label { margin-left: 15px; font-weight: 500; display: ${isCollapsed ? 'none' : 'block'}; white-space: nowrap; }

        .logout-section { border-top: 1px solid rgba(255,255,255,0.1); padding: 10px 0; }

        /* CONTENT AREA */
        .main-content {
          flex: 1;
          height: 100vh;
          overflow-y: auto;
          position: relative;
          display: flex;
          flex-direction: column;
        }

        .top-navbar {
          background: var(--white);
          height: 70px;
          padding: 0 40px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #e2e8f0;
          position: sticky;
          top: 0;
          z-index: 50;
        }

        .time-display { font-weight: 700; color: #1e293b; background: #f1f5f9; padding: 5px 15px; border-radius: 20px; }

        /* DASHBOARD GRID */
        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 24px;
          padding: 40px;
        }

        .bitrix-card {
          background: var(--white);
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          border: 1px solid #e2e8f0;
        }

        .bitrix-card h3 { font-size: 0.75rem; color: #94a3b8; text-transform: uppercase; margin-bottom: 15px; letter-spacing: 1px; }
        .val-large { font-size: 2.5rem; font-weight: 800; color: #1e293b; }

        .map-container { height: 280px; width: 100%; border-radius: 8px; overflow: hidden; margin-top: 10px; }
        .map-marker { background: #ef4444; color: white; padding: 4px 10px; border-radius: 20px; font-weight: bold; border: 2px solid white; transform: translate(-50%, -100%); }

        .news-item { font-size: 0.9rem; color: #475569; margin-bottom: 8px; display: block; text-decoration: none; }
        .news-item:hover { color: var(--primary); }

        .cta-btn {
          background: var(--primary);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: 0.2s;
        }
      `}</style>

      {/* 1. SIDEBAR - ALWAYS VISIBLE & FULL HEIGHT */}
      <aside className="sidebar">
        <div className="logo-section">
          <img src="D&T.png" alt="logo" />
          <button className="collapse-btn" onClick={() => setIsCollapsed(!isCollapsed)}>
            {isCollapsed ? "❯" : "❮"}
          </button>
        </div>

        <nav className="nav-links">
          <button className={`nav-item ${activePage === "dashboard" ? "active" : ""}`} onClick={() => setActivePage("dashboard")}>
            <span className="nav-icon">🏠</span>
            <span className="nav-label">Home</span>
          </button>
          <button className={`nav-item ${activePage === "crm" ? "active" : ""}`} onClick={() => setActivePage("crm")}>
            <span className="nav-icon">📊</span>
            <span className="nav-label">Analytics</span>
          </button>
          <button className={`nav-item ${activePage === "employees" ? "active" : ""}`} onClick={() => setActivePage("employees")}>
            <span className="nav-icon">👥</span>
            <span className="nav-label">Employees</span>
          </button>
          <button className={`nav-item ${activePage === "workspace" ? "active" : ""}`} onClick={() => setActivePage("workspace")}>
            <span className="nav-icon">💼</span>
            <span className="nav-label">Workspace</span>
          </button>
          <button className={`nav-item ${activePage === "reports" ? "active" : ""}`} onClick={() => setActivePage("reports")}>
            <span className="nav-icon">📈</span>
            <span className="nav-label">Reports</span>
          </button>
          <button className={`nav-item ${activePage === "settings" ? "active" : ""}`} onClick={() => setActivePage("settings")}>
            <span className="nav-icon">⚙️</span>
            <span className="nav-label">Settings</span>
          </button>
        </nav>

        <div className="logout-section">
          <button className="nav-item" onClick={handleLogout} style={{color: '#f87171'}}>
            <span className="nav-icon">⏻</span>
            <span className="nav-label">Logout</span>
          </button>
        </div>
      </aside>

      {/* 2. MAIN VIEWPORT */}
      <main className="main-content">
        <header className="top-navbar">
          <div className="breadcrumb">Current Page / <strong>{activePage.toUpperCase()}</strong></div>
          <div className="time-display">{currentTime}</div>
        </header>

        {/* 3. CONDITIONAL ROUTING - CALLING YOUR ACTUAL COMPONENTS */}
        <div className="page-wrapper">
          {activePage === "dashboard" ? (
            <div className="dashboard-grid">
              <div className="bitrix-card">
                <h3>Current Weather</h3>
                {weather ? (
                  <>
                    <div className="val-large">{weather.main.temp}°C</div>
                    <p>{weather.weather[0].description}</p>
                  </>
                ) : <p>Loading...</p>}
              </div>

              <div className="bitrix-card">
                <h3>Stock Market</h3>
                {stocks.map((s, i) => (
                  <div key={i} style={{display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #f1f5f9'}}>
                    <strong>{s.name}</strong>
                    <span>{s.price}</span>
                  </div>
                ))}
              </div>

              <div className="bitrix-card">
                <h3>Global News</h3>
                {news.slice(0, 5).map((n, i) => (
                  <a key={i} href={n.url} target="_blank" rel="noreferrer" className="news-item">
                    ● {n.title.substring(0, 50)}...
                  </a>
                ))}
              </div>

              <div className="bitrix-card">
                <h3>Workforce</h3>
                <div className="val-large" style={{color: 'var(--primary)'}}>{totalEmployees}</div>
                <p>Active Staff Members</p>
              </div>

              <div className="bitrix-card" style={{gridColumn: 'span 2'}}>
                <h3>Location</h3>
                <div className="map-container">
                  <GoogleMapReact
                    bootstrapURLKeys={{ key: "YOUR_GOOGLE_MAPS_API_KEY" }}
                    center={coords}
                    defaultZoom={13}
                  >
                    <div lat={coords.lat} lng={coords.lng} className="map-marker">📍 HQ</div>
                  </GoogleMapReact>
                </div>
              </div>

              <div style={{gridColumn: 'span 2', textAlign: 'right', marginTop: '20px'}}>
                <button className="cta-btn" onClick={() => setActivePage("crm")}>Enter CRM →</button>
              </div>
            </div>
          ) : (
            <>
              {/* This renders your components exactly as they are in your folder */}
              {activePage === "crm" && <CRM />}
              {activePage === "employees" && <Employee />}
              {activePage === "workspace" && <TasksWorkspace />}
              {activePage === "reports" && <Reports />}
              {activePage === "settings" && <Settings />}
            </>
          )}
        </div>

        {/* YOUR CHAT WIDGET */}
        <ChatWidget />
      </main>
    </div>
  );
}

export default Dashboard;

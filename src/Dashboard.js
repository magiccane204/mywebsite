import React, { useState, useEffect, useMemo } from "react";
import GoogleMapReact from "google-map-react";

/** * SECTION 1: MOCK COMPONENTS 
 * These represent the files shown in your directory (CRM.js, Employee.js, etc.)
 */

const CRM = () => (
  <div className="sub-view-container">
    <div className="view-card">
      <h2>CRM Overview</h2>
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr><th>Lead Name</th><th>Value</th><th>Source</th><th>Status</th></tr>
          </thead>
          <tbody>
            <tr><td>Alpha Corp</td><td>$12,500</td><td>LinkedIn</td><td><span className="pill green">Closed</span></td></tr>
            <tr><td>Beta Tech</td><td>$8,200</td><td>Referral</td><td><span className="pill blue">Negotiation</span></td></tr>
            <tr><td>Gamma Systems</td><td>$21,000</td><td>Cold Call</td><td><span className="pill orange">Discovery</span></td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

const Employee = () => (
  <div className="sub-view-container">
    <div className="view-card">
      <h2>Employee Directory</h2>
      <div className="employee-grid">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="emp-profile">
            <div className="avatar-placeholder"></div>
            <h4>User Account {i}</h4>
            <p>Senior Developer</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const TasksWorkspace = () => (
  <div className="sub-view-container">
    <div className="view-card">
      <h2>Workspace & Tasks</h2>
      <div className="kanban-layout">
        <div className="kanban-column"><h3>Todo</h3><div className="task-item">UI Refactor</div></div>
        <div className="kanban-column"><h3>Doing</h3><div className="task-item">API Integration</div></div>
        <div className="kanban-column"><h3>Done</h3><div className="task-item">Setup Repo</div></div>
      </div>
    </div>
  </div>
);

const Reports = () => (
  <div className="sub-view-container">
    <div className="view-card">
      <h2>Analytics Reports</h2>
      <div className="chart-placeholder">
        <div className="bar" style={{height: '60%'}}></div>
        <div className="bar" style={{height: '80%'}}></div>
        <div className="bar" style={{height: '40%'}}></div>
        <div className="bar" style={{height: '90%'}}></div>
      </div>
    </div>
  </div>
);

const Settings = () => (
  <div className="sub-view-container">
    <div className="view-card">
      <h2>System Settings</h2>
      <div className="settings-row">
        <label>Enable Dark Mode</label>
        <input type="checkbox" />
      </div>
      <div className="settings-row">
        <label>Email Notifications</label>
        <input type="checkbox" defaultChecked />
      </div>
    </div>
  </div>
);

const ChatWidget = () => (
  <div className="floating-chat-btn">
    <span>💬</span>
  </div>
);

/** * SECTION 2: SIDEBAR COMPONENT 
 */

const Sidebar = ({ activePage, setActivePage, isCollapsed, setIsCollapsed, handleLogout }) => {
  const menuItems = [
    { id: "dashboard", label: "Home", icon: "🏠" },
    { id: "crm", label: "Analytics", icon: "📊" },
    { id: "employees", label: "Employees", icon: "👥" },
    { id: "workspace", label: "Workspace", icon: "💼" },
    { id: "reports", label: "Reports", icon: "📈" },
    { id: "settings", label: "Settings", icon: "⚙️" },
  ];

  return (
    <aside className={`sidebar-container ${isCollapsed ? "collapsed" : ""}`}>
      <div className="sidebar-top">
        <div className="logo-area">
          {!isCollapsed && <span className="logo-text">D&T CRM</span>}
          <button className="collapse-toggle" onClick={() => setIsCollapsed(!isCollapsed)}>
            {isCollapsed ? "»" : "«"}
          </button>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`nav-link ${activePage === item.id ? "active" : ""}`}
            onClick={() => setActivePage(item.id)}
            title={isCollapsed ? item.label : ""}
          >
            <span className="nav-icon">{item.icon}</span>
            {!isCollapsed && <span className="nav-label">{item.label}</span>}
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <button className="nav-link logout-btn" onClick={handleLogout}>
          <span className="nav-icon">⏻</span>
          {!isCollapsed && <span className="nav-label">Logout</span>}
        </button>
      </div>
    </aside>
  );
};

/** * SECTION 3: DASHBOARD MAIN CONTENT 
 */

const DashboardView = ({ stats, weather, stocks, news, coords, setActivePage }) => {
  return (
    <div className="dashboard-content">
      <header className="content-header">
        <h1>Overview</h1>
        <div className="header-actions">
          <button className="primary-btn" onClick={() => setActivePage('crm')}>Open CRM →</button>
        </div>
      </header>

      <div className="dashboard-grid">
        {/* Weather Card */}
        <div className="stat-card">
          <span className="card-tag">Weather</span>
          {weather ? (
            <div className="card-body">
              <h2 className="huge-val">{Math.round(weather.main.temp)}°C</h2>
              <p>{weather.weather[0].description} in Mumbai</p>
            </div>
          ) : <p>Loading weather...</p>}
        </div>

        {/* Stock Card */}
        <div className="stat-card">
          <span className="card-tag">Markets</span>
          <div className="card-body">
            {stocks.map((s, i) => (
              <div key={i} className="list-item">
                <strong>{s.name}</strong>
                <span className={s.change?.includes('+') ? "text-green" : "text-red"}>
                  ₹{s.price}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Employee Stats */}
        <div className="stat-card highlight">
          <span className="card-tag">Team Size</span>
          <div className="card-body">
            <h2 className="huge-val">{stats.total}</h2>
            <p>Active Employees Tracked</p>
          </div>
        </div>

        {/* News Card */}
        <div className="stat-card">
          <span className="card-tag">News</span>
          <div className="card-body news-feed">
            {news.slice(0, 3).map((n, i) => (
              <p key={i} className="news-title">● {n.title.substring(0, 50)}...</p>
            ))}
          </div>
        </div>

        {/* Map Card */}
        <div className="stat-card wide-card">
          <span className="card-tag">HQ Location</span>
          <div className="map-container-fix">
            <GoogleMapReact
              bootstrapURLKeys={{ key: "YOUR_GOOGLE_MAPS_API_KEY" }}
              defaultCenter={coords}
              defaultZoom={15}
            >
              <div lat={coords.lat} lng={coords.lng} className="map-marker">📍 HQ</div>
            </GoogleMapReact>
          </div>
        </div>
      </div>
    </div>
  );
};

/** * MAIN APP CONTROLLER 
 */

function Dashboard({ setMode }) {
  // UI States
  const [activePage, setActivePage] = useState("dashboard");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  // Data States
  const [weather, setWeather] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [news, setNews] = useState([]);
  const [coords, setCoords] = useState({ lat: 19.076, lng: 72.877 });
  const [totalEmployees, setTotalEmployees] = useState(124);

  // Effects
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
    loadData();
    return () => clearInterval(timer);
  }, []);

  const loadData = async () => {
    try {
      // Parallel fetch for speed
      getWeather();
      getStocks();
      getNews();
      getLocation();
    } catch (e) {
      console.error(e);
    }
  };

  const getWeather = async () => {
    try {
      const res = await fetch("https://api.openweathermap.org/data/2.5/weather?q=Mumbai&appid=3de55583c5dce6d3730d5e7629577229&units=metric");
      const data = await res.json();
      if (data.main) setWeather(data);
    } catch {}
  };

  const getStocks = async () => {
    // Mocking stock data to avoid API limit issues
    setStocks([
      { name: "RELIANCE", price: "2,540.00", change: "+1.2%" },
      { name: "TCS", price: "3,410.20", change: "-0.4%" }
    ]);
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
    <div className="full-app-wrapper">
      <style>{`
        :root {
          --primary: #7c3aed;
          --sidebar-bg: #1e1b4b;
          --content-bg: #f1f5f9;
          --sidebar-w: 260px;
          --sidebar-w-small: 85px;
          --text-muted: #64748b;
          --white: #ffffff;
          --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .full-app-wrapper {
          display: flex;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          font-family: 'Inter', system-ui, sans-serif;
          background: var(--content-bg);
        }

        /* SIDEBAR SECTION */
        .sidebar-container {
          width: var(--sidebar-w);
          height: 100vh;
          background: var(--sidebar-bg);
          display: flex;
          flex-direction: column;
          transition: var(--transition);
          flex-shrink: 0;
          box-shadow: 4px 0 15px rgba(0,0,0,0.1);
          z-index: 100;
        }

        .sidebar-container.collapsed {
          width: var(--sidebar-w-small);
        }

        .sidebar-top {
          padding: 20px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .logo-area {
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: white;
          font-weight: 800;
          font-size: 1.2rem;
        }

        .collapse-toggle {
          background: rgba(255,255,255,0.1);
          border: none;
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 6px;
          cursor: pointer;
        }

        .sidebar-nav {
          flex: 1;
          padding: 15px 0;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .nav-link {
          display: flex;
          align-items: center;
          padding: 15px 25px;
          color: #a5b4fc;
          background: transparent;
          border: none;
          width: 100%;
          text-align: left;
          cursor: pointer;
          transition: 0.2s;
        }

        .nav-link:hover {
          background: rgba(255,255,255,0.05);
          color: white;
        }

        .nav-link.active {
          background: var(--primary);
          color: white;
          border-right: 4px solid white;
        }

        .nav-icon {
          font-size: 1.4rem;
          min-width: 35px;
          display: flex;
          justify-content: center;
        }

        .nav-label {
          margin-left: 15px;
          font-weight: 500;
          white-space: nowrap;
        }

        .logout-btn { color: #fda4af; margin-top: auto; }

        /* CONTENT SECTION */
        .main-stage {
          flex: 1;
          display: flex;
          flex-direction: column;
          height: 100vh;
          overflow-y: auto;
        }

        .stage-top-bar {
          background: var(--white);
          height: 70px;
          padding: 0 40px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #e2e8f0;
          position: sticky;
          top: 0;
          z-index: 50;
        }

        .clock-badge {
          background: #f1f5f9;
          padding: 8px 15px;
          border-radius: 20px;
          font-family: monospace;
          font-weight: bold;
          color: #1e293b;
        }

        .dashboard-content { padding: 40px; }

        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 25px;
        }

        .stat-card {
          background: var(--white);
          border-radius: 16px;
          padding: 25px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
          border: 1px solid #e2e8f0;
        }

        .stat-card.wide-card { grid-column: span 2; }

        .card-tag {
          font-size: 0.75rem;
          text-transform: uppercase;
          color: var(--text-muted);
          font-weight: 700;
          letter-spacing: 1px;
        }

        .huge-val { font-size: 3rem; margin: 15px 0 5px; color: #0f172a; }

        .map-container-fix {
          height: 300px;
          width: 100%;
          border-radius: 12px;
          overflow: hidden;
          margin-top: 15px;
          background: #cbd5e1;
        }

        .list-item {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid #f1f5f9;
        }

        .primary-btn {
          background: var(--primary);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
        }

        .floating-chat-btn {
          position: fixed;
          bottom: 30px;
          right: 30px;
          width: 60px;
          height: 60px;
          background: var(--primary);
          color: white;
          border-radius: 50%;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 24px;
          box-shadow: 0 10px 25px rgba(124, 58, 237, 0.4);
          z-index: 1000;
        }

        /* VIEW SPECIFIC */
        .sub-view-container { padding: 40px; }
        .view-card { background: white; padding: 30px; border-radius: 16px; min-height: 500px; }
        .data-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        .data-table th { text-align: left; padding: 12px; border-bottom: 2px solid #f1f5f9; color: var(--text-muted); }
        .data-table td { padding: 15px 12px; border-bottom: 1px solid #f1f5f9; }
        .pill { padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: bold; }
        .pill.green { background: #dcfce7; color: #166534; }
        .pill.blue { background: #dbeafe; color: #1e40af; }
        .pill.orange { background: #ffedd5; color: #9a3412; }
      `}</style>

      {/* COMPONENT 1: SIDEBAR */}
      <Sidebar 
        activePage={activePage} 
        setActivePage={setActivePage} 
        isCollapsed={isCollapsed} 
        setIsCollapsed={setIsCollapsed}
        handleLogout={handleLogout}
      />

      {/* COMPONENT 2: MAIN VIEWPORT */}
      <main className="main-stage">
        <header className="stage-top-bar">
          <div className="breadcrumb">System / <strong>{activePage}</strong></div>
          <div className="clock-badge">{currentTime}</div>
          <div className="user-profile-summary" style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
            <span style={{fontSize: '14px', fontWeight: '600'}}>Welcome, Admin</span>
            <div style={{width: 35, height: 35, background: '#7c3aed', borderRadius: '50%'}}></div>
          </div>
        </header>

        <section className="viewport-inner">
          {activePage === "dashboard" && (
            <DashboardView 
              stats={{ total: totalEmployees }}
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
        </section>

        <ChatWidget />
      </main>
    </div>
  );
}

export default Dashboard;

import React, { useState, useEffect, useCallback } from "react";
import GoogleMapReact from "google-map-react";

/** * Mock Components to ensure the code runs 
 * Replace these with your actual file imports
 */
const CRM = () => <div className="p-20">CRM Component Loaded</div>;
const Employee = () => <div className="p-20">Employee Management</div>;
const Reports = () => <div className="p-20">System Reports</div>;
const Settings = () => <div className="p-20">Settings Panel</div>;
const TasksWorkspace = () => <div className="p-20">Tasks & Workspace</div>;
const ChatWidget = () => <div className="chat-fab">💬</div>;

// Simulated API for the demonstration
const api = {
  get: async () => ({ data: { total: 124 } })
};

function Dashboard({ setMode }) {
  // --- STATE MANAGEMENT ---
  const [activePage, setActivePage] = useState("dashboard");
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [weather, setWeather] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [news, setNews] = useState([]);
  const [coords, setCoords] = useState({ lat: 19.076, lng: 72.877 }); // Default to Mumbai
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState([
    { id: 1, text: "New employee onboarded", time: "2m ago" },
    { id: 2, text: "Server backup completed", time: "1h ago" },
  ]);

  // --- EFFECTS ---

  // Clock Interval
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Data Fetching
  useEffect(() => {
    const initDashboard = async () => {
      setIsLoading(true);
      await Promise.all([
        loadEmployeeStats(),
        getWeather(),
        getStocks(),
        getNews(),
        getLocation()
      ]);
      setIsLoading(false);
    };
    initDashboard();
  }, []);

  // --- LOGIC FUNCTIONS ---

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
      // Note: Replace with your actual valid API key
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
      setStocks(results);
    } catch (err) {
      // Fallback mock data if API limit reached
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
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => console.log("User denied location access.")
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
    >
      <span className="icon">{icon}</span>
      <span className="label">{label}</span>
    </button>
  );

  const MapMarker = ({ text }) => (
    <div style={{
      color: 'white', 
      background: 'red',
      padding: '5px 10px',
      display: 'inline-flex',
      textAlign: 'center',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '20px',
      transform: 'translate(-50%, -50%)',
      fontWeight: 'bold',
      boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
    }}>
      📍 You
    </div>
  );

  // --- MAIN UI ---

  return (
    <div className="dashboard-container">
      {/* INTERNAL STYLES TO FIX DESIGN IMMEDIATELY */}
      <style>{`
        :root {
          --primary: #7c3aed;
          --bg-light: #f3f4f6;
          --sidebar-width: 260px;
          --card-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }

        .dashboard-container {
          display: flex;
          height: 100vh;
          width: 100vw;
          overflow: hidden;
          font-family: 'Inter', sans-serif;
          background: var(--bg-light);
        }

        .sidebar {
          width: var(--sidebar-width);
          background: #1e1b4b;
          display: flex;
          flex-direction: column;
          padding: 20px 0;
          color: white;
        }

        .logo-section {
          padding: 0 25px 30px;
          text-align: center;
        }

        .logo-section img { max-width: 120px; }

        .sidebar-btn {
          background: transparent;
          border: none;
          color: #a5b4fc;
          padding: 15px 25px;
          text-align: left;
          display: flex;
          align-items: center;
          cursor: pointer;
          transition: 0.3s;
          width: 100%;
          font-size: 15px;
        }

        .sidebar-btn:hover { background: rgba(255,255,255,0.05); color: white; }
        .sidebar-btn.active { 
          background: var(--primary); 
          color: white; 
          border-right: 4px solid #fff;
        }

        .sidebar-btn .icon { margin-right: 15px; font-size: 18px; }
        .sidebar-btn .label { font-weight: 500; }

        .main-content {
          flex: 1;
          overflow-y: auto;
          position: relative;
        }

        .top-bar {
          background: white;
          padding: 15px 40px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .time-display {
          font-weight: 700;
          font-size: 1.2rem;
          color: #1f2937;
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 25px;
          padding: 40px;
        }

        .stat-card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: var(--card-shadow);
          transition: transform 0.2s;
        }

        .stat-card:hover { transform: translateY(-5px); }

        .stat-card h3 {
          margin: 0 0 15px 0;
          font-size: 0.9rem;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .weather-info h2 { font-size: 2.5rem; margin: 0; color: #111827; }
        
        .stock-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #f3f4f6;
        }

        .map-container {
          height: 250px;
          width: 100%;
          border-radius: 8px;
          overflow: hidden;
          margin-top: 10px;
          background: #e5e7eb;
        }

        .news-item {
          font-size: 0.85rem;
          margin-bottom: 10px;
          color: #374151;
          display: block;
          text-decoration: none;
        }

        .news-item:hover { color: var(--primary); }

        .btn-enter-crm {
          position: fixed;
          bottom: 30px;
          right: 30px;
          padding: 15px 30px;
          background: var(--primary);
          color: white;
          border: none;
          border-radius: 50px;
          font-weight: 600;
          box-shadow: 0 10px 15px -3px rgba(124, 58, 237, 0.4);
          cursor: pointer;
          z-index: 10;
        }

        .loading-overlay {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100%;
          font-weight: bold;
          color: var(--primary);
        }
      `}</style>

      {/* SIDEBAR NAVIGATION */}
      <aside className="sidebar">
        <div className="logo-section">
          <img src="D&T.png" alt="Company Logo" />
        </div>

        <nav>
          <SidebarItem id="dashboard" icon="🏠" label="Home" />
          <SidebarItem id="crm" icon="📊" label="Analytics" />
          <SidebarItem id="employees" icon="👥" label="Employees" />
          <SidebarItem id="workspace" icon="💼" label="Workspace" />
          <SidebarItem id="reports" icon="📈" label="Reports" />
          <SidebarItem id="settings" icon="⚙️" label="Settings" />
          
          <div style={{ marginTop: 'auto' }}>
            <button className="sidebar-btn" onClick={handleLogout} style={{ color: '#f87171' }}>
              <span className="icon">⏻</span>
              <span className="label">Logout</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="main-content">
        <header className="top-bar">
          <div className="search-box">
            <input type="text" placeholder="Search data..." style={{ padding: '8px 15px', borderRadius: '20px', border: '1px solid #ddd' }} />
          </div>
          <div className="time-display">{currentTime}</div>
          <div className="user-profile" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 'bold' }}>Admin User</div>
              <div style={{ fontSize: '12px', color: '#666' }}>Premium Tier</div>
            </div>
            <div style={{ width: 40, height: 40, background: '#7c3aed', borderRadius: '50%' }}></div>
          </div>
        </header>

        {activePage === "dashboard" ? (
          <div className="dashboard-body">
            {isLoading ? (
              <div className="loading-overlay">Initializing Dashboard...</div>
            ) : (
              <div className="dashboard-grid">
                
                {/* Weather Widget */}
                <div className="stat-card">
                  <h3>Current Weather</h3>
                  {weather ? (
                    <div className="weather-info">
                      <h2>{Math.round(weather.main.temp)}°C</h2>
                      <p style={{ textTransform: 'capitalize', color: '#6b7280' }}>
                        {weather.weather[0].description} in Mumbai
                      </p>
                    </div>
                  ) : <p>Loading weather...</p>}
                </div>

                {/* Stock Market Widget */}
                <div className="stat-card">
                  <h3>Stock Watchlist</h3>
                  {stocks.map((s, i) => (
                    <div key={i} className="stock-row">
                      <strong>{s.name}</strong>
                      <span style={{ color: s.change?.startsWith('+') ? '#059669' : '#dc2626' }}>
                        ₹{s.price}
                      </span>
                    </div>
                  ))}
                </div>

                {/* News Widget */}
                <div className="stat-card">
                  <h3>Global Headlines</h3>
                  {news.length > 0 ? (
                    news.map((n, i) => (
                      <a key={i} href={n.url} target="_blank" rel="noreferrer" className="news-item">
                        • {n.title.substring(0, 50)}...
                      </a>
                    ))
                  ) : <p>Fetching news...</p>}
                </div>

                {/* Total Employees Widget */}
                <div className="stat-card">
                  <h3>Workforce</h3>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                    <h1 style={{ fontSize: '3rem', margin: 0 }}>{totalEmployees}</h1>
                    <span style={{ color: '#059669', fontWeight: 'bold' }}>+12% this month</span>
                  </div>
                  <p style={{ color: '#6b7280', fontSize: '0.8rem' }}>Active employees across 4 branches</p>
                </div>

                {/* Map Widget - FIX: Wrapped in container with height/width */}
                <div className="stat-card" style={{ gridColumn: 'span 2' }}>
                  <h3>Office Location</h3>
                  <div className="map-container">
                    <GoogleMapReact
                      bootstrapURLKeys={{ key: "YOUR_GOOGLE_MAPS_API_KEY" }}
                      defaultCenter={coords}
                      defaultZoom={14}
                    >
                      <MapMarker lat={coords.lat} lng={coords.lng} />
                    </GoogleMapReact>
                  </div>
                </div>

                {/* Activity Feed */}
                <div className="stat-card">
                  <h3>Recent Activity</h3>
                  {notifications.map(n => (
                    <div key={n.id} style={{ marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px solid #eee' }}>
                      <div style={{ fontWeight: '500', fontSize: '0.9rem' }}>{n.text}</div>
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{n.time}</div>
                    </div>
                  ))}
                </div>

              </div>
            )}

            <button className="btn-enter-crm" onClick={() => setActivePage("crm")}>
              Launch CRM Analytics →
            </button>
          </div>
        ) : (
          <div className="page-content">
            {activePage === "crm" && <CRM />}
            {activePage === "employees" && <Employee />}
            {activePage === "workspace" && <TasksWorkspace />}
            {activePage === "reports" && <Reports />}
            {activePage === "settings" && <Settings />}
          </div>
        )}

        <ChatWidget />
      </main>
    </div>
  );
}

export default Dashboard;

import { useState, useEffect } from "react";
import CRM from "./CRM";
import Employee from "./Employee";
import Reports from "./Reports";
import Settings from "./Settings";
import TasksWorkspace from "./TasksWorkspace";
import api from "./api";
import "./CRM.css";
import ChatWidget from "./ChatWidget";
import GoogleMapReact from "google-map-react";

function Dashboard({ setMode }) {
  const [activePage, setActivePage] = useState("dashboard");
  const [currentTime, setCurrentTime] = useState("");

  const [weather, setWeather] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [news, setNews] = useState([]);
  const [coords, setCoords] = useState(null);
  const [totalEmployees, setTotalEmployees] = useState(0);

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
          name: s,
          price: data["Global Quote"]?.["05. price"],
        });
      } catch {}
    }

    setStocks(results);
  };

  const getNews = async () => {
    try {
      const res = await fetch(
        "https://api.spaceflightnewsapi.net/v4/articles/"
      );
      const data = await res.json();
      setNews(data.results || []);
    } catch (err) {
      console.error(err);
    }
  };

  const getLocation = () => {
    navigator.geolocation.getCurrentPosition((pos) => {
      setCoords({
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
      });
    });
  };

  const Map = ({ lat, lng }) => {
    return (
      <div style={{ height: "220px", width: "100%" }}>
        <GoogleMapReact
          bootstrapURLKeys={{ key: "YOUR_GOOGLE_MAPS_API_KEY" }}
          defaultCenter={{ lat, lng }}
          defaultZoom={13}
        >
          <div lat={lat} lng={lng}>📍</div>
        </GoogleMapReact>
      </div>
    );
  };

  const handleLogout = () => {
    localStorage.clear();
    setMode("login");
  };

  if (activePage === "dashboard") {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          background: "#f9fafb",
          position: "relative",
          padding: "40px",
        }}
      >
        <div className="time-display">{currentTime}</div>

        <div className="bitrix-grid">

          <div className="bitrix-card">
            <h3>Weather</h3>
            {weather && weather.main ? (
              <>
                <h2>{weather.main.temp}°C</h2>
                <p>{weather.weather[0].description}</p>
              </>
            ) : <p>Loading...</p>}
          </div>

          <div className="bitrix-card">
            <h3>Stock Market</h3>
            {stocks.length > 0 ? (
              stocks.map((s, i) => (
                <div key={i}>
                  <strong>{s.name}</strong>
                  <p>{s.price}</p>
                </div>
              ))
            ) : <p>Loading...</p>}
          </div>

          <div className="bitrix-card">
            <h3>Global News</h3>
            {news.length > 0 ? (
              news.slice(0,5).map((n,i)=><p key={i}>{n.title}</p>)
            ) : <p>Loading...</p>}
          </div>

          <div className="bitrix-card">
            <h3>Location</h3>
            {coords ? (
              <Map lat={coords.lat} lng={coords.lon} />
            ) : (
              <p>Fetching location...</p>
            )}
          </div>

          <div className="bitrix-card">
            <h3>Total Employees</h3>
            <h1>{totalEmployees}</h1>
          </div>

        </div>

        <div style={{ position: "absolute", bottom: "40px", right: "40px" }}>
          <button
            style={{
              padding: "12px 20px",
              borderRadius: "8px",
              border: "none",
              background: "#7c3aed",
              color: "white",
              cursor: "pointer",
            }}
            onClick={() => setActivePage("crm")}
          >
            Enter CRM →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="sidebar">
        <div className="logo">
          <img src="D&T.png" alt="logo" />
        </div>

        <button onClick={() => setActivePage("dashboard")}>🏠 Home</button>
        <button onClick={() => setActivePage("crm")}>📊 Analytics</button>
        <button onClick={() => setActivePage("employees")}>👥 Employees</button>
        <button onClick={() => setActivePage("workspace")}>💼 Workspace</button>
        <button onClick={() => setActivePage("reports")}>📈 Reports</button>
        <button onClick={() => setActivePage("settings")}>⚙️ Settings</button>
        <button onClick={handleLogout}>⏻ Logout</button>
      </div>

      <div className="content">
        <div className="time-display">{currentTime}</div>

        {activePage === "crm" && <CRM />}
        {activePage === "employees" && <Employee />}
        {activePage === "workspace" && <TasksWorkspace />}
        {activePage === "reports" && <Reports />}
        {activePage === "settings" && <Settings />}

        <ChatWidget />
      </div>
    </div>
  );
}

export default Dashboard;

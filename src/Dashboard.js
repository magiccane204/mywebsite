import { useState, useEffect } from "react";
import CRM from "./CRM";
import Employee from "./Employee";
import Reports from "./Reports";
import Settings from "./Settings";
import TasksWorkspace from "./TasksWorkspace";
import api from "./api";
import "./CRM.css";
import ChatWidget from "./ChatWidget";

function Dashboard({ setMode }) {
  const [activePage, setActivePage] = useState("dashboard");
  const [currentTime, setCurrentTime] = useState("");

  const [weather, setWeather] = useState(null);
  const [stocks, setStocks] = useState(null);
  const [news, setNews] = useState([]);
  const [location, setLocation] = useState("");
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
        "https://api.openweathermap.org/data/2.5/weather?q=Mumbai&appid=YOUR_WEATHER_KEY&units=metric"
      );
      const data = await res.json();
      if (data.main) setWeather(data);
    } catch (err) {
      console.error(err);
    }
  };

  const getStocks = async () => {
    try {
      const res = await fetch(
        "https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=RELIANCE.BSE&apikey=YOUR_STOCK_KEY"
      );
      const data = await res.json();
      setStocks(data["Global Quote"] || null);
    } catch (err) {
      console.error(err);
    }
  };

  const getNews = async () => {
    try {
      const res = await fetch(
        "https://newsapi.org/v2/top-headlines?country=in&apiKey=YOUR_NEWS_KEY"
      );
      const data = await res.json();
      setNews(data.articles || []);
    } catch (err) {
      console.error(err);
    }
  };

  const getLocation = () => {
    navigator.geolocation.getCurrentPosition((pos) => {
      setLocation(`Lat: ${pos.coords.latitude}, Lon: ${pos.coords.longitude}`);
    });
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
            ) : (
              <p>Loading...</p>
            )}
          </div>

          <div className="bitrix-card">
            <h3>Stock Market</h3>
            {stocks && stocks["05. price"] ? (
              <>
                <h2>{stocks["05. price"]}</h2>
                <p>Change: {stocks["10. change percent"]}</p>
              </>
            ) : (
              <p>Loading...</p>
            )}
          </div>

          <div className="bitrix-card">
            <h3>Global News</h3>
            {news.length > 0 ? (
              news.slice(0,5).map((n, i) => <p key={i}>• {n.title}</p>)
            ) : (
              <p>Loading...</p>
            )}
          </div>

          <div className="bitrix-card">
            <h3>Location</h3>
            <p>{location || "Fetching location..."}</p>
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
        <button onClick={() => setActivePage("dashboard")}>
          <span>🏠</span>
          <span>Home</span>
        </button>
        <button onClick={() => setActivePage("crm")}>
          <span>📊</span>
          <span>Analytics</span>
        </button>
        <button onClick={() => setActivePage("employees")}>
          <span>👥</span>
          <span>Employees</span>
        </button>
        <button onClick={() => setActivePage("workspace")}>
          <span>💼</span>
          <span>Workspace</span>
        </button>
        <button onClick={() => setActivePage("reports")}>
          <span>📈</span>
          <span>Reports</span>
        </button>
        <button onClick={() => setActivePage("settings")}>
          <span>⚙️</span>
          <span>Settings</span>
        </button>
        <button onClick={handleLogout}>
          <span>⏻</span>
          <span>Logout</span>
        </button>
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

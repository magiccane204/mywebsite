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
  const [coords, setCoords] = useState(null);
  const [totalEmployees, setTotalEmployees] = useState(0);

  // ⏰ TIME
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // 📡 LOAD DATA
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

  // 🌦 WEATHER
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

  // 📈 STOCK
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

  // 📰 NEWS
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

  // 📍 LOCATION
  const getLocation = () => {
    navigator.geolocation.getCurrentPosition((pos) => {
      setCoords({
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
      });
    });
  };

  const handleLogout = () => {
    localStorage.clear();
    setMode("login");
  };

  return (
    <div className="app">
      {/* SIDEBAR (UNCHANGED) */}
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

      {/* CONTENT */}
      <div className="content">
        <div className="time-display">{currentTime}</div>

        {/* DASHBOARD */}
        {activePage === "dashboard" && (
          <div style={{ padding: "40px" }}>
            <div className="bitrix-grid">

              {/* WEATHER */}
              <div className="bitrix-card">
                <h3>Weather</h3>
                {weather && weather.main ? (
                  <>
                    <h1>{weather.main.temp}°C</h1>
                    <img
                      src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
                      alt=""
                    />
                    <p>{weather.weather[0].description}</p>
                  </>
                ) : (
                  <p>Loading...</p>
                )}
              </div>

              {/* STOCK */}
              <div className="bitrix-card">
                <h3>Stock Market</h3>
                {stocks && stocks["05. price"] ? (
                  <>
                    <h2>₹ {stocks["05. price"]}</h2>
                    <p>{stocks["10. change percent"]}</p>
                  </>
                ) : (
                  <p>Loading...</p>
                )}
              </div>

              {/* NEWS */}
              <div className="bitrix-card" style={{ overflowY: "auto", maxHeight: "250px" }}>
                <h3>Live News</h3>
                {news.length > 0 ? (
                  news.slice(0, 5).map((n, i) => (
                    <div key={i} style={{ marginBottom: "12px" }}>
                      <img
                        src={n.urlToImage || "https://via.placeholder.com/150"}
                        alt=""
                        style={{ width: "100%", borderRadius: "8px" }}
                      />
                      <p style={{ fontSize: "13px" }}>{n.title}</p>
                    </div>
                  ))
                ) : (
                  <p>Loading...</p>
                )}
              </div>

              {/* MAP */}
              <div className="bitrix-card">
                <h3>Location</h3>
                {coords ? (
                  <iframe
                    width="100%"
                    height="220"
                    src={`https://maps.google.com/maps?q=${coords.lat},${coords.lon}&z=15&output=embed`}
                  ></iframe>
                ) : (
                  <p>Fetching location...</p>
                )}
              </div>

              {/* EMPLOYEES */}
              <div className="bitrix-card">
                <h3>Total Employees</h3>
                <h1>{totalEmployees}</h1>
              </div>

            </div>
          </div>
        )}

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

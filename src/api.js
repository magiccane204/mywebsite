import axios from "axios";

const api = axios.create({
  baseURL: "https://mywebsite-im3c.onrender.com",
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;

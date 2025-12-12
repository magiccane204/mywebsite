import React, { useEffect, useState } from "react";
import axios from "axios";
import { PieChart, Pie, Tooltip, Cell, Legend, ResponsiveContainer } from "recharts";
import "./CRM.css";

const COLORS = ["#22c55e", "#3b82f6", "#ef4444", "#f59e0b", "#8b5cf6"];

function Reports() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    total: 0,
    avgSalary: 0,
    maxSalary: 0,
    minSalary: 0,
  });

  // ✅ Fetch all customers for logged-in user
  useEffect(() => {
    async function fetchReports() {
      try {
        const userEmail = localStorage.getItem("loggedInUser");
        if (!userEmail) {
          setLoading(false);
          return;
        }

        const res = await axios.get(`http://localhost:5002/customers/${userEmail}`);
        setCustomers(res.data);

        if (res.data.length > 0) {
          const salaries = res.data.map((c) => c.Salary || 0);
          const roles = {};

          res.data.forEach((c) => {
            const role = c["Applied Position"] || "Unknown";
            roles[role] = (roles[role] || 0) + 1;
          });

          const total = res.data.length;
          const avgSalary = Math.round(salaries.reduce((a, b) => a + b, 0) / total);
          const maxSalary = Math.max(...salaries);
          const minSalary = Math.min(...salaries);

          setSummary({ total, avgSalary, maxSalary, minSalary });
          setRoleData(
            Object.keys(roles).map((key) => ({ name: key, value: roles[key] }))
          );
        }
      } catch (err) {
        console.error("Error fetching report data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchReports();
  }, []);

  const [roleData, setRoleData] = useState([]);

  if (loading) return <div className="content"><div>Loading reports...</div></div>;

  return (
    <div className="content">
      <div className="horizontalbar">📊 Customer Reports</div>

      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <h3>Overall Summary</h3>
        <p>Total Customers: <b>{summary.total}</b></p>
        <p>Average Salary: <b>₹{summary.avgSalary}</b></p>
        <p>Highest Salary: <b>₹{summary.maxSalary}</b></p>
        <p>Lowest Salary: <b>₹{summary.minSalary}</b></p>
      </div>

      <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
        {roleData.length > 0 ? (
          <ResponsiveContainer width="80%" height={400}>
            <PieChart>
              <Pie
                dataKey="value"
                isAnimationActive={true}
                data={roleData}
                cx="50%"
                cy="50%"
                outerRadius={130}
                fill="#8884d8"
                label
              >
                {roleData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p>No customer data to display.</p>
        )}
      </div>
    </div>
  );
}

export default Reports;

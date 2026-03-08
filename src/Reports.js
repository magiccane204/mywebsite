import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  PieChart,
  Pie,
  Tooltip,
  Cell,
  Legend,
  ResponsiveContainer
} from "recharts";
import "./CRM.css";

const COLORS = ["#22c55e", "#3b82f6", "#ef4444", "#f59e0b", "#8b5cf6"];

function Reports() {

  const [employees, setEmployees] = useState([]);
  const [roleData, setRoleData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [summary, setSummary] = useState({
    total: 0,
    avgSalary: 0,
    maxSalary: 0,
    minSalary: 0
  });

  useEffect(() => {

    async function fetchReports() {

      try {

        const token = localStorage.getItem("token");

        const res = await axios.get("/api/Employees", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const data = res.data || [];

        setEmployees(data);

        if (data.length === 0) {
          setLoading(false);
          return;
        }

        const salaries = [];
        const roles = {};

        data.forEach(emp => {

          const salary = emp.Salary || 0;
          salaries.push(salary);

          const role = emp["Applied Position"] || "Unknown";

          roles[role] = (roles[role] || 0) + 1;

        });

        const total = salaries.length;

        const avgSalary =
          total > 0
            ? Math.round(
                salaries.reduce((a, b) => a + b, 0) / total
              )
            : 0;

        const maxSalary = Math.max(...salaries);
        const minSalary = Math.min(...salaries);

        setSummary({
          total,
          avgSalary,
          maxSalary,
          minSalary
        });

        const roleChartData = Object.keys(roles).map(key => ({
          name: key,
          value: roles[key]
        }));

        setRoleData(roleChartData);

      } catch (err) {

        console.error("REPORT_FETCH_ERROR", err);

      } finally {

        setLoading(false);

      }

    }

    fetchReports();

  }, []);

  if (loading)
    return (
      <div className="content">
        <h3>Loading Reports...</h3>
      </div>
    );

  return (

    <div className="content">

      <div className="horizontalbar">
        📊 Employee Salary Reports
      </div>

      <div style={{ textAlign: "center", marginBottom: "20px" }}>

        <h3>Overall Summary</h3>

        <p>Total Employees: <b>{summary.total}</b></p>

        <p>Average Salary: <b>₹{summary.avgSalary}</b></p>

        <p>Highest Salary: <b>₹{summary.maxSalary}</b></p>

        <p>Lowest Salary: <b>₹{summary.minSalary}</b></p>

      </div>

      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
      }}>

        {roleData.length > 0 ? (

          <ResponsiveContainer width="80%" height={400}>

            <PieChart>

              <Pie
                data={roleData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={140}
                label
              >

                {roleData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}

              </Pie>

              <Tooltip />
              <Legend />

            </PieChart>

          </ResponsiveContainer>

        ) : (

          <p>No employee data available.</p>

        )}

      </div>

    </div>

  );

}

export default Reports;


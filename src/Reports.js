import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line, AreaChart, Area,
  ScatterChart, Scatter, ZAxis
} from "recharts";
import "./CRM.css"; 


const COLORS = ["#7c3aed", "#38bdf8", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#8b5cf6", "#14b8a6", "#f97316", "#6366f1"];


const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'var(--bg-card, #161533)',
        border: '1px solid var(--border, #2d2b55)',
        padding: '12px 16px',
        borderRadius: '8px',
        boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
        color: 'var(--text-main, #fff)'
      }}>
        {label && <p style={{ margin: '0 0 8px 0', fontWeight: 800, fontSize: '14px' }}>{label}</p>}
        {payload.map((entry, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: entry.color }}></div>
            <p style={{ margin: 0, color: 'var(--text-dim, #94a3b8)', fontWeight: 600, fontSize: '13px' }}>
              {entry.name}: <span style={{ color: 'var(--text-main, #fff)' }}>
                {typeof entry.value === 'number' && entry.name.includes("Salary") 
                  ? `₹${entry.value.toLocaleString()}` 
                  : entry.value}
              </span>
            </p>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

function Reports() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

 
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [leaves, setLeaves] = useState([]);

  const [summary, setSummary] = useState({ total: 0, avgSalary: 0, maxSalary: 0, activeTasks: 0, totalLeaves: 0 });

  useEffect(() => {
    async function fetchSystemData() {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        const [empRes, taskRes, leaveRes] = await Promise.all([
          axios.get("/api/Employees", { headers }),
          axios.get("/api/tasks", { headers }),
          axios.get("/api/leaves", { headers })
        ]);

        const empData = empRes.data || [];
        const taskData = taskRes.data || [];
        const leaveData = leaveRes.data || [];

        setEmployees(empData);
        setTasks(taskData);
        setLeaves(leaveData);

        
        const salaries = empData.map(e => e.Salary || 0);
        const total = empData.length;
        const avgSalary = total > 0 ? Math.round(salaries.reduce((a, b) => a + b, 0) / total) : 0;
        
        setSummary({
          total,
          avgSalary,
          maxSalary: salaries.length > 0 ? Math.max(...salaries) : 0,
          activeTasks: taskData.filter(t => t.Status !== "Completed").length,
          totalLeaves: leaveData.length
        });

      } catch (err) {
        console.error("TELEMETRY_FETCH_ERROR", err);
        setError("Failed to sync live telemetry from the server.");
      } finally {
        setLoading(false);
      }
    }

    fetchSystemData();
  }, []);


  const positionData = useMemo(() => {
    const counts = {};
    employees.forEach(emp => {
      const pos = emp["Applied Position"] || "Unspecified";
      counts[pos] = (counts[pos] || 0) + 1;
    });
    return Object.keys(counts).map(k => ({ name: k, value: counts[k] }));
  }, [employees]);

  const salaryByPosData = useMemo(() => {
    const groups = {};
    employees.forEach(emp => {
      const pos = emp["Applied Position"] || "Unspecified";
      if (!groups[pos]) groups[pos] = { total: 0, count: 0 };
      groups[pos].total += emp.Salary || 0;
      groups[pos].count += 1;
    });
    return Object.keys(groups).map(k => ({
      name: k,
      AvgSalary: Math.round(groups[k].total / groups[k].count)
    }));
  }, [employees]);


  const hiringTimelineData = useMemo(() => {
    const timeline = {};
    employees.forEach(emp => {
      if (!emp.createdAt) return;
      const date = new Date(emp.createdAt);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      timeline[monthYear] = (timeline[monthYear] || 0) + 1;
    });
    return Object.keys(timeline).sort().map(k => ({ date: k, Hires: timeline[k] }));
  }, [employees]);

  const rolePrivilegeData = useMemo(() => {
    const counts = {};
    employees.forEach(emp => {
      const role = emp.Role || "Employee";
      counts[role] = (counts[role] || 0) + 1;
    });
    return Object.keys(counts).map(k => ({ name: k, value: counts[k] }));
  }, [employees]);


  const accountStatusData = useMemo(() => {
    const lockedCount = employees.filter(e => e.locked).length;
    const activeCount = employees.length - lockedCount;
    return [
      { name: "Active", value: activeCount },
      { name: "Locked", value: lockedCount }
    ];
  }, [employees]);


  const taskStatusData = useMemo(() => {
    const counts = {};
    tasks.forEach(t => {
      const status = t.Status || "Pending";
      counts[status] = (counts[status] || 0) + 1;
    });
    return Object.keys(counts).map(k => ({ name: k, Tasks: counts[k] }));
  }, [tasks]);


  const workloadData = useMemo(() => {
    const counts = {};
    tasks.forEach(t => {
      const email = t.EmployeeEmail || "Unknown";
      const name = email.split("@")[0]; 
      counts[name] = (counts[name] || 0) + 1;
    });
   
    return Object.keys(counts)
      .map(k => ({ name: k, Tasks: counts[k] }))
      .sort((a, b) => b.Tasks - a.Tasks)
      .slice(0, 5);
  }, [tasks]);


  const leaveStatusData = useMemo(() => {
    const counts = {};
    leaves.forEach(l => {
      const status = l.Status || "Submitted";
      counts[status] = (counts[status] || 0) + 1;
    });
    return Object.keys(counts).map(k => ({ name: k, value: counts[k] }));
  }, [leaves]);


  const leaveTimelineData = useMemo(() => {
    const timeline = {};
    leaves.forEach(l => {
      if (!l.createdAt) return;
      const date = new Date(l.createdAt);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      timeline[monthYear] = (timeline[monthYear] || 0) + 1;
    });
    return Object.keys(timeline).sort().map(k => ({ date: k, Requests: timeline[k] }));
  }, [leaves]);

 
  const tenureSalaryData = useMemo(() => {
    const now = new Date();
    return employees.map(emp => {
      if (!emp.createdAt || !emp.Salary) return null;
      const joinDate = new Date(emp.createdAt);
      const daysEmployed = Math.floor((now - joinDate) / (1000 * 60 * 60 * 24));
      return { days: daysEmployed, salary: emp.Salary, name: emp.Name };
    }).filter(Boolean);
  }, [employees]);


  if (loading) return <div style={{ padding: '40px', color: 'var(--text-main)' }}><h3>Fetching Live Telemetry...</h3></div>;

  return (
    <div style={{ width: '100%', paddingBottom: '40px' }}>
      
      {error && <div style={{ background: '#ef444420', color: '#ef4444', padding: '12px', borderRadius: '8px', marginBottom: '24px', fontWeight: 600 }}>{error}</div>}

      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main, #fff)', marginBottom: '8px' }}>Live System Analytics</h1>
        <p style={{ color: 'var(--text-dim, #94a3b8)' }}>Real-time telemetry extracted from MongoDB records.</p>
      </div>

  
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        {[
          { label: "Total Workforce", value: summary.total },
          { label: "Median Salary", value: `₹${summary.avgSalary.toLocaleString()}` },
          { label: "Active Tasks", value: summary.activeTasks, color: '#f59e0b' },
          { label: "Total Leave Records", value: summary.totalLeaves, color: '#38bdf8' }
        ].map((stat, i) => (
          <div key={i} style={{ background: 'var(--bg-card, #161533)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border, #2d2b55)' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-dim, #94a3b8)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '8px' }}>{stat.label}</div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: stat.color || 'var(--text-main, #fff)' }}>{stat.value}</div>
          </div>
        ))}
      </div>


      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px' }}>

        
        <ChartCard title="Workforce by Position" subtitle="Employee spread across applied roles">
          <PieChart>
            <Pie data={positionData} innerRadius={80} outerRadius={120} dataKey="value" stroke="none">
              {positionData.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="bottom" wrapperStyle={{ color: 'var(--text-dim, #94a3b8)' }} />
          </PieChart>
        </ChartCard>

        
        <ChartCard title="Compensation Matrix" subtitle="Average salary per position">
          <BarChart data={salaryByPosData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border, #2d2b55)" />
            <XAxis dataKey="name" stroke="var(--text-dim, #94a3b8)" tick={{ fill: 'var(--text-dim, #94a3b8)' }} />
            <YAxis stroke="var(--text-dim, #94a3b8)" tickFormatter={(val) => `₹${val/1000}k`} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--border, #2d2b55)', opacity: 0.3 }} />
            <Bar dataKey="AvgSalary" fill="#38bdf8" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartCard>

        <ChartCard title="Hiring Velocity" subtitle="Employee account creation over time">
          <AreaChart data={hiringTimelineData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorHires" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border, #2d2b55)" vertical={false} />
            <XAxis dataKey="date" stroke="var(--text-dim, #94a3b8)" />
            <YAxis stroke="var(--text-dim, #94a3b8)" allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="Hires" stroke="#10b981" fillOpacity={1} fill="url(#colorHires)" />
          </AreaChart>
        </ChartCard>

        
        <ChartCard title="System Privileges" subtitle="Breakdown of system Roles">
          <PieChart>
            <Pie data={rolePrivilegeData} innerRadius={0} outerRadius={110} dataKey="value" stroke="var(--bg-card, #161533)">
              {rolePrivilegeData.map((e, i) => <Cell key={i} fill={["#8b5cf6", "#f43f5e", "#f59e0b"][i % 3]} />)}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="bottom" />
          </PieChart>
        </ChartCard>

        
        <ChartCard title="Task Pipeline" subtitle="Overview of all assigned tasks by status">
          <BarChart data={taskStatusData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border, #2d2b55)" />
            <XAxis type="number" stroke="var(--text-dim, #94a3b8)" allowDecimals={false} />
            <YAxis dataKey="name" type="category" stroke="var(--text-dim, #94a3b8)" />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--border, #2d2b55)', opacity: 0.3 }} />
            <Bar dataKey="Tasks" fill="#f59e0b" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ChartCard>

        
        <ChartCard title="Leave Requests Overview" subtitle="Status of all submitted leaves">
          <PieChart>
            <Pie data={leaveStatusData} innerRadius={60} outerRadius={100} dataKey="value" stroke="none">
              {leaveStatusData.map((e, i) => <Cell key={i} fill={["#10b981", "#ef4444", "#38bdf8", "#f59e0b"][i % 4]} />)}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="bottom" />
          </PieChart>
        </ChartCard>

        
        <ChartCard title="Highest Workloads" subtitle="Top 5 employees by assigned task count">
          <BarChart data={workloadData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border, #2d2b55)" />
            <XAxis dataKey="name" stroke="var(--text-dim, #94a3b8)" />
            <YAxis stroke="var(--text-dim, #94a3b8)" allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--border, #2d2b55)', opacity: 0.3 }} />
            <Bar dataKey="Tasks" fill="#ec4899" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartCard>

        
        <ChartCard title="Tenure vs Compensation" subtitle="Days employed against current salary">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border, #2d2b55)" />
            <XAxis type="number" dataKey="days" name="Days Employed" stroke="var(--text-dim, #94a3b8)" unit="d" />
            <YAxis type="number" dataKey="salary" name="Salary" stroke="var(--text-dim, #94a3b8)" tickFormatter={(val) => `${val/1000}k`} />
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
            <Scatter name="Employees" data={tenureSalaryData} fill="#14b8a6" />
          </ScatterChart>
        </ChartCard>

        
        <ChartCard title="Leave Request Velocity" subtitle="Volume of leaves submitted over time">
          <LineChart data={leaveTimelineData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border, #2d2b55)" vertical={false} />
            <XAxis dataKey="date" stroke="var(--text-dim, #94a3b8)" />
            <YAxis stroke="var(--text-dim, #94a3b8)" allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="Requests" stroke="#f97316" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 8 }} />
          </LineChart>
        </ChartCard>

        
        <ChartCard title="Account Security" subtitle="Active vs Administratively Locked accounts">
          <PieChart>
            <Pie data={accountStatusData} innerRadius={80} outerRadius={110} dataKey="value" stroke="none">
              {accountStatusData.map((e, i) => <Cell key={i} fill={["#10b981", "#ef4444"][i % 2]} />)}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="bottom" />
          </PieChart>
        </ChartCard>

      </div>
    </div>
  );
}

const ChartCard = ({ title, subtitle, children }) => (
  <div style={{
    background: 'var(--bg-card, #161533)',
    border: '1px solid var(--border, #2d2b55)',
    borderRadius: '20px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    height: '420px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
  }}>
    <div style={{ marginBottom: '20px' }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main, #fff)', margin: 0 }}>{title}</h3>
      <span style={{ fontSize: '12px', color: 'var(--text-dim, #94a3b8)', fontWeight: 600 }}>{subtitle}</span>
    </div>
    <div style={{ flex: 1, width: '100%', minHeight: 0 }}>
     
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  </div>
);

export default Reports;

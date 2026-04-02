import React, { useEffect, useState } from "react";
import axios from "axios";

const api = axios.create({
  baseURL: "https://mywebsite-im3c.onrender.com/api"
});

function TasksWorkspace(){

const [tasks,setTasks] = useState([]);
const [employees,setEmployees] = useState([]);
const [leaves,setLeaves] = useState([]);

const [title,setTitle] = useState("");
const [description,setDescription] = useState("");
const [employeeEmail,setEmployeeEmail] = useState("");

const [leaveDate,setLeaveDate] = useState("");
const [leaveReason,setLeaveReason] = useState("");

const [showTaskModal,setShowTaskModal] = useState(false);
const [showLeaveModal,setShowLeaveModal] = useState(false);

// ✅ FIX 1: Normalize and compare correctly (all lowercase)
const rawRole = (localStorage.getItem("role") || "").trim().toLowerCase();
const isAdmin = rawRole === "admin" || rawRole === "superadmin";

// ✅ FIX 2: Helper to ensure we always use the latest token from storage
const getHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
});

// ✅ LOAD DATA AFTER PAGE LOAD
useEffect(()=>{
  const token = localStorage.getItem("token");
  if(!token){
    console.log("NO TOKEN FOUND");
    return;
  }

  loadTasks();
  loadEmployees();
  loadLeaves();
},[]);

// ================= LOAD =================

async function loadTasks(){
try{
const res = await api.get("/tasks", getHeaders());
setTasks(res.data);
}catch(err){
console.log(err);
}
}

async function loadEmployees(){
try{
const res = await api.get("/Employees", getHeaders());
setEmployees(res.data);
}catch(err){
console.log(err);
}
}

async function loadLeaves(){
try{
const res = await api.get("/leaves", getHeaders());
setLeaves(res.data);
}catch(err){
console.log(err);
}
}

// ================= CREATE TASK =================

async function createTask(){

if(!title || !description || !employeeEmail){
alert("Fill all fields");
return;
}

try{
await api.post("/tasks",{
Title:title,
Description:description,
EmployeeEmail:employeeEmail
}, getHeaders());

setTitle("");
setDescription("");
setEmployeeEmail("");
setShowTaskModal(false);

loadTasks();

}catch(err){
console.log(err);
}
}

// ================= APPLY LEAVE =================

async function applyLeave(){

if(!leaveDate || !leaveReason){
alert("Fill all fields");
return;
}

const today = new Date().toISOString().split("T")[0];
if(leaveDate < today){
alert("Cannot select past date");
return;
}

try{
await api.post("/leaves",{
Date:leaveDate,
Reason:leaveReason
}, getHeaders());

setLeaveDate("");
setLeaveReason("");
setShowLeaveModal(false);

loadLeaves();

}catch(err){
console.log(err);
}
}

// ================= UI =================

return(

<div style={{padding:"20px"}}>

<h2>Task Board</h2>

<div style={{marginBottom:"20px"}}>
{/* ✅ Only show Create Task to Admins */}
{isAdmin && <button onClick={()=>setShowTaskModal(true)}>➕ Create Task</button>}
<button onClick={()=>setShowLeaveModal(true)} style={{marginLeft:"10px"}}>
📅 Apply Leave
</button>
</div>

{/* TASK MODAL */}
{showTaskModal && (
<div className="chart-modal" onClick={()=>setShowTaskModal(false)}>
<div className="chart-modal-content" onClick={(e)=>e.stopPropagation()}>

<h3>Create Task</h3>

<input
placeholder="Task Title"
value={title}
onChange={e=>setTitle(e.target.value)}
/>

<textarea
placeholder="Description"
value={description}
onChange={e=>setDescription(e.target.value)}
/>

<select
value={employeeEmail}
onChange={e=>setEmployeeEmail(e.target.value)}
>
<option value="">Select Employee</option>

{employees.length === 0 ? (
  <option disabled>Loading...</option>
) : (
  employees.map(emp=>(
    <option key={emp._id} value={emp.Email}>
      {emp.Name}
    </option>
  ))
)}

</select>

<button onClick={createTask}>Send Task</button>

</div>
</div>
)}

{/* LEAVE MODAL */}
{showLeaveModal && (
<div className="chart-modal" onClick={()=>setShowLeaveModal(false)}>
<div className="chart-modal-content" onClick={(e)=>e.stopPropagation()}>

<h3>Apply Leave</h3>

<input
type="date"
value={leaveDate}
min={new Date().toISOString().split("T")[0]}
onChange={e=>setLeaveDate(e.target.value)}
/>

<textarea
placeholder="Reason"
value={leaveReason}
onChange={e=>setLeaveReason(e.target.value)}
/>

<button onClick={applyLeave}>Submit</button>

</div>
</div>
)}

{/* TASK TABLE */}
<table className="excel-table">
<thead>
<tr>
<th>Title</th>
<th>Description</th>
<th>Status</th>
</tr>
</thead>

<tbody>
{tasks.map(task=>(
<tr key={task._id}>
<td>{task.Title}</td>
<td>{task.Description}</td>
<td>{task.Status}</td>
</tr>
))}
</tbody>
</table>

{/* LEAVE SECTION */}
{/* ✅ FIX 3: Using the isAdmin check so it finally shows for SuperAdmin */}
{isAdmin && (
<div style={{marginTop:"40px"}}>
<h2>Leave Applications</h2>

<table className="excel-table">
<thead>
<tr>
<th>Date</th>
<th>Reason</th>
</tr>
</thead>

<tbody>
{leaves.map(leave=>(
<tr key={leave._id}>
<td>{leave.Date}</td>
<td>{leave.Reason}</td>
</tr>
))}
</tbody>

</table>
</div>
)}

</div>
);
}

export default TasksWorkspace;

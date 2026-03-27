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

// ✅ ALWAYS GET FRESH TOKEN
const token = localStorage.getItem("token");

const rawRole = localStorage.getItem("role");

const userRole =
  rawRole === "Admin" || rawRole === "admin"
    ? "admin"
    : rawRole === "SuperAdmin" || rawRole === "superadmin"
    ? "superadmin"
    : "employee";

const headers = {
  headers:{ Authorization:`Bearer ${token}` }
};

// ✅ LOAD DATA AFTER PAGE LOAD
useEffect(()=>{

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
const res = await api.get("/tasks",headers);
setTasks(res.data);
}catch(err){
console.log(err);
}
}

async function loadEmployees(){
try{
const res = await api.get("/Employees",headers);
setEmployees(res.data);
}catch(err){
console.log(err);
}
}

async function loadLeaves(){
try{
const res = await api.get("/leaves",headers);
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
},headers);

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
},headers);

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
<button onClick={()=>setShowTaskModal(true)}>➕ Create Task</button>
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
{(userRole === "admin" || userRole === "superadmin") && (
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

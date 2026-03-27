import React, { useEffect, useState } from "react";
import axios from "axios";

const api = axios.create({
  baseURL: "https://mywebsite-im3c.onrender.com/api"
});

function TasksWorkspace(){

const [tasks,setTasks] = useState([]);
const [employees,setEmployees] = useState([]);
const [title,setTitle] = useState("");
const [description,setDescription] = useState("");
const [employeeEmail,setEmployeeEmail] = useState("");
const [showTaskModal,setShowTaskModal] = useState(false);

// ✅ LEAVE STATES
const [leaveDate,setLeaveDate] = useState("");
const [leaveReason,setLeaveReason] = useState("");
const [leaves,setLeaves] = useState([]);
const [showLeaveModal,setShowLeaveModal] = useState(false);

const token = localStorage.getItem("token");
const userRole = localStorage.getItem("role");

const headers = {
headers:{ Authorization:`Bearer ${token}` }
};

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

// ✅ LOAD LEAVES
async function loadLeaves(){
try{
const res = await api.get("/leaves",headers);
setLeaves(res.data);
}catch(err){
console.log(err);
}
}

useEffect(()=>{
loadTasks();
loadEmployees();
loadLeaves();
},[]);

async function createTask(){

if(!title || !description || !employeeEmail){
alert("Please fill all fields!");
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

// ✅ APPLY LEAVE
async function applyLeave(){

if(!leaveDate || !leaveReason){
alert("Fill all fields!");
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

async function uploadFile(taskId,file){

if(!file){
alert("Please select a file!");
return;
}

if(file.size === 0){
alert("File is empty!");
return;
}

try{

const form = new FormData();
form.append("file",file);

await api.post(`/tasks/upload/${taskId}`,form,{
headers:{
Authorization:`Bearer ${token}`,
"Content-Type":"multipart/form-data"
}
});

alert("File uploaded successfully!");
loadTasks();

}catch(err){
console.log(err);
alert("Upload failed!");
}

}

function viewFile(taskId){
const token = localStorage.getItem("token");

window.open(
`https://mywebsite-im3c.onrender.com/api/tasks/file/${taskId}?token=${token}`,
"_blank"
);
}

async function downloadFile(taskId){
try{
const token = localStorage.getItem("token");

const res = await axios.get(
`https://mywebsite-im3c.onrender.com/api/tasks/file/${taskId}?download=true&token=${token}`,
{ responseType:"blob" }
);

const url = window.URL.createObjectURL(new Blob([res.data]));

const a = document.createElement("a");
a.href = url;

let filename = "taskfile";
const contentDisposition = res.headers["content-disposition"];

if(contentDisposition){
const match = contentDisposition.match(/filename="(.+)"/);
if(match) filename = match[1];
}

a.download = filename;

document.body.appendChild(a);
a.click();
a.remove();

}catch(err){
console.log(err);
alert("Download failed!");
}
}

async function markComplete(taskId){
try{
await api.put(`/tasks/status/${taskId}`,{
Status:"Completed"
},headers);

loadTasks();

}catch(err){
console.log(err);
}
}

return(

<div>

<h2>Task Board</h2>

<button
className="create-task-btn"
onClick={()=>setShowTaskModal(true)}
>
➕ Create Task
</button>

{/* ✅ APPLY LEAVE BUTTON */}
<button
className="create-task-btn"
onClick={()=>setShowLeaveModal(true)}
style={{marginLeft:"10px"}}
>
📅 Apply Leave
</button>

{/* TASK MODAL */}
{showTaskModal && (
<div className="chart-modal" onClick={()=>setShowTaskModal(false)}>
<div className="chart-modal-content" onClick={(e)=>e.stopPropagation()}>

<h3>Create Task</h3>

<input
type="text"
placeholder="Task Title"
value={title}
onChange={e=>setTitle(e.target.value)}
/>

<textarea
placeholder="Task Description"
value={description}
onChange={e=>setDescription(e.target.value)}
/>

<select
value={employeeEmail}
onChange={e=>setEmployeeEmail(e.target.value)}
>
<option value="">Select Employee</option>

{Array.isArray(employees) && employees.map(emp=>(
<option key={emp._id} value={emp.Email}>
{emp.Name}
</option>
))}

</select>

<button onClick={createTask}>
Send Task
</button>

</div> 
</div>
)}

{/* ✅ LEAVE MODAL */}
{showLeaveModal && (
<div className="chart-modal" onClick={()=>setShowLeaveModal(false)}>
<div className="chart-modal-content" onClick={(e)=>e.stopPropagation()}>

<h3>Apply Leave</h3>

<input
type="date"
value={leaveDate}
onChange={e=>setLeaveDate(e.target.value)}
/>

<textarea
placeholder="Reason"
value={leaveReason}
onChange={e=>setLeaveReason(e.target.value)}
/>

<button onClick={applyLeave}>
Submit Leave
</button>

</div>
</div>
)}

<table className="excel-table">

<thead>
<tr>
<th>Title</th>
<th>Description</th>
<th>Status</th>
<th>Upload</th>
<th>Actions</th>
</tr>
</thead>

<tbody>

{Array.isArray(tasks) && tasks.map(task=>(

<tr key={task._id}>

<td>{task.Title}</td>
<td>{task.Description}</td>
<td>{task.Status}</td>

<td>
<input
type="file"
onChange={(e)=>{
const file = e.target.files[0];
if(file) uploadFile(task._id,file);
}}
/>
</td>

<td>

{task.FileId && (
<>
<button onClick={()=>viewFile(task._id)}>View</button>
<button onClick={()=>downloadFile(task._id)}>Download</button>
</>
)}

<button
disabled={!task.FileId || task.Status === "Completed"}
onClick={()=>markComplete(task._id)}
>
Complete
</button>

</td>

</tr>

))}

</tbody>

</table>

{/* ✅ ADMIN ONLY LEAVE SECTION */}
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

{Array.isArray(leaves) && leaves.map((leave,i)=>(

<tr key={i}>
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

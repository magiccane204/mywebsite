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

const token = localStorage.getItem("token");

const headers = {
headers:{ Authorization:`Bearer ${token}` }
};

/* CREATE TASK */

async function createTask(){
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

/* LOAD EMPLOYEES */

async function loadEmployees(){
try{

const res = await api.get("/Employees",headers);
setEmployees(res.data);

}catch(err){
console.log(err);
}
}

/* LOAD TASKS */

async function loadTasks(){
try{

const res = await api.get("/tasks",headers);
setTasks(res.data);

}catch(err){
console.log(err);
}
}

useEffect(()=>{
loadTasks();
loadEmployees();
},[]);

/* UPLOAD FILE */

async function uploadFile(taskId,file){

try{

const form = new FormData();
form.append("file",file);

await api.post(`/tasks/upload/${taskId}`,form,{
headers:{
Authorization:`Bearer ${token}`,
"Content-Type":"multipart/form-data"
}
});

loadTasks();

}catch(err){
console.log(err);
}

}

/* DOWNLOAD FILE */

async function viewFile(taskId){

try{

const res = await api.get(`/tasks/file/${taskId}?download=true`,{
headers:{ Authorization:`Bearer ${token}` },
responseType:"blob"
});

const url = window.URL.createObjectURL(new Blob([res.data]));

const a = document.createElement("a");
a.href = url;
a.download = "task-file";
document.body.appendChild(a);
a.click();
a.remove();

}catch(err){
console.log(err);
}

}

/* MARK COMPLETED */

async function markComplete(taskId){

try{

await api.put(`/tasks/complete/${taskId}`,{},headers);

loadTasks();

}catch(err){
console.log(err);
}

}

return(

<div>

<h2>My Tasks</h2>

<button
className="create-task-btn"
onClick={()=>setShowTaskModal(true)}
>
➕ Create Task
</button>

{/* CREATE TASK MODAL */}

{showTaskModal && (

<div
className="chart-modal"
onClick={()=>{
setShowTaskModal(false);
setTitle("");
setDescription("");
setEmployeeEmail("");
}}
>

<div
className="chart-modal-content"
onClick={(e)=>e.stopPropagation()}
>

<button
className="close-btn"
onClick={()=>setShowTaskModal(false)}
>
✖ Close
</button>

<h3>Create Task</h3>

<div className="task-form">

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
disabled={!employees.length}
>

<option value="">
{employees.length ? "Select Employee" : "Loading employees..."}
</option>

{Array.isArray(employees) && employees.map(emp=>(
<option key={emp._id} value={emp.Email}>
{emp.Name} ({emp.Email})
</option>
))}

</select>

<button
className="send-btn"
onClick={createTask}
disabled={!title || !employeeEmail}
>
Send Task
</button>

</div>

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

{task.FilePath && (
<button onClick={()=>viewFile(task._id)}>
Download
</button>
)}

{task.Status !== "Completed" && (
<button onClick={()=>markComplete(task._id)}>
Mark Completed
</button>
)}

</td>

</tr>

))}

</tbody>

</table>

</div>

);

}

export default TasksWorkspace;

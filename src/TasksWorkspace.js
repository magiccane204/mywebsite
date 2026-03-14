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

loadTasks();

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

/* LOAD TASKS */

useEffect(()=>{
loadTasks();
loadEmployees();
},[]);


async function loadTasks(){

try{

const res = await api.get("/tasks",headers);

setTasks(res.data);

}catch(err){

console.log(err);

}

}


/* UPLOAD FILE */

async function uploadFile(taskId,file){

const form = new FormData();

form.append("file",file);

await api.post(`/tasks/upload/${taskId}`,form,{
headers:{
Authorization:`Bearer ${token}`,
"Content-Type":"multipart/form-data"
}
});

loadTasks();

}


/* VIEW FILE */

function viewFile(taskId){

window.open(
`https://mywebsite-im3c.onrender.com/api/tasks/file/${taskId}`
);

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
{showTaskModal && (

<div className="chart-modal" onClick={()=>setShowTaskModal(false)}>

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

{employees.map(emp=>(
<option key={emp._id} value={emp.Email}>
{emp.Name} ({emp.Email})
</option>
))}

</select>

<button onClick={createTask}>
Send Task
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
<th>View</th>
</tr>

</thead>

<tbody>

{tasks.map(task=>(

<tr key={task._id}>

<td>{task.Title}</td>
<td>{task.Description}</td>
<td>{task.Status}</td>

<td>

<input
type="file"
onChange={e=>uploadFile(task._id,e.target.files[0])}
/>

</td>

<td>

{task.FilePath && (
<button onClick={()=>viewFile(task._id)}>
View
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

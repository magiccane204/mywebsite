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

useEffect(()=>{
loadTasks();
loadEmployees();
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
const contentDisposition = res.headers["content-disposition"];

let filename = "taskfile";

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

{}
{showTaskModal && (
<div className="chart-modal" onClick={()=>setShowTaskModal(false)}>
<div className="chart-modal-content" onClick={(e)=>e.stopPropagation()}>

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
</div>
)}

{}
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

if(!file){
alert("Please select a file!");
return;
}

if(file.size === 0){
alert("File is empty!");
return;
}

uploadFile(task._id,file);
e.target.value = null;
}}
/>
</td>

<td>

{}
{task.FileId && (
<>
<button onClick={()=>viewFile(task._id)}>
View
</button>

<button onClick={()=>downloadFile(task._id)}>
Download
</button>
</>
)}

{}
<button
disabled={!task.FileId || task.Status === "Completed"}
style={{
backgroundColor: (!task.FileId || task.Status === "Completed") ? "#ccc" : "#4CAF50",
cursor: (!task.FileId || task.Status === "Completed") ? "not-allowed" : "pointer",
opacity: (!task.FileId || task.Status === "Completed") ? 0.6 : 1
}}
onClick={()=>markComplete(task._id)}
>
Complete
</button>

</td>

</tr>

))}

</tbody>

</table>

</div>

);

}

export default TasksWorkspace;

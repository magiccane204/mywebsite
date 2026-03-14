import React, { useEffect, useState } from "react";
import axios from "axios";

const api = axios.create({
  baseURL: "https://mywebsite-im3c.onrender.com/api"
});

export default function TasksWorkspace(){

const [tasks,setTasks] = useState([]);

const token = localStorage.getItem("token");

const headers = {
headers:{ Authorization:`Bearer ${token}` }
};


/* LOAD TASKS */

useEffect(()=>{
loadTasks();
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

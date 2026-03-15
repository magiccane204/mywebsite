import React, { useEffect, useState } from "react";
import axios from "axios";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

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

const statuses = ["Pending","In Progress","Review","Completed"];

/* LOAD TASKS */

async function loadTasks(){
try{

const res = await api.get("/tasks",headers);
setTasks(res.data);

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

useEffect(()=>{
loadTasks();
loadEmployees();
},[]);

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

/* DRAG TASK */

const onDragEnd = async (result)=>{

if(!result.destination) return;

const taskId = result.draggableId;
const newStatus = result.destination.droppableId;

try{

await api.put(`/tasks/status/${taskId}`,{
Status:newStatus
},headers);

loadTasks();

}catch(err){
console.log(err);
}

};

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

/* VIEW FILE */

function viewFile(taskId){

window.open(
`https://mywebsite-im3c.onrender.com/api/tasks/file/${taskId}?token=${token}`,
"_blank"
);

}

/* DOWNLOAD FILE */

async function downloadFile(taskId){

try{

const res = await api.get(`/tasks/file/${taskId}?download=true`,{
headers:{ Authorization:`Bearer ${token}` },
responseType:"blob"
});

const url = window.URL.createObjectURL(new Blob([res.data]));

const a = document.createElement("a");
a.href = url;
a.download = "taskfile";
document.body.appendChild(a);
a.click();
a.remove();

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

{/* CREATE TASK MODAL */}

{showTaskModal && (

<div
className="chart-modal"
onClick={()=>setShowTaskModal(false)}
>

<div
className="chart-modal-content"
onClick={(e)=>e.stopPropagation()}
>

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

{/* TASK BOARD */}

<DragDropContext onDragEnd={onDragEnd}>

<div style={{display:"flex",gap:"20px",marginTop:"20px"}}>

{statuses.map(status=>(

<Droppable droppableId={status} key={status}>

{(provided)=>(

<div
ref={provided.innerRef}
{...provided.droppableProps}
style={{
background:"#f4f4f4",
padding:"10px",
width:"250px",
minHeight:"400px"
}}
>

<h3>{status}</h3>

{tasks
.filter(t=>t.Status===status)
.map((task,index)=>(

<Draggable
key={task._id}
draggableId={task._id}
index={index}
>

{(provided)=>(

<div
ref={provided.innerRef}
{...provided.draggableProps}
{...provided.dragHandleProps}
style={{
background:"#fff",
padding:"10px",
marginBottom:"10px",
border:"1px solid #ccc",
...provided.draggableProps.style
}}
>

<b>{task.Title}</b>

<p>{task.Description}</p>

{/* FILE UPLOAD */}

<input
type="file"
onChange={(e)=>{
const file = e.target.files[0];
if(file) uploadFile(task._id,file);
}}
/>

{/* FILE ACTIONS */}

{task.FileId && (

<div>

<button onClick={()=>viewFile(task._id)}>
View
</button>

<button onClick={()=>downloadFile(task._id)}>
Download
</button>

</div>

)}

</div>

)}

</Draggable>

))}

{provided.placeholder}

</div>

)}

</Droppable>

))}

</div>

</DragDropContext>

</div>

);

}

export default TasksWorkspace;

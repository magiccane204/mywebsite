import React, { useEffect, useState } from "react";
import axios from "axios";

function Customer() {
  const [customers, setCustomers] = useState([]);
  const [role, setRole] = useState("");

  useEffect(() => {
    axios.get("/me").then(res => setRole(res.data.Role));
    axios.get("/customers").then(res => setCustomers(res.data));
  }, []);

  return (
    <div>
      <h2>Customer Management — {role}</h2>

      {customers.length === 0 ? (
        <p>No customers found</p>
      ) : (
        <ul>
          {customers.map((c, i) => (
            <li key={i}>
              {c.Name} — {c.Email}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Customer;

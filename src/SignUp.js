import './SignUp.css'
import { useState } from 'react'
import axios from 'axios'

function Signup({ setMode }) {

const [email, setEmail] = useState('')
const [password, setPassword] = useState('')
const [confirmPassword, setConfirmPassword] = useState('')
const [company, setCompany] = useState('')
const [loading, setLoading] = useState(false)

const validateEmail = (email) => {
const regex = /^[^\s@]+@[^\s@]+.[^\s@]+$/
return regex.test(email)
}

const validatePassword = (password) => {
const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/
return regex.test(password)
}

const handleSignup = async () => {

```
if (!email || !password || !confirmPassword || !company) {
  alert("All fields are required")
  return
}

if (!validateEmail(email)) {
  alert("Enter valid email")
  return
}

if (!validatePassword(password)) {
  alert("Password must be 8 characters with uppercase, lowercase, number and special character")
  return
}

if (password !== confirmPassword) {
  alert("Passwords do not match")
  return
}

if (loading) return
setLoading(true)

try {

  const res = await axios.post("/api/signup", {
    email,
    password,
    company
  })

  alert(res.data.message)
  setMode("login")

} catch (err) {

  alert(err.response?.data?.message || "Signup failed")

}

setLoading(false)
```

}

return ( <div className="Signup-card">

```
  <img src="/D&T.png" alt="company logo" />

  <div className="signup">

    <img src="/user.png" alt="user logo" />
    <h3>Activate Employee Account</h3>

    <input
      className="sinput"
      placeholder="Company Email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
    />

    <input
      className="sinput"
      placeholder="Password"
      type="password"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
    />

    <input
      className="sinput"
      placeholder="Confirm Password"
      type="password"
      value={confirmPassword}
      onChange={(e) => setConfirmPassword(e.target.value)}
    />

    <select
      value={company}
      onChange={(e) => setCompany(e.target.value)}
    >
      <option value="">---Choose Your Company---</option>
      <option>Koenigsegg</option>
      <option>Tesla</option>
      <option>Mercedes</option>
      <option>Google</option>
      <option>Microsoft</option>
      <option>IBM</option>
      <option>OpenAI</option>
      <option>Apple</option>
      <option>Oppo</option>
    </select>

    <button
      className="sgbutton"
      onClick={handleSignup}
      disabled={loading}
    >
      {loading ? "Creating..." : "Activate Account"}
    </button>

    <p>
      Already activated?
      <span onClick={() => setMode('login')}> Login</span>
    </p>

  </div>
</div>
```

)
}

export default Signup

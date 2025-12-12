import './SignUp.css'
import { useState } from 'react';
import axios from 'axios';

function Signup({ setMode }) {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [company, setCompany] = useState('');

    const validateEmail = (email) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    };

    const validatePassword = (password) => {
        // At least 8 chars, one uppercase, one lowercase, one number, one special char
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return regex.test(password);
    };

    const handleSignup = async () => {
        if (!username || !email || !password || !confirmPassword || !company) {
            alert("All fields are required");
            return;
        }

        if (username.length < 3) {
            alert("Username must be at least 3 characters long");
            return;
        }

        if (!validateEmail(email)) {
            alert("Please enter a valid email address");
            return;
        }

        if (!validatePassword(password)) {
            alert("Password must be at least 8 characters, include uppercase, lowercase, number, and special character");
            return;
        }

        if (password !== confirmPassword) {
            alert("Passwords do not match");
            return;
        }

        if (company === "") {
            alert("Please select a company");
            return;
        }

        try {
            const res = await axios.post("http://localhost:5002/register", {
                name: username,
                email,
                password,
                company
            });
            alert(res.data.message);
            setMode('login');
        } catch (err) {
            alert(err.response?.data?.message || "Signup failed. Try again later.");
        }
    };

    return (
        <div className="Signup-card">
            <img src="/D&T.png" alt="company logo" />
            <div className="signup">
                <img src="/user.png" alt="user logo" />
                <h3>Sign Up Page</h3>

                <input 
                    className='sinput' 
                    placeholder="Username" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)} 
                />

                <input 
                    className='sinput' 
                    placeholder="Email" 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                />

                <input 
                    className='sinput' 
                    placeholder="Password" 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                />

                <input 
                    className='sinput' 
                    placeholder="Re-Enter Password" 
                    type="password" 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                />

                <select value={company} onChange={(e) => setCompany(e.target.value)}>
                    <option disabled hidden value="">---Choose Your Company---</option>
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

                <button className='sgbutton' onClick={handleSignup}>Sign Up</button>

                <p>
                    Do you have an existing account? 
                    <span onClick={() => setMode('login')}> Login</span>
                </p>
            </div>
        </div>
    );
}

export default Signup;

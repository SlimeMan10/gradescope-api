import React, { useState } from 'react';
import getMissingAssignments from '../filterData/missingClasses';
import api from '../filterData/apiLink';

interface MissingAssignment {
  assignment_name: string;
  course_name: string;
  due_date: Date;
  late_due_date: Date;
}

export default function LogIn() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [classes, setClasses] = useState<MissingAssignment[] | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    if (!email || !password) {
      setError("Missing email or password");
      setLoading(false);
      return;
    }
    
    const controller = new AbortController();
    
    try {
      // First login
      console.log("Attempting to login with:", { email });
      const response = await fetch(`${api}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password
        }),
        signal: controller.signal
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Login failed:", errorText);
        throw new Error(`Login failed: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log("Login response:", data);
      
      if (data.status_code !== 200 || data.message !== 'Login successful') {
        throw new Error("Invalid login response");
      }
      
      localStorage.setItem("log in", "true");
      console.log("Login successful, fetching missing assignments");
      
      // Then fetch assignments
      await getMissingAssignments({setClasses, setError, controller});
      
    } catch (error) {
      console.error("Login error:", error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2>Log In to Gradescope</h2>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <form onSubmit={handleLogin}>
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="text"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
        </div>
        
        <button 
          type="submit" 
          disabled={loading}
          className="login-button"
        >
          {loading ? 'Logging in...' : 'Log In'}
        </button>
      </form>
      {classes && classes.length > 0 && (
  <div className="assignments-list">
    <h3>Missing Assignments</h3>
    <ul>
      {classes.map((assignment, index) => (
        <li key={index}>
          <strong>{assignment.course_name}</strong>: {assignment.assignment_name}
          <br />
          <span className="due-date">
            Due: {new Date(assignment.due_date).toLocaleString(undefined, {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              timeZoneName: 'short'
            })}
            {" "}
            <span className="timezone-note">(your local time)</span>
          </span>
          <br />
          <span className="late-due-date">
            Late Due: {new Date(assignment.late_due_date).toLocaleString(undefined, {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              timeZoneName: 'short'
            })}
            {" "}
            <span className="timezone-note">(your local time)</span>
          </span>
        </li>
      ))}
    </ul>
  </div>
)}
    </div>
  );
}
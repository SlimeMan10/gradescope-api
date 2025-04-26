import React, { useState } from 'react';
import apiLink from '../filterData/apiLink';

interface LogInProps {
  onLoginSuccess: () => void;
}

export default function LogIn({ onLoginSuccess }: LogInProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const email = (document.getElementById('email') as HTMLFormElement)?.value;
    const password = (document.getElementById('password') as HTMLFormElement)?.value;
    
    if (!email || !password) {
      setError("Missing email or password");
      setLoading(false);
      return;
    }
    
    const controller = new AbortController();
    
    try {
      console.log("Attempting to login to:", `${apiLink}/login`);
      
      // First login
      const response = await fetch(`${apiLink}/login`, {
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
      
      const data = await response.json();
      console.log("Login response:", data);
      
      if (!response.ok) {
        throw new Error(`Login failed: ${response.status} ${JSON.stringify(data)}`);
      }
      
      if (data.status_code !== 200 || data.message !== 'Login successful') {
        throw new Error("Invalid login response");
      }
      
      // Store the session token
      localStorage.setItem("log in", "true");
      localStorage.setItem("session_token", data.session_token);
      console.log("Session token stored:", data.session_token);
      
      onLoginSuccess(); // Call the callback function when login is successful
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

  // Rest of component remains the same
}
import React, { useState } from 'react';
import apiLink from './apiLink';

interface LogInProps {
  onLoginSuccess: () => void;
}

export default function LogIn({ onLoginSuccess }: LogInProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [show2FA, setShow2FA] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const twoFactorCode = show2FA ? (document.getElementById('2fa') as HTMLFormElement)?.value : undefined;
    
    if (!email || !password) {
      setError("Missing email or password");
      setLoading(false);
      return;
    }
    
    const controller = new AbortController();
    
    try {
      // First login
      const response = await fetch(`${apiLink}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          two_factor_code: twoFactorCode
        }),
        signal: controller.signal,
        credentials: 'include',
        mode: 'cors'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Extract the actual error message from the response
        const errorMessage = data.detail || data.message || `Login failed: ${response.status}`;
        if (errorMessage.includes("2FA is required")) {
          setShow2FA(true);
          setError("Please enter your 2FA code");
        } else {
          throw new Error(errorMessage);
        }
      } else if (data.status_code !== 200 || data.message !== 'Login successful') {
        throw new Error(data.detail || "Invalid login response");
      } else {
        // Store the session token
        localStorage.setItem("log in", "true");
        localStorage.setItem("session_token", data.session_token);
        
        // Wait for a small delay to ensure localStorage is updated
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Dispatch a custom event to notify other components about the login
        window.dispatchEvent(new Event('loginStatusChanged'));
        
        onLoginSuccess(); // Call the callback function when login is successful
      }
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
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 transition-all duration-500">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md border border-gray-200 transform transition-all duration-500 hover:shadow-2xl animate-fadeIn"
           role="region" 
           aria-label="Login form"
      >
          <h1 className="text-2xl font-semibold text-center text-purple-800 mb-6 animate-slideDown">Log Into Gradescope</h1>
          
          <div className="mb-6 p-4 bg-blue-50 text-blue-700 rounded-md text-sm animate-fadeIn">
            <p className="font-medium mb-2">Important:</p>
            <p>You must have a Gradescope account that you can log into directly (without using "Log in with School Credentials" or "Log in with Google").</p>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm animate-shake" role="alert" aria-live="assertive">
              {error}
            </div>
          )}
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2 animate-slideUp" style={{animationDelay: '100ms'}}>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input 
                type="email" 
                id="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus-accessible focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
                placeholder="Enter your email"
                aria-required="true"
                aria-describedby="email-help"
              />
              <div id="email-help" className="text-xs text-gray-500">Enter your Gradescope account email</div>
            </div>
            
            <div className="space-y-2 animate-slideUp" style={{animationDelay: '200ms'}}>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input 
                type="password" 
                id="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus-accessible focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
                placeholder="Enter your password"
                aria-required="true"
                aria-describedby="password-help"
              />
              <div id="password-help" className="text-xs text-gray-500">Enter your Gradescope account password</div>
            </div>
            
            {show2FA && (
              <div className="space-y-2 animate-slideUp" style={{animationDelay: '250ms'}}>
                <label htmlFor="2fa" className="block text-sm font-medium text-gray-700">
                  Two-Factor Authentication Code
                </label>
                <input 
                  type="text" 
                  id="2fa" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus-accessible focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
                  placeholder="Enter your 2FA code"
                  aria-required="true"
                  aria-describedby="2fa-help"
                />
                <div id="2fa-help" className="text-xs text-gray-500">Enter the code from your authenticator app</div>
              </div>
            )}
            
            <button
              type="submit"
              onClick={(e) => {
                e.preventDefault();
                handleLogin(e as React.FormEvent);
              }}
              className="relative w-full py-2 px-4 bg-purple-800 hover:bg-purple-700 text-white font-medium rounded-md focus-accessible focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-300 transform hover:scale-105 hover:shadow-md animate-slideUp"
              style={{animationDelay: '300ms'}}
              disabled={loading}
              aria-busy={loading}
              aria-live="polite"
            >
              <span className={loading ? 'opacity-0' : ''}>Log In</span>
              {loading && (
                <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </span>
              )}
            </button>
          </form>
        </div>
    </div>
  );
}
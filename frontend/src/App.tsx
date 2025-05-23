import { useState, useEffect } from 'react';
import LogIn from './components/Login';
import MissingAssignmentDisplay from './components/Dashboard';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  
  // Check login status on mount and when localStorage changes
  useEffect(() => {
    const checkLoginStatus = () => {
      const loginStatus = localStorage.getItem('log in') === 'true' && 
                          localStorage.getItem('session_token') !== null;
      setIsLoggedIn(loginStatus);
    };
    
    // Check initial status
    checkLoginStatus();
    
    // Set up storage event listener
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'log in' || e.key === 'session_token') {
        checkLoginStatus();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Custom event for same-tab updates
    const handleCustomLoginEvent = () => checkLoginStatus();
    window.addEventListener('loginStatusChanged', handleCustomLoginEvent);
    
    // Check every second (fallback)
    const interval = setInterval(checkLoginStatus, 1000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('loginStatusChanged', handleCustomLoginEvent);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="app bg-white min-h-screen" role="application" aria-label="Gradescope Assignment Tracker">
      {!isLoggedIn ? (
        <LogIn onLoginSuccess={() => {
          setIsLoggedIn(true);
          // Dispatch custom event to notify other components
          window.dispatchEvent(new Event('loginStatusChanged'));
        }} />
      ) : (
        <MissingAssignmentDisplay />
      )}
    </div>
  );
}

export default App;
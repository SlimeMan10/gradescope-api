import { useState, useEffect } from 'react';
import getMissingAssignments from './filterData/index';
import Cards from './Cards';
import LogoutButton from './LogoutButton';

interface MissingAssignment {
  assignment_name: string;
  course_name: string;
  due_date: Date;
  late_due_date: Date;
}

export default function MissingAssignmentDisplay() {
  const [assignments, setAssignments] = useState<MissingAssignment[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
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
    
    // Add event listener for localStorage changes
    window.addEventListener('storage', checkLoginStatus);
    
    // Add event listener for custom login event
    window.addEventListener('loginStatusChanged', checkLoginStatus);
    
    // Clean up
    return () => {
      window.removeEventListener('storage', checkLoginStatus);
      window.removeEventListener('loginStatusChanged', checkLoginStatus);
    };
  }, []);

  // Fetch data when logged in
  useEffect(() => {
    if (!isLoggedIn) return;
    
    setLoading(true);
    setError(null);
    
    const controller = new AbortController();
    
    const fetchData = async () => {
      try {
        await getMissingAssignments({ setAssignments, setError, controller });
      } catch (err) {
        // error taken care of in getMissingAssignment
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    
    return () => {
      controller.abort();
    };
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return null; // Don't render anything if not logged in
  }

  return (
    <div className="bg-white min-h-screen p-6 relative" role="main" aria-label="Missing assignments dashboard">
      <LogoutButton />
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-purple-800 mb-6 animate-slideDown">All Missing Assignments</h1>
        
        {loading ? (
          <div className="flex justify-center items-center h-40" role="status" aria-live="polite">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            <span className="sr-only">Loading assignments...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 p-4 rounded-md text-red-700 animate-shake" role="alert" aria-live="assertive">
            Error loading assignments: {error.message}
          </div>
        ) : !assignments || assignments.length === 0 ? (
          <div className="bg-white p-6 rounded-lg shadow-lg text-center border border-gray-200 animate-fadeIn">
            <p className="text-lg text-gray-700">No missing assignments found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" role="list" aria-label="Missing assignments list">
            <Cards assignments={assignments} />
          </div>
        )}
      </div>
    </div>
  );
}
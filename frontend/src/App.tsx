import React, { useState, useEffect } from 'react';
import Login from './backend/login';
import getCurrentClasses from './backend/classes/currentClasses';
import getAssignments from './backend/assignments/getAssignments';
import getAllMissingAssignments from './backend/assignments/getMissingAssignments';
import type StudentCourse from './backend/interfaces';
import type { AssignmentResponse } from './backend/interfaces';

// Helper function to group assignments by week and day
function groupAssignmentsByWeek(assignments: AssignmentResponse[]) {
  const grouped: Record<string, Record<string, AssignmentResponse[]>> = {};
  
  assignments.forEach(assignment => {
    const dueDate = new Date(assignment.due_date);
    
    // Get the Monday of the week
    const day = dueDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const diff = dueDate.getDate() - day + (day === 0 ? -6 : 1); // Adjust to get Monday
    const monday = new Date(dueDate);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);
    
    // Get week identifier (use the Monday date as the key)
    const weekKey = monday.toISOString().split('T')[0];
    
    // Get day identifier
    const dayKey = dueDate.toISOString().split('T')[0];
    
    // Initialize week and day if they don't exist
    if (!grouped[weekKey]) {
      grouped[weekKey] = {};
    }
    
    if (!grouped[weekKey][dayKey]) {
      grouped[weekKey][dayKey] = [];
    }
    
    // Add assignment to the appropriate day
    grouped[weekKey][dayKey].push(assignment);
  });
  
  return grouped;
}

// Helper to get formatted date ranges for display
function getWeekDateRange(weekKey: string) {
  const monday = new Date(weekKey);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const mondayStr = monday.toLocaleDateString(undefined, options);
  const sundayStr = sunday.toLocaleDateString(undefined, options);
  
  return `${mondayStr} - ${sundayStr}`;
}

// Get day name from date
function getDayName(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, { weekday: 'long' });
}

// Format date for display
function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [courses, setCourses] = useState<StudentCourse[]>([]);
  const [assignments, setAssignments] = useState<AssignmentResponse[]>([]);
  const [missingAssignments, setMissingAssignments] = useState<AssignmentResponse[]>([]);
  const [groupedAssignments, setGroupedAssignments] = useState<Record<string, Record<string, AssignmentResponse[]>>>({});
  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem('isLoggedIn') === 'true');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'courses' | 'missing'>('courses');
  const [currentWeekKey, setCurrentWeekKey] = useState<string>('');
  const [availableWeeks, setAvailableWeeks] = useState<string[]>([]);

  // Helper to get current week key
  const getCurrentWeekKey = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust to get Monday
    const monday = new Date(today);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);
    return monday.toISOString().split('T')[0];
  };

  // Navigate to previous week
  const goToPreviousWeek = () => {
    const currentIndex = availableWeeks.indexOf(currentWeekKey);
    if (currentIndex > 0) {
      setCurrentWeekKey(availableWeeks[currentIndex - 1]);
    }
  };

  // Navigate to next week
  const goToNextWeek = () => {
    const currentIndex = availableWeeks.indexOf(currentWeekKey);
    if (currentIndex < availableWeeks.length - 1) {
      setCurrentWeekKey(availableWeeks[currentIndex + 1]);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Temporarily inject values into the DOM so your Login() function can access them
    const emailInput = document.createElement('input');
    const passwordInput = document.createElement('input');
    emailInput.id = 'email';
    emailInput.value = email;
    passwordInput.id = 'password';
    passwordInput.value = password;
    document.body.appendChild(emailInput);
    document.body.appendChild(passwordInput);

    try {
      await Login();
      setIsLoggedIn(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed. Please try again.';
      setError(errorMessage);
      console.error(err);
    } finally {
      // Clean up the fake inputs
      emailInput.remove();
      passwordInput.remove();
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    setIsLoggedIn(false);
    setCourses([]);
    setAssignments([]);
    setMissingAssignments([]);
    setGroupedAssignments({});
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!isLoggedIn) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Fetch courses
        const fetchedCourses = await getCurrentClasses();
        setCourses(fetchedCourses);
        
        // Fetch assignments
        console.log("Fetching assignments...");
        const fetchedAssignments = await getAssignments();
        setAssignments(fetchedAssignments);
        
        // Fetch missing assignments
        console.log("Fetching missing assignments...");
        const fetchedMissingAssignments = await getAllMissingAssignments();
        setMissingAssignments(fetchedMissingAssignments);
        
        // Group missing assignments by week and day
        const grouped = groupAssignmentsByWeek(fetchedMissingAssignments);
        setGroupedAssignments(grouped);
        
        // Get available weeks and set current week
        const weeks = Object.keys(grouped).sort();
        setAvailableWeeks(weeks);
        
        // Set the current week to the current week if available, otherwise the first week
        const currentWeek = getCurrentWeekKey();
        if (weeks.includes(currentWeek)) {
          setCurrentWeekKey(currentWeek);
        } else if (weeks.length > 0) {
          setCurrentWeekKey(weeks[0]);
        }
        
        console.log("Data fetch completed");
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data. Please try again.';
        setError(errorMessage);
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (isLoggedIn) {
      fetchData();
    }
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return (
      <div className="login-container">
        <h2>Login to Gradescope</h2>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email-input">
              Email:
              <input
                type="email"
                id="email-input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </label>
          </div>
          
          <div className="form-group">
            <label htmlFor="password-input">
              Password:
              <input
                type="password"
                id="password-input"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </label>
          </div>
          
          <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    );
  }

  const renderWeeklyAssignments = () => {
    if (!currentWeekKey || !groupedAssignments[currentWeekKey]) {
      return <div className="no-data">No assignments due this week</div>;
    }

    // Create an array of days from Monday to Sunday for the current week
    const monday = new Date(currentWeekKey);
    const daysOfWeek = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      return date.toISOString().split('T')[0];
    });

    return (
      <div className="weekly-assignments">
        <div className="week-navigation">
          <button 
            onClick={goToPreviousWeek} 
            disabled={availableWeeks.indexOf(currentWeekKey) === 0}
            className="week-nav-button"
          >
            ← Previous Week
          </button>
          <h3 className="week-title">{getWeekDateRange(currentWeekKey)}</h3>
          <button 
            onClick={goToNextWeek} 
            disabled={availableWeeks.indexOf(currentWeekKey) === availableWeeks.length - 1}
            className="week-nav-button"
          >
            Next Week →
          </button>
        </div>
        
        <div className="days-container">
          {daysOfWeek.map(dayKey => {
            const dayAssignments = groupedAssignments[currentWeekKey][dayKey] || [];
            const today = new Date().toISOString().split('T')[0] === dayKey;
            
            return (
              <div key={dayKey} className={`day-card ${today ? 'today' : ''} ${dayAssignments.length > 0 ? 'has-assignments' : ''}`}>
                <div className="day-header">
                  <div className="day-name">{getDayName(dayKey)}</div>
                  <div className="day-date">{formatDate(dayKey)}</div>
                </div>
                
                <div className="day-assignments">
                  {dayAssignments.length > 0 ? (
                    <ul className="assignments-list">
                      {dayAssignments.map((assignment, index) => (
                        <li key={`${assignment.assignment_id}-${index}`} className="assignment-item compact">
                          <div className="assignment-name">{assignment.name}</div>
                          <div className="assignment-time">
                            Due: {new Date(assignment.due_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className="assignment-status">
                            <span className="status-badge">{assignment.submissions_status}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="no-assignments">No assignments due</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard-container">
      <div className="header">
        <h2>Your Gradescope Dashboard</h2>
        <button onClick={handleLogout}>Logout</button>
      </div>
      
      <div className="tabs">
        <button 
          className={`tab-button ${activeTab === 'courses' ? 'active' : ''}`}
          onClick={() => setActiveTab('courses')}
        >
          Courses
        </button>
        <button 
          className={`tab-button ${activeTab === 'missing' ? 'active' : ''}`}
          onClick={() => setActiveTab('missing')}
        >
          Weekly Assignments
          {missingAssignments.length > 0 && (
            <span className="badge">{missingAssignments.length}</span>
          )}
        </button>
      </div>
      
      {loading ? (
        <div className="loading">Loading data...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : activeTab === 'courses' ? (
        <div className="courses-container">
          <h3>Your Courses</h3>
          {courses.length > 0 ? (
            <ul className="courses-list">
              {courses.map((course, index) => (
                <li key={course.name + index} className="course-item">
                  <div className="course-header">
                    <strong>{course.name}</strong>
                  </div>
                  <div className="course-details">
                    <div className="course-name">{course.full_name}</div>
                    <div className="course-term">{course.semester} {course.year}</div>
                    {course.num_assignments && (
                      <div className="course-assignments">
                        Assignments: {course.num_assignments}
                      </div>
                    )}
                    {course.num_grades_published !== null && (
                      <div className="course-grades">
                        Grades published: {course.num_grades_published}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="no-data">No courses found for the current semester.</div>
          )}
        </div>
      ) : (
        <div className="missing-assignments-container">
          <h3>Weekly Assignments</h3>
          {Object.keys(groupedAssignments).length > 0 ? (
            renderWeeklyAssignments()
          ) : (
            <div className="no-data">No outstanding assignments! 🎉</div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
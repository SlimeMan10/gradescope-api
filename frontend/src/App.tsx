import React, { useState, useEffect } from 'react';
import getCurrentClasses from './backend/classes/currentClasses';
import getAssignments from './backend/assignments/getAssignments';
import getAllMissingAssignments from './backend/assignments/getMissingAssignments';
import type { StudentCourse } from './backend/interfaces';
import type { AssignmentResponse } from './backend/interfaces';
import groupAssignmentsByWeek from './components/helperFunctions/Week/groupAssignmentsByWeek';
import getCurrentWeekKey from './components/helperFunctions/Week/GetCurrentWeekKey';
import handleLogin from './components/helperFunctions/login/Login';
import handleLogout from './components/helperFunctions/login/Logout';
import WeeklyAssignments from './components/WeeklyAssignments';

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

  const onSubmitLogin = (e: React.FormEvent) => {
    handleLogin(
      e, 
      email, 
      password, 
      setLoading, 
      setError, 
      setIsLoggedIn
    );
  };

  const onLogout = () => {
    handleLogout(
      setIsLoggedIn,
      setCourses,
      setAssignments,
      setMissingAssignments,
      setGroupedAssignments
    );
  };

  if (!isLoggedIn) {
    return (
      <div className="login-container">
        <h2>Login to Gradescope</h2>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        <form onSubmit={onSubmitLogin}>
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

  return (
    <div className="dashboard-container">
      <div className="header">
        <h2>Your Gradescope Dashboard</h2>
        <button onClick={onLogout}>Logout</button>
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
            <WeeklyAssignments 
              currentWeekKey={currentWeekKey}
              groupedAssignments={groupedAssignments}
              availableWeeks={availableWeeks}
              setCurrentWeekKey={setCurrentWeekKey}
              courses={courses}
            />
          ) : (
            <div className="no-data">No outstanding assignments! 🎉</div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
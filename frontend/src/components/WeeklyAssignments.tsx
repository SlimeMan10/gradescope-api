import React from 'react';
import { AssignmentResponse, StudentCourse } from '../backend/interfaces';
import goToPreviousWeek from './helperFunctions/Week/GoToPreviousWeek';
import getWeekDateRange from './helperFunctions/Week/getWeekDateRange';
import goToNextWeek from './helperFunctions/Week/GoToNextWeek';
import getDayName from './helperFunctions/Week/DayName';
import formatDate from './helperFunctions/Week/formatDay';

interface WeeklyAssignmentsProps {
  currentWeekKey: string;
  groupedAssignments: Record<string, Record<string, AssignmentResponse[]>>;
  availableWeeks: string[];
  setCurrentWeekKey: React.Dispatch<React.SetStateAction<string>>;
  courses: StudentCourse[];
}

const WeeklyAssignments: React.FC<WeeklyAssignmentsProps> = ({
  currentWeekKey,
  groupedAssignments,
  availableWeeks,
  setCurrentWeekKey,
  courses
}) => {
  if (!currentWeekKey || !groupedAssignments[currentWeekKey]) {
    return <div className="no-data">No assignments due this week</div>;
  }

  // Create a mapping of course IDs to course names
  const courseMap: Record<string, string> = {};
  courses.forEach(course => {
    if (course.name) {
      courseMap[course.name] = course.full_name;
    }
  });

  // Create an array of days from Monday to Sunday for the current week
  const monday = new Date(currentWeekKey);
  
  // Calculate assignments statistics for the week
  const allAssignmentsForWeek: AssignmentResponse[] = [];
  Object.keys(groupedAssignments[currentWeekKey] || {}).forEach(dayKey => {
    const dayAssignments = groupedAssignments[currentWeekKey][dayKey] || [];
    allAssignmentsForWeek.push(...dayAssignments);
  });
  
  // Get total no submission assignments
  const noSubmissionAssignments = allAssignmentsForWeek.filter(
    assignment => assignment.submissions_status === "No Submission"
  ).length;
  
  // Reorder the days array to start on Monday
  // Days will be ordered: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday
  const daysOfWeek = [];
  for (let i = 1; i <= 7; i++) {
    // Start with Monday (i=1) and wrap around to Sunday (i=7 becomes 0)
    const dayIndex = i % 7;
    
    // Find the date for this weekday
    const date = new Date(monday);
    const diff = dayIndex - monday.getDay();
    date.setDate(monday.getDate() + diff + (dayIndex === 0 ? 7 : 0));
    
    daysOfWeek.push(date.toISOString().split('T')[0]);
  }

  // Get the week date range for display
  const weekDateRange = getWeekDateRange(currentWeekKey);
  
  // Get today's date for countdown calculations
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Calculate days until due or days overdue
  const getDueDateStatus = (dueDate: Date) => {
    const dueDateObj = new Date(dueDate);
    dueDateObj.setHours(0, 0, 0, 0);
    
    const diffTime = dueDateObj.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return `${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''} overdue`;
    } else if (diffDays === 0) {
      return "Due today";
    } else {
      return `Due in ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    }
  };

  return (
    <div className="weekly-assignments">
      <div className="week-header">
        <div className="week-navigation">
          <button 
            onClick={() => goToPreviousWeek(availableWeeks, currentWeekKey, setCurrentWeekKey)} 
            disabled={availableWeeks.indexOf(currentWeekKey) === 0}
            className="week-nav-button"
          >
            ← Previous Week
          </button>
          <h3 className="week-title">{weekDateRange}</h3>
          <button 
            onClick={() => goToNextWeek(availableWeeks, currentWeekKey, setCurrentWeekKey)} 
            disabled={availableWeeks.indexOf(currentWeekKey) === availableWeeks.length - 1}
            className="week-nav-button"
          >
            Next Week →
          </button>
        </div>
      </div>
      
      <div className="assignments-header">
        <h2 className="tasks-title">Tasks ({noSubmissionAssignments})</h2>
      </div>
      
      <div className="assignments-container">
        {daysOfWeek.map(dayKey => {
          const allDayAssignments = groupedAssignments[currentWeekKey][dayKey] || [];
          // Filter to only show "No Submission" assignments
          const dayAssignments = allDayAssignments.filter(
            assignment => assignment.submissions_status === "No Submission"
          );
          
          if (dayAssignments.length === 0) return null;
          
          const dayDate = new Date(dayKey);
          const isToday = new Date().toISOString().split('T')[0] === dayKey;
          
          return (
            <div key={dayKey} className="assignments-by-day">
              <h3 className="day-header">
                {getDayName(dayKey)}, {formatDate(dayKey)}
                {isToday && <span className="today-marker"> (Today)</span>}
              </h3>
              
              {dayAssignments.map((assignment, index) => {
                // Extract course code/name for display
                const courseDisplay = assignment.course_id && courseMap[assignment.course_id] || assignment.course_id || "Unknown Course";
                // Get course code (like CSE 340)
                const courseCode = typeof courseDisplay === 'string' ? 
                  courseDisplay.split(' ').slice(0, 2).join(' ') : 
                  courseDisplay;
                
                return (
                  <div key={`${assignment.assignment_id}-${index}`} className="assignment-card">
                    <div className="course-badge">
                      {courseCode}
                    </div>
                    <div className="assignment-details">
                      <div className="assignment-name">
                        {courseDisplay}: {assignment.name}
                      </div>
                      <div className="assignment-time">
                        {new Date(assignment.due_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="assignment-countdown">
                        {getDueDateStatus(assignment.due_date)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeeklyAssignments;
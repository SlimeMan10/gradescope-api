import {AssignmentResponse} from '../../../backend/interfaces';
import formatDateKey from './formatDateKey';

// We are going to assume that the front end has passed in the missing assignments for us
export default function groupAssignmentsByWeek(assignments: AssignmentResponse[]) {
  const grouped: Record<string, Record<string, AssignmentResponse[]>> = {};
  
  assignments.forEach(assignment => {
    // Parse the due date string into a Date object and adjust for timezone issues
    const dueDateStr = new Date(assignment.due_date).toISOString().split('T')[0];
    const dueDate = new Date(dueDateStr + 'T00:00:00');
    
    // Get the day of week (0-6, where 0 is Sunday)
    const dayOfWeek = dueDate.getDay();
    
    // Calculate difference to Monday
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    
    // Create Monday date for the week
    const monday = new Date(dueDate);
    monday.setDate(dueDate.getDate() + diff);
    
    // Format dates consistently using ISO format to avoid timezone issues
    const weekKey = monday.toISOString().split('T')[0];
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
  
  console.log("Grouped:", grouped);
  return grouped;
}

// Helper function to format date consistently

interface MissingAssignment {
  assignment_name: string;
  course_name: string;
  due_date: Date;
  late_due_date: Date;
}

interface CardsProps {
  assignments: MissingAssignment[] | null;
}

export default function Cards({ assignments }: CardsProps) {
  if (!assignments || assignments.length === 0) {
    return (
      <div className="col-span-full bg-white p-6 rounded-lg shadow-lg text-center border border-gray-200 animate-fadeIn"
           role="status" 
           aria-live="polite">
        <p className="text-lg text-gray-700">No missing assignments found.</p>
      </div>
    );
  }

  // Sort assignments by due date (closest due date first)
  const sortedAssignments = [...assignments].sort((a, b) => {
    const dateA = new Date(a.due_date).getTime();
    const dateB = new Date(b.due_date).getTime();
    return dateA - dateB;
  });

  return (
    <>
      {sortedAssignments.map((assignment, index) => {
        // Calculate days remaining until due date
        const dueDate = new Date(assignment.due_date);
        const today = new Date();
        const timeDiff = dueDate.getTime() - today.getTime();
        const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
        
        // Determine urgency for styling
        let urgencyClass = "bg-green-50 border-green-200";
        let textClass = "text-green-700";
        let ariaUrgency = "normal priority";
        
        if (daysRemaining <= 0) {
          urgencyClass = "bg-red-50 border-red-200";
          textClass = "text-red-700";
          ariaUrgency = "critical priority, overdue";
        } else if (daysRemaining <= 2) {
          urgencyClass = "bg-orange-50 border-orange-200";
          textClass = "text-orange-700";
          ariaUrgency = "high priority, due soon";
        } else if (daysRemaining <= 5) {
          urgencyClass = "bg-yellow-50 border-yellow-200";
          textClass = "text-yellow-700";
          ariaUrgency = "medium priority";
        }

        // Staggered animation delay
        const animationDelay = `${index * 100}ms`;

        return (
          <div 
            key={`${assignment.course_name}-${assignment.assignment_name}-${index}`}
            className={`${urgencyClass} p-6 rounded-lg shadow-md border-2 card-hover-effect animate-slideUp`}
            style={{ animationDelay }}
            role="listitem"
            aria-label={`Assignment: ${assignment.assignment_name} for ${assignment.course_name}, ${ariaUrgency}`}
            tabIndex={0}
          >
            <h2 className="text-xl font-bold mb-2 text-gray-800">{assignment.assignment_name}</h2>
            <p className="text-gray-600 mb-4">Course: {assignment.course_name}</p>
            
            <div className="mb-2">
              <span className="text-sm font-medium text-gray-600">Due Date:</span>
              <span className={`ml-2 text-sm ${textClass}`}>
                {new Date(assignment.due_date).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
            
            {assignment.late_due_date && (
              <div className="mb-4">
                <span className="text-sm font-medium text-gray-600">Late Due Date:</span>
                <span className="ml-2 text-sm text-gray-700">
                  {new Date(assignment.late_due_date).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            )}
            
            <div className={`text-sm font-semibold ${textClass} mt-2 ${daysRemaining <= 2 ? 'animate-pulse' : ''}`}>
              {daysRemaining <= 0 
                ? "Overdue!" 
                : daysRemaining === 1 
                  ? "Due tomorrow!" 
                  : `${daysRemaining} days remaining`}
            </div>
          </div>
        );
      })}
    </>
  );
}
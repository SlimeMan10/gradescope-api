import url from '../../url';
import getCurrentClasses from '../../classes/currentClasses/index';
import AssignmentResponse from '../../interfaces';
import StudentCourse from '../../interfaces';

export default async function getAssignments(): Promise<AssignmentResponse[]> {
    // Get all current classes
    let allClasses: StudentCourse[];
    try {
        allClasses = await getCurrentClasses();
    } catch (error) {
        console.error("Error getting current classes:", error);
        throw error;
    }
    
    if (!allClasses || allClasses.length === 0) {
        console.warn("No classes found");
        return [];
    }
    
    // Track course IDs to fetch assignments for
    const courseIds: string[] = [];
    
    // Extract course IDs from classes
    for (let i = 0; i < allClasses.length; i++) {
        const currClass = allClasses[i];
        
        // Find the course ID - it might be under different property names
        const courseId = currClass.course_id;
        
        if (courseId) {
            courseIds.push(courseId);
        } else {
            console.warn("No course ID found for class:", currClass);
        }
    }
    
    
    // Fetch assignments for each course
    const allAssignments: AssignmentResponse[] = [];
    
    for (let i = 0; i < courseIds.length; i++) {
        const courseId = courseIds[i];
        
        try {
            // Use URL with query parameters since the API expects course_id in the query
            const response = await fetch(`${url}/assignments?course_id=${courseId}`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Error response for course ${courseId}:`, errorText);
                throw new Error(`Error fetching assignments: ${response.status} - ${errorText}`);
            }
            
            const data = await response.json();
            
            // If the API returns an array of assignments
            if (Array.isArray(data)) {
                allAssignments.push(...data);
            } else {
                // If it returns a single assignment or different structure
                allAssignments.push(data as AssignmentResponse);
            }
        } catch (error) {
            console.error(`Failed to fetch assignments for course ${courseId}:`, error);
            // Continue with other courses even if one fails
        }
    }
    console.log("allAssignments: ", allAssignments);
    return allAssignments;
}
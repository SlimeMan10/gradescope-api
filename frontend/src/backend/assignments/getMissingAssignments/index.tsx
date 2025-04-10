import getAssignments from '../getAssignments/index';
import url from '../../url';
import getCurrentClasses from '../../classes/currentClasses/index';
import AssignmentResponse from '../../interfaces';
import StudentCourse from '../../interfaces';

export default async function getAllMissingAssignments(): Promise<AssignmentResponse[]> {
    let allAssignments: AssignmentResponse[] = [];
    try {
        // get all the classes from getAssignments
        allAssignments = await getAssignments();
    } catch (error) {
        throw new Error("Failure getting classes from getCurrentClasses");
    }
    let nonSubmittedClasses: AssignmentResponse[] = [];
    for (let i = 0; i < allAssignments.length; i++) {
        const currAssignment = allAssignments[i];
        const assignmentStatus = currAssignment.submissions_status;
        if (assignmentStatus !== "Submitted") {
            nonSubmittedClasses.push(currAssignment);
        }
    }
    console.log("All missing assignments: ", nonSubmittedClasses);
    return nonSubmittedClasses;
}
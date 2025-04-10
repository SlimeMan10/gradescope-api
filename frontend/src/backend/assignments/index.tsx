import url from '../url';
import getCurrentClasses from '../classes/index';
import assignmentResponse from '../interfaces';
import StudentCourse from '../interfaces';


export default async function getAssignments(): Promise<assignmentReponse[]> {
    // we need all valid class id's from this quarter
    let allClasses: StudentCourse[];
    try {
        allClasses = await getCurrentClasses();
    } catch (error) {
        throw error;
    }
    //now we can loop through it and get the assignments for each class
    for (let i = 0; i < allClasses.length; i++) {
        const currClass = allClasses[i];
        
    }
}

export default async function getAllAssignments() {

}

export default async function getAllMissingAssignments() {

}
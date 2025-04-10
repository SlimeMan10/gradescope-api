import StudentCourse from '../../interfaces';
import AllCoursesResponse from '../../interfaces';
import getAllClasses from '../allClasses/index';

export default async function getCurrentClasses(): Promise<StudentCourse[]> {
    let allClasses: AllCoursesResponse;
    try {
        allClasses = await getAllClasses();
    } catch(error) {
        throw error;
    }
    
    // now that we have all the classes we want to loop through it and get
    // all the classes that are the current "semester/quarter", we know the
    // data is sorted by newest to oldest. So we will do a for loop that 
    // will keep track of the semester as the year will be irrelevant to this
    const studentCourses = allClasses.student;
    const studentCourseKeys = Object.keys(studentCourses);
    let semester: string = '';
    let currentClasses: StudentCourse[] = [];
    
    for (let i = studentCourseKeys.length - 1; i >= 0; i--) {
        const key = studentCourseKeys[i];
        const currClass = studentCourses[key];
        const currentSemester: string = currClass.semester;
        
        if (semester === '') {
            semester = currentSemester;
        }
        
        if (currentSemester !== semester) {
            break;
        }
        
        currentClasses.push({
            ...currClass,
            course_id: key
        } as StudentCourse & { id: string });
    }
    return currentClasses;
}
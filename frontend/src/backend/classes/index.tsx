import url from '../url';
import StudentCourse from '../interfaces';
import AllCoursesResponse from '../interfaces';


export default async function getAllClasses(): Promise<AllCoursesResponse> {
    try {
        const loggedIn: string | null = localStorage.getItem("isLoggedIn");
        if (loggedIn == null) {
            throw new Error("User is not logged in");
        }

        const response: Response = await fetch(url + 'courses', {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error("Error getting response");
        }

        const data: AllCoursesResponse = await response.json();
        console.log(data);
        return data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function getCurrentClasses(): Promise<StudentCourse[]> {
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
    
    for (let i = 0; i < studentCourseKeys.length; i++) {
        const key = studentCourseKeys[i];
        const currClass = studentCourses[key];
        const currentSemester: string = currClass.semester;
        
        if (semester === '') {
            semester = currentSemester;
        }
        
        if (currentSemester !== semester) {
            break;
        }
        
        currentClasses.push(currClass);
    }
    
    return currentClasses;
}
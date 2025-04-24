import api  from './apiLink.tsx';

interface coursesApiReturn {
    teacher: Record<string, courseData>;
    student: Record<string, courseData>;
}

interface courseData {
    name: string,
    full_name: string,
    semester: string,
    year: number,
    num_grades_published: string | null,
    num_assignments: string
}

interface assignment {
    assignment_id: string,
    name: string,
    release_date: Date,
    due_date: Date,
    late_due_date: Date,
    submissions_status: string,
    grade: string,
    max_grade: string
}

interface missing_assignment {
    assignment_name: string,
    course_name: string,
    due_date: Date
}

async function getAllClasses({setError, controller}): Promise<Record<string, courseData> | undefined> {
    try {
        const response: Response = await fetch(api + "/courses", {
            method: "POST",
            body: JSON.stringify({}),
            signal: controller.signal,
        });
        if (!response.ok) {
            throw Error("Error Fetching Classes");
        }
        const data: coursesApiReturn = await response.json();
        return data.student;
    } catch (error) {
        if (error.name !== 'AbortError') {
            setError(error);
        }
    }
}

interface courseDataWithId extends courseData {
    id: string
  }

function getCurrentClasses({allClasses}): courseDataWithId[] {
    // create a copy to keep function pure
    const classesArray: courseDataWithId[] = Object.entries(allClasses).map(([id, classData]) => {
        if (typeof classData === 'object' && classData !== null) {
            return {
                ...classData,
                id
            } as courseDataWithId;
        }
        throw new Error("Invalid class data");
    });

    const curr_semester: string | undefined = classesArray.length > 0 ? classesArray[0].semester : undefined;

    let curr_classes: courseDataWithId[] = [];
    for (let i = classesArray.length - 1; i >= 0; i--) {
        if (classesArray[i].semester !== curr_semester) {
            break;
        }
        curr_classes.push(classesArray[i]);
    }
    
    return curr_classes;
}

async function getMissingAssignments({setClasses, setError, controller}) {
    let allClasses: Record<string, courseData> | undefined;
    try {
        allClasses = await getAllClasses({ setError, controller });
    } catch (error) {
        // taken care of in all classes
        return;
    }
    if (allClasses == null) {
        console.error("No classes found");
        return;
    }
    const currentClasses: courseDataWithId[] = getCurrentClasses({allClasses});
    if (currentClasses == null || currentClasses.length == 0) {
        console.error("No classes found");
        return;
    }
    try {
        const missing_assignment = await getMissingAssignmentsHelper({setError, controller, currentClasses});
        setClasses(missing_assignment);
    } catch (error) {
        // taken care of in the helper
        return;
    }
}

async function getMissingAssignmentsHelper({setError, controller, currentClasses}) {
    try {
      // Create an array of promises for all fetch requests
      const assignmentPromises = currentClasses.map(async (curr_class) => {
        try {
          const response = await fetch(api + '/assignments', {
            method: 'POST',
            body: JSON.stringify({
              course_id: curr_class.id
            }),
            signal: controller.signal,
          });
          
          if (!response.ok) {
            throw Error('Failure getting missing assignment');
          }
          
          const data = await response.json();
          return data;
        } catch (error) {
          if (error.name !== 'AbortError') {
            setError(error);
          }
          return null; // Return null for failed requests
        }
      });
      
      // Wait for all promises to resolve
      const results = await Promise.all(assignmentPromises);
      
      // Filter out any null results (failed requests)
      return results.filter(result => result !== null);
    } catch (error) {
      setError(error);
      return [];
    }
  }

export default getMissingAssignments;
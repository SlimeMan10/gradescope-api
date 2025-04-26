import apiLink from '../apiLink.tsx';

interface coursesapiLinkReturn {
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
    late_due_date: Date
}

interface courseDataWithId extends courseData {
  id: string
}

export default async function getMissingAssignments({setAssignments, setError, controller}: 
    { setAssignments: (classes: missing_assignment[] | null) => void; setError: (error: any) => void; controller: AbortController })
    : Promise<void | null>
    {
      let allClasses: Record<string, courseData> | undefined;
      try {
          allClasses = await getAllClasses({ setError, controller });
      } catch (error) {
          // taken care of in all classes
          return;
      }
      if (!allClasses) {
          console.error("allClasses is undefined");
          return;
      }
      const currentClasses: courseDataWithId[] = getCurrentClasses({allClasses});
      if (!currentClasses) {
          console.error("current classes not found found");
          return;
      }
      console.log("Current Classes",currentClasses);
      try {
          const missing_assignment: missing_assignment[] | null = await getMissingAssignmentsHelper({setError, controller, currentClasses});
          console.log("Missing Assignments", missing_assignment);
          setAssignments(missing_assignment);
      } catch (error) {
          // taken care of in the helper
          return;
      }
  }

async function getAllClasses({setError, controller}: { setError: (error: any) => void; controller: AbortController }): Promise<Record<string, courseData> | undefined> {
    try {
        const response: Response = await fetch(apiLink + "/courses", {
            method: "POST",
            body: JSON.stringify({}),
            signal: controller.signal,
        });
        if (!response.ok) {
            throw Error("Error Fetching Classes");
        }
        const data: coursesapiLinkReturn = await response.json();
        console.log(data);
        console.log(data.student);
        const studentData: Record<string, courseData> | undefined = data.student;
        return studentData;
    } catch (error: Error | unknown) {
        if (error instanceof Error && error.name !== 'AbortError') {
            setError(error);
        }
    }
}

function getCurrentClasses({allClasses}: { allClasses: Record<string, courseData> }): courseDataWithId[] {
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
    const curr_semester: string | undefined = classesArray.length > 0 ? classesArray[classesArray.length - 1].semester : undefined;
    let curr_classes: courseDataWithId[] = [];
    for (let i = classesArray.length - 1; i >= 0; i--) {
        if (classesArray[i].semester !== curr_semester) {
            break;
        }
        curr_classes.push(classesArray[i]);
    }
    return curr_classes;
}

async function getMissingAssignmentsHelper({setError, controller, currentClasses}: 
  { setError: (error: any) => void; controller: AbortController; currentClasses: courseDataWithId[] }): Promise<missing_assignment[] | null> {
    try {
      // Create an array of promises for all fetch requests
      const assignmentPromises = currentClasses.map(async (curr_class) => {
        try {
          const response: Response = await fetch(apiLink + '/assignments?course_id=' + curr_class.id, {
            method: 'POST',
            signal: controller.signal,
          });
          
          if (!response.ok) {
            throw Error('Failure getting missing assignment');
          }
          
          const data: assignment[] = await response.json();
          // Map assignments to match the missing_assignment structure
          const filteredData: assignment[] = data.filter((assignment) => 
            assignment.submissions_status === 'No Submission'
          );
          return filteredData.map((assignment) => ({
            assignment_name: assignment.name,
            course_name: curr_class.name,
            due_date: assignment.due_date,
            late_due_date: assignment.late_due_date,
          }));
        } catch (error) {
          if (error instanceof Error && error.name !== 'AbortError') {
            setError(error);
          }
          return []; // Return an empty array for failed requests
        }
      });
      
      // Wait for all promises to resolve
      const results = await Promise.all(assignmentPromises);
      
      // Flatten the array of arrays and return the results
      return results.flat();
    } catch (error) {
      setError(error);
      return [];
    }
  }
export default interface StudentCourse {
    name: string;
    full_name: string;
    semester: string;
    year: string;
    num_grades_published: number | null;
    num_assignments: string;
}

export default interface AllCoursesResponse {
    instructor: Record<string, any>; // or a more specific type if known
    student: Record<string, StudentCourse>; // keys are dynamic IDs like "460107"
}

export default interface assignmentResponse {
    assignment_id: number,
    name: string,
    release_date: Date,
    due_date: Date,
    late_due_date: Date | null,
    submissions_status: string,
    grade: number,
    max_grade: number
}
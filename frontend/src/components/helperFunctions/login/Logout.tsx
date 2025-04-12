import { Dispatch, SetStateAction } from 'react';
import type StudentCourse from '../../../backend/interfaces';
import AssignmentResponse from '../../../backend/interfaces';

const handleLogout = (
  setIsLoggedIn: Dispatch<SetStateAction<boolean>>,
  setCourses: Dispatch<SetStateAction<StudentCourse[]>>,
  setAssignments: Dispatch<SetStateAction<AssignmentResponse[]>>,
  setMissingAssignments: Dispatch<SetStateAction<AssignmentResponse[]>>,
  setGroupedAssignments: Dispatch<SetStateAction<Record<string, Record<string, AssignmentResponse[]>>>>
) => {
  localStorage.removeItem('isLoggedIn');
  setIsLoggedIn(false);
  setCourses([]);
  setAssignments([]);
  setMissingAssignments([]);
  setGroupedAssignments({});
};

export default handleLogout;
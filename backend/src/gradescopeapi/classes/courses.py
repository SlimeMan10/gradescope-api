from dataclasses import dataclass


@dataclass
class Course:
    name: str
    full_name: str
    semester: str
    year: str
    num_grades_published: str
    num_assignments: str

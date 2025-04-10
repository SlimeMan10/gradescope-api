from dataclasses import dataclass


@dataclass
class Member:
    full_name: str
    first_name: str
    last_name: str
    sid: str
    email: str
    role: str
    id: str
    num_submissions: int
    sections: str
    course_id: str

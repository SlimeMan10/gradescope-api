"""Functions for modifying assignment details."""

import datetime
from dataclasses import dataclass

import requests
from bs4 import BeautifulSoup
from requests_toolbelt.multipart.encoder import MultipartEncoder

from gradescopeapi import DEFAULT_GRADESCOPE_BASE_URL


@dataclass
class Assignment:
    assignment_id: str
    name: str
    release_date: datetime.datetime
    due_date: datetime.datetime
    late_due_date: datetime.datetime
    submissions_status: str
    grade: str
    max_grade: str


def update_assignment_date(
    session: requests.Session,
    course_id: str,
    assignment_id: str,
    release_date: datetime.datetime | None = None,
    due_date: datetime.datetime | None = None,
    late_due_date: datetime.datetime | None = None,
    gradescope_base_url: str = DEFAULT_GRADESCOPE_BASE_URL,
):
    """Update the dates of an assignment on Gradescope.

    Args:
        session (requests.Session): The session object for making HTTP requests.
        course_id (str): The ID of the course.
        assignment_id (str): The ID of the assignment.
        release_date (datetime.datetime | None, optional): The release date of the assignment. Defaults to None.
        due_date (datetime.datetime | None, optional): The due date of the assignment. Defaults to None.
        late_due_date (datetime.datetime | None, optional): The late due date of the assignment. Defaults to None.

    Notes:
        The timezone for dates used in Gradescope is specific to an institution. For example, for NYU, the timezone is America/New_York.
        For datetime objects passed to this function, the timezone should be set to the institution's timezone.

    Returns:
        bool: True if the assignment dates were successfully updated, False otherwise.
    """
    GS_EDIT_ASSIGNMENT_ENDPOINT = (
        f"{gradescope_base_url}/courses/{course_id}/assignments/{assignment_id}/edit"
    )
    GS_POST_ASSIGNMENT_ENDPOINT = (
        f"{gradescope_base_url}/courses/{course_id}/assignments/{assignment_id}"
    )

    # Get auth token
    response = session.get(GS_EDIT_ASSIGNMENT_ENDPOINT)
    soup = BeautifulSoup(response.text, "html.parser")
    auth_token = soup.select_one('input[name="authenticity_token"]')["value"]

    # Setup multipart form data
    multipart = MultipartEncoder(
        fields={
            "utf8": "✓",
            "_method": "patch",
            "authenticity_token": auth_token,
            "assignment[release_date_string]": (
                release_date.strftime("%Y-%m-%dT%H:%M") if release_date else ""
            ),
            "assignment[due_date_string]": (
                due_date.strftime("%Y-%m-%dT%H:%M") if due_date else ""
            ),
            "assignment[allow_late_submissions]": "1" if late_due_date else "0",
            "assignment[hard_due_date_string]": (
                late_due_date.strftime("%Y-%m-%dT%H:%M") if late_due_date else ""
            ),
            "commit": "Save",
        }
    )
    headers = {
        "Content-Type": multipart.content_type,
        "Referer": GS_EDIT_ASSIGNMENT_ENDPOINT,
    }

    response = session.post(
        GS_POST_ASSIGNMENT_ENDPOINT, data=multipart, headers=headers
    )

    return response.status_code == 200

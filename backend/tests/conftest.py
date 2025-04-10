import os

import pytest
from dotenv import load_dotenv

from gradescopeapi.classes.connection import GSConnection

load_dotenv()

GRADESCOPE_CI_STUDENT_EMAIL = os.getenv("GRADESCOPE_CI_STUDENT_EMAIL")
GRADESCOPE_CI_STUDENT_PASSWORD = os.getenv("GRADESCOPE_CI_STUDENT_PASSWORD")
GRADESCOPE_CI_INSTRUCTOR_EMAIL = os.getenv("GRADESCOPE_CI_INSTRUCTOR_EMAIL")
GRADESCOPE_CI_INSTRUCTOR_PASSWORD = os.getenv("GRADESCOPE_CI_INSTRUCTOR_PASSWORD")


@pytest.fixture
def create_session():
    def _create_session(account_type: str = "student"):
        """Creates and returns a session for testing"""
        connection = GSConnection()

        match account_type.lower():
            case "student":
                connection.login(
                    GRADESCOPE_CI_STUDENT_EMAIL, GRADESCOPE_CI_STUDENT_PASSWORD
                )
            case "instructor":
                connection.login(
                    GRADESCOPE_CI_INSTRUCTOR_EMAIL, GRADESCOPE_CI_INSTRUCTOR_PASSWORD
                )
            case _:
                raise ValueError(
                    "Invalid account type: must be 'student' or 'instructor'"
                )

        return connection.session

    return _create_session

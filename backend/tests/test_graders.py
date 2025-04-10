from gradescopeapi.classes.account import Account


def test_get_assignment_graders_non_empty(create_session):
    """Test getting graders for a question that has been graded."""
    # create test session
    test_session = create_session("instructor")
    account = Account(test_session)

    course_id = "753413"
    question_id = "49653137"

    graders = account.get_assignment_graders(course_id, question_id)
    assert len(graders) > 0, "Should have at least 1 grader"


def test_get_assignment_graders_empty(create_session):
    """Test getting graders for a question that has not been graded."""
    # create test session
    test_session = create_session("instructor")
    account = Account(test_session)

    course_id = "753413"
    question_id = "49653136"

    graders = account.get_assignment_graders(course_id, question_id)
    assert len(graders) == 0, "Should not have any graders"

from datetime import datetime
import asyncio
import uuid
from fastapi import Depends, FastAPI, HTTPException, status, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))
from gradescopeapi._config.config import FileUploadModel, LoginRequestModel
from gradescopeapi.classes.account import Account
from gradescopeapi.classes.assignments import Assignment, update_assignment_date
from gradescopeapi.classes.connection import GSConnection
from gradescopeapi.classes.courses import Course
from gradescopeapi.classes.extensions import get_extensions, update_student_extension
from gradescopeapi.classes.member import Member
from gradescopeapi.classes.upload import upload_assignment

# Create app FIRST - before using it
app = FastAPI()

# API endpoint prefix
API_PREFIX = "/api"

# Add CORS middleware - ONLY ONCe
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://gradescope-plus.vercel.app",  # Production frontend
        "http://localhost:3000",              # Local development
        "http://localhost:5173"               # Vite default port
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600
)

# Get the absolute path to the current directory
current_dir = os.path.dirname(os.path.abspath(__file__))
static_dir = os.path.join(current_dir, "static")

# Create static directory if it doesn't exist
os.makedirs(static_dir, exist_ok=True)

# Mount static files with absolute path - ONLY ONCE
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# User sessions storage - replaces the global connection and account
user_sessions = {}

# Get path to React build directory
project_root = os.path.abspath(os.path.join(current_dir, ".."))
frontend_build_dir = os.path.join(project_root, "frontend", "build")

# Mount React build directory if it exists
if os.path.exists(frontend_build_dir):
   app.mount("/assets", StaticFiles(directory=os.path.join(frontend_build_dir, "assets")), name="react_assets")

# Root route to serve our HTML file - ONLY ONCE
@app.get("/")
def read_root():
   return FileResponse(os.path.join(static_dir, "index.html"))

# Session cleanup background task
@app.on_event("startup")
async def startup_event():
    asyncio.create_task(cleanup_expired_sessions())

async def cleanup_expired_sessions():
    while True:
        now = datetime.now()
        # Remove sessions inactive for more than 30 minutes
        expired = [token for token, data in user_sessions.items() 
                  if (now - data["last_active"]).seconds > 1800]
        
        for token in expired:
            del user_sessions[token]
        
        # Check every minute
        await asyncio.sleep(60)

# Dependency to get the current user's data
def get_current_user_data(
    session_token: str = Header(None, description="Session token from login"),
    authorization: str = Header(None, description="Bearer token")
):
    # Try to get token from different possible sources
    token = None
    
    # Check session_token header (direct)
    if session_token:
        token = session_token
    # Check Authorization header (Bearer format)
    elif authorization and authorization.startswith("Bearer "):
        token = authorization.replace("Bearer ", "")
    
    if not token:
        raise HTTPException(status_code=401, detail="Invalid or missing session token")
    
    if token not in user_sessions:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    
    # Update last active timestamp
    user_sessions[token]["last_active"] = datetime.now()
    return user_sessions[token]

# Helper to get connection from user data
def get_connection_from_user_data(user_data: dict):
    return user_data["connection"]

# Helper to get account from user data
def get_account_from_user_data(user_data: dict):
    return user_data["account"]

@app.post(f"{API_PREFIX}/login", name="login")
def login(
   login_data: LoginRequestModel,
):
   """Login to Gradescope, with correct credentials

   Args:
       username (str): email address of user attempting to log in
       password (str): password of user attempting to log in
       two_factor_code (str, optional): 2FA code if required

   Raises:
       HTTPException: If the request to login fails, with a 404 Unauthorized Error status code and the error message "Account not found".
   """
   user_email = login_data.email
   password = login_data.password
   two_factor_code = login_data.two_factor_code

   try:
       # Create a new connection for this login
       user_connection = GSConnection()
       user_connection.login(user_email, password, two_factor_code)
       
       # Generate a unique session token
       session_token = str(uuid.uuid4())
       
       # Store the connection in the sessions dictionary
       user_sessions[session_token] = {
           "connection": user_connection,
           "account": user_connection.account,
           "last_active": datetime.now(),
           "email": user_email
       }
       
       return {
           "message": "Login successful", 
           "status_code": status.HTTP_200_OK,
           "session_token": session_token
       }
   except ValueError as e:
       raise HTTPException(status_code=404, detail=str(e))


@app.post(f"{API_PREFIX}/logout")
def logout(user_data: dict = Depends(get_current_user_data)):
    """Logout from Gradescope

    Removes the user's session from the server

    Returns:
        dict: Message indicating success
    """
    # Get the session token from headers
    session_token = next((k for k, v in user_sessions.items() if v == user_data), None)
    if session_token:
        del user_sessions[session_token]
    
    return {
        "message": "Logout successful",
        "status_code": status.HTTP_200_OK
    }


@app.post(f"{API_PREFIX}/courses", response_model=dict[str, dict[str, Course]])
def get_courses(user_data: dict = Depends(get_current_user_data)):
   """Get all courses for the user

   Args:
       account (Account): Account object containing the user's courses

   Returns:
       dict: dictionary of dictionaries

   Raises:
       HTTPException: If the request to get courses fails, with a 500 Internal Server Error status code and the error message.
   """
   try:
       account = get_account_from_user_data(user_data)
       course_list = account.get_courses()
       return course_list
   except RuntimeError as e:
       raise HTTPException(status_code=500, detail=str(e))


@app.post(f"{API_PREFIX}/course_users", response_model=list[Member])
def get_course_users(course_id: str, user_data: dict = Depends(get_current_user_data)):
   """Get all users for a course. ONLY FOR INSTRUCTORS.

   Args:
       course_id (str): The ID of the course.

   Returns:
       dict: dictionary of dictionaries

   Raises:
       HTTPException: If the request to get courses fails, with a 500 Internal Server Error status code and the error message.
   """
   try:
       account = get_account_from_user_data(user_data)
       course_list = account.get_course_users(course_id)
       print(course_list)
       return course_list
   except RuntimeError as e:
       raise HTTPException(status_code=500, detail=str(e))


@app.post(f"{API_PREFIX}/assignments", response_model=list[Assignment])
def get_assignments(course_id: str = None, user_data: dict = Depends(get_current_user_data)):
   """Get all assignments for a course.
   
   Args:
       course_id (str): The ID of the course (passed as query parameter)
       user_data (dict): User session data from dependency

   Returns:
       list: list of Assignment objects

   Raises:
       HTTPException: If the request to get assignments fails, with a 500 Internal Server Error status code and the error message.
       HTTPException: If course_id is missing, with a 422 Unprocessable Entity status code.
   """
   if not course_id:
       raise HTTPException(
           status_code=422,
           detail="course_id is required as a query parameter"
       )
   
   try:
       account = get_account_from_user_data(user_data)
       assignments = account.get_assignments(course_id)
       return assignments
   except RuntimeError as e:
       raise HTTPException(
           status_code=500, detail=f"Failed to get assignments. Error {e}"
       )


@app.post(f"{API_PREFIX}/assignment_submissions", response_model=dict[str, list[str]])
def get_assignment_submissions(
   course_id: str,
   assignment_id: str,
   user_data: dict = Depends(get_current_user_data)
):
   """Get all assignment submissions for an assignment. ONLY FOR INSTRUCTORS.

   Args:
       course_id (str): The ID of the course.
       assignment_id (str): The ID of the assignment.

   Returns:
       list: list of Assignment objects

   Raises:
       HTTPException: If the request to get assignments fails, with a 500 Internal Server Error status code and the error message.
   """
   try:
       account = get_account_from_user_data(user_data)
       assignment_list = account.get_assignment_submissions(
           course_id=course_id, assignment_id=assignment_id
       )
       return assignment_list
   except RuntimeError as e:
       raise HTTPException(
           status_code=500, detail=f"Failed to get assignments. Error: {e}"
       )


@app.post(f"{API_PREFIX}/single_assignment_submission", response_model=list[str])
def get_student_assignment_submission(
   student_email: str, course_id: str, assignment_id: str,
   user_data: dict = Depends(get_current_user_data)
):
   """Get a student's assignment submission. ONLY FOR INSTRUCTORS.

   Args:
       student_email (str): The email address of the student.
       course_id (str): The ID of the course.
       assignment_id (str): The ID of the assignment.

   Returns:
       dict: dictionary containing a list of student emails and their corresponding submission IDs

   Raises:
       HTTPException: If the request to get assignment submissions fails, with a 500 Internal Server Error status code and the error message.
   """
   try:
       account = get_account_from_user_data(user_data)
       assignment_submissions = account.get_assignment_submission(
           student_email=student_email,
           course_id=course_id,
           assignment_id=assignment_id,
       )
       return assignment_submissions
   except RuntimeError as e:
       raise HTTPException(
           status_code=500, detail=f"Failed to get assignment submissions. Error: {e}"
       )


@app.post(f"{API_PREFIX}/assignments/update_dates")
def update_assignment_dates(
   course_id: str,
   assignment_id: str,
   release_date: datetime,
   due_date: datetime,
   late_due_date: datetime,
   user_data: dict = Depends(get_current_user_data)
):
   """
   Update the release and due dates for an assignment. ONLY FOR INSTRUCTORS.

   Args:
       course_id (str): The ID of the course.
       assignment_id (str): The ID of the assignment.
       release_date (datetime): The release date of the assignment.
       due_date (datetime): The due date of the assignment.
       late_due_date (datetime): The late due date of the assignment.

   Notes:
       The timezone for dates used in Gradescope is specific to an institution. For example, for NYU, the timezone is America/New_York.
       For datetime objects passed to this function, the timezone should be set to the institution's timezone.

   Returns:
       dict: A dictionary with a "message" key indicating if the assignment dates were updated successfully.

   Raises:
       HTTPException: If the assignment dates update fails, with a 400 Bad Request status code and the error message "Failed to update assignment dates".
   """
   try:
       print(f"late due date {late_due_date}")
       connection = get_connection_from_user_data(user_data)
       success = update_assignment_date(
           session=connection.session,
           course_id=course_id,
           assignment_id=assignment_id,
           release_date=release_date,
           due_date=due_date,
           late_due_date=late_due_date,
       )
       if success:
           return {
               "message": "Assignment dates updated successfully",
               "status_code": status.HTTP_200_OK,
           }
       else:
           raise HTTPException(
               status_code=400, detail="Failed to update assignment dates"
           )
   except Exception as e:
       raise HTTPException(status_code=500, detail=str(e))


@app.post(f"{API_PREFIX}/assignments/extensions", response_model=dict)
def get_assignment_extensions(
    course_id: str, 
    assignment_id: str,
    user_data: dict = Depends(get_current_user_data)
):
   """
   Get all extensions for an assignment.

   Args:
       course_id (str): The ID of the course.
       assignment_id (str): The ID of the assignment.

   Returns:
       dict: A dictionary containing the extensions, where the keys are user IDs and the values are Extension objects.

   Raises:
       HTTPException: If the request to get extensions fails, with a 500 Internal Server Error status code and the error message.
   """
   try:
       connection = get_connection_from_user_data(user_data)
       extensions = get_extensions(
           session=connection.session,
           course_id=course_id,
           assignment_id=assignment_id,
       )
       return extensions
   except RuntimeError as e:
       raise HTTPException(status_code=500, detail=str(e))


@app.post(f"{API_PREFIX}/assignments/extensions/update")
def update_extension(
   course_id: str,
   assignment_id: str,
   user_id: str,
   release_date: datetime,
   due_date: datetime,
   late_due_date: datetime,
   user_data: dict = Depends(get_current_user_data)
):
   """
   Update the extension for a student on an assignment. ONLY FOR INSTRUCTORS.

   Args:
       course_id (str): The ID of the course.
       assignment_id (str): The ID of the assignment.
       user_id (str): The ID of the student.
       release_date (datetime): The release date of the extension.
       due_date (datetime): The due date of the extension.
       late_due_date (datetime): The late due date of the extension.

   Returns:
       dict: A dictionary with a "message" key indicating if the extension was updated successfully.

   Raises:
       HTTPException: If the extension update fails, with a 400 Bad Request status code and the error message.
       HTTPException: If a ValueError is raised (e.g., invalid date order), with a 400 Bad Request status code and the error message.
       HTTPException: If any other exception occurs, with a 500 Internal Server Error status code and the error message.
   """
   try:
       connection = get_connection_from_user_data(user_data)
       success = update_student_extension(
           session=connection.session,
           course_id=course_id,
           assignment_id=assignment_id,
           user_id=user_id,
           release_date=release_date,
           due_date=due_date,
           late_due_date=late_due_date,
       )
       if success:
           return {
               "message": "Extension updated successfully",
               "status_code": status.HTTP_200_OK,
           }
       else:
           raise HTTPException(status_code=400, detail="Failed to update extension")
   except ValueError as e:
       raise HTTPException(status_code=400, detail=str(e))
   except Exception as e:
       raise HTTPException(status_code=500, detail=str(e))


@app.post(f"{API_PREFIX}/assignments/upload")
def upload_assignment_files(
   course_id: str, 
   assignment_id: str, 
   leaderboard_name: str, 
   file: FileUploadModel,
   user_data: dict = Depends(get_current_user_data)
):
   """
   Upload files for an assignment.

   NOTE: This function within FastAPI is currently nonfunctional, as we did not
   find the datatype for file, which would allow us to upload a file via
   Postman. However, this functionality works correctly if a user
   runs this as a Python package.

   Args:
       course_id (str): The ID of the course on Gradescope.
       assignment_id (str): The ID of the assignment on Gradescope.
       leaderboard_name (str): The name of the leaderboard.
       file (FileUploadModel): The file object to upload.

   Returns:
       dict: A dictionary containing the submission link for the uploaded files.

   Raises:
       HTTPException: If the upload fails, with a 400 Bad Request status code and the error message "Upload unsuccessful".
       HTTPException: If any other exception occurs, with a 500 Internal Server Error status code and the error message.
   """
   try:
       connection = get_connection_from_user_data(user_data)
       submission_link = upload_assignment(
           session=connection.session,
           course_id=course_id,
           assignment_id=assignment_id,
           files=file,
           leaderboard_name=leaderboard_name,
       )
       if submission_link:
           return {"submission_link": submission_link}
       else:
           raise HTTPException(status_code=400, detail="Upload unsuccessful")
   except Exception as e:
       raise HTTPException(status_code=500, detail=str(e))

# This catch-all route should be at the very end
@app.get("/{full_path:path}")
async def serve_react(full_path: str):
   """Catch-all route to handle client-side routing in React"""
   # Skip API routes
   if full_path.startswith("api/"):
       raise HTTPException(status_code=404, detail="API endpoint not found")
   
   # If the frontend build exists, serve it
   if os.path.exists(frontend_build_dir):
       # Check if a file exists at the path
       file_path = os.path.join(frontend_build_dir, full_path)
       if os.path.exists(file_path) and os.path.isfile(file_path):
           return FileResponse(file_path)
       
       # Otherwise, serve index.html for client-side routing
       return FileResponse(os.path.join(frontend_build_dir, "index.html"))
   
   # If frontend build doesn't exist, fallback to static/index.html
   return FileResponse(os.path.join(static_dir, "index.html"))
"use strict";
(function() {
    // Track the current week we're viewing
    let currentWeekOffset = 0;
    // Store all assignments for navigation between weeks
    let allMissingAssignments = [];
    // Store stats by week
    let weeklyStats = new Map();
    // Storage key for credentials
    const STORAGE_KEY = 'dashboard_credentials';

    window.addEventListener('DOMContentLoaded', init);

    function init() {
        // Check for saved credentials and auto-login if available
        checkSavedCredentials();
        
        const loginButton = document.querySelector('#auth-form button');
        if (loginButton) {
            console.log("inside the loginButton");
            loginButton.onclick = function(event) {
                event.preventDefault();
                login(true); // true means "save credentials"
            };
        } else {
            console.error("Error: Login button not found.");
        }

        // Add event listener for logout button
        const logoutButton = document.getElementById('logout-btn');
        if (logoutButton) {
            logoutButton.addEventListener('click', logout);
        }

        // Add event listeners for week navigation
        const prevWeekBtn = document.getElementById('prev-week');
        const nextWeekBtn = document.getElementById('next-week');
        
        if (prevWeekBtn) {
            prevWeekBtn.addEventListener('click', showPreviousWeek);
        }
        
        if (nextWeekBtn) {
            nextWeekBtn.addEventListener('click', showNextWeek);
        }

        // Add event listener for the "Remember me" checkbox
        const rememberMeCheckbox = document.getElementById('remember-me');
        if (rememberMeCheckbox) {
            // Check if there are saved credentials and set checkbox accordingly
            const savedCredentials = getSavedCredentials();
            if (savedCredentials) {
                rememberMeCheckbox.checked = true;
            }
        }
    }

    function checkSavedCredentials() {
        const savedCredentials = getSavedCredentials();
        if (savedCredentials) {
            // Auto-login with saved credentials
            autoLogin(savedCredentials);
        }
    }

    function getSavedCredentials() {
        try {
            const credentials = localStorage.getItem(STORAGE_KEY);
            if (credentials) {
                return JSON.parse(credentials);
            }
        } catch (error) {
            console.error("Error reading saved credentials:", error);
            // Clear potentially corrupted data
            localStorage.removeItem(STORAGE_KEY);
        }
        return null;
    }

    function saveUserCredentials(email, password) {
        try {
            const credentials = {
                email: email,
                password: password,
                timestamp: new Date().toISOString()
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(credentials));
            console.log("Credentials saved successfully");
        } catch (error) {
            console.error("Error saving credentials:", error);
        }
    }

    function clearSavedCredentials() {
        localStorage.removeItem(STORAGE_KEY);
        console.log("Credentials cleared");
    }

    async function autoLogin(credentials) {
        try {
            // Fill login form with saved credentials (for visual feedback)
            const emailInput = document.getElementById('email');
            const passwordInput = document.getElementById('password');
            
            if (emailInput && passwordInput) {
                emailInput.value = credentials.email;
                passwordInput.value = credentials.password;
            }
            
            // Submit login with saved credentials
            await login(false); // false means "don't re-save credentials"
        } catch (error) {
            console.error("Auto-login failed:", error);
            // If auto-login fails, show the login form
            showLoginForm();
        }
    }

    function logout() {
        // Get the remember me checkbox status
        const rememberMeCheckbox = document.getElementById('remember-me');
        const shouldRemember = rememberMeCheckbox ? rememberMeCheckbox.checked : false;
        
        // If not checked, clear credentials
        if (!shouldRemember) {
            clearSavedCredentials();
        }
        
        // Show login form, hide dashboard
        showLoginForm();
        
        // Reset data
        allMissingAssignments = [];
        weeklyStats.clear();
        currentWeekOffset = 0;
    }

    function showLoginForm() {
        document.getElementById('login-container').style.display = 'block';
        document.getElementById('dashboard-container').style.display = 'none';
    }

    function showDashboard() {
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('dashboard-container').style.display = 'block';
    }

    function showPreviousWeek() {
        if (currentWeekOffset > 0) {
            currentWeekOffset--;
            updateWeekView();
        }
    }

    function showNextWeek() {
        const maxWeeks = getMaxWeeks();
        if (currentWeekOffset < maxWeeks - 1) {
            currentWeekOffset++;
            updateWeekView();
        }
    }

    function getMaxWeeks() {
        if (allMissingAssignments.length === 0) return 1;
        
        const today = new Date();
        const latestAssignment = allMissingAssignments[allMissingAssignments.length - 1];
        const diffTime = Math.abs(latestAssignment.dueDate - today);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return Math.ceil(diffDays / 7) + 1; // Add 1 for current week
    }

    function updateWeekView() {
        // Update the week title
        updateWeekTitle();
        
        // Get assignments for the selected week
        const weekAssignments = getAssignmentsForWeek(currentWeekOffset);
        
        // Get stats for the selected week
        const stats = weeklyStats.get(currentWeekOffset) || {
            totalAssignments: 0,
            submittedAssignments: 0,
            submissionRate: 0
        };
        
        // Update the dashboard with the week's assignments and stats
        updateDashboardForWeek(stats, weekAssignments);
        
        // Update navigation button states
        updateNavigationButtons();
    }

    function updateWeekTitle() {
        const weekTitleElement = document.getElementById('week-title');
        if (weekTitleElement) {
            if (currentWeekOffset === 0) {
                weekTitleElement.textContent = 'This Week';
            } else if (currentWeekOffset === 1) {
                weekTitleElement.textContent = 'Next Week';
            } else {
                const today = new Date();
                const futureDate = new Date(today);
                futureDate.setDate(today.getDate() + (currentWeekOffset * 7));
                
                const startOfWeek = new Date(futureDate);
                startOfWeek.setDate(futureDate.getDate() - futureDate.getDay());
                
                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 6);
                
                const startFormatted = startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const endFormatted = endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                
                weekTitleElement.textContent = `${startFormatted} - ${endFormatted}`;
            }
        }
    }
    
    function updateNavigationButtons() {
        const prevWeekBtn = document.getElementById('prev-week');
        const nextWeekBtn = document.getElementById('next-week');
        
        if (prevWeekBtn) {
            prevWeekBtn.disabled = currentWeekOffset === 0;
            prevWeekBtn.classList.toggle('disabled', currentWeekOffset === 0);
        }
        
        if (nextWeekBtn) {
            const maxWeeks = getMaxWeeks();
            const isLastWeek = currentWeekOffset >= maxWeeks - 1;
            nextWeekBtn.disabled = isLastWeek;
            nextWeekBtn.classList.toggle('disabled', isLastWeek);
        }
    }

    async function login(saveCredentials = true) {
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const rememberMeCheckbox = document.getElementById('remember-me');

        if (!emailInput || !passwordInput) {
            console.error("Error: Email or password input fields not found.");
            return;
        }

        const email = emailInput.value; // Use .value to get input content
        const password = passwordInput.value; // Use .value to get input content
        const rememberMe = rememberMeCheckbox ? rememberMeCheckbox.checked : false;

        try {
            const url = "http://localhost:8000";
            const request = await fetch(url + '/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    "email": email,
                    "password": password
                })
            });
            if (!request.ok) {
                const errorMessage = await request.text(); // Get error message from response
                throw new Error(`Login failed: ${errorMessage} (Status: ${request.status})`);
            }
            const data = await request.json(); // Assuming the server returns JSON on success
            
            // Save credentials if the "Remember me" checkbox is checked
            if (saveCredentials && rememberMe) {
                saveUserCredentials(email, password);
            } else if (!rememberMe && saveCredentials) {
                // If "Remember me" is unchecked, clear any saved credentials
                clearSavedCredentials();
            }
            
            // Show dashboard, hide login form
            showDashboard();
            
            // Load classes and assignments
            getClasses();
        } catch (error) {
            console.error("Login error:", error);
            // Optionally, display an error message to the user
            alert("Login failed: " + error.message);
        }
    }

    async function getClasses() {
        let data;
        try {
            const url = "http://localhost:8000";
            const request = await fetch(url + "/courses", {
                method: "POST",
            });
            if (!request.ok) {
                const errorMessage = await request.text();
                throw new Error(`Failed getting classes: ${errorMessage}`);
            }
            console.log("parsing data");
            data = await request.json();
            console.log("Raw classes data:", data);
            if (data && data.student) {
                const currentQuarterClasses = filterCurrentQuarterClasses(data.student);
                console.log("Current quarter class IDs:", currentQuarterClasses);
                // You can now use currentQuarterClasses to update your UI
                
                // Add await here since getAssignments is async
                const assignments = await getAssignments(currentQuarterClasses);
                console.log("Assignments:", assignments);
            } else {
                console.warn("The 'student' property was not found in the /courses response.");
            }
        } catch (error) {
            console.error(error);
        }
    }

    async function getAssignments(classes) {
        // we will store things in <classId, {data}>
        let map = new Map();
        
        for (const currClass of classes) {
          try {
            const url = "http://localhost:8000";
            // Change to use URL parameters instead of JSON body
            const response = await fetch(`${url}/assignments?course_id=${currClass}`, {
              method: "POST",
              headers: {
                'Content-Type': 'application/json'
              }
              // No body needed here as we're using query parameters
            });
            
            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`Failure getting class assignments: ${response.status} - ${errorText}`);
            }
            
            const data = await response.json();
            map.set(currClass, data);
          } catch(error) {
            console.error(`Error fetching assignments for class ${currClass}:`, error);
          }
        }
        
        // Process all assignments after fetching them
        if (map.size > 0) {
            processAssignments(map);
        }
        
        return map;
    }

    function processAssignments(map) {
        // Calculate overall stats for all assignments
        const stats = calculateSubmissionStats(map);
        
        // Get all missing assignments and sort by due date
        allMissingAssignments = getMissingAssignmentsByDueDate(map);
        
        // Group assignments by week and calculate weekly stats
        calculateWeeklyStats();
        
        // Reset to current week view
        currentWeekOffset = 0;
        updateWeekView();
        
        console.log(`Overall submission rate: ${stats.submissionRate}%`);
        console.log("Missing assignments:", allMissingAssignments);
        console.log("Weekly stats:", weeklyStats);
    }

    function calculateWeeklyStats() {
        // Clear previous stats
        weeklyStats.clear();
        
        // Group assignments by week
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Process all missing assignments
        allMissingAssignments.forEach(item => {
            const dueDate = new Date(item.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            
            // Calculate which week this assignment belongs to
            const diffTime = Math.abs(dueDate - today);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const weekOffset = Math.floor(diffDays / 7);
            
            // Initialize this week's stats if it doesn't exist
            if (!weeklyStats.has(weekOffset)) {
                weeklyStats.set(weekOffset, {
                    totalAssignments: 0,
                    submittedAssignments: 0,
                    submissionRate: 0,
                    assignments: [],
                    assignmentsByDay: {
                        Sunday: [],
                        Monday: [],
                        Tuesday: [],
                        Wednesday: [],
                        Thursday: [],
                        Friday: [],
                        Saturday: []
                    }
                });
            }
            
            // Get this week's stats
            const weekStats = weeklyStats.get(weekOffset);
            
            // Add this assignment to the week
            weekStats.assignments.push(item);
            weekStats.totalAssignments++;
            
            // Also add it to the correct day of the week
            const dayOfWeek = dueDate.toLocaleDateString('en-US', { weekday: 'long' });
            if (weekStats.assignmentsByDay[dayOfWeek]) {
                weekStats.assignmentsByDay[dayOfWeek].push(item);
            }
            
            // Update the week's stats
            weekStats.submissionRate = ((weekStats.submittedAssignments / weekStats.totalAssignments) * 100).toFixed(2);
        });
    }

    function getAssignmentsForWeek(weekOffset) {
        // Get assignments for the specified week
        return weeklyStats.has(weekOffset) ? 
            weeklyStats.get(weekOffset).assignments : [];
    }

    function getAssignmentsByDayForWeek(weekOffset) {
        // Get assignments organized by day for the specified week
        return weeklyStats.has(weekOffset) ? 
            weeklyStats.get(weekOffset).assignmentsByDay : null;
    }

    function updateDashboardForWeek(stats, assignments) {
        // Update submission rate in the donut chart
        const submissionRateElement = document.getElementById('submission-rate');
        if (submissionRateElement) {
            submissionRateElement.textContent = `${stats.submissionRate}%`;
        }
        
        // Update submission stats count
        const statsElement = document.getElementById('submission-stats');
        if (statsElement) {
            statsElement.textContent = `${stats.submittedAssignments}/${stats.totalAssignments}`;
        }
        
        // Update the donut chart visualization
        updateDonutChart(stats.submissionRate);
        
        // Get assignments organized by day
        const assignmentsByDay = getAssignmentsByDayForWeek(currentWeekOffset);
        
        // Update missing assignments list
        const listElement = document.getElementById('missing-assignments');
        if (listElement) {
            // Clear existing content
            listElement.innerHTML = '';
            
            if (assignments.length === 0) {
                listElement.innerHTML = '<div class="assignment-item"><p>No assignments due this week!</p></div>';
            } else {
                // Create sections for each day of the week
                const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                
                days.forEach(day => {
                    const dayAssignments = assignmentsByDay[day];
                    
                    // Only create a section if there are assignments for this day
                    if (dayAssignments && dayAssignments.length > 0) {
                        // Create day header
                        const dayHeader = document.createElement('div');
                        dayHeader.classList.add('day-header');
                        dayHeader.textContent = day;
                        listElement.appendChild(dayHeader);
                        
                        // Create list items for each assignment this day
                        dayAssignments.forEach(item => {
                            // Create assignment element
                            const assignmentEl = document.createElement('div');
                            assignmentEl.classList.add('assignment-item');
                            
                            // Create icon element
                            const iconEl = document.createElement('div');
                            iconEl.classList.add('assignment-icon');
                            iconEl.innerHTML = '<i class="icon-assignment"></i>';
                            
                            // Create details element
                            const detailsEl = document.createElement('div');
                            detailsEl.classList.add('assignment-details');
                            
                            // Create class name element
                            const classNameEl = document.createElement('div');
                            classNameEl.classList.add('class-name');
                            classNameEl.textContent = `Class ID: ${item.classId}`;
                            
                            // Create course element
                            const courseEl = document.createElement('h3');
                            courseEl.textContent = `${item.assignment.name}`;
                            
                            // Format due date for display
                            const dueDate = item.dueDate.toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            });
                            
                            // Create due date element
                            const dueDateEl = document.createElement('p');
                            dueDateEl.innerHTML = `Due ${dueDate} | <span>${item.assignment.max_grade || 100} points</span>`;
                            
                            // Create action element
                            const actionEl = document.createElement('div');
                            actionEl.classList.add('assignment-action');
                            actionEl.innerHTML = '<i class="icon-check"></i>';
                            
                            // Append elements
                            detailsEl.appendChild(classNameEl);
                            detailsEl.appendChild(courseEl);
                            detailsEl.appendChild(dueDateEl);
                            assignmentEl.appendChild(iconEl);
                            assignmentEl.appendChild(detailsEl);
                            assignmentEl.appendChild(actionEl);
                            listElement.appendChild(assignmentEl);
                        });
                    }
                });
            }
        }
        
        // Update due status
        updateDueStatus(assignments);
    }

    function calculateSubmissionStats(map) {
        let totalAssignments = 0;
        let submittedAssignments = 0;
        
        // Iterate through each class and its assignments
        for (const [classId, data] of map) {
            if (Array.isArray(data)) {
                totalAssignments += data.length;
                
                // Count submitted assignments
                const submitted = data.filter(assignment => 
                    assignment.submissions_status === "Submitted"
                ).length;
                
                submittedAssignments += submitted;
            }
        }
        
        // Calculate submission rate as percentage
        const submissionRate = totalAssignments > 0 
            ? ((submittedAssignments / totalAssignments) * 100).toFixed(2) 
            : 0;
            
        return {
            totalAssignments: totalAssignments,
            submittedAssignments: submittedAssignments,
            submissionRate: submissionRate
        };
    }

    function getMissingAssignmentsByDueDate(map) {
        const missingAssignments = [];
        
        // Collect all missing assignments from all classes
        for (const [classId, data] of map) {
            if (Array.isArray(data)) {
                data.forEach(assignment => {
                    if (assignment.submissions_status !== "Submitted") {
                        missingAssignments.push({
                            classId: classId,
                            assignment: assignment,
                            dueDate: new Date(assignment.due_date)
                        });
                    }
                });
            }
        }
        
        // Sort by due date (closest first)
        return missingAssignments.sort((a, b) => a.dueDate - b.dueDate);
    }

    function getFormattedDueDate(dueDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const dueDateCopy = new Date(dueDate);
        dueDateCopy.setHours(0, 0, 0, 0);
        
        if (dueDateCopy.getTime() === today.getTime()) {
            return 'Today';
        } else if (dueDateCopy.getTime() === tomorrow.getTime()) {
            return 'Tomorrow';
        } else {
            // Get day of week
            return dueDateCopy.toLocaleDateString('en-US', { weekday: 'long' });
        }
    }

    function updateDonutChart(percentage) {
        // Get the donut chart element
        const donutChart = document.querySelector('.donut-chart');
        
        // Create CSS for the donut chart with the given percentage
        if (donutChart) {
            // Convert the percentage to a CSS conic-gradient
            // For a donut chart, we start from the top (270deg) and go clockwise
            const degree = (percentage / 100) * 360;
            
            // Set the background with conic-gradient
            if (percentage > 0) {
                donutChart.style.background = `conic-gradient(
                    #3498db ${degree}deg, 
                    #e1e5eb ${degree}deg 360deg
                )`;
            } else {
                donutChart.style.background = '#e1e5eb';
            }
        }
    }

    function updateDueStatus(assignments) {
        const dueStatusElement = document.getElementById('due-status');
        
        if (dueStatusElement) {
            if (assignments.length === 0) {
                dueStatusElement.textContent = 'No assignments due';
                return;
            }
            
            // Count assignments by day
            const assignmentsByDay = new Map();
            
            assignments.forEach(item => {
                const dueDateText = getFormattedDueDate(item.dueDate);
                
                if (!assignmentsByDay.has(dueDateText)) {
                    assignmentsByDay.set(dueDateText, 0);
                }
                
                assignmentsByDay.set(dueDateText, assignmentsByDay.get(dueDateText) + 1);
            });
            
            // Create a summary text
            let statusText = '';
            
            if (currentWeekOffset === 0) {
                // For current week, be more specific
                if (assignmentsByDay.has('Today')) {
                    const count = assignmentsByDay.get('Today');
                    statusText = `${count} due Today`;
                } else if (assignmentsByDay.has('Tomorrow')) {
                    const count = assignmentsByDay.get('Tomorrow');
                    statusText = `${count} due Tomorrow`;
                } else {
                    // Find the closest day
                    const firstAssignment = assignments[0];
                    const dueDateText = getFormattedDueDate(firstAssignment.dueDate);
                    const count = assignmentsByDay.get(dueDateText);
                    statusText = `${count} due ${dueDateText}`;
                }
            } else {
                // For future weeks, summarize
                statusText = `${assignments.length} assignments`;
            }
            
            dueStatusElement.textContent = statusText;
        }
    }

    function isSameDay(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }

    function filterCurrentQuarterClasses(coursesData) {
        console.log("Inside filtering")
        let currClasses = [];
        const courseArray = Object.keys(coursesData);
        let currQuarter = '';
        let currYear = '';
        // best case scenario: O(1), worst case: O(n)
        for (let i = courseArray.length - 1; i >= 0; i--) {
            const courseId = courseArray[i];
            // gets the current class
            const courseData = coursesData[courseId];
            const semester = courseData.semester;
            const year = courseData.year;
            if (currQuarter === "" && currYear === '') {
                currQuarter = semester
                currYear = year;
            } else if (currQuarter !== semester || currYear !== year) {
                break;
            }
            currClasses.push(courseId);
        }
        return currClasses;
    }
})();
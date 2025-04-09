"use strict";
(function() {

    window.addEventListener('DOMContentLoaded', init);

    function init() {
        const loginButton = document.querySelector('#auth-form button');
        if (loginButton) {
            console.log("inside the loginButton")
            loginButton.onclick = function(event) {
                event.preventDefault();
                console.log("preventDefault() called via onclick");
                login();
            };
        } else {
            console.error("Error: Login button not found.");
        }
    }

    async function login() {
        console.log("Inside the login function")
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');

        if (!emailInput || !passwordInput) {
            console.error("Error: Email or password input fields not found.");
            return;
        }

        const email = emailInput.value; // Use .value to get input content
        const password = passwordInput.value; // Use .value to get input content

        try {
            console.log("Inside the try")
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
            console.log("Processed the fetch")
            if (!request.ok) {
                const errorMessage = await request.text(); // Get error message from response
                throw new Error(`Login failed: ${errorMessage} (Status: ${request.status})`);
            }
            console.log("Passed the !request.ok")
            const data = await request.json(); // Assuming the server returns JSON on success
            console.log("Login successful:", data);
            // Optionally, redirect the user or update the UI here
            getClasses();
        } catch (error) {
            console.error("Login error:", error);
            // Optionally, display an error message to the user
        }
    }

    async function getClasses() {
        console.log("Inside getClasses")
        try {
            const url = "http://localhost:8000";
            const request = await fetch(url + "/courses", {
                method: "POST",
            })
            if (!request.ok) {
                const errorMessage = await request.text();
                throw new Error("Failed getting classes:  ${errorMessage}")
            }
            const data = await request.json();
            console.log(data);
        } catch(error) {

        }
    }

    function id(name) {
        return document.getElementById(name);
    }

    function qs(name) {
        return document.querySelector(name);
    }

    function qsa(name) {
        return document.querySelectorAll(name);
    }
})();
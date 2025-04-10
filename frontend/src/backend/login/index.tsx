import { id } from '../reusableDomFunctions/index';
import url from '../url';

interface LoginResponse {
    status_code: number;
    message: string;
}

export default async function Login() {
    // grab the values of the email and password
    try {
        const emailElement = id('email') as HTMLInputElement | null;
        const passwordElement = id('password') as HTMLInputElement | null;
        
        if (!emailElement || !passwordElement) {
            throw new Error("Missing email or password elements");
        }
        
        // Extract the input values, not the elements themselves
        const email = emailElement.value;
        const password = passwordElement.value;
        
        // Add validation if needed
        if (!email || !password) {
            throw new Error("Email and password cannot be empty");
        }
        
        // Login is a post request that requires both email and password

        const response = await fetch(url + "login", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'  // Added content type header
            },
            body: JSON.stringify({
                email,
                password
            })
        });
        
        if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
        }

        const data: LoginResponse = await response.json();
        console.log(data); // Use the data or handle it as needed
        if (data.status_code === 200 && data.message === "Login successful") {
            localStorage.setItem('isLoggedIn', 'true');
        } else {
            throw new Error("Login failed: " + data.message);
        }
        return data; // It's usually good to return the data
        
    } catch (error) {
        console.error("Login error:", error);
        throw error;
    }
}
import { id } from '../reusableDomFunctions/index';
import url from '../url';

interface LoginResponse {
    status_code: number;
    message: string;
}

export default async function Login() {
    try {
        const emailElement = id('email') as HTMLInputElement | null;
        const passwordElement = id('password') as HTMLInputElement | null;
        
        if (!emailElement || !passwordElement) {
            throw new Error("Missing email or password elements");
        }
        
        const email = emailElement.value;
        const password = passwordElement.value;
        
        if (!email || !password) {
            throw new Error("Email and password cannot be empty");
        }
        
        const response = await fetch(`${url}/login`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                password
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            const errorMessage = errorData?.detail || `Request failed with status ${response.status}`;
            throw new Error(errorMessage);
        }

        const data: LoginResponse = await response.json();
        
        if (data.status_code === 200 && data.message === "Login successful") {
            localStorage.setItem('isLoggedIn', 'true');
            return data;
        } else {
            throw new Error("Login failed: " + data.message);
        }
        
    } catch (error) {
        console.error("Login error:", error);
        throw error;
    }
}
import { useState, useEffect } from 'react';
import apiLink from './apiLink';

export default function Login() {
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);
    const [action, setAction] = useState<boolean>(false);
    const [loggedIn, setLoggedIn] = useState<boolean>(false);

    useEffect(() => {
        // Check if user is already logged in
        const isLoggedIn = localStorage.getItem("log in") === 'true';
        if (isLoggedIn) {
            setLoggedIn(true);
        }
    }, []);

    useEffect(() => {
        if (!action) return;
        
        setLoading(true);
        setError(null);
        const controller: AbortController = new AbortController();

        // check if we have the email and password
        const email: string = (document.getElementById('email') as HTMLInputElement)?.value;
        const password: string = (document.getElementById('password') as HTMLInputElement)?.value;

        if (!email || !password) {
            setError(new Error("Missing email or password"));
            setLoading(false);
            setAction(false);
            return;
        }

        const login = async () => {
            try {
                const response: Response = await fetch(apiLink + '/login', {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email,
                        password
                    }),
                    signal: controller.signal,
                });
                
                if (!response.ok) {
                    throw new Error("Error signing into Gradescope");
                }
                
                localStorage.setItem('log in', 'true');
                setLoggedIn(true);
            } catch (error) {
                if (error instanceof Error && error.name !== 'AbortError') {
                    setError(error);
                }
            } finally {
                setLoading(false);
                setAction(false);
            }
        };
        
        login();
        
        return () => {
            controller.abort();
        };
    }, [action]);

    if (loggedIn) {
        return null; // Return null instead of empty return
    }

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        setAction(true);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900">Log Into Gradescope</h1>
                    <p className="mt-2 text-sm text-gray-600">Enter your credentials to access your account</p>
                </div>
                
                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 my-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-red-700">{error.message}</p>
                            </div>
                        </div>
                    </div>
                )}
                
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email
                            </label>
                            <div className="mt-1">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                            </div>
                        </div>
                        
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Password
                            </label>
                            <div className="mt-1">
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                                loading ? "opacity-80 cursor-not-allowed" : ""
                            }`}
                        >
                            {loading ? (
                                <span className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Logging in...
                                </span>
                            ) : (
                                "Log In"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
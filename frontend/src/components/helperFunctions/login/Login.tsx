import { Dispatch, SetStateAction } from 'react';
import Login from '../../../backend/login';

const handleLogin = async (
  e: React.FormEvent,
  email: string,
  password: string,
  setLoading: Dispatch<SetStateAction<boolean>>,
  setError: Dispatch<SetStateAction<string | null>>,
  setIsLoggedIn: Dispatch<SetStateAction<boolean>>
) => {
  e.preventDefault();
  setLoading(true);
  setError(null);

  try {
    const response = await fetch('http://localhost:8000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.detail || 'Login failed. Please try again.');
    }

    const data = await response.json();
    if (data.status_code === 200 && data.message === "Login successful") {
      setIsLoggedIn(true);
      localStorage.setItem('isLoggedIn', 'true');
    } else {
      throw new Error(data.message || 'Login failed. Please try again.');
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Login failed. Please try again.';
    setError(errorMessage);
    console.error(err);
  } finally {
    setLoading(false);
  }
};

export default handleLogin;
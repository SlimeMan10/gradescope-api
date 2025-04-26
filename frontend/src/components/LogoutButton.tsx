import { useState } from 'react';
import { fetchWithAuth } from './apiUtils';

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    
    try {
      // Call the logout endpoint
      await fetchWithAuth('/logout', {
        method: 'POST'
      });
      
      // Clear local storage regardless of server response
      localStorage.removeItem('log in');
      localStorage.removeItem('session_token');
      
      // Reload the page to show login screen
      window.location.reload();
    } catch (error) {
      console.error('Logout error:', error);
      
      // Even if the API call fails, log out locally
      localStorage.removeItem('log in');
      localStorage.removeItem('session_token');
      window.location.reload();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="absolute top-4 right-4 px-4 py-2 bg-purple-800 text-white rounded-md
                hover:bg-purple-700 transition-all duration-300 transform hover:scale-105
                shadow-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
      aria-label="Logout from account"
    >
      {loading ? 'Logging out...' : 'Logout'}
    </button>
  );
}
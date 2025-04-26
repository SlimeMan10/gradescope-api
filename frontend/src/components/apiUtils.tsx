// apiUtils.ts - Simplified version
import apiLink from './apiLink';

// Helper function to make authenticated API requests
export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const sessionToken = localStorage.getItem('session_token');
  
  if (!sessionToken) {
    throw new Error('No session token found');
  }
  
  // Add session token to headers
  const headers = {
    ...options.headers,
    'session_token': sessionToken,
    'Content-Type': 'application/json'
  };
  
  // Construct the full URL
  const url = endpoint.startsWith('/') 
    ? `${apiLink}${endpoint}` 
    : `${apiLink}/${endpoint}`;
  
  // Make the request with updated headers
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  // Handle 401 errors (invalid or expired session)
  if (response.status === 401) {
    // Clear login state and reload
    localStorage.removeItem('log in');
    localStorage.removeItem('session_token');
    window.location.reload();
    throw new Error('Session expired. Please log in again.');
  }
  
  return response;
}
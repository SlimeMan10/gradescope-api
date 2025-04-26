import apiLink from './apiLink';

// Helper function to make authenticated API requests
export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const sessionToken = localStorage.getItem('session_token');
  
  if (!sessionToken) {
    console.error("No session token found in localStorage");
    localStorage.removeItem('log in');
    window.location.reload();
    throw new Error('No session token found');
  }
  
  console.log(`Making authenticated request to: ${apiLink}${endpoint}`);
  
  // Add session token to headers
  const headers = {
    ...options.headers,
    'Content-Type': 'application/json',
    'session-token': sessionToken, // Use kebab-case header name
    'Session-Token': sessionToken  // Try alternative casing as backup
  };
  
  // Construct the full URL
  const url = endpoint.startsWith('/') 
    ? `${apiLink}${endpoint}` 
    : `${apiLink}/${endpoint}`;
  
  try {
    // Make the request with updated headers
    const response = await fetch(url, {
      ...options,
      headers,
    });
    
    // Log the response status
    console.log(`API Response: ${response.status} for ${url}`);
    
    // Handle 401 errors (invalid or expired session)
    if (response.status === 401) {
      console.error("Session expired or invalid");
      localStorage.removeItem('log in');
      localStorage.removeItem('session_token');
      window.location.reload();
      throw new Error('Session expired. Please log in again.');
    }
    
    return response;
  } catch (error) {
    console.error(`Request failed for ${url}:`, error);
    throw error;
  }
}
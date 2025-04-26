// apiUtils.ts
import apiLink from './apiLink';

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const sessionToken = localStorage.getItem('session_token');
  
  if (!sessionToken) {
    console.error("No session token found");
    localStorage.removeItem('log in');
    window.location.reload();
    throw new Error('No session token found');
  }
  
  console.log(`Making request to ${apiLink}${endpoint} with token: ${sessionToken.substring(0, 8)}...`);
  
  // Create headers with all possible token formats
  const headers = {
    ...options.headers,
    'Content-Type': 'application/json',
    'session_token': sessionToken,         // underscore format
    'session-token': sessionToken,         // hyphen format
    'sessiontoken': sessionToken,          // no separator
    'Session-Token': sessionToken,         // capitalized
    'Authorization': `Bearer ${sessionToken}` // Bearer format
  };
  
  // Construct the full URL
  const url = endpoint.startsWith('/') 
    ? `${apiLink}${endpoint}` 
    : `${apiLink}/${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });
    
    console.log(`Response from ${endpoint}: ${response.status}`);
    
    if (response.status === 401) {
      console.error("Unauthorized access - token might be invalid");
      localStorage.removeItem('log in');
      localStorage.removeItem('session_token');
      window.location.reload();
      throw new Error('Session expired. Please log in again.');
    }
    
    return response;
  } catch (error) {
    console.error(`Request failed:`, error);
    throw error;
  }
}
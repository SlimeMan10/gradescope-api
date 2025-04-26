// apiUtils.ts
import apiLink from './apiLink';

const MAX_RETRIES = 2;
const RETRY_DELAY = 100; // milliseconds

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}, retryCount = 0) {
  const sessionToken = localStorage.getItem('session_token');
  
  if (!sessionToken) {
    console.error("No session token found");
    localStorage.removeItem('log in');
    window.location.reload();
    throw new Error('No session token found');
  }
  
  console.log(`Making request to ${apiLink}${endpoint} with token: ${sessionToken.substring(0, 8)}... (attempt ${retryCount + 1}/${MAX_RETRIES})`);
  
  // Create headers with session token
  const headers = {
    ...options.headers,
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${sessionToken}`,
    'session_token': sessionToken
  };
  
  // Construct the full URL
  const url = endpoint.startsWith('/') 
    ? `${apiLink}${endpoint}` 
    : `${apiLink}/${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
      mode: 'cors'
    });
    
    console.log(`Response from ${endpoint}: ${response.status}`);
    
    if (response.status === 401 && retryCount < MAX_RETRIES - 1) {
      console.log(`Retrying request after ${RETRY_DELAY}ms...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return fetchWithAuth(endpoint, options, retryCount + 1);
    }
    
    if (response.status === 401 && retryCount >= MAX_RETRIES - 1) {
      console.error("Max retries reached - session might be invalid");
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
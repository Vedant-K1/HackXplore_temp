import axios from 'axios';
import { ChatState } from '../contexts/chatProvider'; // Adjust path if needed

// Base URL of your Flask backend
const API_BASE_URL = "/api";

// Create an Axios instance with consistent credentials handling
const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,  // Critical for sending cookies
    headers: {
      'Content-Type': 'application/json',
      // 'Access-Control-Allow-Credentials': 'true'
      // 'X-Requested-With': 'XMLHttpRequest'  
    }
  });
  

// Add an interceptor to check for 401 errors and handle them
api.interceptors.request.use(
  config => {
    console.log('Sending request:', config.url, 'with credentials:', config.withCredentials);
    return config;
  },
  error => Promise.reject(error)
);

api.interceptors.response.use(
  response => {
    // console.log('Response cookies:', document.cookie);
    return response;
  },
  error => {
    if (error.response && error.response.status === 401) {
      console.error("Unauthorized access - session may have expired");
    }
    return Promise.reject(error);
  }
);

// Helper function to get the correct API endpoint prefix
export const getApiEndpoint = (basePath, user) => {
    let k;
    if(user["user_info"]) k = user["user_info"]
    else k = user
    
  if (!k || !k.type) {
    console.error("User type not available for API endpoint construction.");
    return null;
  }
  
  const formattedBasePath = basePath.startsWith('/') ? basePath : `/${basePath}`;
  console.log(`/${k.type}${formattedBasePath}`)
  return `/${k.type}${formattedBasePath}`;
};

export default api;

// import axios from 'axios';
// import { ChatState } from '../context/chatProvider'; // Adjust path if needed

// // Base URL of your Flask backend
// const API_BASE_URL = "http://127.0.0.1:5000";

// // Create an Axios instance
// const api = axios.create({
//   baseURL: API_BASE_URL,
//   withCredentials: true, // Send cookies with requests (essential for Flask sessions)
// });

// // Helper function to get the correct API endpoint prefix
// export const getApiEndpoint = (basePath, user) => {
//     let k;
//     if(user["user_info"]) k = user["user_info"]
//     else k = user
//     console.log("vvvv",user)
//   if (!k || !k.type) {
//     console.error("User type not available for API endpoint construction.");
//     // Handle this error appropriately - maybe redirect to login or throw an error
//     // For now, returning null or a default might prevent immediate crashes elsewhere
//     return null;
//     // throw new Error("User type unavailable");
//   }
//   // Ensure basePath starts with a slash if it doesn't already
//   const formattedBasePath = basePath.startsWith('/') ? basePath : `/${basePath}`;
//   return `${k.type}${formattedBasePath}`;
// };


// export default api; // Export the configured Axios instance


// --- Usage Example (in another component) ---
// import api, { getApiEndpoint } from '../config/api';
// import { ChatState } from '../context/chatProvider';
//
// function MyComponent() {
//   const { user } = ChatState();
//
//   const fetchData = async () => {
//      if (!user) return; // Make sure user is available
//      const endpoint = getApiEndpoint('/chats', user); // e.g., /student/chats or /teacher/chats
//      if (!endpoint) return; // Handle error if endpoint couldn't be constructed
//
//      try {
//          const { data } = await api.get(endpoint); // Use the configured 'api' instance
//          // ... process data
//      } catch (error) {
//          // ... handle error
//      }
//   }
//   // ...
// }
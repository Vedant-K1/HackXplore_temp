import { createContext, useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
const chatContext = createContext();

const ChatProvider = ({ children }) => {
  const [user, setUser] = useState({});
  const [selectedChat, setSelectedChat] = useState();
  const [chats, setChats] = useState();
  const [notification, setNotification] = useState([]);

  // useEffect(() => {
  //   const userInfo = JSON.parse(localStorage.getItem("userInfo"));
  //   setUser(userInfo);
  // }, []);
  useEffect(() => {
    try {
      const storedUserInfo = localStorage.getItem("userInfo");
      if (storedUserInfo) {
         const parsedUserInfo = JSON.parse(storedUserInfo);
         // Basic check if it looks like the correct user object
         if (parsedUserInfo && parsedUserInfo._id && parsedUserInfo.type) {
            setUser(parsedUserInfo);
         } else {
            console.warn("Invalid user info found in localStorage.");
            localStorage.removeItem("userInfo"); // Clean up invalid data
            // Optional: navigate('/login');
         }
      } else {
         // Optional: navigate('/login'); // Redirect if no user info
      }
    } catch (error) {
        console.error("Error parsing user info from localStorage:", error);
        localStorage.removeItem("userInfo"); // Clean up corrupted data
        // Optional: navigate('/login');
    }
    // Add dependencies if needed, but usually runs once on mount
  }, []); 

  return (
    <chatContext.Provider
      value={{
        user,
        setUser,
        selectedChat,
        setSelectedChat,
        chats,
        setChats,
        notification,
        setNotification,
      }}
    >
      {children}
    </chatContext.Provider>
  );
};

export const ChatState = () => {
  return useContext(chatContext);
};

export default ChatProvider;

import { useState, useEffect,useRef } from "react";
import { ChatState } from "../../../contexts/chatProvider";
import {
  Box,
  Text,
  IconButton,
  Spinner,
  FormControl,
  Input,
  useToast,
} from "@chakra-ui/react";
import { ArrowBackIcon } from "@chakra-ui/icons";
import { getSender, getSenderFull } from "../../../config/ChatLogix";
import ProfileModal from "../../Chat/ProfileModal";
import UpdateGroupChatModal from "../components/UpdateGroupChatModal";
import axios from "axios";
import "./style.css";
import ScrollableChat from "./ScrollableChat";
import io from "socket.io-client";
import animationData from "../../../../animations/typins.json";
import Lottie from "react-lottie";
import api, { getApiEndpoint } from "../../../config/api"; // Import helpers


const ENDPOINT = "http://127.0.0.1:5000";
var socket, selectedChatCompare;

const SingleChat = ({ fetchAgain, setFetchAgain }) => {
  const { user, selectedChat, setSelectedChat, notification, setNotification,chats,setChats } =
    ChatState();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState();
  const toast = useToast();
  const [socketConneted, setSocketConnected] = useState();
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [sentMessages, setSentMessages] = useState(new Set());
  const processedMessagesRef = useRef(new Set());


  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: animationData,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };

  const [typingUsers, setTypingUsers] = useState(new Map()); // Track who's typing
  // ...existing code...

  useEffect(() => {
    let k
    if(user["user_info"]) k = user["user_info"]
    else k = user
    socket = io(ENDPOINT, {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    withCredentials: true
  });
    socket.emit("setup", k);
    socket.on("connected", () => setSocketConnected(true));
    
    // Update typing handler to include user info
    socket.on("typing", (userId) => {
      // Only show typing indicator if someone else is typing
      if (userId !== k._id) {
        setIsTyping(true);
        // Store typing status with timestamp
        setTypingUsers(prev => new Map(prev).set(userId, Date.now()));
      }
    });

    
    socket.on("stop typing", (userId) => {
      // Remove user from typing users map
      setTypingUsers(prev => {
        const updatedMap = new Map(prev);
        updatedMap.delete(userId);
        // Only set isTyping to false if no one else is typing
        if (updatedMap.size === 0) {
          setIsTyping(false);
        }
        return updatedMap;
      });
    });
  }, []);

  // useEffect(() => {
  //   let k
  //   if(user["user_info"]) k = user["user_info"]
  //   else k = user
  //   socket = io(ENDPOINT);
  //   socket.emit("setup", k);
  //   socket.on("connected", () => setSocketConnected(true));
  //   socket.on("typing", () => setIsTyping(true));
  //   socket.on("stop typing", () => setIsTyping(false));
  // }, []);

  useEffect(() => {
    if (!socket) return;
    
    // Message handler function
    const handleNewMessage = (newMessageReceived) => {
      console.log("Received message:", newMessageReceived._id);
      
      // If we've already processed this message, skip it
      if (processedMessagesRef.current.has(newMessageReceived._id)) {
        console.log("Skipping duplicate:", newMessageReceived._id);
        return;
      }
      
      // Mark as processed immediately
      processedMessagesRef.current.add(newMessageReceived._id);
      
      // Notification logic for messages in other chats
      if (!selectedChatCompare || selectedChatCompare._id !== newMessageReceived.chat._id) {
        if (!notification.includes(newMessageReceived)) {
          setNotification([newMessageReceived, ...notification]);
          setFetchAgain(!fetchAgain);
        }
      } else {
        // Add to messages if in the current chat
        setMessages(prev => [...prev, newMessageReceived]);
      }
    };
    
    // Register the handler
    socket.on("message received", handleNewMessage);
    
    // Clean up
    return () => {
      socket.off("message received", handleNewMessage);
    };
  }, [selectedChat, notification, fetchAgain]); 

  const sendMessage = async (event) => {
    if (event.key === "Enter" && newMessage) {
      // socket.emit("stop typing", selectedChat._id);

      setTyping(false);
    setIsTyping(false);
    
    // Clear any existing typing timeout
    if (typing && typing.timeout) {
      clearTimeout(typing.timeout);
    }
    
    // Notify others to stop showing typing indicator for this user
    const userId = user.user_info ? user.user_info._id : user._id;
    socket.emit("stop typing", {
      room: selectedChat._id,
      userId: userId
    });
      
      const endpoint = getApiEndpoint('/messages', user); 
      try {
        const { data } = await api.post(
          endpoint,
          {
            content: newMessage,
            chatId: selectedChat._id,
          }
        );
        
        // Mark as processed BEFORE adding to messages
        processedMessagesRef.current.add(data._id);
        console.log("Marked as processed:", data._id);
        
        // Still emit for socket (can later be removed once backend emits properly)
        socket.emit("new message", data);
        
        setNewMessage("");
        setMessages(prev => [...prev, data]);
      } catch (error) {
        toast({
          title: "Error Occurred!",
          description: error.message,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };

  const fetchMessages = async () => {
    if (!selectedChat) return;
    const endpoint = getApiEndpoint(`/messages/${selectedChat._id}`, user); 
    try {
      setLoading(true);
      const { data } = await api.get(endpoint);
      
      // Reset processed messages when loading a new chat
      processedMessagesRef.current = new Set(data.map(msg => msg._id));
      
      setMessages(data);
      setLoading(false);
      socket.emit("join chat", selectedChat._id);
    } catch (error) {
      toast({
        title: "Error Occurred!",
        description: error.message,
        status: "error",
        duration: 5000,
        position: "top-center",
        isClosable: true,
      });
      setLoading(false);
    }
  };
  


  // ---------------------------------------------------main

  // useEffect(() => {
  //   if (socket) {
  //     const messageHandler = (newMessageReceived) => {
  //       // Check if we've already processed this message (prevents duplicates)
  //       if (sentMessages.has(newMessageReceived._id)) {
  //         return;
  //       }
  
  //       if (!selectedChatCompare || selectedChatCompare._id !== newMessageReceived.chat._id) {
  //         // Give notification if we're not in this chat
  //         if (!notification.includes(newMessageReceived)) {
  //           setNotification([newMessageReceived, ...notification]);
  //           setFetchAgain(!fetchAgain);
  //         }
  //       } else {
  //         // Update messages if we're in this chat
  //         setMessages(prevMessages => [...prevMessages, newMessageReceived]);
  //         console.log("Different ",sentMessages,newMessageReceived)
  //       }
  //     };
  
  //     // Register the event handler
  //     socket.on("message received", messageHandler);
      
  //     // Cleanup function
  //     return () => {
  //       socket.off("message received", messageHandler);
  //     };
  //   }
  // }, [selectedChatCompare, notification, sentMessages]);

  // const sendMessage = async (event) => {
  //   if (event.key === "Enter" && newMessage) {
  //     socket.emit("stop typing", selectedChat._id);
  //     const endpoint = getApiEndpoint('/messages', user); // Construct endpoint
  //     if (!endpoint) return;
  //     try {
  //       const { data } = await api.post( // Use api instance
  //         endpoint, // Use endpoint
  //         {
  //           content: newMessage,
  //           chatId: selectedChat._id,
  //         }
  //       );
  //       socket.emit("new message", data);
  //       console.log("Current ",sentMessages,data)
  //       setSentMessages(prev => new Set(prev).add(data._id));
  //       setNewMessage("");
  //       setMessages([...messages, data]);
  //     } catch (error) {
  //       toast({
  //         title: "Error Occured!",
  //         description: error.message,
  //         status: "error",
  //         duration: 5000,
  //         position: "top-center",
  //         isClosable: true,
  //       });
  //     }
  //   }
  // };

  // --------------------------------------------

  // useEffect(() => {
  //   socket.on("message received", (newMessageRecieved) => {
  //     if (
  //       !selectedChatCompare ||
  //       selectedChatCompare._id === newMessageRecieved._id
  //     ) {
  //       // give notification
  //       if (!notification.includes(newMessageRecieved)) {
  //         setNotification([newMessageRecieved, ...notification]);
  //         setFetchAgain(!fetchAgain);
  //       }
  //     } else {
  //       setMessages([...messages, newMessageRecieved]);
  //     }
  //   });
  // });

  // const sendMessage = async (event) => {
  //   if (event.key === "Enter" && newMessage) {
  //     socket.emit("stop typing", selectedChat._id);
  //     const endpoint = getApiEndpoint('/messages', user); // Construct endpoint
  //     if (!endpoint) return;
  //     try {
  //       const { data } = await api.post( // Use api instance
  //         endpoint, // Use endpoint
  //         {
  //           content: newMessage,
  //           chatId: selectedChat._id,
  //         }
  //       );
  //       socket.emit("new message", data);
  //       setNewMessage("");
  //       setMessages([...messages, data]);
  //     } catch (error) {
  //       toast({
  //         title: "Error Occured!",
  //         description: error.message,
  //         status: "error",
  //         duration: 5000,
  //         position: "top-center",
  //         isClosable: true,
  //       });
  //     }
  //   }
  // };

  // ------------------------------------main
  // const fetchMessages = async () => {
  //   if (!selectedChat) {
  //     return;
  //   }
  //   const endpoint = getApiEndpoint(`/messages/${selectedChat._id}`, user); // Construct endpoint
  //   if (!endpoint) return;
  //   try {
  //     setLoading(true);
  //     // const config = {
  //     //   headers: {
  //     //     Authorization: `Bearer ${user.token}`,
  //     //   },
  //     // };
  //     const { data } = await api.get(endpoint);
  //     setMessages(data);
  //     setLoading(false);

  //     socket.emit("join chat", selectedChat._id);
  //   } catch (error) {
  //     toast({
  //       title: "Error Occured!",
  //       description: error.message,
  //       status: "error",
  //       duration: 5000,
  //       position: "top-center",
  //       isClosable: true,
  //     });
  //     setLoading(false);
  //   }
  // };
  // --------------------------------------------------





  

  // const typingHandler = (e) => {
  //   setNewMessage(e.target.value);

  //   // Typing indicator Logic
  //   if (!socketConneted) {
  //     return;
  //   }
  //   setIsTyping(false);
  //   if (!typing) {
  //     // setTyping(true);
  //     socket.emit("typing", selectedChat._id);
  //     setIsTyping(false);
  //   }
  //   let lastTypingTime = new Date().getTime();
  //   var timerLength = 3000;
  //   setTimeout(() => {
  //     var timeNow = new Date().getTime();
  //     var timeDiff = timeNow - lastTypingTime;

  //     if (timeDiff >= timerLength && typing) {
  //       socket.emit("stop typing", selectedChat._id);
  //       setTyping(false);
  //     }
  //   }, timerLength);
  // };

  const typingHandler = (e) => {
    setNewMessage(e.target.value);

    // Typing indicator Logic
    if (!socketConneted || !selectedChat) {
      return;
    }
    
    // Clear previous timeout if exists
    if (typing.timeout) clearTimeout(typing.timeout);
    
    // Send typing signal with current user's ID
    let userId = user.user_info ? user.user_info._id : user._id;
    socket.emit("typing", {
      room: selectedChat._id,
      userId: userId
    });
    
    // Set typing state with timeout information
    const timeoutId = setTimeout(() => {
      socket.emit("stop typing", {
        room: selectedChat._id,
        userId: userId
      });
      setTyping(false);
    }, 3000);
    
    setTyping({ active: true, timeout: timeoutId });
  };

  // Clean up timeouts when component unmounts
  useEffect(() => {
    return () => {
      if (typing.timeout) clearTimeout(typing.timeout);
    };
  }, [typing]);

  useEffect(() => {
    fetchMessages();
    selectedChatCompare = selectedChat;
  }, [selectedChat]);

  return (
    <>
      {selectedChat ? (
        <>
          <Text
            fontSize={{ base: "28px", md: "30px" }}
            pb={3}
            px={2}
            w="100%"
            fontFamily="Work sans"
            display="flex"
            justifyContent={{ base: "space-between" }}
            alignItems="center"
          >
            <IconButton
              display={{ base: "flex", md: "none" }}
              icon={<ArrowBackIcon />}
              onClick={() => setSelectedChat("")}
            />
            {!selectedChat.isGroupChat ? (
              <>
                {getSender(user, selectedChat.users)}
                <ProfileModal user={getSenderFull(user, selectedChat.users)} />
              </>
            ) : (
              <>
                {selectedChat?.chatName.toUpperCase()}
                <UpdateGroupChatModal
                  fetchAgain={fetchAgain}
                  setFetchAgain={setFetchAgain}
                  fetchMessages={fetchMessages}
                />
              </>
            )}
          </Text>
          <Box
            display="flex"
            justifyContent="flex-end"
            p={3}
            bg="#E8E8E8"
            w="100%"
            h="100%"
            borderRadius="lg"
            overflowY="hidden"
            border={{ base: "1px solid blue", md: "1px solid black" }}

      borderWidth="1px"
          >
            {loading ? (
              <Spinner
                size="xl"
                w={20}
                h={20}
                alignSelf="center"
                margin="auto"
              />
            ) : (
              <>
                <div className="messages">
                  <ScrollableChat messages={messages} />
                </div>
              </>
            )}
          </Box>
          <FormControl onKeyDown={sendMessage} isRequired mt={3} border={{ base: "1px solid blue", md: "1px solid black" }}
      borderRadius="lg"
      borderWidth="1px">
            {isTyping ? (
              <div>
                {/* BY ME DHRUVIL : COMMENTED OUT TYPING ANIMATION */}
                {/* <Lottie
                  options={defaultOptions}
                  width={70}
                  style={{ marginLeft: "5px" }}
                /> */}
              </div>
            ) : (
              ""
            )}
            <Input
              variant="filled"
              bg="#E0E0E0"
              placeholder="Enter a message.."
              onChange={typingHandler}
              value={newMessage}
            />
          </FormControl>
        </>
      ) : (
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          h="100%"
        >
          <Text fontSize="3xl" pg={3} fontFamily="Work sans">
            Click on a user to start chating
          </Text>
        </Box>
      )}
    </>
  );
};

export default SingleChat;

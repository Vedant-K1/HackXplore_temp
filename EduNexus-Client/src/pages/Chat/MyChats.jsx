import { ChatState } from "../../contexts/chatProvider";
import { Box, Button, useToast, Text } from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { AddIcon } from "@chakra-ui/icons";
import ChatLoading from "./ChatLoading";
import { Stack, Skeleton } from "@chakra-ui/react";
import { getSender } from "../../config/ChatLogix";
import GroupChatModal from "./GroupChatModal";
import axios from "axios";
import api, { getApiEndpoint } from "../../config/api";

export default function MyChats({ fetchAgain, setFetchAgain }) {
  const { selectedChat, setSelectedChat, user, chats, setChats } = ChatState();
  console.log(user)
  const toast = useToast();
  const [loggedUser, setLoggedUser] = useState();

  const fetchChats = async () => {
    const endpoint = getApiEndpoint('/chats', user); // Construct endpoint
    if (!endpoint) return;
    try {
      const { data } = await api.get(endpoint); 
      setChats(data);
    } catch (error) {
      toast({
        position: "top-left",
        title: "Error Occured!",
        description: error.message,
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }
  };

  useEffect(() => {
    setLoggedUser(JSON.parse(localStorage.getItem("userInfo")));
    fetchChats();
  }, [fetchAgain, user]); // BY ME

  return (
    <Box
      display={{ base: selectedChat ? "none" : "flex", md: "flex" }}
      flexDir="column"
      alignItems="center"
      p={3}
      bg="#d6bcfa"
      w={{ base: "100%", md: "31%" }}
      border={{ base: "1px solid blue", md: "1px solid black" }}
      borderRadius="lg"
      borderWidth="1px"
    >
      <Box
        pb={3}
        px={3}
        fontSize={{ base: "20px", md: "25px" }}
        fontFamily="Work sans"
        display="flex"
        fontWeight="bold"
        w="100%"
        justifyContent="space-between"
        alignItems="center"
   
        
      >
        My Chats
        <GroupChatModal>
          <Button
            display="flex"
            fontSize={{ base: "17px", md: "10px", lg: "17px" }}
            bg="#553c9a"
            color={"white"}
            rightIcon={<AddIcon />}
          >
            New Group Chat
          </Button>
        </GroupChatModal>
      </Box>
      <hr></hr>
      <Box
        display="flex"
        flexDir="column"
        p={3}
        bg="#d6bcfa"
        w="100%"
        h="100%"
        borradius="lg"
        overflowY="hidden"
        
      >
        {chats ? (
          <Stack
          >
            {chats?.map((chat) => (
              <Box
                onClick={() => setSelectedChat(chat)}
                cursor="pointer"
                bg={selectedChat === chat ? "#553c9a" : "#ab77f0"}
                color={ "white" }
                px={3}
                py={2}
                
                borderRadius="lg"
                key={chat._id}
                // border={{ base: "1px solid blue", md: "1px solid black" }}
                fontSize={{ base: "sm", md: "md", lg: "lg" }}  // Responsive font size
                fontWeight="bold"   
      borderWidth="1px"
              >
                <Text>
                  {!chat.isGroupChat
                    ? getSender(loggedUser, chat.users)
                    : chat.chatName}
                </Text>
              </Box>
            ))}
          </Stack>
        ) : (
          <ChatLoading />
        )}
      </Box>
    </Box>
  );
}

import { useState, useEffect } from "react";
import { ChatState } from "../../contexts/chatProvider";
import { Box } from "@chakra-ui/react";
import SingleChat from "./components/SingleChat";

const ChatBox = ({ fetchAgain, setFetchAgain }) => {
  const { selectedChat } = ChatState();

  return (
    <Box
      display={{ base: selectedChat ? "flex" : "none", md: "flex" }}
      alignItems="center"
      flexDir="column"
      p={3}
      bg="#d6bcfa"
      w={{ base: "100%", md: "68%" }}
      border={{ base: "1px solid blue", md: "1px solid black" }}
      borderRadius="lg"
      borderWidth="1px"
    >
      <SingleChat fetchAgain={fetchAgain} setFetchAgain={setFetchAgain} />
    </Box>
  );
};

export default ChatBox;

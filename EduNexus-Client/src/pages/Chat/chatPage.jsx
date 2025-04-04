import React from "react";
import axios from "axios";
import {
  Container,
  Box,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { ChatState } from "../../contexts/chatProvider";
import SideDrawer from "./SideDrawer";
import MyChats from "./MyChats";
import ChatBox from "../ChatBox/ChatBox";
import { Navbar } from "../../components/navbar"

const ChatPage = () => {
  const { user } = ChatState();
  const [fetchAgain, setFetchAgain] = useState(false);

  

  return (
    <div style={{ width: "100%" }}>
      {user && <Navbar isChat={<SideDrawer />} />}
      <Box
        display="flex"
        justifyContent="space-between"
        w="100%"
        h="91.5vh"
        p="10px"
      >
        {user && (
          <MyChats fetchAgain={fetchAgain} setFetchAgain={setFetchAgain} />
        )}
        {user && (
          <ChatBox fetchAgain={fetchAgain} setFetchAgain={setFetchAgain} />
        )}
      </Box>
    </div>
  );
};

export default ChatPage;

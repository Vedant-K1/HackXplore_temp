import { useState, useEffect } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  IconButton,
  Button,
  FormControl,
  Input,
  useToast,
  Box,
  Spinner,
} from "@chakra-ui/react";
import { useDisclosure } from "@chakra-ui/hooks";
import { ViewIcon } from "@chakra-ui/icons";
import { ChatState } from "../../../contexts/chatProvider";
import UserBadgeItem from "../../Chat/UserBadgeItem";
import axios from "axios";
import UserListItem from "../../Chat/UserListItem";
import api, { getApiEndpoint } from "../../../config/api"; 

const UpdateGroupChatModal = ({ fetchAgain, setFetchAgain, fetchMessages }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [groupChatName, setGroupChatName] = useState();
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [search, setSearch] = useState();
  const [searchResult, setSearchResult] = useState([]);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const [renameLoading, setRenameLoading] = useState(false);
  const { selectedChat, setSelectedChat, user } = ChatState();

  const handleDelte = (userId) => {
    setSelectedUsers(selectedUsers.filter((ele) => ele._id !== userId));
  };

  const handleSearch = async (e) => {
    setSearch(e);
    if (!e) {
      return;
    }
    const endpoint = getApiEndpoint('/users/search', user); // Construct endpoint
    if (!endpoint) return; 
    try {
      setLoading(true);
      const { data } = await api.get(`${endpoint}?search=${e}`);
      setLoading(false);
      setSearchResult(data);
    } catch (err) {
      setLoading(false);
      toast({
        position: "top-left",
        title: "Error Occured!",
        description: err.message,
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }
  };

  const handleRename = async () => {
    if (!groupChatName) {
      toast({
        position: "top-left",
        title: "Please fill the group name!",
        description: err.message,
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    const endpoint = getApiEndpoint('/chats/rename', user); // Construct endpoint
     if (!endpoint) return;
    try {
      setRenameLoading(true);

      const { data } = await api.put( // Use api instance
        endpoint, // Use endpoint
        {
          chatId: selectedChat._id,
          chatName: groupChatName,
        }
      );
      toast({
        position: "top-center",
        title: "Successfully Updated Group Name",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      setSelectedChat(data);
      setFetchAgain(!fetchAgain);
      setRenameLoading(false);
    } catch (error) {}
  };

  const handleAddUser = async (user1) => {
    if (selectedChat.users.find((u) => u._id === user1._id)) {
      toast({
        position: "top-left",
        title: "User already added!",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (selectedChat.groupAdmin._id !== user._id) {
      toast({
        position: "top-left",
        title: "Only Group Admin can Add someone!",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      // return;
    }
    const endpoint = getApiEndpoint('/chats/groupadd', user); // Construct endpoint
    if (!endpoint) return; 
    try {
      setLoading(true);
      const { data } = await api.put( // Use api instance
        endpoint, // Use endpoint
        {
          chatId: selectedChat._id,
          userId: user1._id, // user to add
        }
      );
      setSelectedChat(data);
      setFetchAgain(!fetchAgain);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      toast({
        position: "top-left",
        title: "Error Occured!",
        description: err.message,
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }
  };

  const handleRemove = async (user1) => {
    if (selectedChat.groupAdmin._id !== user._id && user._id !== user1._id) {
      toast({
        position: "top-left",
        title: "Only Group Admin can Add someone!",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    const endpoint = getApiEndpoint('/chats/groupremove', user); // Construct endpoint
    if (!endpoint) return;
    try {
      setLoading(true);
      const { data } = await api.put( // Use api instance
        endpoint, // Use endpoint
        {
          chatId: selectedChat._id,
          userId: user1._id, // user to remove
        }
      );
      user1.id === user.id ? setSelectedChat() : setSelectedChat(data);
      setFetchAgain(!fetchAgain);
      fetchMessages();
      toast({
        position: "top-center",
        title:
          user1.id === user.id
            ? "Successfully Left group chat"
            : "Successfully removed from group chat",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      setLoading(false);
    } catch (err) {
      setLoading(false);
      toast({
        position: "top-left",
        title: "Error Occured!",
        description: err.message,
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }
  };
  return (
    <>
      <IconButton
        display={{ base: "flex" }}
        icon={<ViewIcon />}
        onClick={onOpen}
      />
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{selectedChat.chatName}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Box
              display="flex"
              flexWrap="wrap"
              justifyContent="flex-start"
              p={1.5}
              bg="whitesmoke"
              borderRadius="lg"
              mb={3}
            >
              {selectedChat?.users.map((user) => (
                <UserBadgeItem
                  key={user._id}
                  user={user}
                  handleFunction={() => handleRemove(user)}
                />
              ))}
            </Box>
            <FormControl
              display="flex"
              flexWrap="wrap"
              justifyContent="space-evenly"
            >
              <Input
                w="75%"
                placeholder="Chat Name"
                value={groupChatName}
                mb={3}
                onChange={(e) => setGroupChatName(e.target.value)}
              />
              <Button
                variant="solid"
                colorscheme="teal"
                ml={1}
                isLoading={renameLoading}
                onClick={handleRename}
              >
                Update
              </Button>
            </FormControl>
            <FormControl>
              <Input
                placeholder="Add Users eg: John, Piyush, Jane"
                mb={1}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </FormControl>
            {loading ? (
              <Spinner size="lg" />
            ) : (
              searchResult
                ?.slice(0, 4)
                .map((user) => (
                  <UserListItem
                    key={user._id}
                    user={user}
                    handleFunction={() => handleAddUser(user)}
                  />
                ))
            )}
          </ModalBody>

          <ModalFooter>
            <Button
              colorscheme="red"
              mr={3}
              onClick={() => {
                handleRemove(user);
              }}
            >
              Leave Group
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default UpdateGroupChatModal;

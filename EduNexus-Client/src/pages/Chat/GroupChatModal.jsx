import { useState, useEffect } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  useToast,
  FormControl,
  Input,
  Box,
  FormLabel,
  FormErrorMessage,
  FormHelperText,
} from "@chakra-ui/react";
import { useDisclosure } from "@chakra-ui/hooks";
import { ChatState } from "../../contexts/chatProvider";
import UserBadgeItem from "./UserBadgeItem";
import UserListItem from "./UserListItem";
import axios from "axios";
import api, { getApiEndpoint } from "../../config/api"; // Import helpers


const GroupChatModal = ({ children }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [groupChatName, setGroupChatName] = useState();
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [search, setSearch] = useState();
  const [searchResult, setSearchResult] = useState([]);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const { user, chats, setChats } = ChatState();

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
      console.log("data hit", data);
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
  const handleSubmit = async () => {
    console.log(user)
    if (!groupChatName || !selectedUsers) {
      toast({
        position: "top-left",
        title: "Please fill all the fields!",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    try {
     
      const endpoint = getApiEndpoint('/chats/group', user); // Construct endpoint
    if (!endpoint) return;
    const { data } = await api.post( // Use api instance
      endpoint, // Use constructed endpoint
      {
        name: groupChatName,
        // Flask controller expects JSON for this, so stringify is likely correct here
        // Double-check if Flask /chats/group expects JSON or form-data
        users: selectedUsers.map((u) => u._id), // Send array directly if Flask uses request.json
      },{ withCredentials: true }
    );
      setChats([data, ...chats]);
      onClose();
      toast({
        position: "top",
        title: "Successfully created group chat!",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        position: "top",
        title: "Error Occured!",
        description: err.message,
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleGroup = (userToAdd) => {
    if (selectedUsers.includes(userToAdd)) {
      toast({
        position: "top-left",
        title: "User already added!",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    setSelectedUsers([userToAdd, ...selectedUsers]);
  };
  const handleDelte = (userId) => {
    setSelectedUsers(selectedUsers.filter((ele) => ele._id !== userId));
  };
  return (
    <>
      <span onClick={onOpen}>{children}</span>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader
            fontSize={{ base: "15px", md: "20px", sm: "15px" }}
            fontFamily="Work sans"
            display="flex"
            justifyContent="center"
          >
            Create Group Chat
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody display="flex" flexDir="column" alignItems="center">
            <FormControl>
              <Input
                placeholder="Chat Name"
                mb={3}
                onChange={(e) => setGroupChatName(e.target.value)}
              />
            </FormControl>
            <FormControl>
              <Input
                placeholder="Add Users eg: John, Piyush, Jane"
                mb={1}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </FormControl>
            <Box display="flex" width="100%" flexWrap="wrap">
              {selectedUsers.map((user) => (
                <UserBadgeItem
                  key={user._id}
                  user={user}
                  handleFunction={() => {
                    handleDelte(user._id);
                  }}
                />
              ))}
            </Box>
            {loading ? (
              <div>loading</div>
            ) : (
              searchResult
                ?.slice(0, 4)
                .map((user) => (
                  <UserListItem
                    key={user._id}
                    user={user}
                    handleFunction={() => handleGroup(user)}
                  />
                ))
            )}
          </ModalBody>

          <ModalFooter>
            <Button colorscheme="blue" mr={3} onClick={handleSubmit}>
              Create Chat
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default GroupChatModal;

import { useState } from "react";
import { ChatState } from "../../contexts/chatProvider";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Container,
  Box,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  Button,
  TabPanel,
  Tooltip,
  Avatar,
  Input,
  Spinner,
} from "@chakra-ui/react";
import ProfileModal from "./ProfileModal";
import { useDisclosure } from "@chakra-ui/hooks";
import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuItemOption,
  MenuGroup,
  MenuOptionGroup,
  MenuDivider,
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useToast,
} from "@chakra-ui/react";
import { BellIcon, ChevronDownIcon } from "@chakra-ui/icons";
import NotificationBadge from "react-notification-badge";
import { Effect } from "react-notification-badge";
import ChatLoading from "./ChatLoading";
import UserListItem from "./UserListItem";
import { getSender } from "../../config/ChatLogix";
import api, { getApiEndpoint } from "../../config/api";

export default function SideDrawer() {
  const [search, setSearch] = useState("");
  const [searchResult, setSearchResult] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingChat, setLoadingChat] = useState();
  const {
    user,
    setSelectedChat,
    chats,
    setChats,
    notification,
    setNotification,
  } = ChatState();
  const navigateTo = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const hanldLogout = () => {
    let k;
    if (user["user_info"]) k = user["user_info"]
    else k = user
    sessionStorage.removeItem(`${k.type}_authenticated`)
    localStorage.removeItem("userInfo");
    navigateTo("/");
  };
  const handleSearch = async () => {
    if (!search) {
      toast({
        position: "top-left",
        title: "Please fill the user details!",
        description: "We've created your account for you.",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    const endpoint = getApiEndpoint('/users/search', user); // Construct endpoint
    if (!endpoint) return;
    try {
      setLoading(true);
      const { data } = await api.get(`${endpoint}?search=${search}`); 
      setLoading(false);
      setSearchResult(data);
    } catch (err) {
      toast({
        position: "top-left",
        title: "Error Occured!",
        description: err.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }
  };

  const accessChat = async (userId) => {
    const endpoint = getApiEndpoint('/chats', user); // Construct endpoint
    if (!endpoint) return; 
    try {
      setLoadingChat(true);
      const { data } = await api.post(endpoint, { userId });
      if (!chats.find((c) => c._id === data._id)) {
        setChats([data, ...chats]);
      }
      setSelectedChat(data);
      setLoadingChat(false);
      onClose();
    } catch (err) {
      toast({
        position: "bottom-left",
        title: "Error Occured!",
        description: err.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      setLoadingChat(false);
      return;
    }
  };
  return (
    <>
      
          <Menu>
            <MenuButton p={1}>
              <NotificationBadge
                count={notification.length}
                effect={Effect.SCALE}
              />
              <BellIcon fontSize="2xl" m={1} />
            </MenuButton>
            <MenuList p={2}>
              {!notification.length && "No New Messages"}
              {notification?.map((notif) => (
                <MenuItem
                  borderRadius="lg"
                  _hover={{ bg: "teal", color: "white" }}
                  key={notif._id}
                  onClick={() => {
                    setSelectedChat(notif.chat);
                    setNotification(
                      notification.filter((sms) => sms !== notif)
                    );
                  }}
                >
                  {notif.chat.isGroupChat
                    ? `New Message in ${notif.chat.chatName}`
                    : `New Message from  ${getSender(user, notif.chat.users)}`}
                </MenuItem>
              ))}
            </MenuList>
          </Menu>
          
    </>
  );
}



// import { useState } from "react";
// import { ChatState } from "../../context/chatProvider";
// import { useNavigate } from "react-router-dom";
// import {
//   Box,
//   Flex,
//   Text,
//   Button,
//   HStack,
//   IconButton,
//   Link,
//   Menu,
//   MenuButton,
//   MenuList,
//   MenuItem,
//   Stack,
//   useDisclosure
// } from "@chakra-ui/react";
// import { HamburgerIcon, CloseIcon } from "@chakra-ui/icons";
// import { FaHome, FaUserPlus, FaSignInAlt, FaGithub, FaChalkboardTeacher } from "react-icons/fa";
// import { MdCreateNewFolder, MdLogout, MdOutlineTravelExplore } from "react-icons/md";
// import { RiAiGenerate } from "react-icons/ri";

// // Simple Logo component - you can replace with your actual logo
// const Logo = ({
//   size = 45,
//   height,
//   ...props
// }) => (
//   <svg
//     fill="none"
//     height={size || height}
//     viewBox="0 0 32 32"
//     width={size || height}
//     {...props}
//   >
//     <path
//       clipRule="evenodd"
//       d="M17.6482 10.1305L15.8785 7.02583L7.02979 22.5499H10.5278L17.6482 10.1305ZM19.8798 14.0457L18.11 17.1983L19.394 19.4511H16.8453L15.1056 22.5499H24.7272L19.8798 14.0457Z"
//       fill="currentColor"
//       fillRule="evenodd"
//     />
//   </svg>
// );


// // NavLink component for consistent styling
// const NavLink = ({ href, children }) => (
//   <Link
//     px={2}
//     py={1}
//     rounded="md"
//     color={"white"}
//     textDecoration="none"
//     href={href}
//     className="feature-heading"
//     _hover={{ transform: 'scale(1.1)', color: 'purple.800', bg: 'white', textDecoration: 'none' }}
//     transition="transform 0.3s ease-in-out"
//   >
//     {children}
//   </Link>
// );

// export default function SideDrawer() {
//   const { user } = ChatState();
//   const navigateTo = useNavigate();
//   const { isOpen, onOpen, onClose } = useDisclosure();
  
//   // For demo purposes - you would implement actual auth logic
//   const teacherAuthenticated = true;
//   const studentAuthenticated = false;
//   const jobseekerAuthenticated = false;
  
//   const handleTeacherLogout = () => {
//     localStorage.removeItem("userInfo");
//     navigateTo("/");
//   };
  
//   const handleStudentLogout = () => {
//     localStorage.removeItem("userInfo");
//     navigateTo("/");
//   };
  
//   const handleJobSeekerLogout = () => {
//     localStorage.removeItem("userInfo");
//     navigateTo("/");
//   };

//   const navigate = navigateTo; // Alias for the example code
  
//   return (
//     <Box 
//       bg={"purple.700"} 
//       position="sticky" 
//       boxShadow={'0 5px 6px rgba(0, 0, 0, 0.4)'} 
//       paddingX={"20"} 
//       top={0} 
//       zIndex="sticky"
//     >
//       <Flex h={16} alignItems={'center'} justifyContent={'space-between'}>
//         <IconButton
//           size={'md'}
//           icon={isOpen ? <CloseIcon /> : <HamburgerIcon />}
//           aria-label={'Open Menu'}
//           display={{ md: 'none' }}
//           onClick={isOpen ? onClose : onOpen}
//         />

//         <Link textDecoration="none" _hover={{ color: 'black' }} href='/'>
//           <HStack spacing={8} alignItems={'center'}>
//             <Box display={"flex"}>
//               <Logo color='white' />
//               <Box mt={2} className="roboto-regular-italic" fontSize={'lg'} color="white">
//                 AcademIQ
//               </Box>
//             </Box>
//           </HStack>
//         </Link>

//         <HStack as={'nav'} spacing={4} display={{ base: 'none', md: 'flex' }} ml="auto">
//           {teacherAuthenticated && (
//             <>
//               <NavLink href="/teacher/dashboard">
//                 <HStack spacing={2}>
//                   <FaHome size={24} />
//                   <span>Home</span>
//                 </HStack>
//               </NavLink>

//               <NavLink href="/teacher/create-course">
//                 <HStack spacing={2}>
//                   <MdCreateNewFolder size={24} />
//                   <span>Create Course</span>
//                 </HStack>
//               </NavLink>
//               <NavLink href="/teacher/create-assignment">
//                 <HStack spacing={2}>
//                   <MdCreateNewFolder size={24} />
//                   <span>Create Assignment</span>
//                 </HStack>
//               </NavLink>
//               <NavLink href="/teacher/research">
//                 <HStack spacing={2}>
//                   <MdCreateNewFolder size={24} />
//                   <span>Research</span>
//                 </HStack>
//               </NavLink>
//               <NavLink href="/teacher/timetable">
//                 <HStack spacing={2}>
//                   <MdCreateNewFolder size={24} />
//                   <span>Schedule Timetable</span>
//                 </HStack>
//               </NavLink>
//               <NavLink href="/teacher/list-project">
//                 <HStack spacing={2}>
//                   <FaGithub size={24} />
//                   <span>Github Explorer</span>
//                 </HStack>
//               </NavLink>
//               <Box
//                 px={2}
//                 py={1}
//                 className="feature-heading"
//                 rounded="md"
//                 color={"white"}
//                 textDecoration="none"
//                 _hover={{ transform: 'scale(1.1)', color: 'purple.800', bg: 'white', textDecoration: 'none', cursor: 'pointer' }}
//                 transition="transform 0.3s ease-in-out">
//                 <HStack spacing={2} onClick={handleTeacherLogout}>
//                   <MdLogout size={24} />
//                   <span>Logout</span>
//                 </HStack>
//               </Box>
//             </>
//           )}
//           {studentAuthenticated && (
//             <>
//               <NavLink href="/student/home">
//                 <HStack spacing={2}>
//                   <FaHome size={24} />
//                   <span>Home</span>
//                 </HStack>
//               </NavLink>
//               <NavLink href="/student/assignment">
//                 <HStack spacing={2}>
//                   <MdCreateNewFolder size={24} />
//                   <span>Assignments</span>
//                 </HStack>
//               </NavLink>
//               <NavLink href="/student/research">
//                 <HStack spacing={2}>
//                   <MdCreateNewFolder size={24} />
//                   <span>Research</span>
//                 </HStack>
//               </NavLink>
//               <NavLink href="/student/list-project">
//                 <HStack spacing={2}>
//                   <FaHome size={24} />
//                   <span>Projects</span>
//                 </HStack>
//               </NavLink>
//               <Menu>
//                 <MenuButton
//                   px={2}
//                   py={1}
//                   className="feature-heading"
//                   rounded="md"
//                   color={"white"}
//                   _hover={{ transform: 'scale(1.1)', color: 'purple.800', bg: 'white', textDecoration: 'none' }}
//                   transition="transform 0.3s ease-in-out"
//                 >
//                   <HStack spacing={2}>
//                     <RiAiGenerate size={24} />
//                     <span>Generate</span>
//                   </HStack>
//                 </MenuButton>
//                 <MenuList>
//                   <MenuItem onClick={() => navigate("/student/explore")}>
//                     <MdOutlineTravelExplore size={20} style={{marginRight:8}}/>
//                     <span>Smart Courses</span>
//                   </MenuItem>
//                   <MenuItem onClick={() => navigate("/student/shared-courses")}>
//                     <FaChalkboardTeacher size={20} style={{marginRight:8}}/>
//                     <span>View Shared Courses</span>
//                   </MenuItem>
//                 </MenuList>
//               </Menu>

//               <Box
//                 px={2}
//                 py={1}
//                 className="feature-heading"
//                 rounded="md"
//                 color={"white"}
//                 textDecoration="none"
//                 _hover={{ transform: 'scale(1.1)', color: 'purple.800', bg: 'white', textDecoration: 'none', cursor: "pointer" }}
//                 transition="transform 0.3s ease-in-out">
//                 <HStack spacing={2} onClick={handleStudentLogout}>
//                   <MdLogout size={24} />
//                   <span>Logout</span>
//                 </HStack>
//               </Box>
//             </>
//           )}
//           {jobseekerAuthenticated && (
//             <>
//               <NavLink href="/student/dashboard">
//                 <HStack spacing={2}>
//                   <FaHome size={24} />
//                   <span>Home</span>
//                 </HStack>
//               </NavLink>

//               <Box
//                 px={2}
//                 py={1}
//                 className="feature-heading"
//                 rounded="md"
//                 color={"white"}
//                 textDecoration="none"
//                 _hover={{ transform: 'scale(1.1)', color: 'purple.800', bg: 'white', textDecoration: 'none', cursor: "pointer" }}
//                 transition="transform 0.3s ease-in-out">
//                 <HStack spacing={2} onClick={handleJobSeekerLogout}>
//                   <MdLogout size={24} />
//                   <span>Logout</span>
//                 </HStack>
//               </Box>
//             </>
//           )}
//           {!teacherAuthenticated && !studentAuthenticated && !jobseekerAuthenticated && (
//             <>
//               <NavLink href="/register">
//                 <HStack spacing={2}>
//                   <FaUserPlus size={24} />
//                   <span>Sign Up</span>
//                 </HStack>
//               </NavLink>

//               <NavLink href="/login">
//                 <HStack spacing={2}>
//                   <FaSignInAlt size={24} />
//                   <span>Login</span>
//                 </HStack>
//               </NavLink>
//             </>
//           )}
//         </HStack>
//       </Flex>

//       {/* Mobile menu when open */}
//       {isOpen ? (
//         <Box pb={4} display={{ md: 'none' }}>
//           <Stack as={'nav'} spacing={4}>
//             <NavLink href="/">Home</NavLink>
//             <NavLink href="/teacher/create">Create</NavLink>
//             <NavLink href="/login">Login</NavLink>
//           </Stack>
//         </Box>
//       ) : null}
//     </Box>
//   );
// }


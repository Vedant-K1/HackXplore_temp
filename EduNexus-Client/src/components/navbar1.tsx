import React, { ReactNode, useEffect, useState } from 'react';
import {
    Box,
    Flex,
    Link,
    HStack,
    IconButton,
    Stack,
    useDisclosure,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
} from '@chakra-ui/react';
import { HamburgerIcon, CloseIcon } from '@chakra-ui/icons';
import { FaHome, FaSignInAlt, FaUserPlus, FaChalkboardTeacher, FaGithub } from 'react-icons/fa';
import { RiAiGenerate } from "react-icons/ri";
import { MdOutlineTravelExplore, MdCreateNewFolder, MdLogout } from "react-icons/md";
import { Logo } from './icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface NavLinkProps {
    href: string;
    children: ReactNode;
}

const NavLink: React.FC<NavLinkProps> = ({ children, href }) => (
    <Link
        px={2}
        py={1}
        className="feature-heading"
        rounded="md"
        color={"white"}
        href={href}
        textDecoration="none"
        _hover={{ transform: 'scale(1.1)', color: 'purple.800', bg: 'white', textDecoration: 'none' }}
        transition="transform 0.3s ease-in-out"
    >
        {children}
    </Link>
);


export const Navbar = () => {
    const navigate = useNavigate();

    const { isOpen, onOpen, onClose } = useDisclosure();
    const [studentAuthenticated, setStudentAuthenticated] = useState(false);
    const [teacherAuthenticated, setTeacherAuthenticated] = useState(false);
    const [jobseekerAuthenticated, setJobSeekerAuthenticated] = useState(false);


    const handleStudentLogout = async (clash=false) => {
        try {
            await axios.get('/api/student/logout', { withCredentials: true });
            setStudentAuthenticated(false);
            sessionStorage.removeItem('student_authenticated');
            localStorage.clear();
            if( !clash) navigate("/");
        } catch (error) {
            console.error(error);
        }
    };

    const handleTeacherLogout = async (clash=false) => {
        try {
            await axios.get('/api/teacher/logout', { withCredentials: true });
            setTeacherAuthenticated(false);
            sessionStorage.removeItem('teacher_authenticated');
            localStorage.clear();
            if( !clash) navigate("/");
        } catch (error) {
            console.error(error);
        }
    };


    useEffect(() => {
        const isStudentAuthenticated = sessionStorage.getItem('student_authenticated') === 'true';
        const isTeacherAuthenticated = sessionStorage.getItem('teacher_authenticated') === 'true';
       

        setStudentAuthenticated(isStudentAuthenticated);
        setTeacherAuthenticated(isTeacherAuthenticated);
        

    }, []);

    console.log(sessionStorage.getItem('student_authenticated') === 'true',sessionStorage.getItem('teacher_authenticated') === 'true',sessionStorage.getItem('job_seeker_authenticated') === 'true')

   


   
    return (
        <Box bg={"purple.700"} position="sticky" boxShadow={'0 5px 6px rgba(0, 0, 0, 0.4)'} paddingX={"20"} top={0} zIndex="sticky">
            <Flex h={16} alignItems={'center'} justifyContent={'space-between'}>
                <IconButton
                    size={'md'}
                    icon={isOpen ? <CloseIcon /> : <HamburgerIcon />}
                    aria-label={'Open Menu'}
                    display={{ md: 'none' }}
                    onClick={isOpen ? onClose : onOpen}
                />

                

                <HStack as={'nav'} spacing={4} display={{ base: 'none', md: 'flex' }} ml="auto">
                    {teacherAuthenticated  && (
                        <>
                            
                            <Box
                                px={2}
                                py={1}
                                className="feature-heading"
                                rounded="md"
                                color={"white"}
                                textDecoration="none"
                                _hover={{ transform: 'scale(1.1)', color: 'purple.800', bg: 'white', textDecoration: 'none', cursor: 'pointer' }}
                                transition="transform 0.3s ease-in-out">
                                <HStack spacing={2} onClick={handleTeacherLogout}>
                                    <MdLogout size={24} />
                                    <span>Logout</span>
                                </HStack>
                            </Box>
                        </>
                    )}
                    {studentAuthenticated   && (
                        <>
                            <NavLink href="/student/home">
                                <HStack spacing={2}>
                                    <FaHome size={24} />
                                    <span>Home</span>
                                </HStack>
                            </NavLink>

                            <NavLink href="/student/list-project">
                                <HStack spacing={2}>
                                    <FaHome size={24} />
                                    <span>Projects</span>
                                </HStack>
                            </NavLink>
                            <NavLink href="/student/assignment">
                                <HStack spacing={2}>
                                    <MdCreateNewFolder size={24} />
                                    <span>Assignments</span>
                                </HStack>
                            </NavLink>
                            <NavLink href="/student/research">
                                <HStack spacing={2}>
                                    <MdCreateNewFolder size={24} />
                                    <span>Research</span>
                                </HStack>
                            </NavLink>
                          
                            <Menu>
                                <MenuButton
                                    px={2}
                                    py={1}
                                    className="feature-heading"
                                    rounded="md"
                                    color={"white"}
                                    _hover={{ transform: 'scale(1.1)', color: 'purple.800', bg: 'white', textDecoration: 'none' }}
                                    transition="transform 0.3s ease-in-out"
                                >
                                    <HStack spacing={2}>
                                        <RiAiGenerate size={24} />
                                        <span>Generate</span>
                                    </HStack>
                                </MenuButton>
                                <MenuList>
                                    <MenuItem onClick={() => navigate("/student/explore")}>
                                        <MdOutlineTravelExplore size={20} style={{marginRight:8}}/>
                                        <span>Smart Courses</span>
                                    </MenuItem>
                                    {/* <MenuItem onClick={() => navigate("/student/pers-courses")}>
                                        <FaFileAlt size={20} />
                                        <span>Personalized Content</span>
                                    </MenuItem> */}
                                    <MenuItem onClick={() => navigate("/student/shared-courses")}>
                                        <FaChalkboardTeacher size={20} style={{marginRight:8}}/>
                                        <span>View Shared Courses</span>
                                    </MenuItem>
                                </MenuList>
                            </Menu>

                            <Box
                                px={2}
                                py={1}
                                className="feature-heading"
                                rounded="md"
                                color={"white"}
                                textDecoration="none"
                                _hover={{ transform: 'scale(1.1)', color: 'purple.800', bg: 'white', textDecoration: 'none', cursor: "pointer" }}
                                transition="transform 0.3s ease-in-out">
                                <HStack spacing={2} onClick={handleStudentLogout}>
                                    <MdLogout size={24} />
                                    <span>Logout</span>
                                </HStack>
                            </Box>
                        </>
                    )}
                    {!teacherAuthenticated && !studentAuthenticated && (
                        <>
                            <NavLink href="/register">
                                <HStack spacing={2}>
                                    <FaUserPlus size={24} />
                                    <span>Sign Up</span>
                                </HStack>
                            </NavLink>

                            <NavLink href="/login">
                                <HStack spacing={2}>
                                    <FaSignInAlt size={24} />
                                    <span>Login</span>
                                </HStack>
                            </NavLink>
                        </>
                    )}
                </HStack>


            </Flex>

            {/* Mobile menu when open */}
            {isOpen ? (
                <Box pb={4} display={{ md: 'none' }}>
                    <Stack as={'nav'} spacing={4}>
                        <NavLink href="/">Home</NavLink>
                        <NavLink href="/teacher/create">Create</NavLink>
                        <NavLink href="/login">Login</NavLink>
                    </Stack>
                </Box>
            ) : null}
        </Box>
    );
};

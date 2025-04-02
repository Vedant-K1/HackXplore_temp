import React, { useState, useEffect } from 'react';
import {
    Box,
    Heading,
    Text,
    Spinner,
    Alert,
    AlertIcon,
    List,
    ListItem,
    Button,
    useColorModeValue,
    Flex,
    Link as ChakraLink, // Alias Chakra's Link
    Divider,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom'; // Alias React Router's Link
import { AddIcon } from '@chakra-ui/icons';
import { Navbar } from '../../../components/navbar';

// Define the structure of a project object from the backend
interface ProjectSummary {
    _id: string; // Assuming MongoDB ObjectId string
    project_name: string; // Make sure backend sends this key
    // Add other summary fields if available, e.g., number of collaborators
}

interface ApiResponse {
    message: string;
    projects?: ProjectSummary[]; // Use project_name consistently
    response: boolean;
}

function ProjectListStudent() {
    const [projects, setProjects] = useState<ProjectSummary[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const bgColor = useColorModeValue('gray.50', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');
    const headingColor = useColorModeValue('purple.600', 'purple.300');

    useEffect(() => {
        const fetchProjects = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // IMPORTANT: Ensure your backend uses credentials (cookies) for auth
                const response = await fetch('/api/student/projects', { // Assuming this endpoint lists projects for the logged-in teacher
                    method: 'POST', // Changed to POST as per backend code, GET is more standard though
                    headers: {
                        'Content-Type': 'application/json',
                        // Cookies should be sent automatically by the browser if backend is configured for CORS with credentials
                    },
                     // If it requires a body, add it here. If not, remove body.
                    // body: JSON.stringify({ /* potentially teacher_id if session isn't used reliably */ }),
                });

                if (!response.ok) {
                    // Try to get error message from response body
                    let errorMsg = `HTTP error! status: ${response.status}`;
                    try {
                        const errorData = await response.json();
                        errorMsg = errorData.message || errorMsg;
                    } catch (e) {
                        // Ignore if response body isn't JSON
                    }
                    throw new Error(errorMsg);
                }

                const data: ApiResponse = await response.json();
                console.log(data)

                if (data.response && data.projects) {
                    // Ensure project_name exists
                    const validProjects = data.projects.filter(p => p.project_name);
                     if (validProjects.length !== data.projects.length) {
                        console.warn("Some projects received from backend were missing 'project_name'");
                     }
                    // setProjects(validProjects);
                    setProjects(data.projects);
                } else {
                    throw new Error(data.message || 'Failed to fetch projects.');
                }
            } catch (err: any) {
                console.error("Error fetching projects:", err);
                setError(err.message || 'An unexpected error occurred.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchProjects();
    }, []); // Empty dependency array ensures this runs once on mount

    return (
        <>
         <Navbar />
        <Box p={8} bg={bgColor} minH="100vh">
            <Flex justify="space-between" align="center" mb={8}>
                <Heading as="h1" size="xl" color={headingColor}>
                    My Projects
                </Heading>
                <Button
                    as={RouterLink}
                    to="/student/create-project" // Link to your create project route
                    leftIcon={<AddIcon />}
                    colorScheme="purple"
                    variant="solid"
                >
                    Create New Project
                </Button>
            </Flex>

            {isLoading && (
                <Flex justify="center" align="center" height="200px">
                    <Spinner size="xl" color={headingColor} />
                </Flex>
            )}

            {error && (
                <Alert status="error" borderRadius="md">
                    <AlertIcon />
                    {error}
                </Alert>
            )}

            {!isLoading && !error && (
                <Box borderWidth="1px" borderRadius="lg" overflow="hidden" borderColor={borderColor}>
                    {projects.length === 0 ? (
                        <Text p={6} textAlign="center" color={useColorModeValue('gray.600', 'gray.400')}>
                            You haven't created any projects yet.
                        </Text>
                    ) : (
                        <List spacing={0}>
                            {projects.map((project, index) => (
                                <React.Fragment key={project._id}>
                                    <ListItem
                                        p={4}
                                        _hover={{ bg: useColorModeValue('gray.100', 'gray.700') }}
                                    >
                                        <ChakraLink
                                            as={RouterLink}
                                            to={`/student/projects/view/${project.project_name}`} // Link to the view page
                                            fontWeight="medium"
                                            color={useColorModeValue('purple.700', 'purple.200')}
                                            _hover={{ textDecoration: 'underline' }}
                                            display="block" // Make the link fill the list item
                                        >
                                            {project.project_name || `Project ID: ${project._id}`}
                                        </ChakraLink>
                                        {/* Add more project details here if needed */}
                                    </ListItem>
                                    {index < projects.length - 1 && <Divider borderColor={borderColor} />}
                                </React.Fragment>
                            ))}
                        </List>
                    )}
                </Box>
            )}
        </Box>
        </>
    );
}

export default ProjectListStudent;
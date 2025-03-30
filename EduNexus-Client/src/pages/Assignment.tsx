import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  SimpleGrid,
  Text,
  VStack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  useToast,
  useColorModeValue,
  Badge,
  Flex,
  useDisclosure,
  ChakraProvider
} from '@chakra-ui/react';
import axios from 'axios';
import { FaCalendarAlt, FaBook, FaFileUpload } from 'react-icons/fa';
import { Navbar } from '../components/navbar';

const AssignmentsDashboard = () => {
  // In a real application, you would get the student ID from your authentication context
  // This is just a placeholder - replace with your actual auth implementation
  const studentId = "student123"; // Replace with actual student ID from auth
  
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [comments, setComments] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  
  const cardBg = useColorModeValue('white', 'gray.700');
  const cardHoverBg = useColorModeValue('gray.50', 'gray.600');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/teacher/fetch-assignments');
      setAssignments(response.data.assignments);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch assignments',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignmentClick = (assignment) => {
    setSelectedAssignment(assignment);
    onOpen();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast({
          title: 'Invalid file type',
          description: 'Please upload a PDF file',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        e.target.value = null;
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast({
        title: 'No file selected',
        description: 'Please select a PDF file to upload',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('doc', selectedFile);
      formData.append('student_id', studentId);
      formData.append('assignment_id', selectedAssignment.assignment_id);
      
      const response = await axios.post('/api/student/submit-assignment', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      toast({
        title: 'Assignment submitted',
        description: 'Your assignment has been submitted successfully and evaluated.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Show evaluation feedback
      if (response.data.evaluation) {
        toast({
          title: 'Evaluation Results',
          description: `You scored ${response.data.evaluation.total_marks_obtained} marks`,
          status: 'info',
          duration: 8000,
          isClosable: true,
        });
      }
      
      // Close modal and reset form
      onClose();
      setSelectedFile(null);
      setComments('');
    } catch (error) {
      console.error('Error submitting assignment:', error);
      
      const errorMessage = error.response?.data?.error || 'An unexpected error occurred';
      
      toast({
        title: 'Submission failed',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date();
  };

  return (
    <>
    <Navbar/>
    <ChakraProvider>
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
          <Box textAlign="center">
            <Heading>Assignment Dashboard</Heading>
            <Text mt={2} color="gray.600">View and submit your assignments</Text>
          </Box>
          
          <Box p={5}>
            <Heading as="h2" size="lg" mb={6} textAlign="center">Your Assignments</Heading>
            
            {loading ? (
              <Text textAlign="center">Loading assignments...</Text>
            ) : (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                {assignments.map((assignment) => (
                  <Box
                    key={assignment.assignment_id}
                    p={5}
                    shadow="md"
                    borderWidth="1px"
                    borderRadius="lg"
                    bg={cardBg}
                    borderColor={borderColor}
                    _hover={{
                      shadow: 'lg',
                      transform: 'translateY(-5px)',
                      bg: cardHoverBg,
                      transition: 'all 0.3s ease'
                    }}
                    cursor="pointer"
                    onClick={() => handleAssignmentClick(assignment)}
                  >
                    <VStack align="start" spacing={3}>
                      <Heading size="md">{assignment.title}</Heading>
                      <Text noOfLines={2}>{assignment.details}</Text>
                      
                      <Flex align="center" mt={2}>
                        <FaBook />
                        <Text ml={2} fontWeight="medium">{assignment.subject_name}</Text>
                      </Flex>
                      
                      <Flex align="center">
                        <FaCalendarAlt />
                        <Text ml={2}>
                          Due: {formatDate(assignment.due_date)}
                        </Text>
                      </Flex>
                      
                      {isOverdue(assignment.due_date) ? (
                        <Badge colorScheme="red">Overdue</Badge>
                      ) : (
                        <Badge colorScheme="green">Open</Badge>
                      )}
                    </VStack>
                  </Box>
                ))}
              </SimpleGrid>
            )}

            {/* Submission Modal */}
            <Modal isOpen={isOpen} onClose={onClose} size="lg">
              <ModalOverlay />
              <ModalContent>
                <ModalHeader>
                  Submit Assignment: {selectedAssignment?.title}
                </ModalHeader>
                <ModalCloseButton />
                
                <form onSubmit={handleSubmit}>
                  <ModalBody>
                    <VStack spacing={4}>
                      <Box w="full">
                        <Text fontWeight="medium" mb={2}>Assignment Details:</Text>
                        <Text>{selectedAssignment?.details}</Text>
                      </Box>
                      
                      <FormControl isRequired>
                        <FormLabel>Upload Assignment (PDF only)</FormLabel>
                        <Input
                          type="file"
                          accept=".pdf"
                          onChange={handleFileChange}
                          p={1}
                        />
                      </FormControl>
                      
                      <FormControl>
                        <FormLabel>Comments (optional)</FormLabel>
                        <Textarea
                          value={comments}
                          onChange={(e) => setComments(e.target.value)}
                          placeholder="Add any comments about your submission..."
                        />
                      </FormControl>
                    </VStack>
                  </ModalBody>

                  <ModalFooter>
                    <Button mr={3} onClick={onClose} variant="outline">
                      Cancel
                    </Button>
                    <Button type="submit" colorScheme="blue" leftIcon={<FaFileUpload />}>
                      Submit Assignment
                    </Button>
                  </ModalFooter>
                </form>
              </ModalContent>
            </Modal>
          </Box>
        </VStack>
      </Container>
    </ChakraProvider>
    </>
  );
};

export default AssignmentsDashboard;
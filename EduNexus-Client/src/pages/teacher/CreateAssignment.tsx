import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Spinner,
  Text,
  useToast,
} from '@chakra-ui/react';
import { Navbar } from '../../components/navbar';

const CreateAssignment = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    assignment_name: '',
    subject_name: '',
    details: '',
    active: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [currentEvaluations, setCurrentEvaluations] = useState([]);
  const [currentAssignment, setCurrentAssignment] = useState(null);
  const [isLoadingEvaluations, setIsLoadingEvaluations] = useState(false);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);
  const toast = useToast();

  // Fetch assignments on component mount
  useEffect(() => {
    fetchAssignments();
  }, []);

  // Function to fetch all assignments
  const fetchAssignments = async () => {
    setIsLoadingAssignments(true);
    try {
      const response = await fetch('/api/teacher/fetch-assignments');
      const data = await response.json();
      
      if (response.ok) {
        setAssignments(data.assignments || []);
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to fetch assignments',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while fetching assignments',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoadingAssignments(false);
    }
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  
  const openDetailsModal = (assignment) => {
    setCurrentAssignment(assignment);
    setIsDetailsModalOpen(true);
    fetchAssignmentDetails(assignment.assignment_id);
  };
  
  const closeDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setCurrentEvaluations([]);
    setCurrentAssignment(null);
  };

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/teacher/create-assignment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: data.message });
        // Add assignment_id from the response to the assignment object
        const newAssignment = {
          ...formData,
          assignment_id: data.assignment_id,
        };
        // Append new assignment to list
        setAssignments((prev) => [...prev, newAssignment]);
        // Reset form data
        setFormData({
          assignment_name: '',
          subject_name: '',
          details: '',
          active: true,
        });
        closeModal();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to create assignment' });
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage({ type: 'error', text: 'An error occurred while creating the assignment' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fetch assignment details (evaluations)
  const fetchAssignmentDetails = async (assignmentId) => {
    setIsLoadingEvaluations(true);
    try {
      const response = await fetch(`/api/teacher/fetch-marks?assignment_id=${assignmentId}`);
      const data = await response.json();
      
      if (response.ok) {
        setCurrentEvaluations(data.evaluations || []);
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to fetch evaluations',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        setCurrentEvaluations([]);
      }
    } catch (error) {
      console.error('Error fetching evaluations:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while fetching evaluations',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setCurrentEvaluations([]);
    } finally {
      setIsLoadingEvaluations(false);
    }
  };

  return (
    <>
      <Navbar />
      <Box p={6} maxW="5xl" mx="auto" bg="white" boxShadow="md" borderRadius="lg">
        {message && (
          <Box
            p="4"
            mb="4"
            borderRadius="md"
            bg={message.type === 'success' ? 'green.100' : 'red.100'}
            color={message.type === 'success' ? 'green.800' : 'red.800'}
          >
            {message.text}
          </Box>
        )}

        {/* Create Assignment Button aligned to left */}
        <Box textAlign="left" mb="6">
          <Button colorScheme="purple" onClick={openModal}>
            Create Assignment
          </Button>
        </Box>

        {/* Modal Popup for Creating an Assignment */}
        <Modal isOpen={isModalOpen} onClose={closeModal}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Create New Assignment</ModalHeader>
            <ModalCloseButton />
            <form onSubmit={handleSubmit}>
              <ModalBody>
                <Box mb="4">
                  <label
                    htmlFor="assignment_name"
                    style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}
                  >
                    Assignment Name*
                  </label>
                  <input
                    type="text"
                    id="assignment_name"
                    name="assignment_name"
                    value={formData.assignment_name}
                    onChange={handleChange}
                    required
                    placeholder="Enter assignment name"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: '0.375rem',
                      border: '1px solid #CBD5E0',
                    }}
                  />
                </Box>

                <Box mb="4">
                  <label
                    htmlFor="subject_name"
                    style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}
                  >
                    Subject Name*
                  </label>
                  <input
                    type="text"
                    id="subject_name"
                    name="subject_name"
                    value={formData.subject_name}
                    onChange={handleChange}
                    required
                    placeholder="Enter subject name"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: '0.375rem',
                      border: '1px solid #CBD5E0',
                    }}
                  />
                </Box>

                <Box mb="4">
                  <label
                    htmlFor="details"
                    style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}
                  >
                    Details
                  </label>
                  <textarea
                    id="details"
                    name="details"
                    value={formData.details}
                    onChange={handleChange}
                    rows="4"
                    placeholder="Enter assignment details"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: '0.375rem',
                      border: '1px solid #CBD5E0',
                    }}
                  ></textarea>
                </Box>

                <Box mb="4">
                  <label style={{ display: 'flex', alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      name="active"
                      checked={formData.active}
                      onChange={handleChange}
                      style={{ marginRight: '0.5rem' }}
                    />
                    Active
                  </label>
                </Box>
              </ModalBody>

              <ModalFooter>
                <Button variant="ghost" onClick={closeModal} mr="3">
                  Cancel
                </Button>
                <Button colorScheme="blue" type="submit" isLoading={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Assignment'}
                </Button>
              </ModalFooter>
            </form>
          </ModalContent>
        </Modal>

        {/* Modal for showing assignment details/evaluations */}
        <Modal isOpen={isDetailsModalOpen} onClose={closeDetailsModal} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              {currentAssignment ? currentAssignment.assignment_name : 'Assignment'} - Student Evaluations
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {isLoadingEvaluations ? (
                <Box textAlign="center" py="6">
                  <Spinner size="xl" color="blue.500" />
                  <Text mt="4">Loading evaluations...</Text>
                </Box>
              ) : currentEvaluations.length === 0 ? (
                <Box py="4" textAlign="center">
                  <Text>No evaluations found for this assignment.</Text>
                </Box>
              ) : (
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Student ID</Th>
                      <Th isNumeric>Total Marks Obtained</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {currentEvaluations.map((evaluation, index) => (
                      <Tr key={index}>
                        <Td>{evaluation.student_id}</Td>
                        <Td isNumeric>{evaluation.total_marks_obtained}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              )}
            </ModalBody>
            <ModalFooter>
              <Button colorScheme="blue" onClick={closeDetailsModal}>
                Close
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Container for displaying all assignments */}
        <Box mt="8">
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>
            Assignments
          </h2>
          
          {isLoadingAssignments ? (
            <Box textAlign="center" py="6">
              <Spinner size="xl" color="blue.500" />
              <Text mt="4">Loading assignments...</Text>
            </Box>
          ) : assignments.length === 0 ? (
            <p>No assignments created yet.</p>
          ) : (
            assignments.map((assignment, index) => (
              <Box key={index} p="4" mb="4" borderWidth="1px" borderRadius="md">
                <Box display="flex" justifyContent="space-between" alignItems="center" mb="2">
                  <Text fontWeight="bold" fontSize="lg">
                    {assignment.assignment_name}
                  </Text>
                  <Badge colorScheme={assignment.active ? 'green' : 'red'}>
                    {assignment.active ? 'Active' : 'Inactive'}
                  </Badge>
                </Box>
                <p>
                  <strong>Subject Name:</strong> {assignment.subject_name}
                </p>
                {assignment.details && (
                  <p>
                    <strong>Details:</strong> {assignment.details}
                  </p>
                )}
                <Box mt="3" textAlign="right">
                  <Button 
                    size="sm" 
                    colorScheme="teal"
                    onClick={() => openDetailsModal(assignment)}
                  >
                    Show Details
                  </Button>
                </Box>
              </Box>
            ))
          )}
        </Box>
      </Box>
    </>
  );
};

export default CreateAssignment;
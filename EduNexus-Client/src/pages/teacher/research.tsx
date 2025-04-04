import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  VStack,
  HStack,
  Heading,
  Text,
  Link,
  Spinner,
  useDisclosure,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription
} from '@chakra-ui/react';
import { Navbar } from '../../components/navbar';
import { ExternalLinkIcon } from '@chakra-ui/icons';

const Research = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [researchData, setResearchData] = useState({
    topic: '',
    journals: '',
    details: ''
  });
  
  // State for success message and loading
  const [showSuccess, setShowSuccess] = useState(false);
  const [submittedTopic, setSubmittedTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // State for research results
  const [results, setResults] = useState([]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setResearchData({
      ...researchData,
      [name]: value
    });
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Save the topic for the success message
      setSubmittedTopic(researchData.topic);
      
      // Call your API endpoint
      const response = await fetch('/api/teacher/research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: researchData.topic }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch research results');
      }
      
      const data = await response.json();
      console.log(data)
      // Parse the response and transform it into the format needed for display
      const parsedResults = [];
      const responseObj = JSON.parse(data.response);
      
      Object.entries(responseObj).forEach(([index, paperObj]) => {
        // Each paperObj has a single key (paper name) with an object value
        const paperName = Object.keys(paperObj)[0];
        const paperDetails = paperObj[paperName];
        
        parsedResults.push({
          id: parseInt(index) + 1,
          name: paperName,
          link: paperDetails.link,
          summary: paperDetails.summary
        });
      });
      
      // Update results state
      setResults(parsedResults);
      
      // Close the modal and reset form
      setResearchData({ topic: '', journals: '', details: '' });
      onClose();
      
      // Show success message
      setShowSuccess(true);
      
      // Hide success message after 5 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 5000);
      
    } catch (err) {
      console.error('Error submitting research request:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
    <Navbar />
    <Box p={5}>
      <Button colorScheme="purple" onClick={onOpen}>
        Research New Topic
      </Button>

      {/* Success Alert */}
      {showSuccess && (
        <Alert 
          status="success" 
          mt={4} 
          mb={4}
          borderRadius="md"
        >
          <AlertIcon />
          <AlertTitle mr={2}>Success!</AlertTitle>
          <AlertDescription>Your research topic "{submittedTopic}" has been successfully submitted.</AlertDescription>
        </Alert>
      )}
      
      {/* Error Alert */}
      {error && (
        <Alert 
          status="error" 
          mt={4} 
          mb={4}
          borderRadius="md"
        >
          <AlertIcon />
          <AlertTitle mr={2}>Error!</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Research Request Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>New Research Request</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl id="topic" isRequired>
                <FormLabel>Topic</FormLabel>
                <Input 
                  name="topic"
                  value={researchData.topic}
                  onChange={handleInputChange}
                  placeholder="Enter research topic" 
                />
              </FormControl>
              <FormControl id="journals">
                <FormLabel>Journals</FormLabel>
                <Input 
                  name="journals"
                  value={researchData.journals}
                  onChange={handleInputChange}
                  placeholder="Preferred journals or sources" 
                />
              </FormControl>
              <FormControl id="details">
                <FormLabel>Details</FormLabel>
                <Textarea
                  name="details"
                  value={researchData.details}
                  onChange={handleInputChange}
                  placeholder="Additional research details or requirements"
                  rows={4}
                />
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button 
              colorScheme="blue" 
              onClick={handleSubmit} 
              isLoading={isLoading}
              loadingText="Searching"
            >
              Submit
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Research Results */}
      <Box mt={8}>
        <Heading size="lg" mb={4}>Research Results</Heading>
        {isLoading ? (
          <Box textAlign="center" py={10}>
            <Spinner size="xl" />
            <Text mt={4}>Searching research papers...</Text>
          </Box>
        ) : (
          <VStack spacing={4} align="stretch">
            {results.map((result) => (
              <Box 
                key={result.id}
                p={5}
                shadow="md"
                borderWidth="1px"
                borderRadius="md"
                width="100%"
              >
                <Link href={result.link} isExternal color="purple.500" fontWeight="bold">
                  {result.name} <ExternalLinkIcon mx="2px" />
                </Link>
                <Text mt={2}>{result.summary}</Text>
              </Box>
            ))}
          </VStack>
        )}
      </Box>
    </Box>
    </>
  );
};

export default Research;
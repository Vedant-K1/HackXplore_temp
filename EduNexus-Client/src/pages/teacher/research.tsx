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
  AlertDescription,
  Badge
} from '@chakra-ui/react';
import { Navbar } from '../../components/navbar';
import { ExternalLinkIcon, ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';

const Research = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [researchData, setResearchData] = useState({
    topic: '',
    details: ''
  });
  
  // State for success message and loading
  const [showSuccess, setShowSuccess] = useState(false);
  const [submittedTopic, setSubmittedTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // State for research results
  const [results, setResults] = useState([]);
  const [queryTimestamp, setQueryTimestamp] = useState(null);
  const [resultCount, setResultCount] = useState(0);
  const [expandedResults, setExpandedResults] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setResearchData({
      ...researchData,
      [name]: value
    });
  };

  const toggleResult = (index) => {
    setExpandedResults(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
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
        body: JSON.stringify({ 
          query: researchData.topic,
          max_papers: 5,
          days_back: 365
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch research results');
      }
      
      const data = await response.json();
      console.log('Research data:', data);
      
      // Update results with the correct format
      if (data.success && data.papers) {
        setResults(data.papers);
        setQueryTimestamp(data.timestamp);
        setResultCount(data.count);
        // Reset expanded results state when getting new results
        setExpandedResults({});
      } else {
        throw new Error('Invalid response format');
      }
      
      // Close the modal and reset form
      setResearchData({ topic: '', details: '' });
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

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const truncateText = (text, maxLength = 150) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
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
            {results.map((paper, index) => (
              <Box 
                key={index}
                p={5}
                shadow="md"
                borderWidth="1px"
                borderRadius="md"
                width="100%"
              >
                <HStack mb={2}>
                  <Link href={paper.url} isExternal color="purple.500" fontWeight="bold">
                    {paper.title} <ExternalLinkIcon mx="2px" />
                  </Link>
                  <Badge colorScheme="purple">{paper.year}</Badge>
                </HStack>
                <Text fontSize="sm" mb={3}>
                  {paper.authors && paper.authors.join(', ')}
                </Text>
                <Text>
                  {expandedResults[index] ? paper.summary : truncateText(paper.summary)}
                </Text>
                {paper.summary && paper.summary.length > 150 && (
                  <Button 
                    mt={2} 
                    size="sm" 
                    variant="link" 
                    colorScheme="purple"
                    onClick={() => toggleResult(index)}
                    rightIcon={expandedResults[index] ? <ChevronUpIcon /> : <ChevronDownIcon />}
                  >
                    {expandedResults[index] ? 'See less' : 'See more'}
                  </Button>
                )}
              </Box>
            ))}
            {results.length === 0 && !isLoading && (
              <Box textAlign="center" py={10}>
                <Text>No research results to display. Search for a topic to begin.</Text>
              </Box>
            )}
          </VStack>
        )}
      </Box>
    </Box>
    </>
  );
};

export default Research;
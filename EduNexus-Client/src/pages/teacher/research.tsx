import React, { useState } from 'react';
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
  SimpleGrid,
  useDisclosure
} from '@chakra-ui/react';
import { Navbar } from '../../components/navbar';
import { ExternalLinkIcon } from '@chakra-ui/icons';
// import { ExternalLinkIcon } from 'react-icons/fa';
const Research = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [researchData, setResearchData] = useState({
    topic: '',
    journals: '',
    details: ''
  });
  
  // Sample research results data
  const [results, setResults] = useState([
    {
      id: 1,
      name: 'Artificial intelligence in education: A systematic literature review',
      link: 'https://www.sciencedirect.com/science/article/pii/S0957417424010339',
      summary: 'The paper presents a comprehensive review of artificial intelligence in education (AIED) by analyzing over 2,200 articles and a detailed examination of 125 key studies. It addresses three central questions: identifying the main categories of AI applications such as adaptive learning, personalized tutoring, intelligent assessment, and emerging educational tools; exploring predominant research topics that span the technical design of educational systems and investigations into the adoption, impacts, and challenges of AIED; and evaluating major research design elements including guiding theories, methodologies, and research contexts. Overall, the review maps out the current conceptual landscape of AIED, highlighting underexplored areas and offering valuable insights for future research in this dynamic field.'
    },
    {
      id: 2,
      name: 'Google Gemini as a next generation AI educational tool: a review of emerging educational technology.',
      link: 'https://link.springer.com/content/pdf/10.1186/s40561-024-00310-z.pdf',
      summary: 'This emerging technology report discusses Google Gemini as a multimodal generative AI tool and presents its revolutionary potential for future educational technology. It introduces Gemini and its features, including versatility in processing data from text, image, audio, and video inputs and generating diverse content types. This study discusses recent empirical studies, technology in practice, and the relationship between Gemini technology and the educational landscape. This report further explores Gemini’s relevance for future educational endeavors and practical applications in emerging technologies. Also, it discusses the significant challenges and ethical considerations that must be addressed to ensure its responsible and effective integration into the educational landscape.'
    },
    {
      id: 3,
      name: 'Towards Goal-oriented Intelligent Tutoring Systems in Online Education',
      link: 'https://arxiv.org/pdf/2312.10053',
      summary: 'This work introduces Goal-oriented Intelligent Tutoring Systems (GITS) that enhance traditional ITSs by strategically planning customized exercise and assessment sequences to help students master specific concepts. To tackle the goal-oriented policy learning challenge, the authors propose a novel graph-based reinforcement learning framework called Planning-Assessment-Interaction (PAI). This framework leverages cognitive structure information to improve state representation and action selection, while a dynamically updated cognitive diagnosis model simulates student responses. The approach is validated using three benchmark datasets from various subjects, with experimental results demonstrating both its effectiveness and efficiency, along with analyses that reveal challenges across different student types.'
    }
  ]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setResearchData({
      ...researchData,
      [name]: value
    });
  };

  const handleSubmit = () => {
    // Here you would typically submit the data to an API
    console.log('Submitting research request:', researchData);
    
    // For demonstration, add a mock result
    const newResult = {
      id: results.length + 1,
      name: researchData.topic,
      link: 'https://example.com/' + researchData.topic.toLowerCase().replace(/\s+/g, '-'),
      summary: `Research on ${researchData.topic} focusing on ${researchData.journals}. ${researchData.details}`
    };
    
    setResults([newResult, ...results]);
    
    // Close the modal and reset form
    setResearchData({ topic: '', journals: '', details: '' });
    onClose();
  };

  return (
    <>
    <Navbar />
    <Box p={5}>
      <Button colorScheme="purple" onClick={onOpen}>
        Research New Topic
      </Button>

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
            <Button colorScheme="blue" onClick={handleSubmit}>
              Submit
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Research Results */}
      <Box mt={8}>
        <Heading size="lg" mb={4}>Research Results</Heading>
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
              <Link href={result.link} isExternal color="blue.500" fontWeight="bold">
                {result.name} <ExternalLinkIcon mx="2px" />
              </Link>
              <Text mt={2}>{result.summary}</Text>
            </Box>
          ))}
        </VStack>
      </Box>
    </Box>
    </>
  );
};

export default Research;
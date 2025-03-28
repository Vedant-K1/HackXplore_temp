import React, { useState } from 'react';
import {
    Box,
    Stack,
    Heading,
    Image,
    Card,
    CardBody,
    CardFooter,
    Button,
    Divider,
    Flex,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalCloseButton,
    ModalBody,
    ModalFooter,
    Text,
    Progress,
    useDisclosure,
    Table,
    Thead,
    Tr,
    Th,
    Tbody,
    Td
} from '@chakra-ui/react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { useColorModeValue } from '@chakra-ui/react';
import image1 from '../assets/cards/image1.jpg';
import image2 from '../assets/cards/image2.jpg';
import image3 from '../assets/cards/image3.jpg';
import image4 from '../assets/cards/image4.jpg';
import image5 from '../assets/cards/image5.jpg';
import image6 from '../assets/cards/image6.jpg';
import image7 from '../assets/cards/image7.jpg';
import image8 from '../assets/cards/image8.jpg';
import image9 from '../assets/cards/image9.jpg';
import image10 from '../assets/cards/image10.jpg';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import NeedleChart from './NeedleChart';

interface JobRoleCardProps {
    jobTitle: string;
    jobDescription: string;
}

const JobRoleCard: React.FC<JobRoleCardProps> = ({ jobTitle, jobDescription }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [skillGapData, setSkillGapData] = useState<any>(null);
    const [inDemandData, setInDemandData] = useState<any>(null);
    const [formattedData, setFormattedData] = useState<any>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const navigate = useNavigate();

    const images = [image1, image2, image3, image4, image5, image6, image7, image8, image9, image10];
    const randomIndex = Math.floor(Math.random() * images.length);
    const randomImage = images[randomIndex];

    const handleMouseEnter = () => setIsHovered(true);
    const handleMouseLeave = () => setIsHovered(false);

    const fetchSkillGapData = async (job_role: string) => {
        setIsLoading(true);
        try {
            // Send the job title as part of the POST request
            const response = await axios.post('/api/job_seeker/skill-gap-analysis', { job_role });
            setSkillGapData(response.data.skill_gap_analysis);
            setInDemandData(response.data.required_skills)
            const formatted = Object.entries(response.data.required_skills || {}).map(([key, value]) => ({
                skill: key,
                demand: value,
                fullMark: 150,
            }));
            setFormattedData(formatted);
        } catch (error) {
            console.error('Error fetching skill gap data:', error);
        } finally {
            setIsLoading(false);
        }
    };


    const renderSkills = (skills: any) => {
        if (!skills || typeof skills !== 'object') {
            return <Text>No skills data available</Text>;
        }
        return Object.entries(skills).map(([skill, description]) => (
            <Box key={skill} mb="3">
                <Heading size="sm">{skill}</Heading>
                <Text>{description}</Text>
            </Box>
        ));
    };

    const getGaugeValue = (level: string) => {
        switch (level.toLowerCase()) {
            case 'easy':
                return { value: 20, color: 'green.400' };
            case 'easy-moderate':
                return { value: 40, color: 'teal.400' };
            case 'moderate':
                return { value: 60, color: 'yellow.400' };
            case 'moderate-difficult':
                return { value: 80, color: 'orange.400' };
            case 'difficult':
                return { value: 100, color: 'red.400' };
            default:
                return { value: 0, color: 'gray.400' };
        }
    };
    


    return (
        <Box boxShadow='lg' rounded='md' position="relative" overflow="hidden">
            <Card
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                height="800px"
                display="flex"
                flexDirection="column"
                justifyContent="space-between"
            >
                <CardBody>
                    <Flex direction="column" justify="space-between">
                        <Image
                            src={randomImage}
                            alt={jobTitle}
                            borderRadius='lg'
                            h="250px"
                        />
                        <Stack mt='3' spacing='3'>
                            <Heading size='md'>{jobTitle}</Heading>
                            <Box fontSize="sm" textAlign={"justify"} color="gray.600" flex="1">
                                {jobDescription}
                            </Box>
                        </Stack>
                    </Flex>
                </CardBody>
                <Divider />
                <CardFooter>
                    <Button
                        variant='solid'
                        bg={'purple.400'}
                        w='100%'
                        color={useColorModeValue('white', 'white')}
                        _hover={{
                            bg: useColorModeValue('purple.600', 'purple.600'),
                            color: useColorModeValue('white', 'white'),
                            transform: "scale(1.05)",
                        }}
                        onClick={() => {
                            fetchSkillGapData(jobTitle);  // Pass jobTitle to the function
                            onOpen();  // Open the modal
                        }}
                    >
                        View
                    </Button>
                </CardFooter>
            </Card>

            {/* Skill Gap Analysis Modal */}
            <Modal isOpen={isOpen} onClose={onClose} size="4xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Skill Gap Analysis for {jobTitle}:</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        {isLoading ? (
                            <Box textAlign="center" p="5">
                                <Text>Fetching your skill gap analysis...</Text>
                                <Progress size="sm" isIndeterminate colorScheme="purple" mt="4" />
                            </Box>
                        ) : skillGapData ? (
                            <Stack spacing="4">
                                <Box mb={6}>
                                    <Heading size="md" color="purple.600" mb={4}>
                                        Required Skills:
                                    </Heading>
                                    <ResponsiveContainer width="100%" height={400}>
                                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={formattedData}>
                                            <PolarGrid />
                                            <PolarAngleAxis dataKey="skill" />
                                            <PolarRadiusAxis />
                                            <Radar name="Demand" dataKey="demand" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </Box>
                                <Box>
                                    <Heading size="md" color="purple.600" marginBottom={2}>Transferable Skills:</Heading>
                                    {renderSkills(skillGapData.transferable_skills)}
                                </Box>

                                <Box>
                                    <Heading size="md" color="purple.600" marginBottom={2}>Required Skill Development:</Heading>
                                    {renderSkills(skillGapData.required_skill_development)}
                                </Box>

                                <NeedleChart level={skillGapData.journey_assessment.level} justification={skillGapData.journey_assessment.justification} />
                            </Stack>
                        ) : (
                            <Text>No data available</Text>
                        )}
                    </ModalBody>

                    <ModalFooter>
                        <Button colorScheme="purple" onClick={() => navigate('/job-seeker/dashboard')}>Go to Dashboard</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

        </Box>
    );
};

export default JobRoleCard;

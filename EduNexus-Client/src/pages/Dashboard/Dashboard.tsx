import React, { useState, useEffect } from 'react';
import {
    ChakraProvider,
    Box,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    theme,
    extendTheme,
    Text,
    VStack,
    Progress,
    Center,
    useToast
} from '@chakra-ui/react';
import { Navbar } from '../../components/navbar';
import axios from 'axios';
import { UserProfile } from './UserProfile';
import { SkillAssess } from './SkillAssess';
import { RecommendCourses } from './RecommendCourses';

interface UserData {
    full_name: string;
    age: string;
    gender: string;
    email: string;
    soft_skill_assessment: {
        quiz: {
            summary: string;
            observations: { [key: string]: string };
            recommendations: { [key: string]: string };
        },
        roleplay: {}[];
    };
    technical_assessment: {
        knowledgeScores: { [key: string]: { score: number; maxScore: number } };
        interestScores: { [key: string]: { score: number; maxScore: number } };
    }
    required_skills:  { [key: string]: number };
}

const purpleTheme = extendTheme({
    ...theme,
    colors: {
        ...theme.colors,
        purple: {
            ...theme.colors.purple,
            500: '#805AD5',
        },
    },
});


const Dashboard = () => {

    const toast = useToast();
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const strengthsAndWeaknesses = {
        strengths: ['Time Management', 'Prioritization', 'Delegation'],
        weaknesses: ['Communication', 'Stress Management', 'Articulation'],
        improvementAreas: ['Confidence Building', 'Presentation Skills', 'Risk Assessment'],
    };

    useEffect(() => {

        const fetchUserData = async () => {
            try {
                const response = await axios.get('/api/job_seeker/user-dashboard', { withCredentials: true });
                setUserData(response.data.user_data);
                setLoading(false);
            } catch (error) {
                toast({
                    title: 'Failed to load questions.',
                    description: 'Please try again later.',
                    status: 'error',
                    duration: 3000,
                    isClosable: true,
                });
            }
        };
        fetchUserData();
    }, [toast]);

    if (loading) {
        return <Center w="100%" h="100vh">
            <VStack spacing={4}>
                <Progress size="lg" isIndeterminate colorScheme="purple" w="90%" />
                <Text fontSize="lg" color="purple.700">
                    Loading your dashboard...
                </Text>
            </VStack>
        </Center>
    }

    if (error) {
        return <Center><Text>{error}</Text></Center>;
    }

    return (
        <ChakraProvider theme={purpleTheme}>
            <Navbar />
            <Box mx="auto" p={4}>
                <Tabs isFitted variant="enclosed">
                    <TabList mb="1em">
                        <Tab _selected={{ bgColor: 'purple.500', color: 'white' }}>User Profile</Tab>
                        <Tab _selected={{ bgColor: 'purple.500', color: 'white' }}>Skill Assessments</Tab>
                        <Tab _selected={{ bgColor: 'purple.500', color: 'white' }}>Recommended Courses</Tab>
                    </TabList>
                    <TabPanels>
                        <TabPanel>
                            {userData && (
                                <UserProfile jobMarketData={userData.required_skills} name={userData.full_name} age={userData.age} gender={userData.gender} email={userData.email} strengthsAndWeaknesses={strengthsAndWeaknesses} />
                            )}
                        </TabPanel>
                        <TabPanel>
                            {userData && <SkillAssess userData={userData} />}
                        </TabPanel>
                        <TabPanel>
                            <RecommendCourses recommendedCourses={userData.online_courses} />
                        </TabPanel>
                    </TabPanels>
                </Tabs>
            </Box>
        </ChakraProvider>
    );
};

export default Dashboard;

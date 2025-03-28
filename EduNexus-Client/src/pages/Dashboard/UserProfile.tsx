import {
    Box,
    Heading,
    Text,
    VStack,
    HStack,
    List,
    ListItem,
    ListIcon,
    Center,
    Avatar,
} from '@chakra-ui/react';
import { CheckCircleIcon, ArrowRightIcon } from '@chakra-ui/icons';
import {
    Cell,
    Pie,
    PieChart,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

interface StrengthsAndWeaknesses {
    strengths: string[];
    weaknesses: string[];
    improvementAreas: string[];
}

export const UserProfile = ({
    name,
    age,
    gender,
    email,
    strengthsAndWeaknesses,
    jobMarketData,
}: {
    name: string;
    age: string;
    gender: string;
    email: string;
    strengthsAndWeaknesses: StrengthsAndWeaknesses;
    jobMarketData: Record<string, number>;
}) => {
    // Transform jobMarketData from object to array for Recharts
    const jobMarketDataArray = Object.entries(jobMarketData).map(([skill, demand]) => ({
        skill,
        demand,
    }));

    const COLORS = ['#FF6384', '#36A2EB', '#FFCE56', '#4CAF50', '#9966FF', '#FF9F40', '#FF4567', '#00C49F', '#0088FE', '#FFBB28'];

    return (
        <Box>
            <Center>
                <Heading size="xl" mb={4}>
                    User Profile
                </Heading>
            </Center>
            <Box borderWidth="1px" borderRadius="lg" p={6} boxShadow="lg" mb={20} bg="purple.50">
                <HStack spacing={6} align="center">
                    <Avatar name={name} size="xl" />
                    <VStack align="start">
                        <Text fontSize="2xl" fontWeight="bold" color="purple.600">
                            {name}
                        </Text>
                        <Text fontSize="md" color="purple.600">
                            <b>Age:</b> {age}
                        </Text>
                        <Text fontSize="md" color="purple.600">
                            <b>Gender:</b> {gender}
                        </Text>
                        <Text fontSize="md" color="purple.600">
                            <b>Email:</b> {email}
                        </Text>
                    </VStack>
                </HStack>
            </Box>

            <Heading size="lg" mb={4} mt={8} color="purple.700">
                Performance Insights
            </Heading>
            <HStack align="start" spacing={8} mb={20}>
                <VStack align="start">
                    <Heading size="sm" color="purple.600">
                        Strengths
                    </Heading>
                    <List spacing={2}>
                        {strengthsAndWeaknesses.strengths.map((strength, index) => (
                            <ListItem key={index}>
                                <ListIcon as={CheckCircleIcon} color="green.500" />
                                {strength}
                            </ListItem>
                        ))}
                    </List>
                </VStack>

                <VStack align="start">
                    <Heading size="sm" color="purple.600">
                        Weaknesses
                    </Heading>
                    <List spacing={2}>
                        {strengthsAndWeaknesses.weaknesses.map((weakness, index) => (
                            <ListItem key={index}>
                                <ListIcon as={ArrowRightIcon} color="red.500" />
                                {weakness}
                            </ListItem>
                        ))}
                    </List>
                </VStack>

                <VStack align="start">
                    <Heading size="sm" color="purple.600">
                        Areas for Improvement
                    </Heading>
                    <List spacing={2}>
                        {strengthsAndWeaknesses.improvementAreas.map((area, index) => (
                            <ListItem key={index}>
                                <ListIcon as={ArrowRightIcon} color="blue.500" />
                                {area}
                            </ListItem>
                        ))}
                    </List>
                </VStack>
            </HStack>

            {/* AI Skill Matcher */}
            <Heading size="lg" mb={5} color="purple.700">
                AI Skill Matcher
            </Heading>
            <VStack align="start" spacing={4} mb={20}>
                {/* Map job roles here */}
            </VStack>

            {/* Job Market Analysis */}
            <Heading size="lg" mb={5} color="purple.700">
                Job Market Analysis
            </Heading>
            <Box borderWidth="1px" borderRadius="lg" p={4} mb={20} boxShadow="lg" bg="purple.50">
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            data={jobMarketDataArray}
                            dataKey="demand"
                            nameKey="skill"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            fill="#805AD5"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                        >
                            {jobMarketDataArray.map((_entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(value, name) => [`${value}%`, name]} />
                    </PieChart>
                </ResponsiveContainer>
            </Box>
        </Box>
    );
};

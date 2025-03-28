import React, { useState } from 'react';
import {
    Box,
    Heading,
    Text,
    VStack,
    HStack,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Center
} from '@chakra-ui/react';
import { PieChart, Pie,Sector, Cell } from 'recharts';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface UserData {
    full_name: string;
    age: string;
    gender: string;
    email: string;
    soft_skill_assessment: {
        quiz : {
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
}

const renderActiveShape = (props) => {
    const {
        cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle,
        fill, payload, percent, value,
    } = props;
    const RADIAN = Math.PI / 180;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    return (
        <g>
            <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill}>{payload.name}</text>
            <Sector
                cx={cx}
                cy={cy}
                innerRadius={innerRadius}
                outerRadius={outerRadius}
                startAngle={startAngle}
                endAngle={endAngle}
                fill={fill}
            />
            <Sector
                cx={cx}
                cy={cy}
                startAngle={startAngle}
                endAngle={endAngle}
                innerRadius={outerRadius + 6}
                outerRadius={outerRadius + 10}
                fill={fill}
            />
            <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
            <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
            <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333">{`Score: ${value}`}</text>
            <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey + 20} textAnchor={textAnchor} fill="#999">
                {`(${(percent * 100).toFixed(2)}%)`}
            </text>
        </g>
    );
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];



export const SkillAssess = ({userData} : {userData: UserData}) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [selectedSoftSkillSection, setSelectedSoftSkillSection] = useState('mcq');
    // Transforming hard skills data for bar charts
    const knowledgeData = Object.keys(userData.technical_assessment.knowledgeScores).map((skill) => ({
        name: skill,
        Score: (userData.technical_assessment.knowledgeScores[skill].score / userData.technical_assessment.knowledgeScores[skill].maxScore) * 100,
    }));

    const interestData = Object.keys(userData.technical_assessment.interestScores).map((skill) => ({
        name: skill,
        Score: (userData.technical_assessment.interestScores[skill].score / userData.technical_assessment.interestScores[skill].maxScore) * 100,
    }));


    const onPieEnter = (_:number, index:number) => {
        setActiveIndex(index);
    };
    return (
        <Box>
            <Center>
                <Heading size="xl" mb={4}>
                    Skill Assessment
                </Heading>
            </Center>

            {/* Hard Skills */}
            <Heading size="lg" mb={8} color="purple.700">
                Hard Skills Analysis:
            </Heading>

            <HStack spacing={4} align="stretch" mb={20}>
                <Box borderWidth="1px" borderRadius="lg" p={4} flex="1" boxShadow="lg">
                    <Heading size="sm" mb={2} color="purple.600">
                        Knowledge-Based Assessment
                    </Heading>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={knowledgeData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="Score">
                                {knowledgeData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </Box>

                <Box borderWidth="1px" borderRadius="lg" p={4} flex="1" boxShadow="lg">
                    <Heading size="sm" mb={2} color="purple.600">
                        Interest-Based Assessment
                    </Heading>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                activeIndex={activeIndex}
                                activeShape={renderActiveShape}
                                data={interestData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="Score"
                                onMouseEnter={onPieEnter}
                            >
                                {interestData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                </Box>
            </HStack>

            {/* Soft Skills */}
            <Heading size="lg" mb={8} color="purple.700">
                Soft Skills Analysis:
            </Heading>

            <HStack spacing={4} mb={6}>
                <Box
                    as="button"
                    p={3}
                    borderWidth="1px"
                    borderRadius="lg"
                    bg={selectedSoftSkillSection === 'mcq' ? 'purple.500' : 'gray.200'}
                    color={selectedSoftSkillSection === 'mcq' ? 'white' : 'black'}
                    onClick={() => setSelectedSoftSkillSection('mcq')}
                >
                    Scenario-based Quiz Results
                </Box>
                <Box
                    as="button"
                    p={3}
                    borderWidth="1px"
                    borderRadius="lg"
                    bg={selectedSoftSkillSection === 'interview' ? 'purple.500' : 'gray.200'}
                    color={selectedSoftSkillSection === 'interview' ? 'white' : 'black'}
                    onClick={() => setSelectedSoftSkillSection('interview')}
                >
                    Roleplay Exercise Results
                </Box>
            </HStack>

            {/* Render Selected Section */}
            {selectedSoftSkillSection === 'mcq' ? (
                <Box borderWidth="1px" boxShadow={"dark-lg"} borderRadius="lg" p={4} mb={6} bg="purple.50">
                    <Text mb={4}>
                        <b>Summary:</b> {userData.soft_skill_assessment.quiz.summary}
                    </Text>
                    <Heading size="sm" mb={2} color="purple.600">
                        Observations:
                    </Heading>
                    <VStack align="start" spacing={3}>
                        {Object.entries(userData.soft_skill_assessment.quiz.observations).map(([key, value]) => (
                            <Box key={key}>
                                <Text>
                                    <b>{key}:</b> {value}
                                </Text>
                            </Box>
                        ))}
                    </VStack>

                    <Heading size="sm" mt={4} mb={2} color="purple.600">
                        Recommendations:
                    </Heading>
                    <VStack align="start" spacing={3}>
                        {Object.entries(userData.soft_skill_assessment.quiz.recommendations).map(([key, value]) => (
                            <Box key={key}>
                                <Text>
                                    <b>{key}:</b> {value}
                                </Text>
                            </Box>
                        ))}
                    </VStack>
                </Box>
            ) : (
                <Table variant='striped' shadow={"dark-lg"} colorScheme="purple" textAlign="center">
                    <Thead>
                        <Tr>
                            <Th textAlign="center">Skill</Th>
                            <Th textAlign="center">Description</Th>
                            <Th textAlign="center">Score (Out of 10)</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {userData.soft_skill_assessment.roleplay
                            .filter(skill => skill.score !== "None" && Object.values(skill)[0] !== "None")
                            .map((skill, index) => (
                                <Tr key={index}>
                                    <Td textAlign="center" width={"200px"}>
                                        <b>{Object.keys(skill)[0].replace(/([a-z])([A-Z])/g, '$1 $2')}</b>
                                    </Td>
                                    <Td>{Object.values(skill)[0]}</Td>
                                    <Td textAlign="center" width={"170px"}>{skill.score}</Td>
                                </Tr>
                            ))}
                    </Tbody>
                </Table>
            )}
        </Box>
    );
};
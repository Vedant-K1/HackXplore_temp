import React from 'react';
import { Box, Heading, Text, Flex } from '@chakra-ui/react';

const LEVELS = [
    { name: 'Easy', color: '#38A169' },
    { name: 'Easy-Moderate', color: '#2C7A7B' },
    { name: 'Moderate', color: '#D69E2E' },
    { name: 'Moderate-Difficult', color: '#DD6B20' },
    { name: 'Difficult', color: '#E53E3E' },
];

const getRotationAngle = (level: string) => {
    switch (level.toLowerCase()) {
        case 'easy': return -85;
        case 'easy-moderate': return -45;
        case 'moderate': return 0;
        case 'moderate-difficult': return 45;
        case 'difficult': return 80;
        default: return -90;
    }
};

interface GaugeChartProps {
    level: string;
    justification: string;
}

const GaugeChart: React.FC<GaugeChartProps> = ({ level, justification }) => {
    const rotationAngle = getRotationAngle(level);

    return (
        <Box textAlign="center" mt={6}>
            <Heading size="md" color="purple.600" mb={4}>
                Journey Assessment
            </Heading>

            {/* Semi-Circular Gauge */}
            <Box position="relative" w="300px" h="150px" mx="auto">
                <svg
                    viewBox="-100 -100 200 100"
                    style={{
                        width: '100%',
                        height: '100%',
                        overflow: 'visible',
                    }}
                >
                    {/* Gauge Segments */}
                    {LEVELS.map((segment, i) => {
                        const startAngle = -90 + i * 36; // 180 degrees / 5 segments = 36 degrees per segment
                        const endAngle = startAngle + 36;
                        const start = polarToCartesian(0, 0, 80, startAngle);
                        const end = polarToCartesian(0, 0, 80, endAngle);

                        const path = `
                            M ${start.x} ${start.y}
                            A 80 80 0 0 1 ${end.x} ${end.y}
                            L 0 0
                            Z
                        `;

                        return (
                            <path
                                key={segment.name}
                                d={path}
                                fill={segment.color}
                                stroke="white"
                                strokeWidth="2"
                            />
                        );
                    })}

                    {/* Needle */}
                    <g transform={`rotate(${rotationAngle})`}>
                        <path
                            d="M-3 0 L3 0 L0 -70 Z"
                            fill="#6B46C1"
                            stroke="#6B46C1"
                        />
                        <circle
                            cx="0"
                            cy="0"
                            r="6"
                            fill="#6B46C1"
                            stroke="white"
                            strokeWidth="2"
                        />
                    </g>
                </svg>
            </Box>

            {/* Level Indicators */}
            <Flex justify="space-between" mt={4} px={2}>
                {LEVELS.map((segment) => (
                    <Text
                        key={segment.name}
                        fontSize="sm"
                        color={segment.color}
                        textAlign="center"
                        flex="1"
                    >
                        {segment.name}
                    </Text>
                ))}
            </Flex>

            {/* Justification */}
            <Text mt={4} px={6} lineHeight="1.6">
                {justification}
            </Text>
        </Box>
    );
};

// Utility function to calculate polar coordinates
const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees - 90) * (Math.PI / 180.0);
    return {
        x: centerX + radius * Math.cos(angleInRadians),
        y: centerY + radius * Math.sin(angleInRadians),
    };
};

export default GaugeChart;

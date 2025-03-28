import { Box, useColorModeValue, Flex, Text, VStack, Button } from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import axios from 'axios';

interface Subsection {
    title: string;
    content: string;
}

interface Subject {
    subject_name: string;
    title_for_the_content: string;
    content: string;
    subsections: Subsection[];
    urls: string[];
}

type Data = Subject[];

export const Sidebar = ({
    data,
    setSelectedSubject,
    isLoading,
    setCurrentIndex,
    setQuizData,
    setQuiz2Data,
    setQuiz3Data,
    trans
}: {
    data: Data;
    setSelectedSubject: (subject: Subject) => void;
    isLoading: boolean;
    setCurrentIndex: (index: number) => void;
    setQuizData: any;
    setQuiz2Data: any;
    setQuiz3Data: any;
    trans: any;
}) => {
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        localStorage.setItem('active_index', activeIndex.toString());
        setSelectedSubject(data[activeIndex]);
        setCurrentIndex(activeIndex);
    }, [activeIndex, data, setSelectedSubject, setCurrentIndex]);

    const changeCon = (index2: number) => {
        setActiveIndex(index2);
        setQuizData(null);
        setQuiz2Data(null);
        setQuiz3Data(null);
    };

    const fetchQuizData = async () => {
        setQuiz2Data(null);
        try {
            setActiveIndex(data.length);
            const moduleid = localStorage.getItem('moduleid');
            const websearch = localStorage.getItem('websearch');
            const source_lang = localStorage.getItem('source_lang');
            localStorage.setItem('quiztype', "first");
            const response = await axios.get(`/api/student/quiz/${moduleid}/${source_lang}/${websearch}`);
            setQuizData(response.data.quiz);
        } catch (error) {
            console.error('Error fetching quiz data:', error);
        }
    };

    const fetchQuiz2Data = async () => {
        setQuizData(null);
        try {
            setActiveIndex(data.length + 1);
            const moduleid = localStorage.getItem('moduleid');
            const websearch = localStorage.getItem('websearch');
            const source_lang = localStorage.getItem('source_lang');
            localStorage.setItem('quiztype', "second");
            const response = await axios.get(`/api/student/quiz2/${moduleid}/${source_lang}/${websearch}`);
            setQuiz2Data(response.data.quiz);
        } catch (error) {
            console.error('Error fetching quiz2 data:', error);
        }
    };

    const fetchQuiz3Data = async () => {
        setQuizData(null);
        try {
            setActiveIndex(data.length + 2);
            const moduleid = localStorage.getItem('moduleid');
            const websearch = localStorage.getItem('websearch');
            const source_lang = localStorage.getItem('source_lang');
            const response = await axios.get(`/api/student/quiz3/${moduleid}/${source_lang}/${websearch}`);
            setQuiz3Data(response.data.quiz);
        } catch (error) {
            console.error('Error fetching quiz3 data:', error);
        }
    };

    if (isLoading) {
        return <></>; // Render nothing or a loading spinner here
    }

    return (
        <VStack
            w={"30%"}
            boxShadow={'10px 0 15px -5px rgba(0, 0, 0, 0.3)'}
            height={"120%"}
            bg={useColorModeValue('white', 'white')}
            color={useColorModeValue('black', 'white')}
        >
            <Box w="full" bg={useColorModeValue('purple.500', 'white')} p={5}>
                <Text className='main-heading' textAlign={'center'} color={useColorModeValue('white', 'white')} fontSize={30}>
                    <b>{trans('Lessons')}</b>
                </Text>
            </Box>
            <Box px={3}>
                {data.map((item: Subject, index: number) => (
                    <Button
                        key={index}
                        onClick={() => changeCon(index)}
                        mb={2}
                        bg={activeIndex === index ? "purple.600" : ""}
                        color={activeIndex === index ? "white" : "black"}
                        _hover={{ bg: useColorModeValue('purple.300', 'white'), color: "black", transform: "scale(1.05)" }}
                        transition="all 0.2s"
                        p={4}
                        borderRadius="md"
                        textAlign={'center'}
                        w="100%"
                        whiteSpace="normal"
                        height="auto"
                    >
                        <Flex align="center" justify={'flex-start'}>
                            <Box>{index + 1}. {item.subject_name}</Box>
                        </Flex>
                    </Button>
                ))}
                <Button
                    onClick={fetchQuizData}
                    mb={5}
                    bg={activeIndex === data.length ? "purple.600" : ""}
                    color={activeIndex === data.length ? "white" : "black"}
                    _hover={{ bg: useColorModeValue('purple.300', 'white'), color: "black", transform: "scale(1.05)" }}
                    transition="all 0.2s"
                    p={4}
                    borderRadius="md"
                    textAlign={'center'}
                    w="100%"
                    whiteSpace="normal"
                    height="auto"
                >
                    <Flex align="center" justify={'flex-start'}>
                        <Box>{trans('Quiz 1: Theoretical Test')}</Box>
                    </Flex>
                </Button>
                <Button
                    onClick={fetchQuiz2Data}
                    mb={5}
                    bg={activeIndex === data.length + 1 ? "purple.600" : ""}
                    color={activeIndex === data.length + 1 ? "white" : "black"}
                    _hover={{ bg: useColorModeValue('purple.300', 'white'), color: "black", transform: "scale(1.05)" }}
                    transition="all 0.2s"
                    p={4}
                    borderRadius="md"
                    textAlign={'center'}
                    w="100%"
                    whiteSpace="normal"
                    height="auto"
                >
                    <Flex align="center" justify={'flex-start'}>
                        <Box>{trans('Quiz 2: Applied Knowledge')}</Box>
                    </Flex>
                </Button>
                <Button
                    onClick={fetchQuiz3Data}
                    mb={5}
                    bg={activeIndex === data.length + 2 ? "purple.600" : ""}
                    color={activeIndex === data.length + 2 ? "white" : "black"}
                    _hover={{ bg: useColorModeValue('purple.300', 'white'), color: "black", transform: "scale(1.05)" }}
                    transition="all 0.2s"
                    p={4}
                    borderRadius="md"
                    textAlign={'center'}
                    w="100%"
                    whiteSpace="normal"
                    height="auto"
                >
                    <Flex align="center" justify={'flex-start'}>
                        <Box>{trans('Quiz 3: Voice Quiz')}</Box>
                    </Flex>
                </Button>
            </Box>
        </VStack>
    );
};

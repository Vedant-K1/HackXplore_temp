import { Box, useToast, Spinner, useColorModeValue, Text, VStack, Link, List, ListItem, Button, Center, Flex, Textarea, useDisclosure } from '@chakra-ui/react';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FaFilePdf, FaFileAudio, FaStickyNote, FaTimes, FaSave } from "react-icons/fa";
import Quiz from './Quiz';
import VoiceQuiz from './VoiceQuiz';
import Slideshow from '../course_overview/Slideshow';

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

interface TypingAnimationProps {
    text: string;
}

interface ContentSecProps {
    subject?: Subject; // Optional subject
    isLoading: boolean;
    images: string[];
    index: number;
    data_len: number;
    quiz: any;
    quiz2: any;
    quiz3: any;
    trans: any;
    videos: string[];
}

const TypingHeadingAnimation = ({ text }: TypingAnimationProps) => {
    const [typedText, setTypedText] = useState('');

    useEffect(() => {
        let currentIndex = 0;
        const interval = setInterval(() => {
            if (currentIndex <= text.length) {
                setTypedText(text.substring(0, currentIndex));
                currentIndex++;
            } else {
                clearInterval(interval);
            }
        }, 10);

        return () => clearInterval(interval);
    }, [text]);

    return <Text className='feature-heading' fontSize="3xl" textAlign="justify" overflowWrap="break-word"><b>{typedText}</b></Text>;
};

const TypingContentAnimation = ({ text }: TypingAnimationProps) => {
    const [typedText, setTypedText] = useState('');

    useEffect(() => {
        let currentIndex = 0;
        const interval = setInterval(() => {
            if (currentIndex <= text.length) {
                setTypedText(text.substring(0, currentIndex));
                currentIndex++;
            } else {
                clearInterval(interval);
            }
        }, 10); // Adjust typing speed here

        return () => clearInterval(interval);
    }, [text]);

    return <Text className='content' fontSize={"lg"} textAlign="justify" overflowWrap="break-word">{typedText}</Text>;
};

export const ContentSec = ({
    subject,
    isLoading,
    images,
    index,
    data_len,
    quiz,
    quiz2,
    quiz3,
    trans,
    videos
}: ContentSecProps) => {
    const toast = useToast();
    const [isSpinnerLoading, setIsSpinnerLoading] = useState(false);
    const [audioSrc, setAudioSrc] = useState<string | null>(null);
    const [showStickyNote, setShowStickyNote] = useState(false);
    const [stickyNote, setStickyNote] = useState('');
    const noteRef = useRef<HTMLDivElement>(null);

    const firstHalf = images[index]?.slice(0, Math.ceil(images[index].length / 2)) || [];
    const secondHalf = images[index]?.slice(Math.ceil(images[index].length / 2)) || [];
    const subsectionfirstHalf = subject?.subsections.slice(0, Math.ceil(subject?.subsections?.length / 2)) || [];
    const subsectionsecondHalf = subject?.subsections.slice(Math.ceil(subject?.subsections?.length / 2)) || [];

    // Load any saved notes when component mounts or subject changes
    useEffect(() => {
        if (subject) {
            const savedNote = localStorage.getItem(`note_${subject.title_for_the_content}`);
            if (savedNote) {
                setStickyNote(savedNote);
            } else {
                setStickyNote('');
            }
        }
    }, [subject]);

    useEffect(() => {
        setAudioSrc(null);
    }, [subject]);

    // Handle clicks outside the sticky note to close it
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (noteRef.current && !noteRef.current.contains(event.target as Node)) {
                // Don't close if clicking the sticky note button
                const target = event.target as HTMLElement;
                if (target.closest('button')?.id === 'stickyNoteBtn') {
                    return;
                }
                setShowStickyNote(false);
            }
        }
        
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [noteRef]);

    const fetchAudio = async (content: Subsection[]) => {
        if (!subject) return; // Ensure subject exists
        try {
            setIsSpinnerLoading(true);
            const source_lang = localStorage.getItem('source_lang') || undefined;

            const payload = {
                content,
                subject_title: subject.title_for_the_content,
                subject_content: subject.content,
                language: source_lang,
            };

            const response = await axios.post('/api/student/generate-audio', payload, {
                responseType: 'blob',
            });
            const blob = new Blob([response.data], { type: 'audio/mpeg' });
            const url = window.URL.createObjectURL(blob);
            setIsSpinnerLoading(false);
            setAudioSrc(url);
        } catch (error) {
            console.error('Error fetching audio:', error);
        }
    };

    const handledownload = async () => {
        try {
            const moduleid = localStorage.getItem('moduleid') || undefined;
            const source_lang = localStorage.getItem('source_lang') || undefined;

            const response = await axios.get(`/api/student/query2/${moduleid}/${source_lang}/download`, {
                responseType: 'blob',
            });
            const blob = new Blob([response.data], { type: 'application/octet-stream' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'course.pdf');
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast({
                title: 'File downloaded.',
                description: 'Check your storage. Your course is downloaded.',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const saveNote = () => {
        if (subject) {
            localStorage.setItem(`note_${subject.title_for_the_content}`, stickyNote);
            toast({
                title: 'Note saved',
                description: 'Your note has been saved successfully',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const toggleStickyNote = () => {
        setShowStickyNote(!showStickyNote);
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <Box textAlign="center" w="205vh" height={"60vh"}>
                    <Spinner size="xl" mt={"140px"} color="purple.500" />
                    <Text mt={4}>Generating Content...</Text>
                </Box>
            );
        }

        if (index < data_len) {
            return (
                <Box px={5} mt={4} width={'full'} height={'100vh'} overflowY={"scroll"} position="relative">
                    {/* Flex container for the heading and sticky notes button */}
                    <Flex justifyContent="space-between" alignItems="center" width="full" mb={5}>
                        <Text className='main-heading' fontSize={"5xl"}><b>{subject?.title_for_the_content ?? ''}</b></Text>
                        
                        {/* Sticky Notes button on the right */}
                        <Button
                            id="stickyNoteBtn"
                            p={6}
                            color={"white"}
                            rounded="md"
                            _hover={{
                                transform: "translateY(-2px)",
                                boxShadow: "md",
                                transition: "transform 0.3s ease",
                                bg: "purple.600"
                            }}
                            bg={"purple.400"}
                            boxShadow="lg"
                            onClick={toggleStickyNote}
                            leftIcon={<FaStickyNote />}
                        >
                            Sticky Notes
                        </Button>
                    </Flex>
                    
                    {/* Inline Sticky Note */}
                    {showStickyNote && (
                        <Box
                            ref={noteRef}
                            position="absolute"
                            right="20px"
                            top="80px"
                            width="350px"
                            bg="white"
                            borderRadius="md"
                            boxShadow="lg"
                            p={4}
                            zIndex={10}
                            borderWidth="1px"
                            borderColor="white"
                            animation="fadeIn 0.3s ease-in-out"
                            sx={{
                                '@keyframes fadeIn': {
                                    '0%': { opacity: 0, transform: 'translateY(-10px)' },
                                    '100%': { opacity: 1, transform: 'translateY(0)' }
                                }
                            }}
                        >
                            <Flex justifyContent="space-between" alignItems="center" mb={2}>
                                <Text fontWeight="bold">Notes for: {subject?.title_for_the_content}</Text>
                                <Button size="sm" variant="ghost" onClick={toggleStickyNote} p={1}>
                                    <FaTimes />
                                </Button>
                            </Flex>
                            <Textarea
                                placeholder="Write your notes here..."
                                value={stickyNote}
                                onChange={(e) => setStickyNote(e.target.value)}
                                minHeight="200px"
                                bg="white"
                                borderColor="black"
                                _hover={{ borderColor: "black" }}
                                fontSize="md"
                                mb={2}
                            />
                            <Button
                                size="sm"
                                colorScheme="purple"
                                leftIcon={<FaSave />}
                                onClick={saveNote}
                                width="full"
                            >
                                Save Notes
                            </Button>
                        </Box>
                    )}
                    
                    <Text className='feature-heading' mb={5} fontSize={"3xl"}>{trans('Find it boring to read? Download and study through voice!')}</Text>
                    <Button
                        variant="outline"
                        mb={10}
                        colorScheme="purple" _hover={{ bg: useColorModeValue('purple.600', 'purple.800'), color: useColorModeValue('white', 'white') }}
                        onClick={() => subject?.subsections && fetchAudio(subject.subsections)}>
                        <FaFileAudio size={20} style={{marginRight:8}}/>
                        {trans('Generate Audio')}
                    </Button>
                    {isSpinnerLoading ? (
                        <Box textAlign="center">
                            <Spinner size="sm" color="purple.500" />
                            <Text mt={2}>Loading...</Text>
                        </Box>
                    ) : audioSrc ? (
                        <audio controls>
                            <source src={audioSrc} type="audio/mpeg" />
                            Your browser does not support the audio element.
                        </audio>
                    ) : null}
                    <TypingContentAnimation text={(subject?.content ?? '').replace(/\*/g, '')} />
                    <Center>
                        <Slideshow images={firstHalf} />
                    </Center>
                    <VStack spacing={8} mb={8}>
                        {subsectionfirstHalf.map((section, index) => (
                            <Box key={index} width={"100%"}>
                                <TypingHeadingAnimation text={section.title} />
                                <TypingContentAnimation text={section.content.replace(/\*/g, '')} />
                            </Box>
                        ))}
                        <Center>
                            <Slideshow images={secondHalf} />
                        </Center>
                        {subsectionsecondHalf.map((section, index) => (
                            <Box key={index} width={"100%"}>
                                <TypingHeadingAnimation text={section.title} />
                                <TypingContentAnimation text={section.content.replace(/\*/g, '')} />
                            </Box>
                        ))}
                    </VStack>
                    <Text fontSize="3xl" className='feature-heading'><b>{trans('Links of Resources:')}</b></Text>
                    <List mb={5}>
                        {Array.isArray(subject?.urls) ? (
                            subject.urls.map((url, index) => (
                                <ListItem key={index}>
                                    <Link fontSize={20} href={url} isExternal color={useColorModeValue('purple.600', 'gray.500')}>
                                        {url}
                                    </Link>
                                </ListItem>
                            ))
                        ) : (
                            <Text>No Links available</Text>
                        )}
                    </List>
                    <Text fontSize="3xl" className='feature-heading'><b>{trans('Links of Videos:')}</b></Text>
                    <List mb={5}>
                        {Array.isArray(videos[index]) ? (
                            videos[index].map((url, index) => (
                                <ListItem key={index}>
                                    <Link fontSize={20} href={url} isExternal color={useColorModeValue('purple.600', 'gray.500')}>
                                        {url}
                                    </Link>
                                </ListItem>
                            ))
                        ) : (
                            <Text>No Links available</Text>
                        )}
                    </List>
                    <Text fontSize="3xl" className='feature-heading'>{trans('Want to Learn Offline? Download the whole Course here:')}</Text>
                    <Button
                        variant="outline"
                        mb={10}
                        onClick={handledownload}
                        colorScheme="purple" _hover={{ bg: useColorModeValue('purple.600', 'purple.800'), color: useColorModeValue('white', 'white') }}
                    >
                        <FaFilePdf size={20} style={{marginRight:8}}/>
                        {trans('Download Course')}
                    </Button>
                </Box>
            );
        } else if (index === data_len) {
            return quiz ? <Quiz data={quiz} trans={trans} /> : <LoadingQuiz />;
        } else if (index === data_len + 1) {
            return quiz2 ? <Quiz data={quiz2} trans={trans} /> : <LoadingQuiz />;
        } else if (index === data_len + 2) {
            return quiz3 ? <VoiceQuiz data={quiz3} trans={trans} /> : <LoadingQuiz />;
        }
    };

    const LoadingQuiz = () => (
        <Box textAlign="center" w="100%" mt={40}>
            <Spinner size="xl" color="purple.500" />
            <Text mt={4}>Generating Quiz...</Text>
        </Box>
    );

    return <>{renderContent()}</>;
};
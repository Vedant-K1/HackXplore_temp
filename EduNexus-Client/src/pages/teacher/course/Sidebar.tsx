import { useState, useEffect} from 'react';
import { useForm } from 'react-hook-form';
import {
    Box,
    Button,
    Heading,
    Input,
    VStack,
    Tab,
    TabList,
    TabPanel,
    TabPanels,
    Tabs,
    SimpleGrid,
    Flex,
    Text,
    Image,
    Collapse,
    Spinner,
    useToast,
} from '@chakra-ui/react';
import axios from 'axios';
import { FaRegClone, FaSave } from 'react-icons/fa';
import { MdOutlinePlayLesson, MdOutlineCloudUpload } from "react-icons/md";
import { FaRegImages } from "react-icons/fa6";

interface SidebarProps {
    contentData: { [submodule: string]: string }[];
    setSelectedSubmodule: (submodule: string) => void;
    isLoading: boolean;
    setCurrentIndex: (index: number) => void;
    relevant_images: (string[])[];
    uploadedImages: string[];
    onInsertImage: (imageUrl: string, index: number) => void;
    setUploadedImages: React.Dispatch<React.SetStateAction<string[]>>;
    handleSaveLesson: () => Promise<void>;
    handleSaveppt: () => Promise<void>;
    downloadpdf: () => Promise<void>;
}

const Sidebar: React.FC<SidebarProps> = ({
    contentData = [],
    setSelectedSubmodule,
    isLoading,
    setCurrentIndex,
    relevant_images,
    uploadedImages,
    onInsertImage,
    setUploadedImages,
    handleSaveLesson,
    handleSaveppt,
    downloadpdf,
}) => {
    const [activeTabIndex, setActiveTabIndex] = useState<number | null>(null);
    const { register, handleSubmit, reset } = useForm<{ prompt: string }>();
    const [activeContentIndex, setActiveContentIndex] = useState<number>(0);
    const submoduleKeys = contentData.map(submodule => Object.keys(submodule)[0]);
    const [imageGenerationList, setImageGenerationList] = useState<string[]>([]);
    const [imageloading, setImageLoading] = useState<boolean>(false);
    const toast = useToast();

    const changeCon = (index: number) => {
        setActiveContentIndex(index);
    };

    const handleImageGeneration = async (data: { prompt: string }) => {
        const ngrokUrl = 'https://4a77-34-23-225-66.ngrok-free.app';
        setImageLoading(true);
        try {
            const response = await axios.post(`${ngrokUrl}/generate-image`, { prompt: data.prompt });
            const newImage = `data:image/png;base64,${response.data.image}`;
            setImageGenerationList(prevList => [...prevList, newImage]);
            toast({
                title: "Image Generated",
                description: "Your image has been generated successfully.",
                status: "success",
                duration: 3000,
                isClosable: true,
            });
            reset();
        } catch (error) {
            console.error('Error generating image:', error);
            alert('Failed to generate image. Please try again.');
        } finally {
            setImageLoading(false);
        }
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement> | null, file?: File) => {
        if (event) {
            event.preventDefault();
            const files = Array.from(event.dataTransfer.files);
            files.forEach(file => handleDrop(null, file));
            return;
        }
    
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64Image = reader.result as string;
                const uniqueIdentifier = `${file.name}-${file.size}`;
                if (!uploadedImages.some(url => url === uniqueIdentifier)) {
                    setUploadedImages(prevImages => [...prevImages, base64Image]);
                }
            };
            reader.readAsDataURL(file);
        }
    };
    

    const categorizeImages = (images: string[]) => {
        const textbookImages = new Set<string>();
        const googleImages = new Set<string>();
        images.forEach((image) => {
            if (image.startsWith('https://')) {
                googleImages.add(image);
            } else {
                textbookImages.add(image);
            }
        });
        return { textbookImages: Array.from(textbookImages), googleImages: Array.from(googleImages) };
    };

    const allTextbookImagesSet = new Set<string>();
    const allGoogleImagesSet = new Set<string>();

    relevant_images.forEach((images) => {
        const { textbookImages, googleImages } = categorizeImages(images);
        textbookImages.forEach(image => allTextbookImagesSet.add(image));
        googleImages.forEach(image => allGoogleImagesSet.add(image));
    });


    const allTextbookImages = Array.from(allTextbookImagesSet);
    const allGoogleImages = Array.from(allGoogleImagesSet);


    useEffect(() => {
        localStorage.setItem('active_content_index', activeContentIndex.toString());
        setSelectedSubmodule(submoduleKeys[activeContentIndex]);
        setCurrentIndex(activeContentIndex);
    }, [activeContentIndex, submoduleKeys, setSelectedSubmodule, setCurrentIndex]);

    if (isLoading) {
        return null;
    }

    const toggleTab = (tabIndex: number) => {
        setActiveTabIndex(prevIndex => (prevIndex === tabIndex ? null : tabIndex));
    };

    return (
        <Box height={"100vh"} bg={"#F8F6F4"}>
            <Tabs
                orientation="vertical"
                variant="unstyled"
                index={activeTabIndex ?? -1}
            >
                <TabList bg={'#D1D1D1'} height={"100vh"} p={"2"} borderTopRightRadius={20} borderBottomRightRadius={20}>
                    <Tab
                        _hover={{ transform: 'scale(1.05)', backgroundColor: 'gray.100', border: 'none' }}
                        _selected={{ bg: 'purple.500', color: 'white' }}
                        padding={1}
                        my={2}
                        _focus={{ outline: 'none', boxShadow: 'none' }}
                        width={["80px", "100px", "70px"]}
                        borderRadius="md"
                        onClick={() => toggleTab(0)}
                    >
                        <Flex direction="column" align="center">
                            <MdOutlinePlayLesson style={{ marginBottom: '4px', fontSize: '24px' }} />
                            <Text fontSize="sm">Topics</Text>
                        </Flex>
                    </Tab>
                    <Tab
                        _hover={{ transform: 'scale(1.05)', backgroundColor: 'gray.100', border: 'none' }}
                        _selected={{ bg: 'purple.500', color: 'white' }}
                        padding={1}
                        my={2}
                        _focus={{ outline: 'none', boxShadow: 'none' }}
                        width={["80px", "100px", "70px"]}
                        borderRadius="md"
                        onClick={() => toggleTab(1)}
                    >
                        <Flex direction="column" align="center">
                            <FaRegImages style={{ marginBottom: '4px', fontSize: '24px' }} />
                            <Text fontSize="sm">Images</Text>
                        </Flex>
                    </Tab>
                    <Tab
                        _hover={{ transform: 'scale(1.05)', backgroundColor: 'gray.100', border: 'none' }}
                        _selected={{ bg: 'purple.500', color: 'white' }}
                        padding={1}
                        my={2}
                        _focus={{ outline: 'none', boxShadow: 'none' }}
                        width={["80px", "100px", "70px"]}
                        borderRadius="md"
                        onClick={() => toggleTab(2)}
                    >
                        <Flex direction="column" align="center">
                            <MdOutlineCloudUpload style={{ marginBottom: '4px', fontSize: '24px' }} />
                            <Text fontSize="sm">Uploaded</Text>
                        </Flex>
                    </Tab>
                    <Tab
                        _hover={{ transform: 'scale(1.05)', backgroundColor: 'gray.100', border: 'none' }}
                        _selected={{ bg: 'purple.500', color: 'white' }}
                        padding={1}
                        my={2}
                        _focus={{ outline: 'none', boxShadow: 'none' }}
                        width={["80px", "100px", "70px"]}
                        borderRadius="md"
                        onClick={() => handleSaveLesson()}
                    >
                        <Flex direction="column" align="center">
                            <FaSave style={{ marginBottom: '4px', fontSize: '24px' }} />
                            <Text fontSize="sm">Save</Text>
                        </Flex>
                    </Tab>
                    <Tab
                        _hover={{ transform: 'scale(1.05)', backgroundColor: 'gray.100', border: 'none' }}
                        _selected={{ bg: 'purple.500', color: 'white' }}
                        padding={1}
                        my={2}
                        _focus={{ outline: 'none', boxShadow: 'none' }}
                        width={["80px", "100px", "70px"]}
                        borderRadius="md"
                        onClick={() => handleSaveppt()}
                    >
                        <Flex direction="column" align="center">
                            <FaSave style={{ marginBottom: '4px', fontSize: '24px' }} />
                            <Text fontSize="sm">Download PPT</Text>
                        </Flex>
                    </Tab>
                    <Tab
                        _hover={{ transform: 'scale(1.05)', backgroundColor: 'gray.100', border: 'none' }}
                        _selected={{ bg: 'purple.500', color: 'white' }}
                        padding={1}
                        my={2}
                        _focus={{ outline: 'none', boxShadow: 'none' }}
                        width={["80px", "100px", "70px"]}
                        borderRadius="md"
                        onClick={() => downloadpdf()}
                    >
                        <Flex direction="column" align="center">
                            <FaSave style={{ marginBottom: '4px', fontSize: '24px' }} />
                            <Text fontSize="sm">Download PDF</Text>
                        </Flex>
                    </Tab>
                </TabList>

                {activeTabIndex !== null && (
                    <TabPanels mt={2} bg={'#DFDFDF'} height={'100vh'} borderRadius={20} boxShadow={'10px 0 15px -5px rgba(0, 0, 0, 0.3)'}>
                        <Collapse in={activeTabIndex === 0} transition={{ enter: { duration: 0.1 }, exit: { duration: 0.1 } }}>
                            <TabPanel width={["80px", "200px", "350px"]}>
                                <Heading as="h3" size="md" textAlign="center" mb={4}>
                                    Lessons
                                </Heading>
                                <VStack spacing={2} align="stretch">
                                    {submoduleKeys.map((submodule, index) => (
                                        <Button
                                            key={index}
                                            variant="ghost"
                                            p={"25"}
                                            onClick={() => changeCon(index)}
                                            justifyContent="flex-start"
                                            borderColor={'purple.300'}
                                            borderWidth={3}
                                            borderRadius={15}
                                            _focus={{ outline: 'none', boxShadow: 'none' }}
                                            bg={activeContentIndex === index ? 'purple.500' : 'white'}
                                            color={activeContentIndex === index ? 'white' : 'inherit'}
                                            className="roboto-bold"
                                            _hover={{ transform: 'scale(1.05)', textDecoration: 'none', borderColor: 'purple.200' }}
                                            style={{
                                                whiteSpace: 'normal',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                lineHeight: '1.5',
                                            }}
                                        >
                                            {index + 1}. {submodule}
                                        </Button>
                                    ))}
                                </VStack>
                            </TabPanel>
                        </Collapse>

                        <Collapse in={activeTabIndex === 1} transition={{ enter: { duration: 0.1 }, exit: { duration: 0.1 } }}>
                            <TabPanel width={["80px", "200px", "350px"]} p={"10px"}>
                                <Heading as="h3" size="md" textAlign="center" mb={2}>
                                    Images
                                </Heading>
                                <Tabs variant="enclosed" colorScheme="purple">
                                    <TabList>
                                        <Tab
                                            border={'none'}
                                            _hover={{ transform: 'scale(1.05)', cursor: 'pointer' }}
                                            transition="transform 0.2s ease"
                                        >
                                            <b>Textbook/Links</b>
                                        </Tab>
                                        <Tab
                                            border={"none"}
                                            _hover={{ transform: 'scale(1.05)', cursor: 'pointer' }}
                                            transition="transform 0.2s ease"
                                        >
                                            <b>Google</b>
                                        </Tab>
                                        <Tab
                                            border={'none'}
                                            _hover={{ transform: 'scale(1.05)', cursor: 'pointer' }}
                                            transition="transform 0.2s ease"
                                        >
                                            <b>Generate Image</b>
                                        </Tab>
                                    </TabList>

                                    <TabPanels>
                                        <TabPanel>
                                            <Box height={"600px"} overflowY="auto">
                                                {allTextbookImages.length === 0 ? (
                                                    <Box textAlign="center" p={4}>
                                                        No images available.
                                                    </Box>
                                                ) : (
                                                    <SimpleGrid columns={[2, 2, 2]}>
                                                        {allTextbookImages.map((image, index) => (
                                                            <Box
                                                                key={index}
                                                                p={2}
                                                                transition="transform 0.2s ease-in-out"
                                                                _hover={{ transform: 'scale(1.3)' }}
                                                            >
                                                                <Image
                                                                    src={`data:image/png;base64,${image}`}
                                                                    onClick={() => onInsertImage(`data:image/png;base64,${image}`, index)}
                                                                    alt={`Textbook Link ${index}`}
                                                                    style={{ width: '100%', height: 'auto' }}
                                                                />
                                                            </Box>
                                                        ))}
                                                    </SimpleGrid>
                                                )}
                                            </Box>
                                        </TabPanel>

                                        <TabPanel>
                                            <Box maxHeight="600px" overflowY="auto">
                                                {allGoogleImages.length === 0 ? (
                                                    <Box textAlign="center" p={4}>
                                                        No images available.
                                                    </Box>
                                                ) : (
                                                    <SimpleGrid columns={[2, 2, 2]}>
                                                        {allGoogleImages.map((image, index) => (
                                                            <Box
                                                                key={index}
                                                                p={2}
                                                                transition="transform 0.2s ease-in-out"
                                                                _hover={{ transform: 'scale(1.3)' }}
                                                            >
                                                                <Image
                                                                    src={image}
                                                                    onClick={() => onInsertImage(image, index)}
                                                                    alt={`Google Link ${index}`}
                                                                    style={{ width: '100%', height: 'auto' }}
                                                                />
                                                            </Box>
                                                        ))}
                                                    </SimpleGrid>
                                                )}
                                            </Box>
                                        </TabPanel>

                                        <TabPanel>
                                            <Box mb={4}>
                                                <Flex align="center" mb={4} gap={2}>
                                                    <form onSubmit={handleSubmit(handleImageGeneration)} style={{ display: 'flex', alignItems: 'center' }}>
                                                        <Input
                                                            placeholder="Enter image description..."
                                                            {...register('prompt')}
                                                            mr={2}
                                                            width="250px"
                                                        />
                                                        <Button colorScheme="purple" type="submit" disabled={imageloading}>
                                                            {imageloading ? <Spinner size="sm" /> : <FaRegClone />}
                                                        </Button>
                                                    </form>
                                                </Flex>

                                                <Box minHeight={"600px"} maxHeight="600px" overflowY="auto">
                                                    {imageGenerationList.length === 0 ? (
                                                        <Box textAlign="center" p={4}>
                                                            No generated images yet.
                                                        </Box>
                                                    ) : (
                                                        <SimpleGrid columns={[2, 2, 2]}>
                                                            {imageGenerationList.map((image, index) => (
                                                                <Box key={index} p={2} _hover={{ transform: 'scale(1.3)' }}>
                                                                    <Image
                                                                        src={image}
                                                                        onClick={() => onInsertImage(image, index)}
                                                                        alt={`Generated Image ${index}`}
                                                                        style={{ width: '100%', height: 'auto' }}
                                                                    />
                                                                </Box>
                                                            ))}
                                                        </SimpleGrid>
                                                    )}
                                                </Box>
                                            </Box>
                                        </TabPanel>
                                    </TabPanels>
                                </Tabs>
                            </TabPanel>

                        </Collapse>

                        <Collapse in={activeTabIndex === 2} transition={{ enter: { duration: 0.1 }, exit: { duration: 0.1 } }}>
                            <TabPanel width={["80px", "200px", "350px"]}>
                                <Heading as="h3" size="md" textAlign="center" mb={4}>
                                    Uploaded Images
                                </Heading>
                                <Box height={"600px"} onDrop={handleDrop}
                                    onDragOver={(e) => e.preventDefault()} overflowY="auto">
                                    {uploadedImages.length === 0 ? (
                                        <Box textAlign="center" p={4}>
                                            Drag and drop images here
                                        </Box>
                                    ) : (
                                        <SimpleGrid columns={[2, 2, 2]}>
                                            {uploadedImages.map((image, index) => (
                                                <Box
                                                    key={index}
                                                    p={2}
                                                    transition="transform 0.2s ease-in-out"
                                                    _hover={{ transform: 'scale(1.3)' }}
                                                >
                                                    <Image
                                                        src={image}
                                                        onClick={() => onInsertImage(image, index)}
                                                        alt={`Uploaded Link ${index}`}
                                                        style={{ width: '100%', height: 'auto' }}
                                                    />
                                                </Box>
                                            ))}
                                        </SimpleGrid>
                                    )}
                                </Box>
                            </TabPanel>
                        </Collapse>

                    </TabPanels>
                )}
            </Tabs>

        </Box>
    );
};

export default Sidebar;

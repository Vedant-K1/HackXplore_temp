import { useState } from 'react';
import {
    Box,
    Heading,
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
} from '@chakra-ui/react';
import { AiOutlineCloudUpload, AiOutlineSave , AiOutlineDownload} from 'react-icons/ai';

interface SidebarProps {
    isLoading: boolean;
    uploadedImages: string[];
    onInsertImage: (imageUrl: string) => void;
    setUploadedImages: React.Dispatch<React.SetStateAction<string[]>>;
    handleSaveLesson: () => Promise<void>;
    downloadDocxFile: () => Promise<void>;
}

const LabManualSidebar: React.FC<SidebarProps> = ({
    isLoading,
    uploadedImages,
    onInsertImage,
    setUploadedImages,
    handleSaveLesson,
    downloadDocxFile,
}) => {
    const [activeTabIndex, setActiveTabIndex] = useState<number | null>(null);

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
                            <AiOutlineCloudUpload style={{ marginBottom: '4px', fontSize: '24px' }} />
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
                            <AiOutlineSave style={{ marginBottom: '4px', fontSize: '24px' }} />
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
                        onClick={() => downloadDocxFile()}
                    >
                        <Flex direction="column" align="center">
                            <AiOutlineDownload style={{ marginBottom: '4px', fontSize: '24px' }} />
                            <Text fontSize="sm">Download</Text>
                        </Flex>
                    </Tab>
                </TabList>

                {activeTabIndex !== null && (
                    <TabPanels mt={2} bg={'#DFDFDF'} height={'100vh'} borderRadius={20} boxShadow={'10px 0 15px -5px rgba(0, 0, 0, 0.3)'}>
                        <Collapse in={activeTabIndex === 0} transition={{ enter: { duration: 0.1 }, exit: { duration: 0.1 } }}>
                            <TabPanel width={["80px", "200px", "350px"]}>
                                <Heading as="h3" size="md" textAlign="center" mb={4}>
                                    Uploaded Images
                                </Heading>
                                <Box height={"600px"} onDrop={handleDrop}
                                    onDragOver={(e) => e.preventDefault()} overflowY="auto">
                                    {uploadedImages.length === 0 ? (
                                        <Box textAlign="center" p={4}>
                                            No images available.
                                        </Box>
                                    ) : (
                                        <SimpleGrid columns={[2, 2, 2]}>
                                            {uploadedImages.map((image, index) => (
                                                <Box
                                                    key={index}
                                                    p={2}
                                                    transition="transform 0.2s ease-in-out"
                                                    _hover={{ transform: 'scale(1.1)' }}
                                                >
                                                    <Image
                                                        src={image}
                                                        onClick={() => onInsertImage(image)}
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

export default LabManualSidebar;

import { useState, useEffect} from 'react';
import {
    Box,
    Button,
    Heading,
    VStack,
    Tab,
    TabList,
    TabPanel,
    TabPanels,
    Tabs,
    Flex,
    Text,
    Collapse,
} from '@chakra-ui/react';
import { AiOutlineFileText } from 'react-icons/ai';

interface SidebarProps {
    contentData: { [submodule: string]: string }[];
    setSelectedSubmodule: (submodule: string) => void;
    isLoading: boolean;
    setCurrentIndex: (index: number) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
    contentData = [],
    setSelectedSubmodule,
    isLoading,
    setCurrentIndex,
}) => {
    const [activeTabIndex, setActiveTabIndex] = useState<number | null>(null);
    const [activeContentIndex, setActiveContentIndex] = useState<number>(0);
    const submoduleKeys = contentData.map(submodule => Object.keys(submodule)[0]);

    const changeCon = (index: number) => {
        setActiveContentIndex(index);
    };

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
                            <AiOutlineFileText style={{ marginBottom: '4px', fontSize: '24px' }} />
                            <Text fontSize="sm">Topics</Text>
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
                    </TabPanels>
                )}
            </Tabs>

        </Box>
    );
};

export default Sidebar;

import { useState } from 'react';
import {
    Box,
    Tab,
    TabList,
    Tabs,
    Flex,
    Text,
} from '@chakra-ui/react';
import { AiOutlineDownload} from 'react-icons/ai';

interface SidebarProps {
    isLoading: boolean;
    downloadDocxFile: () => Promise<void>;
}

const LabManualSidebar: React.FC<SidebarProps> = ({
    isLoading,
    downloadDocxFile,
}) => {
    const [activeTabIndex, setActiveTabIndex] = useState<number | null>(null);

    if (isLoading) {
        return null;
    }

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
                        onClick={() => downloadDocxFile()}
                    >
                        <Flex direction="column" align="center">
                            <AiOutlineDownload style={{ marginBottom: '4px', fontSize: '24px' }} />
                            <Text fontSize="sm">Download</Text>
                        </Flex>
                    </Tab>
                </TabList>
            </Tabs>

        </Box>
    );
};

export default LabManualSidebar;

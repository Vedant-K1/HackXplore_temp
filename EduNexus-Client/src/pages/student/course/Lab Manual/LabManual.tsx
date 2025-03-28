import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Spinner,
    Heading,
    VStack,
    HStack,
    Flex,
} from '@chakra-ui/react';
import { Navbar } from '../../../../components/navbar';
import LabManualContent from './LabManualContent';
import LabManualSidebar from './LabManualSidebar';

const StudentLabManual: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [markdownContent, setMarkdownContent] = useState<string>('');
    const [imageList, setImageList] = useState<string[]>([]);
    const lab_manual_id = localStorage.getItem('lab_manual_id');

    const downloadDocxFile = async () => {
        try {
            const response = await axios.post(
                '/api/teacher/create-lab-manual-docx',
                { lab_manual_id:  lab_manual_id},
                {
                    responseType: 'blob',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `experiment.docx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error downloading document:', error);
        }
    };

    useEffect(() => {
        const fetchContent = async () => {
            setIsLoading(true);
            const response = await axios.post('/api/teacher/fetch-lab-manual', {
                lab_manual_id: lab_manual_id
            }, { withCredentials: true });
            const mkmg = JSON.parse(response.data.markdown_images);
            setMarkdownContent(response.data.markdown_content);
            setImageList(mkmg);
            setIsLoading(false);
        };

        fetchContent();
    }, []);

    if (isLoading) {
        return (
            <>
                <Navbar />
                <Flex justify="center" align="center" width="100vw" height="90vh" textAlign="center">
                    <VStack>
                        <Spinner size="xl" color="purple.500" />
                        <Heading>Generating Content...</Heading>
                    </VStack>
                </Flex>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <HStack alignItems="flex-start" bg={"#F8F6F4"} width={'99vw'} overflow='hidden'>
                <LabManualSidebar
                    isLoading={isLoading}
                    downloadDocxFile={downloadDocxFile}
                />
                <LabManualContent
                    markdownText={markdownContent}
                    imageList={imageList}
                />
            </HStack>
        </>
    );
};

export default StudentLabManual;

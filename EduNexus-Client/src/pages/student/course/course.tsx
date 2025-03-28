import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Spinner,
    Heading,
    VStack,
    HStack,
    Flex,
} from '@chakra-ui/react';
import Sidebar from './Sidebar';
import ContentSec from './ContentSec';
import { Navbar } from '../../../components/navbar';

interface ContentDataItem {
    [submoduleTitle: string]: string;
}

const PerContent: React.FC = () => {
    const [data, setData] = useState<ContentDataItem[]>([]);
    const [selectedSubmodule, setSelectedSubmodule] = useState<string | null>(null);
    const [images, setImages] = useState<string[][]>([]);
    // const [videos, setVideos] = useState<string[][]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [hasInsertedImages, setHasInsertedImages] = useState(false);
    const [imageLists, setImageLists] = useState<string[][]>([]);
    const lesson_id = localStorage.getItem('lesson_id');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.post('/api/teacher/get-lesson', {
                    lesson_id: lesson_id
                }, { withCredentials: true });
                const mk = JSON.parse(response.data.markdown_content);
                const rimg = JSON.parse(response.data.relevant_images);
                const markimg = JSON.parse(response.data.markdown_images);
                console.log(response.data);
                setImageLists(markimg)
                setImages(rimg);
                setData(mk);
                setHasInsertedImages(true);
                setIsLoading(false);
                setSelectedSubmodule(Object.keys(response.data.markdown_content[0] || {})[0]);

                // setImages(relevant_images_testing);
                // setData(content_testing);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        if (data && images && data.length > 0 && images.length > 0 && !hasInsertedImages) {
            setHasInsertedImages(true);
            setIsLoading(false);
        }
    }, [data, images, hasInsertedImages]);

    if (isLoading || !imageLists.length) {
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
                {/* Sidebar */}
                <Sidebar
                    contentData={data} // Pass the data
                    setSelectedSubmodule={(submodule) => {
                        setSelectedSubmodule(submodule);
                        setCurrentIndex(data.findIndex(item => Object.keys(item)[0] === submodule)); // Set the current index based on the submodule
                    }}
                    isLoading={isLoading}
                    setCurrentIndex={setCurrentIndex}
                />


                {selectedSubmodule && (
                    <ContentSec
                        contentData={data} // Pass the entire data
                        selectedSubmodule={selectedSubmodule}
                        imagelist={imageLists}
                    // videos={videos}
                    />
                )}
            </HStack>
        </>
    );
};

export default PerContent;

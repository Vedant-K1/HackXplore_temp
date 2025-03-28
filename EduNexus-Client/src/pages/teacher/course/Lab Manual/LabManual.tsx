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

const LabManual: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [uploadedImages, setUploadedImages] = useState<string[]>([]);
    const [markdownContent, setMarkdownContent] = useState<string>('');
    const [imageList, setImageList] = useState<string[]>([]);
    const lab_manual_id = localStorage.getItem('lab_manual_id');

    const handleSaveLabManual = async () => {
        const course_id = localStorage.getItem('course_id');
        const exp_num = Number(localStorage.getItem('exp_num'));
        const exp_aim = localStorage.getItem('exp_aim');

        try {
            const response = await axios.post('/api/teacher/add-lab-manual', {
                markdown_content: markdownContent,
                uploaded_images: uploadedImages,
                course_id: course_id,
                markdown_images: imageList,
                lab_manual_id: lab_manual_id,
                exp_aim: exp_aim,
                exp_num: exp_num,
            }, { withCredentials: true });

            alert("Lab Manual Saved Successfully!");
            if (response.data.response) {
                localStorage.setItem('lab_manual_id', response.data.lab_manual_id.toString());
            }
        } catch (error) {
            console.error('Error saving lab manual:', error);
            alert('Failed to save lab manual.');
        }
    };

    const insertImageAtCursor = (imageUrl: string) => {
        const textarea = document.getElementById("lab-markdown-textarea") as HTMLTextAreaElement;
        if (textarea) {
            const { selectionStart, selectionEnd, value } = textarea;
    
            setImageList((prevImageList) => {
                const imageIndex = prevImageList.length;
                const uniqueId = `image-${imageIndex}`;
                console.log(imageIndex);
                const newContent = `${value.slice(0, selectionStart)}![${uniqueId}]${value.slice(selectionEnd)}`;
                setMarkdownContent(newContent);
    
                return [...prevImageList, imageUrl];
            });
        }
    };
    
    
    

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
            if (lab_manual_id == null) {
                try {
                    const storedData = localStorage.getItem('labManualData');
                    const formData = storedData ? JSON.parse(storedData) : {};
                    const course_name = formData.course_name;
                    const exp_aim = formData.exp_aim;
                    const include_videos = formData.include_videos;
                    const exp_num = formData.exp_num;
                    const lab_components = formData.lab_components;
                    const response = await axios.post('/api/teacher/generate-lab-manual', {
                        course_name,
                        exp_aim,
                        include_videos,
                        exp_num,
                        lab_components
                    });

                    setMarkdownContent(response.data.MarkdownContent);
                } catch (error) {
                    console.error("Error fetching content:", error);
                }
            } else {
                const response = await axios.post('/api/teacher/fetch-lab-manual', {
                    lab_manual_id: lab_manual_id
                }, { withCredentials: true });
                const umg = JSON.parse(response.data.uploaded_images);
                const mkmg = JSON.parse(response.data.markdown_images);
                setUploadedImages(umg);
                setMarkdownContent(response.data.markdown_content);
                setImageList(mkmg);
            }
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
                        <Heading>Generating Lab Manual...</Heading>
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
                    uploadedImages={uploadedImages}
                    onInsertImage={insertImageAtCursor}
                    setUploadedImages={setUploadedImages}
                    handleSaveLesson={handleSaveLabManual}
                    downloadDocxFile={downloadDocxFile}
                />
                <LabManualContent
                    markdownText={markdownContent}
                    setImageLists={setImageList}
                    setMarkdownContent={setMarkdownContent}
                    imageList={imageList}
                />
            </HStack>
        </>
    );
};

export default LabManual;

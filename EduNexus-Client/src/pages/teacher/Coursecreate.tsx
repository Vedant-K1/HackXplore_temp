import React, { useState } from 'react';
import {
  Box,
  VStack,
  Heading,
  Input,
  Flex,
  Spinner,
  Button,
  FormControl,
  FormLabel,
  Center,
  Text,
  useToast,
  useColorModeValue,
  FormErrorMessage,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Textarea,
  HStack,
  IconButton,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Navbar } from '../../components/navbar';
import { useDisclosure } from "@chakra-ui/react";
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { ArrowUpIcon, ArrowDownIcon } from "@chakra-ui/icons";
import * as yup from 'yup';

const schema = yup.object().shape({
  CourseName: yup.string().required('lesson name is required'),
  NumLects: yup.string().required('lesson style is required'),

});

type LessonData = {
  [key: string]: string;
};

const CourseCreate = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [lessonData, setLessonData] = useState<LessonData>({});
  const { isOpen, onOpen, onClose } = useDisclosure();

  const { register, handleSubmit, formState: { errors }, getValues } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      CourseName: '',
      NumLects: '',
    },
  });


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPdfFile(e.target.files[0]);
    }
  };

  const onSubmit = async (data: { [key: string]: any }) => {
    const formData = new FormData();
    formData.append('course_name', data.CourseName);
    formData.append('num_lectures', data.NumLects);


    if (pdfFile) {
      formData.append('syllabus', pdfFile);
    }

    setLoading(true);

    try {
      const response = await axios.post('/api/teacher/generate-lesson', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.response) {
        setLessonData(response.data.lessons);
        onOpen();
      } else {
        toast({
          title: 'Failed to create lesson',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'An error occurred',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    try {
      const formData = new FormData();
      const values = getValues();
      formData.append('course_name', values.CourseName);
      formData.append('num_lectures', values.NumLects);
      formData.append('lessons', JSON.stringify(lessonData));
      const response = await axios.post('/api/teacher/create-course', formData);
      localStorage.setItem('course_name', response.data.course_name);
      localStorage.setItem('course_id', response.data.course_id);

      if (response.status === 200) {

        toast({
          title: 'Lessons and Course saved successfully!',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        navigate('/teacher/scheduler');
      } else {
        toast({
          title: 'Failed to save lessons',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'An error occurred while saving lessons',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleEdit = (key: keyof LessonData, value: LessonData[keyof LessonData]) => {
    setLessonData((prevData) => ({ ...prevData, [key]: value }));
  };

  const reorderLessons = (index: number, direction: number) => {
    const entries = Object.entries(lessonData);
    if (index + direction < 0 || index + direction >= entries.length) {
      return;
    }
    const [removed] = entries.splice(index, 1);
    entries.splice(index + direction, 0, removed);
    setLessonData(Object.fromEntries(entries));
  };


  return (
    <>
      {loading ? (
        <>
          <Navbar />
          <Flex justify="center" align="center" width="100vw" height="90vh" textAlign="center">
            <VStack>
              <Spinner size="xl" color="purple.500" />
              <Heading>Generating Lesson Plan...</Heading>
            </VStack>
          </Flex>
        </>
      ) : (
        <>
          <Box bg="purple.200" minHeight={'100vh'} minWidth={'100vw'}>
            <Navbar />
            <Box display="flex" alignItems="center" justifyContent="center" p={10}>
              <Box maxWidth="5xl" bg="white" width="40%" p={10} borderWidth={1} borderRadius="xl" boxShadow="lg">
                <Center>
                  <Text className='main-heading' fontSize={"5xl"} color={"purple.600"}>
                    <b>Generate Course</b>
                  </Text>
                </Center>
                <form onSubmit={handleSubmit(onSubmit)}>
                  <FormControl mb={"5"} mt={5} isInvalid={!!errors.CourseName} isRequired>
                    <FormLabel className='feature-heading' letterSpacing={2}><b>Course Name:</b></FormLabel>
                    <Input
                      placeholder="Enter the course name"
                      {...register('CourseName')}
                      borderColor={'purple.600'}
                      _hover={{ borderColor: "purple.600" }}
                    />
                    <FormErrorMessage>{errors.CourseName?.message}</FormErrorMessage>
                  </FormControl>

                  <FormControl mb={"5"} isInvalid={!!errors.NumLects} isRequired>
                    <FormLabel className='feature-heading' letterSpacing={2}><b>Minimum Number of Lectures:</b></FormLabel>
                    <Input
                      placeholder="Describe the lesson"
                      {...register('NumLects')}
                      borderColor={'purple.600'}
                      _hover={{ borderColor: "purple.600" }}
                    />
                    <FormErrorMessage>{errors.NumLects?.message}</FormErrorMessage>
                  </FormControl>
                  <FormControl mb={"5"} isRequired>
                    <FormLabel className='feature-heading' letterSpacing={2}><b>Upload Lesson Related PDFs</b></FormLabel>
                    <Input
                      type="file"
                      borderColor={'purple.600'}
                      p={1}
                      multiple={true}
                      _hover={{ borderColor: "purple.600" }}
                      accept=".pdf"
                      onChange={handleFileChange}
                    />
                  </FormControl>
                  <Button colorScheme="purple" _hover={{ bg: useColorModeValue('purple.600', 'purple.800'), color: useColorModeValue('white', 'white') }} variant="outline" type="submit" width="full" mt={4}>
                    Generate Base lesson
                  </Button>
                </form>
              </Box>
            </Box>
          </Box>
          <Modal isOpen={isOpen} onClose={onClose} size="3xl">
            <ModalOverlay />
            <ModalContent height={"90vh"} overflow={"scroll"}>
              <ModalHeader>Edit Lessons</ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <VStack spacing={4} align="stretch">
                  {Object.entries(lessonData).map(([lesson, description], index) => (
                    <HStack key={lesson} spacing={4} alignItems="center">
                      <VStack align="stretch" flex="1" p={5}>
                        <HStack key={lesson} spacing={4} alignItems="center">
                          <Text fontWeight="bold" color="purple.600">
                            {index + 1}.
                          </Text>
                          <Input
                            value={lesson}

                            onChange={(e) => handleEdit(e.target.value, description)}
                            placeholder="Lesson Name"
                          />
                        </HStack>

                        <Textarea
                          value={description}
                          ml={8}
                          onChange={(e) => handleEdit(lesson, e.target.value)}
                          placeholder="Lesson Description"
                        />
                      </VStack>
                      <VStack spacing={1}>
                        <IconButton
                          icon={<ArrowUpIcon />}
                          onClick={() => reorderLessons(index, -1)}
                          isDisabled={index === 0}
                          aria-label="Move Up"
                        />
                        <IconButton
                          icon={<ArrowDownIcon />}
                          onClick={() => reorderLessons(index, 1)}
                          isDisabled={index === Object.entries(lessonData).length - 1}
                          aria-label="Move Down"
                        />
                      </VStack>
                    </HStack>
                  ))}
                </VStack>
              </ModalBody>
              <ModalFooter>
                <Button colorScheme="purple" onClick={handleSaveChanges}>
                  Save Changes
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>

        </>
      )}
    </>
  );
}

export default CourseCreate;
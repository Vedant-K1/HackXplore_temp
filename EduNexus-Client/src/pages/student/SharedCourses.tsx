import { useState } from "react";
import {
  Box,
  Input,
  Button,
  HStack,
  Spinner,
  Text,
  Grid,
  useToast,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";
import { Navbar } from "../../components/navbar";
import axios from "axios";
import { useNavigate } from 'react-router-dom';
import { useSessionCheck } from "./home/useSessionCheck";
import ChatWidget from '../../components/ChatWidget';

type Course = {
  id: string;
  course_name: string;
  teacher_name: string;
  num_of_lectures: number;
  course_code: string;
  lessons_data: any;
};

function SharedCourses() {
  useSessionCheck();
  const [searchTerm, setSearchTerm] = useState("");
  const [courseData, setCourseData] = useState<Course | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const onLearnClick = async () => {
    setIsLoadingData(true);
    try {
      const response = await axios.post('/api/student/fetch-shared-course', {
        course_code: searchTerm,
      });
      if (response.data.response) {
        setCourseData(response.data.courses);
      } else {
        toast({
          title: "Course Not Found",
          description: "No course found with the given code.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleViewLessons = (course: Course) => {
    localStorage.setItem('course_name', course.course_name);
    localStorage.setItem('course_id', course.id);
    navigate('/student/scheduler');
  };

  const handleCopyCourseCode = (courseCode: string) => {
    navigator.clipboard.writeText(courseCode).then(() => {
      toast({
        title: "Course Code Copied!",
        description: `Course code ${courseCode} has been copied to clipboard.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    }).catch((_) => {
      toast({
        title: "Failed to Copy",
        description: "An error occurred while copying the course code.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    });
  };

  return (
    <div>
      <Navbar />
      <HStack justifyContent={"center"}>
        <Box mt={4} ml={4}>
          <Input
            type="text"
            placeholder="Enter the Course Code!"
            size="lg"
            borderColor={"black"}
            width="30vw"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

        </Box>
        <Button
          p={6}
          color={"white"}
          rounded="md"
          _hover={{
            transform: "translateY(-2px)",
            boxShadow: "md",
            transition: "transform 0.3s ease",  // Add transition property for smooth transition
            bg: "purple.600"
          }}
          bg={"purple.400"}
          boxShadow="lg"
          onClick={onLearnClick}
          mt={4}
        >
          Search
        </Button>
      </HStack>

      {isLoadingData ? (
        <Box textAlign="center" w="205vh" height={"60vh"}>
          <Spinner size="xl" mt={"140px"} color="purple.500" />
          <Text mt={4}>Loading...</Text>
        </Box>
      ) : (
        <>
          {courseData ? (
            <Grid templateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={4} mt={8} p={5}>
              <Box
                key={courseData.id}
                position="relative"
                p={5}
                borderWidth="1px"
                borderRadius="lg"
                bg={useColorModeValue('gray.100', 'gray.700')}
                color={useColorModeValue('gray.700', 'gray.100')}
                boxShadow="lg"
                maxWidth="350px"
              >
                {/* Course Information */}
                <VStack align="start" spacing={3} flex="1">
                  <Text fontWeight="bold" fontSize="lg" color="purple.500">
                    {courseData.course_name}
                  </Text>
                  <Text fontSize="sm">Teacher: <strong>{courseData.teacher_name}</strong></Text>
                  <Text fontSize="sm">Course Code:
                    <Text
                      as="span"
                      fontWeight="bold"
                      color="purple.600"
                      cursor="pointer"
                      onClick={() => handleCopyCourseCode(courseData.course_code)}
                    >
                      {courseData.course_code}
                    </Text>
                  </Text>
                  <Text fontSize="sm">Number of Lectures: {courseData.num_of_lectures}</Text>
                </VStack>

                <Button
                  size="sm"
                  width="100%"
                  bg="purple.600"
                  color="white"
                  _hover={{ bg: 'purple.500' }}
                  mt={3}
                  onClick={() => handleViewLessons(courseData)}
                >
                  View Lessons
                </Button>
              </Box>
            </Grid>
          ) : (
            <>
            </>
          )}
        </>
      )}

      <ChatWidget />
    </div>
  );
}

export default SharedCourses;
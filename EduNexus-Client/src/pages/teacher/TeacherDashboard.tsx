import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Grid,
  Heading,
  Text,
  VStack,
  Flex,
  Spinner,
  IconButton,
  Switch,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import { Navbar } from '../../components/navbar';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { DeleteIcon } from '@chakra-ui/icons';

type Course = {
  id: string;
  course_name: string;
  num_of_lectures: number;
  course_code: string;
  lessons_data: any;
};

const TeacherDashboard = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await axios.get('/api/teacher/get-courses');
        setCourses(response.data.courses);
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const handleViewLessons = (course: Course) => {
    localStorage.setItem('course_name', course.course_name);
    localStorage.setItem('course_id', course.id);
    navigate('/teacher/scheduler');
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
    }).catch((error) => {
      toast({
        title: "Failed to Copy",
        description: "An error occurred while copying the course code.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    });
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" height="90vh">
        <Spinner size="xl" color="purple.500" />
        <Heading ml={4}>Fetching Courses...</Heading>
      </Flex>
    );
  }

  return (
    <div>
      <Navbar />
      <Box p={5}>
        <Heading textAlign="center" mb={6} color="purple.600">
          My Courses
        </Heading>
  
        {courses.length === 0 ? (
          <Flex justify="center" align="center" height="50vh">
            <Heading color="gray.500" size="lg">
              No courses generated yet.
            </Heading>
          </Flex>
        ) : (
          <Grid
            gap={6}
            templateColumns="repeat(auto-fit, minmax(250px, 0.2fr))"
          >
            {courses.map((course) => (
              <Box
                key={course.id}
                position="relative"
                p={5}
                borderWidth="1px"
                borderRadius="lg"
                bg={useColorModeValue('gray.100', 'gray.700')}
                color={useColorModeValue('gray.700', 'gray.100')}
                boxShadow="lg"
                maxWidth="350px"
              >
                <Flex justifyContent="space-between" alignItems="center" mb={4}>
                  <IconButton
                    aria-label="Delete Course"
                    icon={<DeleteIcon />}
                    size="sm"
                    colorScheme="red"
                    // onClick={() => handleDeleteCourse(course.id)}
                  />
                  <Flex alignItems="center">
                    <Text fontSize="sm" mr={2}>
                      Private
                    </Text>
                    <Switch
                      colorScheme="purple"
                      // onChange={() => handlePrivacyToggle(course.id)}
                      // isChecked={course.isPublic}
                    />
                    <Text fontSize="sm" ml={2}>
                      Public
                    </Text>
                  </Flex>
                </Flex>
                <VStack align="start" spacing={3} flex="1">
                  <Text fontWeight="bold" fontSize="lg" color="purple.500">
                    {course.course_name}
                  </Text>
                  <Text fontSize="sm">
                    Course Code:{" "}
                    <Text
                      as="span"
                      fontWeight="bold"
                      color="purple.600"
                      cursor="pointer"
                      onClick={() => handleCopyCourseCode(course.course_code)}
                    >
                      {course.course_code}
                    </Text>
                  </Text>
                  <Text fontSize="sm">
                    Number of Lectures: {course.num_of_lectures}
                  </Text>
                </VStack>
                <Button
                  size="sm"
                  width="100%"
                  bg="purple.600"
                  color="white"
                  _hover={{ bg: "purple.500" }}
                  mt={3}
                  onClick={() => handleViewLessons(course)}
                >
                  View Lessons
                </Button>
              </Box>
            ))}
          </Grid>
        )}
      </Box>
    </div>
  );
  
};

export default TeacherDashboard;

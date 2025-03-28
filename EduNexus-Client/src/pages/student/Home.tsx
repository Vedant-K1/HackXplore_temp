import {
  Tab, Tabs, TabList, TabPanel, TabPanels, SlideFade, Box, Button, Flex,
  Heading,
  Text,
  Spinner,
  SimpleGrid,
  Grid,
  Center,
} from '@chakra-ui/react';
import axios from 'axios';
import { Navbar } from '../../components/navbar';
import CourseCard from './home/CourseCard';
import WorkingCard from './home/WorkingCard';
import Dashboard from './home/Dashboard';

import RecommendedCard from './home/RecommendedCard';
import { useState, useEffect } from 'react';
import { useSessionCheck } from "./home/useSessionCheck";
import { NavLink } from 'react-router-dom';
import ChatWidget from '../../components/ChatWidget';

function Home() {
  useSessionCheck();
  const [tabIndex, setTabIndex] = useState(0);
  const [inProp, setInProp] = useState(false);
  const [recommendCourses, setRecommendedCourses] = useState({});
  const [ongoingCourses, setOngoingCourses] = useState([]);
  const [completedCourses, setCompletedCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const modules = {
    module1: {
      name: "Introduction to Machine Learning",
      summary: "This module provides a foundational understanding of machine learning concepts, algorithms, and techniques.",
    },
    module2: {
      name: "Data Science Fundamentals",
      summary: "This module covers the essential tools and techniques for data collection, cleaning, analysis, and visualization.",
    },
    module3: {
      name: "Deep Learning",
      summary: "This module explores advanced machine learning techniques using deep neural networks.",
    },
    module4: {
      name: "Natural Language Processing",
      summary: "This module focuses on applying machine learning to text data, enabling computers to understand and process human language.",
    },
    module5: {
      name: "Computer Vision",
      summary: "This module explores how computers can 'see' and interpret images and videos using machine learning techniques.",
    },
    module6: {
      name: "Reinforcement Learning",
      summary: "This module delves into reinforcement learning algorithms, where agents learn to make decisions by interacting with an environment.",
    },
    module7: {
      name: "Big Data Analytics",
      summary: "This module introduces methods for analyzing massive datasets using distributed computing frameworks.",
    },
    module8: {
      name: "Data Mining",
      summary: "This module focuses on discovering patterns and insights from large datasets using various data mining techniques.",
    },
    module9: {
      name: "Machine Learning for Robotics",
      summary: "This module explores the application of machine learning in robotics, including robot control and perception.",
    },
    module10: {
      name: "Cloud Computing for Data Science",
      summary: "This module covers utilizing cloud platforms for storing, processing, and analyzing large datasets.",
    },
  };
    
  const handleTabsChange = (index: number) => {
    if (index !== tabIndex) {
      setInProp(false);
      setTimeout(() => {
        setTabIndex(index);
        setInProp(true);
      }, 200);
    }
  };


  useEffect(() => {
    setInProp(true);
  }, [tabIndex]);

  useEffect(() => {
    axios.get('/api/student/user_dashboard')
      .then(response => {
        const data = response.data;
        console.log("recommend", data.recommended_topics)
        console.log("ongoing", data.user_ongoing_modules)
        console.log("completed", data.user_completed_module)
        setRecommendedCourses(data.recommended_topics);
        setOngoingCourses(data.user_ongoing_modules);
        setCompletedCourses(data.user_completed_module);
      })
      .catch(error => {
        console.error(error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const [trophies, setTrophies] = useState([
    { name: "Beginner", description: "Completed 1 course", earned: true },
    { name: "Intermediate", description: "Completed 5 courses", earned: false },
  ]);


  const ongoingCourses_ex = [
    {
      moduleTopic: "Introduction to Machine Learning",
      moduleSummary: "Machine Learning (ML) is a subfield of artificial intelligence (AI) that focuses on developing algorithms and models that enable computers to learn from data and make predictions or decisions without explicit programming.",
    },
    {
      moduleTopic: "Introduction to Data Engineering",
      moduleSummary: "Data engineering is the practice of designing and building systems for collecting, storing, and analysing data at scale.",
    },
  ];

  // const completedCourses = [
  //   {
  //     moduleTopic: "Data Preprocessing with Python",
  //     moduleSummary: "Data Preprocessing with Python involves cleaning and transforming raw data to make it suitable for analysis. This crucial step includes handling missing values, normalizing features, and encoding categorical variables, ensuring data quality and reliability for subsequent analysis.",
  //     quiz: [null, null, {
  //       accuracy: 8,
  //       completeness: 7,
  //       clarity: 9,
  //       relevance: 8,
  //       understanding: 9,
  //       feedback: "Your answers demonstrate a strong understanding of data preprocessing concepts. However, there is room for improvement in providing more detailed explanations and examples in certain areas. Keep up the good work!"
  //     }],
  //   },
  // ];

  const recommendedCourses =
    { 'Machine Learning': 'This course covers the fundamentals of machine learning and its applications in various fields such as data science and artificial intelligence.', 'Big Data Analytics': 'This course focuses on analyzing large datasets using various tools and techniques to extract meaningful insights and make data-driven decisions.', 'Data Mining': 'This course explores techniques for discovering patterns and trends in large datasets, which is essential in the field of data science and machine learning.', 'Artificial Intelligence': 'This course delves into the principles and applications of artificial intelligence, including topics such as neural networks, natural language processing, and computer vision.', 'Statistical Analysis': 'This course provides a comprehensive overview of statistical methods for analyzing data, which is crucial in the field of data science and machine learning.', 'Deep Learning': 'This course covers advanced topics in machine learning, including deep neural networks, convolutional neural networks, and recurrent neural networks.', 'Predictive Modeling': 'This course focuses on developing predictive models using statistical and machine learning techniques to forecast future outcomes based on historical data.', 'Data Visualization': 'This course explores the principles and tools for creating visual representations of data, which is essential for communicating findings in data science and machine learning.', 'Python for Data Science': 'This course teaches the fundamentals of programming in Python and its applications in data science, including data manipulation, visualization, and machine learning.', 'SQL for Data Science': 'This course covers the fundamentals of SQL and its applications in data manipulation, querying databases, and extracting insights for data science purposes.' }



  const activeStepsList = [1, 2, 0, 1]
  return (
    <div>
      <Navbar />
      {loading && (
        <Box textAlign="center" w="205vh" height={"60vh"}>
          <Spinner size="xl" mt={"140px"} color="purple.500" />
          <Text mt={4}>Generating Content...</Text>
        </Box>
      )}
      {!loading && (
        <Tabs my={4} mx={5} isFitted variant='enclosed' index={tabIndex} onChange={handleTabsChange}>
          <TabList borderBottom='0'>
            <Tab _selected={{ bgColor: 'purple.600', color: 'white' }}>Recommended Courses</Tab>
            <Tab _selected={{ bgColor: 'purple.500', color: 'white' }}>In Progress</Tab>
            <Tab _selected={{ bgColor: 'purple.500', color: 'white' }}>Completed</Tab>
            <Tab _selected={{ bgColor: 'purple.500', color: 'white' }}>Dashboard</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <Center><Heading mb={4}>Top Recommendations for You</Heading></Center>
              <Grid templateColumns={{ base: "repeat(1, 1fr)", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" }} gap={6}>
              {Object.entries(recommendCourses).map(([key, value], index) => (
                  <SlideFade
                    in={inProp}
                    transition={{ enter: { duration: 0.7 } }}
                    offsetY="50px"
                    key={key}
                  >
                    <RecommendedCard
                      key={key}
                      moduleTopic={key}
                      moduleSummary={value || "Summary not available"}
                    />
                  </SlideFade>
                ))}

              </Grid>
            </TabPanel>
            <TabPanel>
              {ongoingCourses.length === 0 ? (
                <Box height="70vh" display="flex" alignItems="center" justifyContent="center">
                  <Center>
                    <Flex direction="column">
                      <Heading>No Ongoing Completed</Heading>
                      <NavLink to="/explore"><Button mt={4} ml={150} backgroundColor="purple.500" color="white">Get Started</Button></NavLink>
                    </Flex>
                  </Center>
                </Box>
              ) : (
                <SimpleGrid columns={3} spacing={10}>
                  {ongoingCourses.map((course, index) => (
                    <SlideFade in={inProp} transition={{ enter: { duration: 0.7 } }} offsetY='50px' key={course.moduleTopic}>
                      <WorkingCard
                        initialLessonName={course.module_name}
                        initialProgress={course.quiz_score.length}
                        moduleSummary={course.module_summary} // Pass the module summary
                      />
                    </SlideFade>
                  ))}
                </SimpleGrid>
              )}
            </TabPanel>

            <TabPanel>
              {completedCourses.length === 0 ? (
                <Box height="70vh" display="flex" alignItems="center" justifyContent="center">
                  <Center>
                    <Flex direction="column">
                      <Heading>No Course Completed</Heading>
                      <NavLink to="/explore"><Button mt={4} ml={150} backgroundColor="purple.500" color="white">Get Started</Button></NavLink>
                    </Flex>
                  </Center>
                </Box>
              ) : (
                completedCourses.map((course) => (
                  <SlideFade in={inProp} transition={{ enter: { duration: 0.7 } }} offsetY='50px' key={course.moduleTopic}>
                    <CourseCard courseData={course} />
                  </SlideFade>
                ))
              )}
            </TabPanel>
            <TabPanel style={{ justifyContent: 'center', alignItems: 'center', marginTop: '5rem', marginBottom: '5rem' }}>
              <Heading as='h2' size='xl'>
                <Dashboard />
              </Heading>

            </TabPanel>
          </TabPanels>
        </Tabs>
      )}
      <ChatWidget />
    </div>
  );
}

export default Home;
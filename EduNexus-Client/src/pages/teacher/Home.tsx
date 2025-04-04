import React, { useState, useEffect } from "react";
import { Navbar } from "../../components/navbar1";
import { Box, Flex, Heading, Grid, Text, Link, Icon, Divider, Badge, Image, Spinner, Button } from "@chakra-ui/react";
import { Logo } from "../../components/icons";
import { FaBook, FaGithub, FaPlusCircle, FaFileAlt,FaNewspaper, FaSearch, FaCalendarAlt, FaExternalLinkAlt, FaSync } from "react-icons/fa";

const tiles = [
  { title: "Courses", description: "View your generated courses", icon: FaBook, path: "/teacher/dashboard" },
  { title: "Github Explorer", description: "Manage student assignments", icon: FaGithub, path: "/teacher/list-project" },
  { title: "Create Course", description: "Create a new course", icon: FaPlusCircle, path: "/teacher/create-course" },
  { title: "Create Assignment", description: "Create an assignment", icon: FaFileAlt, path: "/teacher/create-assignment" },
  { title: "Research", description: "Research Tool", icon: FaSearch, path: "/teacher/research" },
  { title: "Schedule Timetable", description: "Make your timetable", icon: FaCalendarAlt, path: "/teacher/timetable" },
];

// Fallback news data in case API fails
const fallbackNewsItems = [
  {
    id: 1,
    title: "New AI Tools for Education Released",
    description: "Learn about the latest AI tools that can help with grading and feedback.",
    publishedAt: "2025-04-03",
    source: { name: "EdTech Magazine" },
    urlToImage: "/images/news/ai-tools.jpg",
    url: "/news/ai-tools"
  },
  {
    id: 2,
    title: "National Science Competition Opens for Registration",
    description: "Get your students involved in this year's science competition.",
    publishedAt: "2025-04-02",
    source: { name: "Science Teachers Association" },
    urlToImage: "/images/news/science-comp.jpg",
    url: "/news/science-competition"
  },
  {
    id: 3,
    title: "Professional Development Workshop Next Month",
    description: "Register for our upcoming workshop on project-based learning.",
    publishedAt: "2025-04-01",
    source: { name: "AcademIQ" },
    urlToImage: "/images/news/workshop.jpg",
    url: "/news/workshops"
  }
];

const TeacherHome = () => {
  const [newsItems, setNewsItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teacherInfo, setTeacherInfo] = useState(null);
  const [usingFallback, setUsingFallback] = useState(false);

  const fetchNews = async () => {
    try {
      setLoading(true);
      setError(null);
      setUsingFallback(false);
      
      // Make sure the URL is correct - add the full path if needed
      const response = await fetch('/api/teacher/teacher-news');
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      // Check if the response content type is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned non-JSON response");
      }
      
      const data = await response.json();
      
      if (data.status === "success") {
        setNewsItems(data.news);
        setTeacherInfo(data.teacher);
      } else {
        throw new Error(data.error || "Failed to fetch news");
      }
    } catch (err) {
      console.error("Failed to fetch news:", err);
      setError(err.message);
      
      // Fall back to static data
      setNewsItems(fallbackNewsItems);
      setUsingFallback(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  // Format date to a more readable format
  const formatDate = (dateString) => {
    if (!dateString) return "";
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (e) {
      return dateString; // Return original string if parsing fails
    }
  };

  return (
    <>
      <Navbar />
      <Box p={5}>
        <Flex align="center" justify="center" mb={8}>
          <Logo color="#6B46C1" size="75px" />
          <Heading textAlign="center" color="purple.600">
            AcademIQ
          </Heading>
        </Flex>

        <Grid templateColumns={{base: "1fr", md: "1fr", lg: "1fr 1fr 1fr"}} gap={6}>
          {/* Menu Tiles Section - 2 columns on larger screens */}
          <Box gridColumn={{lg: "span 2"}}>
            <Grid gap={6} templateColumns={{base: "1fr", sm: "repeat(auto-fit, minmax(250px, 1fr))", lg: "repeat(2, 1fr)"}}>
              {tiles.map((tile, index) => (
                <Link key={index} href={tile.path} _hover={{ textDecoration: "none" }}>
                  <Box
                    p={6}
                    bg="purple.100"
                    borderRadius="lg"
                    boxShadow="md"
                    transition="0.2s"
                    _hover={{ transform: "scale(1.05)", bg: "purple.200" }}
                    textAlign="center"
                  >
                    <Icon as={tile.icon} w={12} h={12} color="purple.800" mb={4} />
                    <Heading size="md" color="purple.800" mb={2}>
                      {tile.title}
                    </Heading>
                    <Text color="gray.600">
                      {tile.description}
                    </Text>
                  </Box>
                </Link>
              ))}
            </Grid>
          </Box>

          {/* News Section - 1 column with custom scroll */}
          <Box>
            <Box 
              p={4} 
              bg="#E9D8FD" 
              borderRadius="lg"
              display="flex"
              flexDirection="column"
              height={{lg: "calc(100vh - 125px)"}}
              position="relative"
            >
              <Flex justify="space-between" align="center" mb={2}>
                <Heading size="md" color="purple.700">
                  Trending Now!
                </Heading>
                {!loading && (
                  <Button 
                    size="sm" 
                    colorScheme="purple" 
                    variant="outline"
                    leftIcon={<FaSync />}
                    onClick={fetchNews}
                    isLoading={loading}
                  >
                    Refresh
                  </Button>
                )}
              </Flex>
              
              
              {usingFallback && (
                <Text fontSize="sm" color="orange.500" mb={2}>
                  Showing sample news. Could not load personalized content.
                </Text>
              )}
              
              <Divider mb={4} />
              
              {/* Custom scrollable news container */}
              <Box 
                overflowY="auto" 
                flex="1"
                className="news-scroll"
                sx={{
                  '&.news-scroll::-webkit-scrollbar': {
                    width: '8px',
                    backgroundColor: '#f0e6ff',
                  },
                  '&.news-scroll::-webkit-scrollbar-thumb': {
                    backgroundColor: '#9f7aea',
                    borderRadius: '10px',
                    border: '2px solid #f0e6ff',
                  },
                  '&.news-scroll::-webkit-scrollbar-track': {
                    borderRadius: '10px',
                    backgroundColor: '#f0e6ff',
                  },
                  scrollbarColor: '#9f7aea #f0e6ff',
                  scrollbarWidth: 'thin',
                }}
                pr={2}
              >
                {loading ? (
                  <Flex justify="center" align="center" height="100%">
                    <Spinner color="purple.500" size="xl" />
                  </Flex>
                ) : error && !usingFallback ? (
                  <Box textAlign="center" color="red.500" p={4}>
                    <Text mb={3}>Error loading news: {error}</Text>
                    <Button 
                      colorScheme="purple" 
                      size="sm"
                      onClick={() => {
                        setNewsItems(fallbackNewsItems);
                        setUsingFallback(true);
                      }}
                    >
                      Show sample news instead
                    </Button>
                  </Box>
                ) : newsItems.length === 0 ? (
                  <Box textAlign="center" color="gray.500" p={4}>
                    <Text>No news articles found.</Text>
                  </Box>
                ) : (
                  newsItems.map((news, index) => (
                    <Box 
                      key={index} 
                      mb={4} 
                      p={4} 
                      bg="white" 
                      borderRadius="md" 
                      boxShadow="sm"
                      transition="0.2s"
                      _hover={{ boxShadow: "md" }}
                    >
                      <Flex mb={2} justify="space-between" align="center">
                        <Badge colorScheme="purple">
                          {news.subject || (news.source && news.source.name) || "News"}
                        </Badge>
                        <Text fontSize="sm" color="gray.500">
                          {formatDate(news.publishedAt)}
                        </Text>
                      </Flex>
                      
                      <Flex>
                        {/* Image on left */}
                      

                        <Box mr={3} flexShrink={0}>
                        {news.urlToImage ? (
                            <Image
                            src={news.urlToImage}
                            alt={news.title}
                            boxSize="80px"
                            objectFit="cover"
                            borderRadius="md"
                            />
                        ) : (
                            <Icon as={FaNewspaper} boxSize="80px" height="80px" color="gray.400" />
                        )}
                        </Box>

                        
                        {/* Content on right */}
                        <Box>
                          <Link 
                            href={news.url} 
                            isExternal 
                            color="purple.700"
                            _hover={{ textDecoration: "underline" }}
                          >
                            <Heading size="sm" mb={2}>{news.title}</Heading>
                          </Link>
                          <Text fontSize="sm" color="gray.600" mb={2} noOfLines={2}>
                            {news.description || "No description available."}
                          </Text>
                          
                          <Link 
                            href={news.url} 
                            isExternal 
                            color="purple.600" 
                            fontSize="sm" 
                            display="flex" 
                            alignItems="center"
                          >
                            Read more <Icon as={FaExternalLinkAlt} ml={1} boxSize={3} />
                          </Link>
                        </Box>
                      </Flex>
                    </Box>
                  ))
                )}
              </Box>
            </Box>
          </Box>
        </Grid>
      </Box>

      {/* Add global style to ensure different scrollbar for the page */}
      <style jsx global>{`
        body::-webkit-scrollbar {
          width: 10px;
          background-color: #f5f5f5;
        }
        body::-webkit-scrollbar-thumb {
          background-color: #cccccc;
          border-radius: 10px;
        }
        body::-webkit-scrollbar-track {
          background-color: #f5f5f5;
        }
      `}</style>
    </>
  );
};

export default TeacherHome;
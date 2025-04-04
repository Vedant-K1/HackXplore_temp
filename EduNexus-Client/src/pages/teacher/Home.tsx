import React from "react";
import { Navbar } from "../../components/navbar1";
import { Box, Flex, Heading, Grid, Text, Link, Icon } from "@chakra-ui/react";
import { Logo } from "../../components/icons";
import { FaBook, FaGithub, FaPlusCircle, FaFileAlt, FaSearch, FaCalendarAlt } from "react-icons/fa";

const tiles = [
  { title: "Courses", description: "View your generated courses", icon: FaBook, path: "/teacher/dashboard" },
  { title: "Github Explorer", description: "Manage student assignments", icon: FaGithub, path: "/teacher/list-project" },
  { title: "Create Course", description: "Create a new course", icon: FaPlusCircle, path: "/teacher/create-course" },
  { title: "Create Assignment", description: "Create an assignment", icon: FaFileAlt, path: "/teacher/create-assignment" },
  { title: "Research", description: "Research Tool", icon: FaSearch, path: "/teacher/research" },
  { title: "Schedule Timetable", description: "Make your timetable", icon: FaCalendarAlt, path: "/teacher/timetable" },
];

const TeacherHome = () => {
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

        <Grid p={5} gap={6} templateColumns="repeat(auto-fit, minmax(350px, 1fr))">
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
                <Icon as={tile.icon} w={16} h={16} color="purple.800" mb={4} />
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
    </>
  );
};

export default TeacherHome;

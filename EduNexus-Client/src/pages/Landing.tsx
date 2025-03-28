import { Box, Flex, Heading, Text, Button, Image, VStack, HStack, Link } from '@chakra-ui/react';
import { Navbar } from '../components/navbar';

export default function LandingPage() {
  return (
    <Box bg={"purple.200"} minHeight={'100vh'}> {/* Change to minHeight for better responsiveness */}
      <Navbar />
      <VStack spacing={4} align="center" py={5} px={4}> {/* Add padding for smaller screens */}
        <Box textAlign="center" mt={3}>
          {/* <Heading as="h1" size={['2xl', '3xl']} color="white" display="inline">
            Welcome to{' '}
          </Heading> */}
          <Heading as="h1" size={['4xl', '4xl']} style={{fontFamily: "Jost"}} color="purple.800" display="inline" letterSpacing={20}>
            EduNexus
          </Heading>
        </Box>
        <Flex
          alignItems="center"
          justifyContent="space-between"
          flexDirection={['column', 'column', 'row']} 
        >
          <Box flex={1} bg={'white'} p={'10'} m={2} borderRadius={20} style={{ boxShadow: "20px 20px 20px rgba(0, 0, 0, 0.5)" }}>
            <Heading as="h2" style={{"fontFamily":"Rajdhani"}} size={['xl', '2xl']} mb={8} color="purple.600">
              Transforming Classrooms with Intelligent Solutions
            </Heading>
            <Text color="black" className='main-heading' textAlign="justify" size={"10px"}>
              Our platform harnesses the power of AI to transform education, offering intelligent tools that enhance both teaching and learning experiences. From real-time content updates for educators to personalized learning pathways and AI-driven mock interviews for students, we bridge the gap between academia and career readiness. With features like skill gap analysis, automated note-taking, and dynamic labs, we provide a seamless, adaptive learning environment designed to equip students with the knowledge and skills they need to succeed in an ever-evolving world.
            </Text>
            <HStack spacing={2} mt={5} justifyContent={['center', 'flex-start']}> {/* Center buttons on small screens */}
              <Link href='/login'>
              <Button colorScheme="purple" _hover={{bg:"purple.800", transform: 'scale(1.05)'}} size="lg" width={['150px', '200px']} variant="solid" mr={5}>
                Sign In
              </Button>
              </Link>
              <Link href='/register'>
              <Button colorScheme="purple" _hover={{bg:"purple.800", transform: 'scale(1.05)'}} size="lg" width={['150px', '200px']} variant="solid" mr={5}>
                Get Started
              </Button>
              </Link>
            </HStack>
          </Box>
          <Box flexShrink={0} mt={[8, 0]}> {/* Add margin on top for smaller screens */}
            <Image
              src="./src/assets/wobg.png"
              alt="Right-aligned image"
              maxWidth={['300px', '400px', '500px']} // Responsive image sizing
              mx={['auto', 0]} // Center image on small screens
            />
          </Box>
        </Flex>
      </VStack>
    </Box>
  );
}

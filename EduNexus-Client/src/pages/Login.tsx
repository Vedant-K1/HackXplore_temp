import { Navbar } from '../components/navbar';
import axios from 'axios';
import {
  Box,
  Flex,
  HStack,
  useToast,
  useColorModeValue,
  Text,
  Link,
  FormControl,
  FormLabel,
  Input,
  Checkbox,
  Button,
  FormErrorMessage,
  Tabs, TabList, TabPanel, Tab, TabPanels
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useState } from 'react';

const schema = yup.object().shape({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(4, 'Password must be at least 4 characters').required('Password is required'),
});

type LoginData = {
  email: string;
  password: string;
};

const Login = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState(0);

  const handleCreateAccountClick = () => {
    navigate('/register');
  };

  const teacherForm = useForm({ resolver: yupResolver(schema) });
  const studentForm = useForm({ resolver: yupResolver(schema) });
  const companyForm = useForm({ resolver: yupResolver(schema) });

  const handleLogin = async (data: LoginData, endpoint: string) => {
    try {
      const response = await axios.post(endpoint, data, { withCredentials: true });
      console.log(data);
      if (response.data.response) {
       
        
        toast({
          title: 'Login successful.',
          description: 'You have successfully logged in.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });

        if (activeTab==0){
          sessionStorage.setItem('teacher_authenticated', 'true');
          navigate('/teacher/dashboard');
          
        }
        else if(activeTab==2){
          sessionStorage.setItem('job_seeker_authenticated', 'true');
          navigate('/job-seeker/assessment');
        }
        else{
          sessionStorage.setItem('student_authenticated', 'true');
          navigate('/student/home');
        }
        
      } else {
        toast({
          title: 'Login failed.',
          description: response.data.message || 'An error occurred while logging in.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'Login failed.',
        description: 'An error occurred while logging in.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      console.error(error);
    }
  };

  return (
    <div>
      <Navbar />
      <Flex minHeight='100vh' bg={useColorModeValue('purple.200', 'purple.800')} width='full' align='center' justifyContent='center'>
        <Box
          px={4}
          py={10}
          bg={useColorModeValue('white', 'gray.900')}
          width='full'
          shadow="dark-lg"
          maxWidth='500px'
          borderColor={useColorModeValue('purple.400', 'gray.900')}
          borderRadius={16}
          textAlign='center'
        >
          <Box textAlign='center'>
            <Text className='feature-heading' color={useColorModeValue('purple.600', 'purple.500')} fontSize={'50px'}><b>Login to Your Account</b></Text>
          </Box>
          <Tabs isFitted variant='soft-rounded' colorScheme='purple' onChange={(index) => setActiveTab(index)}>
            <TabList>
              <Tab>Teacher</Tab>
              <Tab>Student</Tab>
              <Tab>Job Seeker</Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                <Box my={8} textAlign='left'>
                  <form onSubmit={teacherForm.handleSubmit((data) => handleLogin(data, '/api/teacher/login'))}>
                    <FormControl isInvalid={!!teacherForm.formState.errors.email}>
                      <FormLabel>Email address</FormLabel>
                      <Input type='email' placeholder='Enter your email address' {...teacherForm.register('email')} />
                      <FormErrorMessage color={useColorModeValue('purple.600', 'white')}>{teacherForm.formState.errors.email?.message}</FormErrorMessage>
                    </FormControl>

                    <FormControl mt={4} isInvalid={!!teacherForm.formState.errors.password}>
                      <FormLabel>Password</FormLabel>
                      <Input type='password' placeholder='Enter your password' {...teacherForm.register('password')} />
                      <FormErrorMessage>{teacherForm.formState.errors.password?.message}</FormErrorMessage>
                    </FormControl>

                    <HStack justifyContent='space-between' mt={4}>
                      <Box>
                        <Checkbox colorScheme='purple'>Remember Me</Checkbox>
                      </Box>
                      <Box>
                        <Link color={useColorModeValue('purple.400', 'gray.500')}>Forgot your password?</Link>
                      </Box>
                    </HStack>

                    <Button colorScheme="purple" _hover={{ bg: useColorModeValue('purple.600', 'purple.800'), color: useColorModeValue('white', 'white') }} variant="outline" type="submit" width="full" mt={4}>
                      Login
                    </Button>
                  </form>
                </Box>
              </TabPanel>

              <TabPanel>
                <Box my={8} textAlign='left'>
                  <form onSubmit={studentForm.handleSubmit((data) => handleLogin(data, '/api/student/login'))}>
                    <FormControl isInvalid={!!studentForm.formState.errors.email}>
                      <FormLabel>Email address</FormLabel>
                      <Input type='email' placeholder='Enter your email address' {...studentForm.register('email')} />
                      <FormErrorMessage color={useColorModeValue('purple.600', 'white')}>{studentForm.formState.errors.email?.message}</FormErrorMessage>
                    </FormControl>

                    <FormControl mt={4} isInvalid={!!studentForm.formState.errors.password}>
                      <FormLabel>Password</FormLabel>
                      <Input type='password' placeholder='Enter your password' {...studentForm.register('password')} />
                      <FormErrorMessage>{studentForm.formState.errors.password?.message}</FormErrorMessage>
                    </FormControl>

                    <HStack justifyContent='space-between' mt={4}>
                      <Box>
                        <Checkbox colorScheme='purple'>Remember Me</Checkbox>
                      </Box>
                      <Box>
                        <Link color={useColorModeValue('purple.400', 'gray.500')}>Forgot your password?</Link>
                      </Box>
                    </HStack>

                    <Button colorScheme="purple" _hover={{ bg: useColorModeValue('purple.600', 'purple.800'), color: useColorModeValue('white', 'white') }} variant="outline" type="submit" width="full" mt={4}>
                      Login
                    </Button>
                  </form>
                </Box>
              </TabPanel>

              <TabPanel>
                <Box my={8} textAlign='left'>
                  <form onSubmit={companyForm .handleSubmit((data) => handleLogin(data, '/api/job_seeker/login'))}>
                    <FormControl isInvalid={!!companyForm .formState.errors.email}>
                      <FormLabel>Email address</FormLabel>
                      <Input type='email' placeholder='Enter your email address' {...companyForm .register('email')} />
                      <FormErrorMessage color={useColorModeValue('purple.600', 'white')}>{companyForm .formState.errors.email?.message}</FormErrorMessage>
                    </FormControl>

                    <FormControl mt={4} isInvalid={!!companyForm .formState.errors.password}>
                      <FormLabel>Password</FormLabel>
                      <Input type='password' placeholder='Enter your password' {...companyForm .register('password')} />
                      <FormErrorMessage>{companyForm .formState.errors.password?.message}</FormErrorMessage>
                    </FormControl>

                    <HStack justifyContent='space-between' mt={4}>
                      <Box>
                        <Checkbox colorScheme='purple'>Remember Me</Checkbox>
                      </Box>
                      <Box>
                        <Link color={useColorModeValue('purple.400', 'gray.500')}>Forgot your password?</Link>
                      </Box>
                    </HStack>

                    <Button colorScheme="purple" _hover={{ bg: useColorModeValue('purple.600', 'purple.800'), color: useColorModeValue('white', 'white') }} variant="outline" type="submit" width="full" mt={4}>
                      Login
                    </Button>
                  </form>
                </Box>
              </TabPanel>
            </TabPanels>
          </Tabs>
          <Text>
            Or <Link color={useColorModeValue('purple.400', 'gray.500')} onClick={handleCreateAccountClick}>create an account here</Link>
          </Text>
        </Box>
      </Flex>
    </div>
  );
};

export default Login;

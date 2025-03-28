import React, { useState } from 'react';
import axios from 'axios';
import {
  Box,
  Button,
  ButtonGroup,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  useColorModeValue,
  Radio,
  RadioGroup,
  Stack,
  Text,
  useToast,
  Progress,
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useNavigate } from 'react-router-dom';
import * as yup from 'yup';

const form1Schema = yup.object().shape({
  fullName: yup.string().required('Full name is required'),
  age: yup
    .number()
    .integer('Age must be an integer')
    .min(1, 'Age must be a positive number')
    .required('Age is required'),
  location: yup.string().required('Location is required'),
  preferredLanguage: yup.string().required('Preferred language is required'),
  email: yup
    .string()
    .email('Please introduce a valid email')
    .required('Email is required'),
  password: yup
    .string()
    .min(8, 'Password is too short - should be 8 chars minimum.')
    .matches(/[a-zA-Z]/, 'Password can only contain Latin letters.')
    .required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password'), null], 'Passwords must match')
    .required('Confirm password is required'),
});


const form2Schema = yup.object().shape({
  gender: yup.string().required('Gender is required'),
  highestEducation: yup.string().required('Highest Education Completed is required'),
  fieldOfStudy: yup.string().required('Field of Study is required'),
});

const form3Schema = yup.object().shape({
  dreamJob: yup.string().required('Dream Job is required'),
  interest: yup.string().required('Interest is required'),
});

const form4Schema = yup.object().shape({
  challenges: yup.string().required('Please select a challenge you face in learning new skills'),
  motivation: yup.string().required('Please select a motivation to keep learning'),
});

const form5Schema = yup.object().shape({
  platformsUsed: yup.string().required('Please list the platforms you have used for learning'),
  topSkills: yup.string().required('Please list your top 5 skills'),
  resume: yup.mixed().required('Please upload your resume in PDF format').test(
    "fileFormat",
    "Only PDF files are allowed",
    value => value && value[0] && value[0].type === 'application/pdf'
  ),
});


const Form1 = ({ register, errors }: { register: any; errors: any }) => {
  return (
    <>
      <Text
        w="80vh"
        fontSize={'30px'}
        className="feature-heading"
        color={useColorModeValue('purple.600', 'purple.500')}
        textAlign={'center'}
        fontWeight="normal"
        mb="2%"
      >
        <b>Basic Information</b>
      </Text>

      {/* Existing Fields */}
      <FormControl isInvalid={!!errors.fullName} mb={4}>
        <FormLabel htmlFor="full-name">Full Name</FormLabel>
        <Input
          id="full-name"
          name="fullName"
          placeholder="Enter your full name"
          {...register('fullName')}
        />
        <FormErrorMessage>
          {errors.fullName && errors.fullName.message}
        </FormErrorMessage>
      </FormControl>

      <FormControl isInvalid={!!errors.age} mb={4}>
        <FormLabel htmlFor="age">Age</FormLabel>
        <Input
          id="age"
          name="age"
          type="number"
          placeholder="Enter your age"
          {...register('age')}
        />
        <FormErrorMessage>{errors.age && errors.age.message}</FormErrorMessage>
      </FormControl>

      <FormControl isInvalid={!!errors.location} mb={4}>
        <FormLabel htmlFor="location">Location (City/Town/Village)</FormLabel>
        <Input
          id="location"
          name="location"
          placeholder="Enter your location"
          {...register('location')}
        />
        <FormErrorMessage>
          {errors.location && errors.location.message}
        </FormErrorMessage>
      </FormControl>

      <FormControl isInvalid={!!errors.preferredLanguage} mb={4}>
        <FormLabel htmlFor="preferred-language">
          Preferred Language for Learning
        </FormLabel>
        <select
          id="preferred-language"
          name="preferredLanguage"
          {...register('preferredLanguage')}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '5px',
            borderColor: useColorModeValue('gray.300', 'gray.600'),
            background: useColorModeValue('white', 'gray.800'),
          }}
        >
          <option value="English">English</option>
          <option value="Bengali">Bengali</option>
          <option value="Hindi">Hindi</option>
          <option value="Gujarati">Gujarati</option>
          <option value="Kannada">Kannada</option>
          <option value="Malayalam">Malayalam</option>
          <option value="Marathi">Marathi</option>
          <option value="Nepali">Nepali</option>
          <option value="Odia">Odia</option>
          <option value="Punjabi">Punjabi</option>
          <option value="Tamil">Tamil</option>
          <option value="Telugu">Telugu</option>
          <option value="Urdu">Urdu</option>
          <option value="Assamese">Assamese</option>
          <option value="Maithili">Maithili</option>
          <option value="Sanskrit">Sanskrit</option>
          <option value="Sindhi">Sindhi</option>
          <option value="Dogri">Dogri</option>
          <option value="Konkani">Konkani</option>
          <option value="Manipuri">Manipuri</option>
          <option value="Marwari">Marwari</option>
          <option value="Santali">Santali</option>
          <option value="Kashmiri">Kashmiri</option>
          <option value="Bodo">Bodo</option>
        </select>
        <FormErrorMessage>
          {errors.preferredLanguage && errors.preferredLanguage.message}
        </FormErrorMessage>
      </FormControl>

      <FormControl isInvalid={!!errors.email} mb={4}>
        <FormLabel htmlFor="email">Email</FormLabel>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="Enter your email"
          {...register('email')}
        />
        <FormErrorMessage>
          {errors.email && errors.email.message}
        </FormErrorMessage>
      </FormControl>

      <FormControl isInvalid={!!errors.password} mb={4}>
        <FormLabel htmlFor="password">Password</FormLabel>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="Enter your password"
          {...register('password')}
        />
        <FormErrorMessage>
          {errors.password && errors.password.message}
        </FormErrorMessage>
      </FormControl>

      {/* Confirm Password Field */}
      <FormControl isInvalid={!!errors.confirmPassword} mb={4}>
        <FormLabel htmlFor="confirmPassword">Confirm Password</FormLabel>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="Re-enter your password"
          {...register('confirmPassword')}
        />
        <FormErrorMessage>
          {errors.confirmPassword && errors.confirmPassword.message}
        </FormErrorMessage>
      </FormControl>
    </>
  );
};


const Form2 = ({ register, errors }: { register: any; errors: any }) => {
  return (
    <>
      <Text
        w="80vh"
        fontSize={'30px'}
        className="feature-heading"
        color={useColorModeValue('purple.600', 'purple.500')}
        textAlign={'center'}
        fontWeight="normal"
        mb="2%"
      >
        <b>Student Details</b>
      </Text>

      <FormControl isInvalid={!!errors.gender} mb={4}>
        <FormLabel htmlFor="gender">Gender</FormLabel>
        <RadioGroup colorScheme="purple" id="gender" name="gender">
          <Stack direction="row">
            <Radio value="male" {...register('gender')}>
              Male
            </Radio>
            <Radio value="female" {...register('gender')}>
              Female
            </Radio>
            <Radio value="other" {...register('gender')}>
              Other
            </Radio>
          </Stack>
        </RadioGroup>
        <FormErrorMessage>{errors.gender && errors.gender.message}</FormErrorMessage>
      </FormControl>

      <FormControl isInvalid={!!errors.highestEducation} mb={4}>
        <FormLabel htmlFor="highestEducation">Highest Education Completed</FormLabel>
        <RadioGroup colorScheme="purple" id="highestEducation" name="highestEducation">
          <Stack direction="column">
            <Radio value="High School (10th grade)" {...register('highestEducation')}>
              High School (10th grade)
            </Radio>
            <Radio value="Higher Secondary (12th grade) or Diploma" {...register('highestEducation')}>
              Higher Secondary (12th grade) or Diploma
            </Radio>
            <Radio value="Undergraduate Degree" {...register('highestEducation')}>
              Undergraduate Degree
            </Radio>
            <Radio value="Postgraduate Degree" {...register('highestEducation')}>
              Postgraduate Degree
            </Radio>
          </Stack>
        </RadioGroup>
        <FormErrorMessage>{errors.highestEducation && errors.highestEducation.message}</FormErrorMessage>
      </FormControl>

      <FormControl isInvalid={!!errors.fieldOfStudy} mb={4}>
        <FormLabel htmlFor="fieldOfStudy">What is your Field of Study?</FormLabel>
        <RadioGroup colorScheme="purple" id="fieldOfStudy" name="fieldOfStudy">
          <Stack direction="column">
            <Radio value="Science" {...register('fieldOfStudy')}>
              Science
            </Radio>
            <Radio value="Commerce" {...register('fieldOfStudy')}>
              Commerce
            </Radio>
            <Radio value="Arts" {...register('fieldOfStudy')}>
              Arts
            </Radio>
            <Radio value="Technical/Vocational" {...register('fieldOfStudy')}>
              Technical/Vocational
            </Radio>
            <Radio value="Other" {...register('fieldOfStudy')}>
              Other
            </Radio>
          </Stack>
        </RadioGroup>
        <FormErrorMessage>{errors.fieldOfStudy && errors.fieldOfStudy.message}</FormErrorMessage>
      </FormControl>
    </>
  );
};

const Form3 = ({ register, errors }: { register: any; errors: any }) => {
  return (
    <>
      <Text
        w="80vh"
        fontSize={'30px'}
        className="feature-heading"
        color={useColorModeValue('purple.600', 'purple.500')}
        textAlign={'center'}
        fontWeight="normal"
        mb="2%"
      >
        <b>Dream Company & Interests</b>
      </Text>

      <FormControl isInvalid={!!errors.dreamJob} mb={4}>
        <FormLabel htmlFor="dreamJob">What is your Dream Company</FormLabel>
        <Input
          id="dreamJob"
          name="dreamJob"
          placeholder="Example: Google,Microsoft"
          {...register('dreamJob')}
        />
        <FormErrorMessage>{errors.dreamJob && errors.dreamJob.message}</FormErrorMessage>
      </FormControl>

      <FormControl isInvalid={!!errors.interests} mb={4}>
        <FormLabel htmlFor="interests">What are your Interests?</FormLabel>
        <Input
          id="interest"
          name="interest"
          variant="outline"
          colorScheme="purple"
          {...register('interest')}
          placeholder="List your interests using commas ex: Machine learning,AI"
        />
        <FormErrorMessage>{errors.interest && errors.interest.message}</FormErrorMessage>
        <FormErrorMessage>{errors.interests && errors.interests.message}</FormErrorMessage>
      </FormControl>
    </>
  );
};

const Form4 = ({ register, errors }: { register: any; errors: any }) => {
  return (
    <>
      <Text
        w="80vh"
        fontSize={'30px'}
        className="feature-heading"
        color={useColorModeValue('purple.600', 'purple.500')}
        textAlign={'center'}
        fontWeight="normal"
        mb="2%"
      >
        <b>Learning Challenges & Motivation</b>
      </Text>

      <FormControl isInvalid={!!errors.challenges} mb={4}>
        <FormLabel htmlFor="challenges">What challenges do you face in learning new skills?</FormLabel>
        <RadioGroup colorScheme="purple" id="challenges" name="challenges">
          <Stack direction="column">
            <Radio value="Lack of guidance" {...register('challenges')}>
              Lack of guidance
            </Radio>
            <Radio value="Poor internet access" {...register('challenges')}>
              Poor internet access
            </Radio>
            <Radio value="Limited time" {...register('challenges')}>
              Limited time
            </Radio>
            <Radio value="Financial constraints" {...register('challenges')}>
              Financial constraints
            </Radio>
            <Radio value="Unsure of where to start" {...register('challenges')}>
              Unsure of where to start
            </Radio>
          </Stack>
        </RadioGroup>
        <FormErrorMessage>{errors.challenges && errors.challenges.message}</FormErrorMessage>
      </FormControl>

      <FormControl isInvalid={!!errors.motivation} mb={4}>
        <FormLabel htmlFor="motivation">What would motivate you to keep learning?</FormLabel>
        <RadioGroup colorScheme="purple" id="motivation" name="motivation">
          <Stack direction="column">
            <Radio value="Job opportunities" {...register('motivation')}>
              Job opportunities
            </Radio>
            <Radio value="Personal growth" {...register('motivation')}>
              Personal growth
            </Radio>
            <Radio value="Certification" {...register('motivation')}>
              Certification
            </Radio>
            <Radio value="Mentorship" {...register('motivation')}>
              Mentorship
            </Radio>
          </Stack>
        </RadioGroup>
        <FormErrorMessage>{errors.motivation && errors.motivation.message}</FormErrorMessage>
      </FormControl>
    </>
  );
};

const Form5 = ({ register, errors }: { register: any; errors: any }) => {
  return (
    <>
      <Text
        w="80vh"
        fontSize={'30px'}
        className="feature-heading"
        color={useColorModeValue('purple.600', 'purple.500')}
        textAlign={'center'}
        fontWeight="normal"
        mb="2%"
      >
        <b>Skills and Experience</b>
      </Text>

      <FormControl isInvalid={!!errors.platformsUsed} mb={4}>
        <FormLabel htmlFor="platformsUsed">Which platforms have you used for learning?</FormLabel>
        <Input
          id="platformsUsed"
          name="platformsUsed"
          placeholder="E.g., Coursera, Udemy, YouTube, Skillshare"
          {...register('platformsUsed')}
        />
        <FormErrorMessage>{errors.platformsUsed && errors.platformsUsed.message}</FormErrorMessage>
      </FormControl>

      <FormControl isInvalid={!!errors.topSkills} mb={4}>
        <FormLabel htmlFor="topSkills">What are your top 5 skills?</FormLabel>
        <Input
          id="topSkills"
          name="topSkills"
          placeholder="E.g., JavaScript, Python, Data Analysis, Machine Learning, AI"
          {...register('topSkills')}
        />
        <FormErrorMessage>{errors.topSkills && errors.topSkills.message}</FormErrorMessage>
      </FormControl>

      <FormControl isInvalid={!!errors.resume} mb={4}>
        <FormLabel htmlFor="resume">Resume (PDF format only)</FormLabel>
        <Input
          id="resume"
          name="resume"
          type="file"
          accept="application/pdf"
          {...register('resume')}
        />
        <FormErrorMessage>{errors.resume && errors.resume.message}</FormErrorMessage>
      </FormControl>
    </>
  );
};

const JobSeeker = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [progress, setProgress] = useState(25); // Adjusting for four steps

  const resolver: any =
    step === 1
      ? yupResolver(form1Schema)
      : step === 2
        ? yupResolver(form2Schema)
        : step === 3
          ? yupResolver(form3Schema)
          : step === 4
            ? yupResolver(form4Schema)
            : yupResolver(form5Schema);

  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
  } = useForm({
    resolver: resolver,
  });

  const onSubmit = async (data: { [key: string]: any }) => {
    try {
      const formData = new FormData();
      formData.append('full_name', data.fullName);
      formData.append('age', data.age);
      formData.append('location', data.location);
      formData.append('preferred_language', data.preferredLanguage);
      formData.append('email', data.email);
      formData.append('password', data.password);

      // Append all values from Form 2 (Student Details)
      formData.append('gender', data.gender);
      formData.append('highest_education', data.highestEducation);
      formData.append('field_of_study', data.fieldOfStudy);

      // Append all values from Form 3 (Dream Job & Interests)
      formData.append('dream_job', data.dreamJob);
      formData.append('interests', data.interest);

      // Append all values from Form 4 (Learning Challenges & Motivation)
      formData.append('challenges', data.challenges);
      formData.append('motivation', data.motivation);

      // Append all values from Form 5 (Skills and Experience)
      formData.append('learning_platforms', data.platformsUsed);
      formData.append('top_skills', data.topSkills);

      // Handle file upload for resume
      if (data.resume && data.resume[0]) {
        formData.append('resume', data.resume[0]);
      }

      const response = await axios.post('/api/job_seeker/register', formData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.response) {
        // Account created successfully
        toast({
          title: 'Account created.',
          description: "We've created your account for you. You can Login Now!!",
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        navigate('/login');
      } else {
        // User already exists
        toast({
          title: 'Error',
          description: 'User already exists. Please use a different email address.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      // Display toast on general error
      toast({
        title: 'Error',
        description: 'An error occurred while creating the account.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      console.error(error);
    }
  };

  return (
    <div>
      <Flex
        bg={useColorModeValue('purple.200', 'purple.800')}
        width="full"
        align="center"
        justifyContent="center"
        direction="column"
        minHeight={'100vh'}
      >
        <Box
          rounded="lg"
          bg={useColorModeValue('white', 'gray.900')}
          shadow="dark-lg"
          maxWidth={800}
          borderColor={useColorModeValue('purple.400', 'gray.900')}
          p={6}
        >
          <Progress colorScheme="purple" size="sm" value={progress} hasStripe mb="5%" mx="5%" isAnimated />
          <form onSubmit={handleSubmit(onSubmit)}>
            {step === 1 && <Form1 register={register} errors={errors} />}
            {step === 2 && <Form2 register={register} errors={errors} />}
            {step === 3 && <Form3 register={register} errors={errors} />}
            {step === 4 && <Form4 register={register} errors={errors} />}
            {step === 5 && <Form5 register={register} errors={errors} />}
            <ButtonGroup mt="5%" w="100%">
              <Flex w="100%" justifyContent="space-between">
                <Flex>
                  {step > 1 && (
                    <Button
                      variant="outline"
                      colorScheme="purple"
                      _hover={{
                        bg: useColorModeValue('purple.600', 'purple.800'),
                        color: useColorModeValue('white', 'white'),
                      }}
                      onClick={() => {
                        setStep(step - 1);
                        setProgress(progress - 20); // Decrement by 20
                      }}
                    >
                      Previous
                    </Button>
                  )}
                  {step < 5 && (
                    <Button
                      variant="outline"
                      colorScheme="purple"
                      ml={3}
                      _hover={{
                        bg: useColorModeValue('purple.600', 'purple.800'),
                        color: useColorModeValue('white', 'white'),
                      }}
                      onClick={async () => {
                        const isValid = await trigger();
                        if (isValid) {
                          setStep(step + 1);
                          setProgress(progress + 20); // Increment by 20
                        }
                      }}
                    >
                      Next
                    </Button>
                  )}
                </Flex>
                {step === 5 && (
                  <Button
                    variant="outline"
                    colorScheme="purple"
                    _hover={{
                      bg: useColorModeValue('purple.600', 'purple.800'),
                      color: useColorModeValue('white', 'white'),
                    }}
                    type="submit"
                  >
                    Submit
                  </Button>
                )}
              </Flex>
            </ButtonGroup>
          </form>
        </Box>
      </Flex>
    </div>

  );
};

export default JobSeeker;

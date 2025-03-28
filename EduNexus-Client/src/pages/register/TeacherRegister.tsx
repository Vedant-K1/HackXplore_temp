import { useState } from 'react';
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
  Progress,
  useColorModeValue,
  useToast,
  Radio,
  RadioGroup,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useNavigate } from 'react-router-dom';
import * as yup from "yup";

const form1Schema = yup.object().shape({
  firstName: yup.string().required("First name is required"),
  lastName: yup.string().required("Last name is required"),
  email: yup
    .string()
    .email("Please introduce a valid email")
    .required("Email is required"),
  password: yup
    .string()
    .min(8, "Password is too short - should be 8 chars minimum.")
    .matches(/[a-zA-Z]/, "Password can only contain Latin letters.")
    .required("Password is required"),
});

const form2Schema = yup.object().shape({
  country: yup.string().required("Country is required"),
  state: yup.string().required("State is required"),
  city: yup.string().required("City is required"),
  gender: yup.string().required("Gender is required"),
  age: yup.number().integer().min(1, "Age must be a positive number").required("Age is required"),
});

const form3Schema = yup.object().shape({
  collegeName: yup.string().required("College name is required"),
  department: yup.string().required("Department is required"),
  experience: yup.number().integer().min(0, "Experience must be non-negative").required("Experience is required"),
  phoneNumber: yup
    .string()
    .matches(/^\d{10}$/, "Phone number must be exactly 10 digits")
    .required("Phone number is required"),
  qualification: yup.string().required("Qualification is required"),
  subjects: yup.string().required("Subjects are required"),
});



const Form1 = ({ register, errors }: { register: any; errors: any }) => {
  return (
    <>
      <Text w="80vh" className='feature-heading' fontSize={'50px'} color={useColorModeValue('purple.600', 'purple.500')} textAlign="center" fontWeight="normal" mb="2%">
        <b>Basic Details</b>
      </Text>
      <Flex>
        <FormControl isInvalid={!!errors.firstName} mr="5%">
          <FormLabel>First name</FormLabel>
          <Input placeholder="First name" {...register("firstName")} />
          <FormErrorMessage>{errors.firstName && errors.firstName.message}</FormErrorMessage>
        </FormControl>

        <FormControl isInvalid={!!errors.lastName}>
          <FormLabel>Last name</FormLabel>
          <Input placeholder="Last name" {...register("lastName")} />
          <FormErrorMessage>{errors.lastName && errors.lastName.message}</FormErrorMessage>
        </FormControl>
      </Flex>

      <FormControl isInvalid={!!errors.email} mt="2%">
        <FormLabel>Email address</FormLabel>
        <Input type="email" placeholder="Email address" {...register("email")} />
        <FormErrorMessage>{errors.email && errors.email.message}</FormErrorMessage>
      </FormControl>

      <FormControl isInvalid={!!errors.password} mt="2%">
        <FormLabel>Password</FormLabel>
        <Input type="password" placeholder="Enter password" {...register("password")} />
        <FormErrorMessage>{errors.password && errors.password.message}</FormErrorMessage>
      </FormControl>
    </>
  );
};



const Form2 = ({ register, errors }: { register: any; errors: any }) => {
  return (
    <>
      <Text w="80vh" className='feature-heading' fontSize={'50px'} color={useColorModeValue('purple.600', 'purple.500')} textAlign="center" fontWeight="normal" mb="2%">
        <b>Personal Details</b>
      </Text>
      <FormControl isInvalid={!!errors.country} mb="4%">
        <FormLabel>Country</FormLabel>
        <Input placeholder="Country" {...register("country")} />
        <FormErrorMessage>{errors.country && errors.country.message}</FormErrorMessage>
      </FormControl>

      <FormControl isInvalid={!!errors.state} mb="4%">
        <FormLabel>State</FormLabel>
        <Input placeholder="State" {...register("state")} />
        <FormErrorMessage>{errors.state && errors.state.message}</FormErrorMessage>
      </FormControl>

      <FormControl isInvalid={!!errors.city} mb="4%">
        <FormLabel>City</FormLabel>
        <Input placeholder="City" {...register("city")} />
        <FormErrorMessage>{errors.city && errors.city.message}</FormErrorMessage>
      </FormControl>

      <FormControl isInvalid={!!errors.gender} mb="4%">
        <FormLabel>Gender</FormLabel>
        <RadioGroup colorScheme='purple' id="gender" name="gender">
            <Stack direction="row">
              <Radio value="male" {...register('gender')}>Male</Radio>
              <Radio value="female" {...register('gender')}>Female</Radio>
              <Radio value="other" {...register('gender')}>Other</Radio>
            </Stack>
          </RadioGroup>
        <FormErrorMessage>{errors.gender && errors.gender.message}</FormErrorMessage>
      </FormControl>

      <FormControl isInvalid={!!errors.age} mb="4%">
        <FormLabel>Age</FormLabel>
        <Input type="number" placeholder="Age" {...register("age")} />
        <FormErrorMessage>{errors.age && errors.age.message}</FormErrorMessage>
      </FormControl>
    </>
  );
};

const Form3 = ({ register, errors }: { register: any; errors: any }) => {
  return (
    <>
      <Text w="80vh" className='feature-heading' fontSize={'50px'} color={useColorModeValue('purple.600', 'purple.500')} textAlign="center" fontWeight="normal" mb="2%">
        <b>Professional Details</b>
      </Text>
      <FormControl isInvalid={!!errors.collegeName} mb="4%">
        <FormLabel>College Name</FormLabel>
        <Input placeholder="College name" {...register("collegeName")} />
        <FormErrorMessage>{errors.collegeName && errors.collegeName.message}</FormErrorMessage>
      </FormControl>

      <FormControl isInvalid={!!errors.department} mb="4%">
        <FormLabel>Department</FormLabel>
        <Input placeholder="Department" {...register("department")} />
        <FormErrorMessage>{errors.department && errors.department.message}</FormErrorMessage>
      </FormControl>

      <FormControl isInvalid={!!errors.experience} mb="4%">
        <FormLabel>Years of Experience</FormLabel>
        <Input type="number" placeholder="Experience in years" {...register("experience")} />
        <FormErrorMessage>{errors.experience && errors.experience.message}</FormErrorMessage>
      </FormControl>

      <FormControl isInvalid={!!errors.phoneNumber} mb="4%">
        <FormLabel>Phone Number</FormLabel>
        <Input placeholder="Phone number" {...register("phoneNumber")} />
        <FormErrorMessage>{errors.phoneNumber && errors.phoneNumber.message}</FormErrorMessage>
      </FormControl>

      <FormControl isInvalid={!!errors.qualification} mb="4%">
        <FormLabel>Qualification</FormLabel>
        <Input placeholder="Highest qualification" {...register("qualification")} />
        <FormErrorMessage>{errors.qualification && errors.qualification.message}</FormErrorMessage>
      </FormControl>

      <FormControl isInvalid={!!errors.subjects} mb="4%">
        <FormLabel>Subjects</FormLabel>
        <Input placeholder="Subjects you teach" {...register("subjects")} />
        <FormErrorMessage>{errors.subjects && errors.subjects.message}</FormErrorMessage>
      </FormControl>
    </>
  );
};

const TeacherRegister = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [progress, setProgress] = useState(33);

  const resolver: any = step === 1 ? yupResolver(form1Schema) :
    step === 2 ? yupResolver(form2Schema) :
      yupResolver(form3Schema);

  const { register, handleSubmit, formState: { errors }, trigger } = useForm({ resolver: resolver });

  const onSubmit = async (data: { [key: string]: any }) => {
    try {
      const formData = new FormData();
      formData.append('first_name', data.firstName);
      formData.append('last_name', data.lastName);
      formData.append('email', data.email);
      formData.append('password', data.password);

      // Append user details data
      formData.append('college_name', data.collegeName);
      formData.append('department', data.department);
      formData.append('experience', data.experience);
      formData.append('phone_number', data.phoneNumber);
      formData.append('qualification', data.qualification);
      formData.append('subjects', data.subjects);
      formData.append('country', data.country);
      formData.append('state', data.state);
      formData.append('city', data.city);
      formData.append('gender', data.gender);
      formData.append('age', data.age);

      const response = await axios.post('/api/teacher/register', formData);
      if (response.data.response) {
        toast({
          title: 'Account created.',
          description: "Your account has been created. You can log in now!",
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        navigate('/login');
      } else {
        toast({
          title: 'Error',
          description: 'User already exists. Please use a different email address.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while creating the account.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Flex bg={useColorModeValue('purple.200', 'purple.800')} width='full' align='center' justifyContent='center' minHeight={"79vh"}>
      <Box
        rounded="lg"
        my={10}
        bg={useColorModeValue('white', 'gray.900')}
        shadow="dark-lg"
        maxWidth={800}
        borderColor={useColorModeValue('purple.400', 'gray.900')}
        p={6}>
        <Progress colorScheme="purple" size="sm" value={progress} hasStripe mb="5%" mx="5%" isAnimated />
        <form onSubmit={handleSubmit(onSubmit)}>
          {step === 1 && <Form1 register={register} errors={errors} />}
          {step === 2 && <Form2 register={register} errors={errors} />}
          {step === 3 && <Form3 register={register} errors={errors} />}
          <ButtonGroup mt="5%" w="100%">
            <Flex w="100%" justifyContent="space-between">
              {step > 1 && (
                <Button
                  variant="outline"
                  colorScheme="purple"
                  onClick={() => {
                    setStep(step - 1);
                    setProgress(progress - 50);
                  }}
                >
                  Previous
                </Button>
              )}
              {step < 3 && (
                <Button
                  variant="outline"
                  colorScheme="purple"
                  onClick={async () => {
                    const isValid = await trigger();
                    if (isValid) {
                      setStep(step + 1);
                      setProgress(progress + 33); // Update progress increment accordingly
                    }
                  }}
                >
                  Next
                </Button>
              )}
              {step === 3 && (
                <Button variant="outline" colorScheme="purple" type="submit">Submit</Button>
              )}

            </Flex>
          </ButtonGroup>
        </form>
      </Box>
    </Flex>
  );
};

export default TeacherRegister;

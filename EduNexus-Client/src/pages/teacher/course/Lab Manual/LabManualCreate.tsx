import {
    Box,
    VStack,
    Center,
    Text,
    Input,
    Button,
    FormControl,
    FormLabel,
    Checkbox,
    useColorModeValue,
    FormErrorMessage,
    Switch,
    SimpleGrid
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../../../../components/navbar';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const lab_manual_components = {
    "Theory": "A section that explains the theoretical aspects for example (but not limited to): fundamental principles, scientific theories, and background information relevant to the experiment.",
    "Apparatus": "A list of all equipment, tools, chemicals, and materials required to conduct the experiment.",
    "Requirements": "A list of all equipment, tools, chemicals, and materials required to conduct the experiment.",
    "Technologies Used": "A list of all the technologies, software or system requirements required to conduct the experiment.",
    "Procedure": "Step-by-step instructions outlining how the experiment is to be performed.",
    "Code":"A sample code snippet that helps to guides on how to perform the experiment",
    "Observations": "A section for recording observations, data collected, and any qualitative information noted during the experiment.",
    "Results": "This section includes tables, graphs, or any other format of data representation showing the outcomes obtained from the experiment.",
    "Calculations": "A detailed explanation of any mathematical calculations or formulas used to derive the results.",
    "Discussion": "An analysis of the results, explaining the significance of the findings, sources of error, and any deviations from expected outcomes.",
    "Conclusion": "A brief summary of the experiment’s outcomes, stating whether the aim was achieved and what was learned from the experiment.",
    "Precautions": "Guidelines for safely conducting the experiment and avoiding common errors.",
    "Questions": "Related questions or problems to solve, encouraging critical thinking and deeper understanding of the experiment's concepts.",
    "References": "Citations for any books, articles, or online resources used in preparing the lab manual or for further reading.",
    "Appendix": "Additional information, such as supplementary data, extra calculations, or detailed explanations that support the experiment."
};

// Validation schema using Yup
const schema = yup.object().shape({
    exp_num: yup.string().required('Experiment number is required'),
    exp_aim: yup.string().required('Experiment aim is required'),
    include_videos: yup.boolean(),
    lab_components: yup.array().of(yup.string())
});

const LabManualCreate = () => {
    const navigate = useNavigate();
    const course_name = localStorage.getItem('course_name');
    const { register, handleSubmit, formState: { errors }, watch } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            exp_num: '',
            exp_aim: '',
            include_videos: false,
            lab_components: []
        },
    });

    const onSubmit = async (data: { [key: string]: any }) => {
        const lab_components = Object.keys(lab_manual_components).filter(
            (key) => data.lab_components?.includes(key)
        );
    
        const formData = {
            ...data,
            lab_components,
            course_name: course_name || "Unknown Course"  // Fallback in case course_name is not found
        };
    
        // Save formData to localStorage
        localStorage.setItem('exp_num',data.exp_num)
        localStorage.setItem('exp_aim',data.exp_aim)

        localStorage.setItem('labManualData', JSON.stringify(formData));
    
        // Navigate to a new page after saving
        navigate('/teacher/lab-manual');  // Update '/new-page' with your actual path
    };
    

    return (
        <Box bg="purple.200" minHeight={'100vh'} minWidth={'100vw'}>
            <Navbar />
            <Box display="flex" alignItems="center" justifyContent="center" mt={10}>
                <Box maxWidth="5xl" bg="white" p={10} borderWidth={1} borderRadius="xl" boxShadow="lg" textAlign="center">
                    <Center>
                        <Text className='main-heading' fontSize={"5xl"} color={"purple.600"} mb={4}>
                            <b>Generate Lab Manual</b>
                        </Text>
                    </Center>
                    <Center>
                        <Text className='feature-heading' fontSize={"3xl"} mb={6}>
                            <b>Course name:</b> {course_name}
                        </Text>
                    </Center>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <VStack spacing={6} align="center">
                            <FormControl isInvalid={!!errors.exp_num} isRequired width="80%">
                                <FormLabel className='feature-heading' letterSpacing={2}><b>Experiment Number</b></FormLabel>
                                <Input
                                    placeholder="Enter the experiment number"
                                    {...register('exp_num')}
                                    borderColor={'purple.600'}
                                    _hover={{ borderColor: "purple.600" }}
                                />
                                <FormErrorMessage>{errors.exp_num?.message}</FormErrorMessage>
                            </FormControl>

                            <FormControl isInvalid={!!errors.exp_aim} isRequired width="80%">
                                <FormLabel className='feature-heading' letterSpacing={2}><b>Experiment Aim</b></FormLabel>
                                <Input
                                    placeholder="Describe the experiment aim"
                                    {...register('exp_aim')}
                                    borderColor={'purple.600'}
                                    _hover={{ borderColor: "purple.600" }}
                                />
                                <FormErrorMessage>{errors.exp_aim?.message}</FormErrorMessage>
                            </FormControl>

                            <FormControl display="flex" alignItems="center" justifyContent="center">
                                <FormLabel className='feature-heading' mb="0">
                                    <b>Include Videos</b>
                                </FormLabel>
                                <Switch colorScheme="purple" {...register('include_videos')}
                                    size={"lg"} />
                            </FormControl>

                            <VStack mt={6} align="center" width="100%">
                                <Text className='feature-heading' fontSize="2xl" mb={4}><b>Lab Components</b></Text>
                                <SimpleGrid columns={[1, 2]} spacing={2} width="80%">
                                    {Object.keys(lab_manual_components).map((component) => (
                                        <FormControl key={component} display="flex" ml={5} alignItems="center">
                                            <Checkbox {...register('lab_components')} value={component}
                                                size={'lg'}
                                                borderColor={"purple.700"}
                                                _focus={{ outline: 'none', boxShadow: 'none' }}
                                                variant={"solid"}
                                                colorScheme="purple"
                                                className='feature-heading'
                                                letterSpacing={2}
                                            >
                                                {component}
                                            </Checkbox>
                                        </FormControl>
                                    ))}
                                </SimpleGrid>
                            </VStack>

                            <Button colorScheme="purple" _hover={{ bg: useColorModeValue('purple.600', 'purple.800'), color: useColorModeValue('white', 'white') }} variant="outline" type="submit" width="50%" mt={6}>
                                Generate Lab Manual
                            </Button>
                        </VStack>
                    </form>
                </Box>
            </Box>
        </Box>
    );
}

export default LabManualCreate;

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Text, Flex, Progress, Center, Heading, Grid } from '@chakra-ui/react';
import { Navbar } from '../components/navbar';
import JobRoleCard from '../components/JobRoleCard';

const JobRoles = () => {
    const [jobRoles, setJobRoles] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get('/api/job_seeker/fetch-job-roles')
            .then((response) => {
                setJobRoles(response.data.job_roles);
                setLoading(false);
            })
            .catch((error) => {
                console.error("Error fetching job roles:", error);
                setLoading(false);
            });
    }, []);

    return (
        <>
            <Navbar />

            {/* Loading state */}
            {loading ? (
                <Flex
                    direction="column"
                    align="center"
                    justify="center"
                    minHeight="100vh"
                    bg="purple.50"
                >
                    <Progress hasStripe isIndeterminate size="lg" colorScheme="purple" width="80%" mb={6} />
                    <Text fontSize="lg" color="purple.700">
                        Finding Suitable Job Roles...
                    </Text>
                </Flex>
            ) : (
                <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"
                    w={'100%'}
                    bg="gray.100"
                    pt={10}
                >
                    <Center>
                        <Heading size="xl" color={"purple.700"} mb={4}>
                            Suitable Job Roles
                        </Heading>
                    </Center>
                    {/* Displaying job roles after data is loaded */}
                    <Grid
                        templateColumns="repeat(auto-fill, minmax(300px, 1fr))"
                        gap={6}
                        w="100%"
                        maxWidth="1200px"
                        pb={6}
                    >
                        {Object.keys(jobRoles).map((jobTitle, index) => {
                            return (
                                <JobRoleCard
                                    key={index}
                                    jobTitle={jobTitle}
                                    jobDescription={jobRoles[jobTitle]}
                                    onViewClick={() => {
                                        alert(`View details for ${jobTitle}`);
                                    }}
                                />
                            );
                        })}
                    </Grid>

                </Box>
            )}
        </>
    );
};

export default JobRoles;

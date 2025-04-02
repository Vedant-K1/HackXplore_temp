import React, { useState, useCallback } from 'react';
import {
    Box,
    Heading,
    FormControl,
    FormLabel,
    Input,
    Button,
    useColorModeValue,
    Flex,
    FormErrorMessage,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
    CloseButton,
    Stack,
    Text,
    Textarea,
    Checkbox,
    useToast,
    VStack,
    Progress,
    Tag,
    Divider,
} from '@chakra-ui/react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../../../components/navbar';

// --- GitHub API Types ---
interface CreatedRepository { id: number; name: string; full_name: string; html_url: string; owner: { login: string; }; }
interface ErrorWithMessageType { message: string; } // Basic error type

// --- Form Data Structure ---
interface CreateProjectFormData {
    projectName: string;
    teachersListStr: string; // Input as comma-separated string
    studentsListStr: string; // Input as comma-separated string
    // GitHub Repo Options
    repoDescription: string;
    repoIsPrivate: boolean;
}

// --- Validation Schema ---
const schema = yup.object().shape({
    projectName: yup.string().trim()
        .required('Project name is required')
        .matches(/^[a-zA-Z0-9_-]+$/, 'Project name can only contain letters, numbers, hyphens, and underscores'), // Stricter name validation for GitHub compatibility
    teachersListStr: yup.string().trim().matches(/^$|^[a-zA-Z0-9_-]+(,[a-zA-Z0-9_-]+)*$/, 'Enter valid GitHub usernames, separated by commas'),
    studentsListStr: yup.string().trim().matches(/^$|^[a-zA-Z0-9_-]+(,[a-zA-Z0-9_-]+)*$/, 'Enter valid GitHub usernames, separated by commas'),
    repoDescription: yup.string().trim(), // Optional
    repoIsPrivate: yup.boolean(),
});

// --- Utility functions (Simplified from GitHubExplorer) ---
function isErrorWithMessage(error: unknown): error is ErrorWithMessageType { return (typeof error === 'object' && error !== null && 'message' in error && typeof (error as Record<string, unknown>).message === 'string'); }
function getErrorMessage(error: unknown): string { if (isErrorWithMessage(error)) return error.message; if (error instanceof Error) return error.message; return String(error); }

// --- Component ---
function CreateProjectStudent() {
    const navigate = useNavigate();
    const toast = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [githubStatus, setGithubStatus] = useState<{
        step: 'idle' | 'creating_repo' | 'adding_collabs' | 'done' | 'error';
        message: string;
        repoUrl?: string;
        collabResults?: { success: string[], failed: string[] };
    } | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            projectName: '',
            teachersListStr: '',
            studentsListStr: '',
            repoDescription: '',
            repoIsPrivate: true, // Default to private
        }
    });

    const bgColor = useColorModeValue('white', 'gray.800');
    const headingColor = useColorModeValue('purple.600', 'purple.300');
    const boxBg = useColorModeValue('gray.50', 'gray.900');

    // --- GitHub API Fetch Logic (Adapted, uses PAT from state) ---
    // NOTE: This assumes the PAT will be fetched and stored in a variable `pat`
    const githubApiFetch = useCallback(async (url: string, pat: string | null, options: RequestInit = {}): Promise<Response> => {
        if (!pat) {
            throw new Error("GitHub PAT not available. Cannot make API request.");
        }
        const headers: HeadersInit = {
            'Accept': 'application/vnd.github.v3+json',
            'Authorization': `Bearer ${pat}`,
            ...options.headers,
        };
        const response = await fetch(url.startsWith('https://') ? url : `https://api.github.com${url}`, { ...options, headers });

        // Basic rate limit check (optional but good practice)
        const remaining = response.headers.get('X-RateLimit-Remaining');
        if (remaining && parseInt(remaining, 10) === 0) {
            console.warn("GitHub API rate limit likely reached.");
            toast({ title: "GitHub Rate Limit Reached", status: "warning", duration: 5000 });
        }

        if (!response.ok) {
            let errorMessage = `GitHub API Error: ${response.status} ${response.statusText}`;
            try { const errorJson = await response.json(); errorMessage = errorJson.message || errorMessage; } catch (e) {/* ignore */}
            throw new Error(errorMessage);
        }
        return response;
    }, [toast]);

    // --- GitHub Actions (Adapted) ---
    const createRepository = useCallback(async (name: string, description: string, isPrivate: boolean, pat: string): Promise<CreatedRepository> => {
        const response = await githubApiFetch('/user/repos', pat, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, description, private: isPrivate }),
        });
        if (response.status !== 201) throw new Error(`Unexpected status ${response.status} creating repository.`);
        return await response.json() as CreatedRepository;
    }, [githubApiFetch]);

    const addCollaborator = useCallback(async (owner: string, repo: string, username: string, pat: string): Promise<void> => {
        const response = await githubApiFetch(`/repos/${owner}/${repo}/collaborators/${username}`, pat, {
            method: 'PUT',
            // Optionally add permission level if needed: body: JSON.stringify({ permission: 'push' })
        });
        // GitHub returns 201 on new invite, 204 if already collaborator
        if (response.status !== 201 && response.status !== 204) {
            throw new Error(`Unexpected status ${response.status} adding collaborator '${username}'.`);
        }
    }, [githubApiFetch]);

    // --- Helper to parse comma-separated list ---
    const parseUserList = (listStr: string): string[] => {
        if (!listStr) return [];
        return listStr.split(',').map(user => user.trim()).filter(user => user !== '');
    };

    // --- Main Submit Handler ---
    const onSubmit: SubmitHandler<CreateProjectFormData> = async (formData) => {
        setIsLoading(true);
        setGithubStatus(null); // Reset GitHub status

        const dbPayload = {
            project_name: formData.projectName,
            teachers_list: parseUserList(formData.teachersListStr),
            students_list: parseUserList(formData.studentsListStr),
        };

        try {
            // Step 1: Call backend to save to DB and get GitHub credentials
            const backendResponse = await fetch('/api/student/create_project', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dbPayload),
            });

            const backendResult = await backendResponse.json();

            if (!backendResponse.ok || !backendResult.response) {
                throw new Error(backendResult.message || `Failed to save project to database (Status: ${backendResponse.status})`);
            }

            // Check if backend indicated GitHub details are missing
            if (backendResult.github_setup_required) {
                setGithubStatus({
                    step: 'error', // Treat as an error for the GitHub part
                    message: backendResult.message || "Project saved to DB, but automatic GitHub setup cannot proceed due to missing teacher GitHub details.",
                });
                 toast({ title: "Partial Success", description: "Project saved, but GitHub setup skipped.", status: "warning", duration: 7000, isClosable: true });
                setIsLoading(false);
                reset(); // Still reset form as DB part succeeded
                return; // Stop execution here
            }

            // --- Backend Success & GitHub Details Received ---
            const ownerGitHubId = backendResult.github_id;
            const githubPAT = backendResult.github_PAT;

            if (!ownerGitHubId || !githubPAT) {
                 throw new Error("Backend response successful but missing necessary GitHub ID or PAT.");
            }

            // Proceed with GitHub actions
            setGithubStatus({ step: 'creating_repo', message: 'Creating GitHub repository...' });

            // Step 2: Create GitHub Repository
            let createdRepo: CreatedRepository;
            try {
                createdRepo = await createRepository(
                    formData.projectName,
                    formData.repoDescription,
                    formData.repoIsPrivate,
                    githubPAT
                );
                setGithubStatus(prev => ({
                    ...(prev ?? { step: 'creating_repo', message: '' }), // Keep previous state if exists
                    step: 'adding_collabs',
                    message: `Repository '${createdRepo.full_name}' created successfully. Adding collaborators...`,
                    repoUrl: createdRepo.html_url,
                }));

            } catch (repoError) {
                throw new Error(`Failed to create GitHub repository: ${getErrorMessage(repoError)}`);
            }

            // Step 3: Add Collaborators
            const allCollaborators = [...dbPayload.teachers_list, ...dbPayload.students_list];
            const collabResults: { success: string[], failed: string[] } = { success: [], failed: [] };

            if (allCollaborators.length > 0) {
                 const collabPromises = allCollaborators.map(username =>
                    addCollaborator(ownerGitHubId, formData.projectName, username, githubPAT)
                        .then(() => ({ username, status: 'fulfilled' }))
                        .catch(err => ({ username, status: 'rejected', reason: getErrorMessage(err) }))
                );

                const results = await Promise.allSettled(collabPromises); // Use allSettled

                 results.forEach(result => {
                     // Note: The structure after Promise.allSettled is slightly different
                     if (result.status === 'fulfilled' && result.value.status === 'fulfilled') {
                         collabResults.success.push(result.value.username);
                     } else if (result.status === 'fulfilled' && result.value.status === 'rejected') {
                         collabResults.failed.push(`${result.value.username} (${result.value.reason})`);
                         console.warn(`Failed to add collaborator ${result.value.username}: ${result.value.reason}`);
                     } else if (result.status === 'rejected') {
                         // This case is less likely with the inner mapping but good practice
                          collabResults.failed.push(`Unknown collaborator (Error: ${getErrorMessage(result.reason)})`);
                          console.error(`Unexpected error in collaborator promise: ${getErrorMessage(result.reason)}`);
                     }
                 });
            }

            // Final Success State
            let finalMessage = `Project '${formData.projectName}' created successfully!`;
            if (createdRepo.html_url) finalMessage += ` GitHub repository created at ${createdRepo.html_url}.`;
            if (allCollaborators.length > 0) {
                 finalMessage += ` Added ${collabResults.success.length}/${allCollaborators.length} collaborators.`;
                 if (collabResults.failed.length > 0) {
                     finalMessage += ` Failed for: ${collabResults.failed.join(', ')}.`;
                 }
            }

            setGithubStatus({
                step: 'done',
                message: finalMessage,
                repoUrl: createdRepo.html_url,
                collabResults: collabResults,
            });
            toast({ title: "Success!", description: `Project ${formData.projectName} fully created.`, status: "success", duration: 5000, isClosable: true });
            reset(); // Clear form on full success
            // Optional: Redirect after delay
            // setTimeout(() => navigate('/teacher/projects'), 3000);

        } catch (err: any) {
            console.error("Create project error:", err);
            const errorMessage = getErrorMessage(err);
            setGithubStatus({ step: 'error', message: errorMessage });
            toast({ title: "Error", description: errorMessage, status: "error", duration: 9000, isClosable: true });
        } finally {
            setIsLoading(false);
        }
    };


    // --- Render ---
    return (
        <>
         <Navbar />
        <Flex minHeight="90vh" align="center" justify="center" bg={boxBg} py={12}>
            <Box
                bg={bgColor}
                p={8}
                rounded="lg"
                shadow="xl"
                width="full"
                maxWidth="700px" // Increased width slightly
                borderWidth={1}
                borderColor={useColorModeValue('gray.200', 'gray.700')}
            >
                <Heading as="h1" size="lg" textAlign="center" mb={8} color={headingColor}>
                    Create New Project & GitHub Repository
                </Heading>

                {/* Combined Status/Error Area */}
                {githubStatus && (
                    <Box mb={6}>
                         <Alert
                            status={githubStatus.step === 'error' ? 'error' : (githubStatus.step === 'done' ? 'success' : 'info')}
                            borderRadius="md"
                            variant="left-accent"
                        >
                            <AlertIcon />
                             <VStack align="flex-start" spacing={1}>
                                 <AlertTitle>
                                    {githubStatus.step === 'error' ? 'Error' : (githubStatus.step === 'done' ? 'Complete' : 'In Progress...')}
                                 </AlertTitle>
                                 <AlertDescription display="block">
                                    {githubStatus.message}
                                    {/* Show collaborator details on done/error */}
                                    {githubStatus.collabResults && (githubStatus.collabResults.success.length > 0 || githubStatus.collabResults.failed.length > 0) && (
                                         <Text fontSize="sm" mt={2}>
                                             {githubStatus.collabResults.success.length > 0 && `Successfully added: ${githubStatus.collabResults.success.join(', ')}. `}
                                             {githubStatus.collabResults.failed.length > 0 && `Failed to add: ${githubStatus.collabResults.failed.join(', ')}.`}
                                         </Text>
                                     )}
                                 </AlertDescription>
                             </VStack>
                            <CloseButton position="absolute" right="8px" top="8px" onClick={() => setGithubStatus(null)} />
                        </Alert>
                         {(githubStatus.step === 'creating_repo' || githubStatus.step === 'adding_collabs') && (
                            <Progress size="xs" isIndeterminate colorScheme="purple" mt={2} />
                        )}
                     </Box>
                )}

                <form onSubmit={handleSubmit(onSubmit)}>
                    <Stack spacing={6}>
                        {/* Project Name (DB & Repo) */}
                        <FormControl isInvalid={!!errors.projectName} isRequired>
                            <FormLabel htmlFor="projectName">Project & Repository Name</FormLabel>
                            <Input
                                id="projectName"
                                placeholder="my-awesome-project"
                                {...register('projectName')}
                                isDisabled={isLoading}
                            />
                            <FormErrorMessage>{errors.projectName?.message}</FormErrorMessage>
                            <Text fontSize="xs" color="gray.500" mt={1}>Used for both database record and GitHub repository name.</Text>
                        </FormControl>

                        <Divider />

                        {/* GitHub Specific Options */}
                         <Heading size="sm" color={useColorModeValue('gray.600', 'gray.400')}>GitHub Repository Options</Heading>
                         <FormControl isInvalid={!!errors.repoDescription}>
                            <FormLabel htmlFor="repoDescription">Description (Optional)</FormLabel>
                            <Textarea
                                id="repoDescription"
                                placeholder="A short description for the GitHub repository"
                                {...register('repoDescription')}
                                isDisabled={isLoading}
                                rows={2}
                            />
                            <FormErrorMessage>{errors.repoDescription?.message}</FormErrorMessage>
                        </FormControl>

                        <FormControl>
                             <Checkbox
                                id="repoIsPrivate"
                                colorScheme="purple"
                                {...register('repoIsPrivate')}
                                isDisabled={isLoading}
                             >
                                Create as Private Repository
                             </Checkbox>
                         </FormControl>

                        <Divider />

                         {/* Collaborators */}
                         <Heading size="sm" color={useColorModeValue('gray.600', 'gray.400')}>Collaborators</Heading>
                         <FormControl isInvalid={!!errors.teachersListStr}>
                            <FormLabel htmlFor="teachersListStr">Teacher Collaborators (GitHub Usernames)</FormLabel>
                            <Textarea
                                id="teachersListStr"
                                placeholder="teacher1,another-teacher (comma-separated)"
                                {...register('teachersListStr')}
                                isDisabled={isLoading}
                                rows={2}
                            />
                            <FormErrorMessage>{errors.teachersListStr?.message}</FormErrorMessage>
                        </FormControl>

                        <FormControl isInvalid={!!errors.studentsListStr}>
                            <FormLabel htmlFor="studentsListStr">Student Collaborators (GitHub Usernames)</FormLabel>
                            <Textarea
                                id="studentsListStr"
                                placeholder="student-dev,coder-kid (comma-separated)"
                                {...register('studentsListStr')}
                                isDisabled={isLoading}
                                rows={3}
                            />
                            <FormErrorMessage>{errors.studentsListStr?.message}</FormErrorMessage>
                        </FormControl>

                        {/* Security Warning */}
                        <Alert status="warning" borderRadius="md">
                             <AlertIcon />
                             <AlertDescription fontSize="sm">
                                 This action will use the teacher's stored GitHub Personal Access Token (PAT) to create the repository and add collaborators. Ensure the PAT has the necessary permissions ('repo', 'admin:org' if applicable). Transmitting PATs to the frontend carries security risks.
                             </AlertDescription>
                         </Alert>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            colorScheme="purple"
                            width="full"
                            isLoading={isLoading}
                            loadingText="Creating..."
                            // isDisabled={isLoading || (githubStatus?.step !== 'idle' && githubStatus?.step !== 'error' && githubStatus?.step !== 'done')} // Disable while GitHub ops are running
                        >
                            Create Project and Repository
                        </Button>
                    </Stack>
                </form>
            </Box>
        </Flex>
        </>
    );
}

export default CreateProjectStudent;
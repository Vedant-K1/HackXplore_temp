import React, { useState, useEffect, useCallback, CSSProperties } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import {
    Box,
    Heading,
    Text,
    Spinner,
    Alert,
    AlertIcon,
    List,
    ListItem,
    Button,
    useColorModeValue,
    Flex,
    Link as ChakraLink,
    Divider,
    Code,
    Image,
    Tag,
    HStack,
    VStack,
    Icon,
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    Tooltip,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    useToast // For potential feedback messages
} from '@chakra-ui/react';
import { FaFolder, FaFileAlt, FaLink, FaCube, FaQuestion, FaGithub, FaUserFriends, FaArrowLeft, FaExternalLinkAlt } from 'react-icons/fa'; // Using react-icons
import { Navbar } from '../../../components/navbar';

// --- Type Definitions (Adapted from GitHubRepoExplorer) ---
interface RepoContentType { name: string; path: string; sha: string; size: number; url: string; html_url: string; git_url: string; download_url: string | null; type: 'file' | 'dir' | 'symlink' | 'submodule'; content?: string; encoding?: string; _links: { self: string; git: string; html: string; }; }
interface CollaboratorType { login: string; id: number; avatar_url: string; html_url: string; }
interface CommitAuthorInfo { name?: string; email?: string; date?: string; }
interface GitHubUserMini { login?: string; id?: number; avatar_url?: string; html_url?: string; }
interface CommitDetails { author?: CommitAuthorInfo; committer?: CommitAuthorInfo; message: string; comment_count: number; }
interface CommitType { sha: string; node_id: string; commit: CommitDetails; url: string; html_url: string; comments_url: string; author: GitHubUserMini | null; committer: GitHubUserMini | null; }

// --- Backend Response Types ---
interface ProjectDetailsResponse {
    message: string;
    project: { // Assuming backend sends project details like this
        _id: string;
        project_name: string;
        github_id: string; // The OWNER's GitHub ID for the repo
        // Any other relevant project details from MongoDB
    };
    github_PAT: string; // *** THE SECURELY FETCHED PAT ***
    github_id: string; // Teacher's GitHub ID (redundant if in project object, but okay)
    response: boolean;
}

// --- Utility Functions (Adapted) ---
function getErrorMessage(error: unknown): string { if (error instanceof Error) return error.message; return String(error); }
function safeDecodeBase64(base64String: string): string { try { if (typeof base64String !== 'string' || !/^[A-Za-z0-9+/]*={0,2}$/.test(base64String) || base64String.length % 4 !== 0) { /* console.warn("Invalid base64 input string"); */ } return atob(base64String); } catch (e) { console.error("Base64 decoding failed:", e); return `[Error decoding content: ${getErrorMessage(e)}]`; } }
const formatCommitDate = (dateString?: string): string => { if (!dateString) return 'Unknown date'; try { return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch (e) { return dateString; } };

// --- Rate Limit State (Global/Context might be better later) ---
let rateLimitInfo = { limit: null as number | null, remaining: null as number | null, reset: null as number | null };

function ViewProjectStudent() {
    const { projectName } = useParams(); // Get project name from URL
    const toast = useToast();

    // --- State for Backend Data ---
    const [projectOwnerGitHubId, setProjectOwnerGitHubId] = useState<string | null>(null);
    const [githubPAT, setGithubPAT] = useState<string | null>(null); // State to hold the PAT
    const [isBackendLoading, setIsBackendLoading] = useState<boolean>(true);
    const [backendError, setBackendError] = useState<string | null>(null);

    // --- State for GitHub Data Browsing (Adapted from GitHubRepoExplorer) ---
    const [isGitHubLoading, setIsGitHubLoading] = useState<boolean>(true); // Combined loading for GitHub data
    const [gitHubError, setGitHubError] = useState<string | null>(null); // Errors from GitHub API calls
    const [currentPath, setCurrentPath] = useState<string>('');
    const [repoContents, setRepoContents] = useState<RepoContentType[]>([]);
    const [isContentLoading, setIsContentLoading] = useState<boolean>(false); // For subdirs/files
    const [contentError, setContentError] = useState<string | null>(null);
    const [fileContent, setFileContent] = useState<string | null>(null);
    const [isFileContentLoading, setIsFileContentLoading] = useState<boolean>(false);
    const [fileContentError, setFileContentError] = useState<string | null>(null);
    const [currentRateLimit, setCurrentRateLimit] = useState(rateLimitInfo);
    const [collaborators, setCollaborators] = useState<CollaboratorType[]>([]);
    const [commits, setCommits] = useState<CommitType[]>([]);

    // --- UI Styling ---
    const bgColor = useColorModeValue('gray.50', 'gray.800');
    const cardBgColor = useColorModeValue('white', 'gray.700');
    const borderColor = useColorModeValue('gray.200', 'gray.600');
    const headingColor = useColorModeValue('purple.600', 'purple.300');
    const textColor = useColorModeValue('gray.600', 'gray.300');
    const codeBg = useColorModeValue('gray.100', 'gray.900');
    const codeColor = useColorModeValue('black', 'white');

    // --- Centralized GitHub API Fetching (MODIFIED TO USE STATE PAT) ---
    const githubApiFetch = useCallback(async (url: string, options: RequestInit = {}): Promise<Response> => {
        if (!githubPAT) {
            throw new Error("GitHub PAT not available. Cannot make API request.");
        }

        const headers: HeadersInit = {
            'Accept': 'application/vnd.github.v3+json',
            'Authorization': `Bearer ${githubPAT}`, // Use the PAT from state
            ...options.headers,
        };

        const response = await fetch(url.startsWith('https://') ? url : `https://api.github.com${url}`, {
            ...options,
            headers,
        });

        // Update rate limit info
        const limit = response.headers.get('X-RateLimit-Limit');
        const remaining = response.headers.get('X-RateLimit-Remaining');
        const reset = response.headers.get('X-RateLimit-Reset');
        rateLimitInfo = {
            limit: limit ? parseInt(limit, 10) : null,
            remaining: remaining ? parseInt(remaining, 10) : null,
            reset: reset ? parseInt(reset, 10) : null,
        };
        setCurrentRateLimit({ ...rateLimitInfo }); // Update state for display

        if (rateLimitInfo.remaining === 0 && rateLimitInfo.reset) {
            console.warn(`GitHub API rate limit reached. Resets at ${new Date(rateLimitInfo.reset * 1000).toLocaleTimeString()}`);
            toast({ title: "GitHub Rate Limit Reached", status: "warning", duration: 5000, isClosable: true });
        }

        if (!response.ok) {
            let errorMessage = `GitHub API Error: ${response.status} ${response.statusText} for ${options.method || 'GET'} ${url}`;
            try {
                const errorJson = await response.json();
                errorMessage = errorJson.message || errorMessage;
                // Add more specific error details if needed...
            } catch (e) {
                console.error("Could not parse error response body as JSON", e);
            }
            throw new Error(errorMessage);
        }
        return response;
    }, [githubPAT, toast]); // Dependency: PAT and toast

    // --- GitHub API Functions (Adapted, using useCallback) ---
    const fetchRepoContents = useCallback(async (owner: string, repo: string, path: string = ''): Promise<RepoContentType[]> => {
        const encodedPath = path.split('/').map(encodeURIComponent).join('/');
        const response = await githubApiFetch(`/repos/${owner}/${repo}/contents/${encodedPath}?per_page=100`);
        const data = await response.json();
        // Basic validation
        const contentsArray = Array.isArray(data) ? data : [data];
        if (!contentsArray.every(item => typeof item === 'object' && item !== null && 'name' in item && 'type' in item && 'path' in item)) {
             console.warn("Received potentially invalid data format for repository contents.");
             // Filter out potentially invalid items or throw stricter error
             return contentsArray.filter(item => typeof item === 'object' && item !== null && 'name' in item && 'type' in item && 'path' in item) as RepoContentType[];
        }
        contentsArray.sort((a, b) => { /* Sort logic... */ });
        return contentsArray as RepoContentType[];
    }, [githubApiFetch]);

    const fetchFileContent = useCallback(async (owner: string, repo: string, path: string): Promise<string> => {
        const encodedPath = path.split('/').map(encodeURIComponent).join('/');
        const response = await githubApiFetch(`/repos/${owner}/${repo}/contents/${encodedPath}`);
        const data: RepoContentType = await response.json();
        if (data.type !== 'file' || typeof data.content === 'undefined' || data.encoding !== 'base64') {
            throw new Error(`Path "${path}" is not a file or content is missing/invalid.`);
        }
        return safeDecodeBase64(data.content);
    }, [githubApiFetch]);

    const fetchCollaborators = useCallback(async (owner: string, repo: string): Promise<CollaboratorType[]> => {
        const response = await githubApiFetch(`/repos/${owner}/${repo}/collaborators?per_page=100`);
        const data = await response.json();
        if (!Array.isArray(data)) { throw new Error("Unexpected response format (collaborators)."); }
        return data as CollaboratorType[];
    }, [githubApiFetch]);

    const fetchCommits = useCallback(async (owner: string, repo: string, perPage: number = 30): Promise<CommitType[]> => {
        const effectivePerPage = Math.min(perPage, 100);
        const response = await githubApiFetch(`/repos/${owner}/${repo}/commits?per_page=${effectivePerPage}`);
        const data = await response.json();
        if (!Array.isArray(data)) { throw new Error("Unexpected response format (commits)."); }
        return data as CommitType[];
    }, [githubApiFetch]);


    // --- Effect 1: Fetch Backend Data (Project Details + PAT) ---
    useEffect(() => {
        if (!projectName) {
            setBackendError("Project name not found in URL.");
            setIsBackendLoading(false);
            return;
        }

        const fetchProjectDetails = async () => {
            setIsBackendLoading(true);
            setBackendError(null);
            setProjectOwnerGitHubId(null);
            setGithubPAT(null); // Clear previous PAT

            try {
                 // Using POST as defined in backend, though GET with URL param is standard for fetching
                const response = await fetch(`/api/student/projects/${projectName}`, {
                    method: 'POST',
                     headers: {
                        'Content-Type': 'application/json',
                         // Cookies should be sent automatically
                    },
                     // If POST needs a body add it, otherwise remove.
                     // body: JSON.stringify({ project_name: projectName })
                });

                if (!response.ok) {
                    let errorMsg = `Failed to fetch project details (Status: ${response.status})`;
                     try { const errData = await response.json(); errorMsg = errData.message || errorMsg; } catch (e) { /* ignore */ }
                    throw new Error(errorMsg);
                }

                const data: ProjectDetailsResponse = await response.json();
                console.log("ddd",data)
                if (data.response && data.project && data.github_PAT && data.github_id) {
                    if (data.project.project_name !== projectName) {
                         console.warn("Project name mismatch between request and response.");
                         // Decide how to handle this - maybe trust the response?
                    }
                    setProjectOwnerGitHubId(data.github_id); // The *owner* ID needed for API calls
                    setGithubPAT(data.github_PAT); // *** Store the fetched PAT securely in state ***
                } else {
                    throw new Error(data.message || "Invalid response structure from backend.");
                }
            } catch (err: any) {
                console.error("Error fetching project details:", err);
                setBackendError(err.message || "An unexpected error occurred fetching project data.");
            } finally {
                setIsBackendLoading(false);
            }
        };

        fetchProjectDetails();

    }, [projectName]); // Re-run if projectName changes


    // --- Effect 2: Fetch GitHub Data (Contents, Commits, Collaborators) AFTER Backend Data is Ready ---
    useEffect(() => {
        // Only proceed if backend data (owner ID, PAT) is loaded and no backend error
        if (isBackendLoading || backendError || !projectOwnerGitHubId || !githubPAT || !projectName) {
             // If backend failed or is loading, ensure GitHub loading is false
             if(backendError || !isBackendLoading) setIsGitHubLoading(false);
            return;
        }

        // Reset GitHub specific states before fetching
        setIsGitHubLoading(true);
        setGitHubError(null);
        setCurrentPath('');
        setRepoContents([]);
        setCollaborators([]);
        setCommits([]);
        setFileContent(null);
        setContentError(null);
        setFileContentError(null);


        const fetchAllGitHubData = async () => {
             console.log(`Fetching GitHub data for ${projectOwnerGitHubId}/${projectName}`);
            try {
                // Use Promise.allSettled to fetch concurrently
                const results = await Promise.allSettled([
                    fetchRepoContents(projectOwnerGitHubId, projectName, ''), // Initial contents
                    fetchCollaborators(projectOwnerGitHubId, projectName),
                    fetchCommits(projectOwnerGitHubId, projectName, 30) // Fetch recent 30 commits
                ]);

                let overallError = false;
                let errorMessages: string[] = [];

                // Process Repo Contents
                if (results[0].status === 'fulfilled') {
                    setRepoContents(results[0].value);
                } else {
                    const errMsg = getErrorMessage(results[0].reason);
                    console.error("Error loading initial repository contents:", errMsg);
                    errorMessages.push(`Contents: ${errMsg}`);
                    overallError = true;
                }

                // Process Collaborators
                if (results[1].status === 'fulfilled') {
                    setCollaborators(results[1].value);
                } else {
                    const errMsg = getErrorMessage(results[1].reason);
                     console.error("Error fetching collaborators:", errMsg);
                     // Non-critical usually, maybe just log or show minor warning
                    // errorMessages.push(`Collaborators: ${errMsg}`);
                    // overallError = true; // Decide if this is a blocking error
                     setCollaborators([]); // Ensure it's an empty array on error
                }

                // Process Commits
                if (results[2].status === 'fulfilled') {
                    setCommits(results[2].value);
                } else {
                    const errMsg = getErrorMessage(results[2].reason);
                    console.error("Error fetching commits:", errMsg);
                    errorMessages.push(`Commits: ${errMsg}`);
                    overallError = true;
                }

                if (overallError) {
                     setGitHubError(`Failed to load some repository data: ${errorMessages.join('; ')}`);
                }

            } catch (err: any) {
                // Catch errors from Promise.allSettled itself (unlikely) or initial setup
                console.error("Generic error fetching GitHub data:", err);
                setGitHubError(getErrorMessage(err));
            } finally {
                setIsGitHubLoading(false);
            }
        };

        fetchAllGitHubData();

    }, [
        isBackendLoading, // Depends on backend loading state
        backendError, // Depends on backend error state
        projectOwnerGitHubId, // Depends on owner ID
        githubPAT, // Depends on PAT availability
        projectName, // Depends on project name
        fetchRepoContents, // Include API functions in dependencies
        fetchCollaborators,
        fetchCommits
    ]); // Re-run if backend data or API functions change


    // --- UI Callbacks (Adapted) ---
    const loadContents = useCallback(async (path: string) => {
        if (!projectOwnerGitHubId || !projectName) return;

        const setLoading = path === '' ? setIsGitHubLoading : setIsContentLoading; // Use overall for root, specific for sub
        setLoading(true);
        setContentError(null);
        setFileContent(null); // Clear file view when navigating dirs
        setFileContentError(null);
        // Don't clear repoContents immediately, looks jerky. Maybe clear after fetch starts.

        try {
             setRepoContents([]); // Clear existing contents before fetching new ones
            const contents = await fetchRepoContents(projectOwnerGitHubId, projectName, path);
            setRepoContents(contents);
            setCurrentPath(path);
        } catch (err) {
            const errMsg = getErrorMessage(err);
            console.error(`Error loading contents for path "${path}":`, errMsg);
            setContentError(`Failed to load directory contents: ${errMsg}`);
            setRepoContents([]); // Ensure empty on error
        } finally {
            setLoading(false);
        }
    }, [projectOwnerGitHubId, projectName, fetchRepoContents]);

     const handleContentItemClick = useCallback(async (item: RepoContentType) => {
        if (!projectOwnerGitHubId || !projectName) return;
        const { type, path } = item;

        if (type === 'dir') {
            loadContents(path);
        } else if (type === 'file') {
            setIsFileContentLoading(true);
            setFileContentError(null);
            setFileContent(null);
            try {
                const content = await fetchFileContent(projectOwnerGitHubId, projectName, path);
                setFileContent(content);
                setCurrentPath(path); // Update path to show the file path
                 setContentError(null); // Clear directory errors if file loads
            } catch (err) {
                const errMsg = getErrorMessage(err);
                console.error(`Error loading file content for path "${path}":`, errMsg);
                setFileContentError(`Failed to load file: ${errMsg}`);
            } finally {
                setIsFileContentLoading(false);
            }
        } else {
             setContentError(`Viewing content for type "${type}" is not supported yet.`);
             toast({ title: "Unsupported Type", description: `Cannot view '${item.name}' (${type}).`, status: "info", duration: 3000 });
        }
    }, [projectOwnerGitHubId, projectName, loadContents, fetchFileContent, toast]);

     const handleGoBack = useCallback(() => {
        const targetPath = currentPath.includes('/') ? currentPath.substring(0, currentPath.lastIndexOf('/')) : '';
        // Reset file view state
        setFileContent(null);
        setFileContentError(null);
        // Load parent directory contents
        loadContents(targetPath);
    }, [currentPath, loadContents]);

    // --- Helper: Render Breadcrumbs ---
    const renderBreadcrumbs = () => {
        const pathParts = currentPath ? currentPath.split('/') : [];
        const isFileView = fileContent !== null; // Determine if currently viewing a file

        return (
            <Breadcrumb separator="/" fontSize="md" color={textColor}>
                <BreadcrumbItem>
                    {/* Link to root directory */}
                    <BreadcrumbLink
                        as={ChakraLink}
                        onClick={(e) => { e.preventDefault(); loadContents(''); }}
                        fontWeight={pathParts.length === 0 && !isFileView ? 'bold' : 'normal'}
                        color={pathParts.length === 0 && !isFileView ? headingColor : 'inherit'}
                        _hover={{ textDecoration: 'underline', color: headingColor }}
                    >
                        {projectName} {/* Show Repo Name at Root */}
                    </BreadcrumbLink>
                </BreadcrumbItem>

                {pathParts.map((part, index) => {
                    const currentPartPath = pathParts.slice(0, index + 1).join('/');
                    const isLastPart = index === pathParts.length - 1;

                    return (
                        <BreadcrumbItem key={index} isCurrentPage={isLastPart}>
                             {/* Link to intermediate directories */}
                            <BreadcrumbLink
                                as={ChakraLink}
                                onClick={(e) => { e.preventDefault(); if (!isLastPart || !isFileView) loadContents(currentPartPath); }} // Only allow clicking if not the last part OR if it is the last part but we are viewing a file (so click goes to dir)
                                fontWeight={isLastPart ? 'bold' : 'normal'}
                                color={isLastPart ? headingColor : 'inherit'}
                                isTruncated
                                maxWidth="150px" // Prevent long names from breaking layout
                                title={part}
                                _hover={{ textDecoration: 'underline', color: headingColor }}
                            >
                                {part}
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                    );
                })}
            </Breadcrumb>
        );
    };

    // --- Helper: Get Icon for Item Type ---
    const getItemIcon = (type: RepoContentType['type']) => {
        switch (type) {
            case 'dir': return FaFolder;
            case 'file': return FaFileAlt;
            case 'symlink': return FaLink;
            case 'submodule': return FaCube; // Or FaGithub?
            default: return FaQuestion;
        }
    };


    // --- Main Render ---
    if (isBackendLoading) {
        return (
            <Flex justify="center" align="center" minH="80vh">
                <Spinner size="xl" color={headingColor} />
                <Text ml={4} fontSize="lg" color={textColor}>Loading project details...</Text>
            </Flex>
        );
    }

    if (backendError) {
        return (
            <Flex justify="center" align="center" minH="80vh" p={6}>
                <Alert status="error" maxW="lg" borderRadius="md">
                    <AlertIcon />
                    <Box>
                        {/* <AlertTitle>Error Loading Project</AlertTitle>
                         <AlertDescription>{backendError}</AlertDescription> */}
                         <Button as={RouterLink} to="/student/projects" mt={4} colorScheme="purple" size="sm">
                             Back to Projects
                         </Button>
                    </Box>
                </Alert>
            </Flex>
        );
    }

     // Only render GitHub explorer part if backend load was successful
    return (
        <>
         <Navbar />
        <Box p={6} bg={bgColor} minH="100vh">
            {/* Header */}
            <Flex justify="space-between" align="center" mb={4} wrap="wrap" gap={4}>
                <Heading as="h1" size="lg" color={headingColor} noOfLines={1}>
                    Project: {projectName}
                </Heading>
                 <ChakraLink
                    href={`https://github.com/${projectOwnerGitHubId}/${projectName}`}
                    isExternal
                    colorScheme="gray"
                    variant="outline"
                    size="sm"
                    // leftIcon={<Icon as={FaGithub} />}
                >
                    View on GitHub <Icon as={FaExternalLinkAlt} mx="2px" />
                </ChakraLink>
            </Flex>

             {/* Rate Limit Info */}
            {currentRateLimit.limit !== null && (
                <Text fontSize="xs" color={textColor} textAlign="right" mb={4}>
                    GitHub API Rate Limit: {currentRateLimit.remaining ?? 'N/A'} / {currentRateLimit.limit ?? 'N/A'} remaining.
                    {currentRateLimit.remaining === 0 && currentRateLimit.reset && ` Resets at ${new Date(currentRateLimit.reset * 1000).toLocaleTimeString()}.`}
                </Text>
            )}

            {/* Main Content Area with Tabs */}
             <Tabs isLazy variant="soft-rounded" colorScheme="purple">
                 <TabList mb={4}>
                     <Tab>Files</Tab>
                     <Tab>Commits</Tab>
                     <Tab>Collaborators</Tab>
                 </TabList>

                 <TabPanels>
                    {/* --- Tab: Files --- */}
                    <TabPanel p={0}>
                         <Box borderWidth="1px" borderRadius="lg" bg={cardBgColor} p={4} borderColor={borderColor}>
                            {/* Back Button & Breadcrumbs */}
                             <Flex align="center" justify="space-between" mb={4} borderBottomWidth={1} pb={3} borderColor={borderColor}>
                                 {(currentPath || fileContent !== null) && (
                                     <Button
                                        //  leftIcon={<FaArrowLeft />}
                                         size="sm"
                                         variant="ghost"
                                         onClick={handleGoBack}
                                         isDisabled={isContentLoading || isFileContentLoading}
                                         mr={3}
                                     >
                                         Back
                                     </Button>
                                 )}
                                 <Box flexGrow={1} overflow="hidden">
                                     {renderBreadcrumbs()}
                                 </Box>
                             </Flex>

                             {/* Loading/Error for GitHub Data */}
                              {isGitHubLoading && !isContentLoading && !isFileContentLoading && (
                                 <Flex justify="center" p={6}><Spinner color={headingColor} /></Flex>
                             )}
                             {gitHubError && (
                                 <Alert status="warning" my={4} borderRadius="md"><AlertIcon />{gitHubError}</Alert>
                             )}
                              {isContentLoading && <Flex justify="center" p={6}><Spinner color={headingColor} /></Flex>}
                              {contentError && <Alert status="error" my={4} borderRadius="md"><AlertIcon />{contentError}</Alert>}
                              {isFileContentLoading && <Flex justify="center" p={6}><Spinner color={headingColor} /></Flex>}
                              {fileContentError && <Alert status="error" my={4} borderRadius="md"><AlertIcon />{fileContentError}</Alert>}


                            {/* File Content Display */}
                            {fileContent !== null && !isFileContentLoading && !fileContentError && (
                                <Box
                                    borderWidth={1} borderRadius="md" borderColor={borderColor}
                                    mt={4} maxHeight="60vh" overflowY="auto"
                                    bg={codeBg} color={codeColor}
                                >
                                    <Text p={3} borderBottomWidth={1} borderColor={borderColor} fontWeight="medium" fontSize="sm">
                                        Viewing: {currentPath.split('/').pop()}
                                    </Text>
                                    <Code as="pre" p={4} display="block" whiteSpace="pre-wrap" wordBreak="break-all" fontSize="sm" bg="transparent">
                                        {fileContent}
                                    </Code>
                                </Box>
                            )}

                            {/* Directory Listing */}
                             {!isGitHubLoading && !gitHubError && !isContentLoading && !contentError && fileContent === null && (
                                 <List spacing={0}>
                                     {repoContents.length === 0 && (
                                         <ListItem p={4} textAlign="center" color={textColor}>
                                             {currentPath ? 'Directory is empty.' : 'Repository is empty or inaccessible.'}
                                         </ListItem>
                                     )}
                                     {repoContents.map((item) => (
                                         <ListItem
                                             key={item.sha}
                                             borderBottomWidth="1px"
                                             borderColor={borderColor}
                                             _last={{ borderBottomWidth: 0 }}
                                         >
                                             <Flex
                                                 align="center"
                                                 p={3}
                                                 _hover={{ bg: useColorModeValue('gray.100', 'gray.600') }}
                                                 cursor={item.type === 'dir' || item.type === 'file' ? 'pointer' : 'default'}
                                                 onClick={() => { if(item.type === 'dir' || item.type === 'file') handleContentItemClick(item); }}
                                                 role={item.type === 'dir' || item.type === 'file' ? 'button' : undefined}
                                                 tabIndex={item.type === 'dir' || item.type === 'file' ? 0 : undefined}
                                                  onKeyPress={(e) => { if ((e.key === 'Enter' || e.key === ' ') && (item.type === 'dir' || item.type === 'file')) handleContentItemClick(item); }}
                                             >
                                                 <Icon as={getItemIcon(item.type)} mr={3} color={item.type === 'dir' ? 'blue.400' : textColor} w={5} h={5} />
                                                 <Text flexGrow={1} noOfLines={1} title={item.name}>
                                                     {item.name}
                                                 </Text>
                                                 {item.type !== 'dir' && item.type !== 'file' && (
                                                     <Tag size="sm" colorScheme="gray" ml={2}>({item.type})</Tag>
                                                 )}
                                             </Flex>
                                         </ListItem>
                                     ))}
                                 </List>
                             )}
                         </Box>
                    </TabPanel>

                    {/* --- Tab: Commits --- */}
                    <TabPanel p={0}>
                         <Box borderWidth="1px" borderRadius="lg" bg={cardBgColor} p={4} borderColor={borderColor}>
                            <Heading size="md" mb={4} color={headingColor} borderBottomWidth={1} pb={2} borderColor={borderColor}>
                                Recent Commits
                            </Heading>
                             {isGitHubLoading && <Flex justify="center" p={6}><Spinner color={headingColor} /></Flex>}
                             {gitHubError && !isGitHubLoading && <Alert status="warning" borderRadius="md"><AlertIcon />Could not load commit history.</Alert>}
                             {!isGitHubLoading && !gitHubError && (
                                 commits.length === 0 ? (
                                     <Text color={textColor} textAlign="center" p={4}>No commits found or history is inaccessible.</Text>
                                 ) : (
                                     <List spacing={0}>
                                         {commits.map((commit) => {
                                             const authorLogin = commit.author?.login;
                                             const authorAvatar = commit.author?.avatar_url;
                                             const authorHtmlUrl = commit.author?.html_url;
                                             const authorName = commit.commit.author?.name ?? 'Unknown Author';
                                             const commitDate = formatCommitDate(commit.commit.author?.date);
                                             const commitMessage = commit.commit.message.split('\n')[0]; // First line

                                             return (
                                                 <ListItem
                                                     key={commit.sha}
                                                     py={3}
                                                     borderBottomWidth="1px"
                                                     borderColor={borderColor}
                                                     _last={{ borderBottomWidth: 0 }}
                                                 >
                                                     <Flex align="flex-start" justify="space-between" gap={3}>
                                                         <HStack spacing={3} align="flex-start" flexGrow={1} minWidth={0}>
                                                              <Tooltip label={authorLogin || authorName} placement="top" hasArrow>
                                                                  <ChakraLink href={authorHtmlUrl ?? '#'} isExternal={!!authorHtmlUrl}>
                                                                     <Image
                                                                         src={authorAvatar}
                                                                         fallbackSrc={`https://avatars.dicebear.com/api/initials/${encodeURIComponent(authorName)}.svg`} // Placeholder
                                                                         alt={`${authorLogin || authorName} avatar`}
                                                                         boxSize="32px"
                                                                         borderRadius="full"
                                                                         mt={1} // Align better with text
                                                                     />
                                                                  </ChakraLink>
                                                               </Tooltip>
                                                             <VStack align="flex-start" spacing={0} flexGrow={1} overflow="hidden">
                                                                 <Tooltip label={commit.commit.message} placement="top" hasArrow openDelay={500}>
                                                                    <Text fontWeight="medium" noOfLines={1} title={commit.commit.message}>{commitMessage}</Text>
                                                                 </Tooltip>
                                                                 <HStack spacing={1.5} wrap="wrap" fontSize="sm" color={textColor}>
                                                                     {authorHtmlUrl ? (
                                                                         <ChakraLink href={authorHtmlUrl} isExternal fontWeight="bold" color={headingColor} _hover={{ textDecoration: 'underline' }}>{authorLogin || authorName}</ChakraLink>
                                                                     ) : (
                                                                         <Text fontWeight="bold">{authorName}</Text>
                                                                     )}
                                                                      <Text>committed on</Text>
                                                                      <Text>{commitDate}</Text>
                                                                 </HStack>
                                                             </VStack>
                                                         </HStack>
                                                         <Tooltip label={`View commit ${commit.sha.substring(0, 7)} on GitHub`} placement="top" hasArrow>
                                                            <ChakraLink href={commit.html_url} isExternal flexShrink={0}>
                                                                <Code variant="subtle" colorScheme="purple" fontSize="sm">{commit.sha.substring(0, 7)}</Code>
                                                            </ChakraLink>
                                                         </Tooltip>
                                                     </Flex>
                                                 </ListItem>
                                             );
                                         })}
                                         {commits.length >= 30 && (
                                             <Text fontSize="sm" color={textColor} mt={4} textAlign="center">Showing the latest 30 commits.</Text>
                                         )}
                                     </List>
                                 )
                             )}
                         </Box>
                    </TabPanel>

                    {/* --- Tab: Collaborators --- */}
                    <TabPanel p={0}>
                         <Box borderWidth="1px" borderRadius="lg" bg={cardBgColor} p={4} borderColor={borderColor}>
                            <Heading size="md" mb={4} color={headingColor} borderBottomWidth={1} pb={2} borderColor={borderColor}>
                                Collaborators
                            </Heading>
                             {isGitHubLoading && <Flex justify="center" p={6}><Spinner color={headingColor} /></Flex>}
                             {gitHubError && !isGitHubLoading && <Alert status="warning" borderRadius="md"><AlertIcon />Could not load collaborators.</Alert>}
                             {!isGitHubLoading && !gitHubError && (
                                 collaborators.length === 0 ? (
                                     <Text color={textColor} textAlign="center" p={4}>No collaborators found or they are inaccessible.</Text>
                                 ) : (
                                     <Flex wrap="wrap" gap={4}>
                                         {collaborators.map(collab => (
                                             <Tooltip key={collab.id} label={collab.login} placement="top" hasArrow>
                                                <ChakraLink href={collab.html_url} isExternal _hover={{ textDecoration: 'none' }}>
                                                    <VStack spacing={1}>
                                                        <Image
                                                             src={collab.avatar_url}
                                                             alt={`${collab.login} avatar`}
                                                             boxSize="48px"
                                                             borderRadius="full"
                                                             borderWidth={1}
                                                             borderColor={borderColor}
                                                         />
                                                         <Text fontSize="xs" noOfLines={1}>{collab.login}</Text>
                                                    </VStack>
                                                </ChakraLink>
                                             </Tooltip>
                                         ))}
                                     </Flex>
                                 )
                             )}
                         </Box>
                    </TabPanel>
                 </TabPanels>
             </Tabs>
        </Box>
        </>
    );
}

export default ViewProjectStudent;
import React, { useState, useEffect, useCallback } from 'react';

// --- Type Definitions ---
// (Keep existing: RepoContentType, CollaboratorType, ErrorWithMessageType, AuthenticatedUser, CreatedRepository)
interface RepoContentType { name: string; path: string; sha: string; size: number; url: string; html_url: string; git_url: string; download_url: string | null; type: 'file' | 'dir' | 'symlink' | 'submodule'; content?: string; encoding?: string; _links: { self: string; git: string; html: string; }; }
interface CollaboratorType { login: string; id: number; avatar_url: string; html_url: string; }
interface ErrorWithMessageType { message: string; }
interface AuthenticatedUser { login: string; id: number; /* ... */ }
interface CreatedRepository { id: number; name: string; full_name: string; html_url: string; owner: { login: string; }; }

// Added type for Commit data
interface CommitAuthorInfo {
    name?: string;
    email?: string;
    date?: string; // ISO 8601 format
}
interface GitHubUserMini { // Can be null if git author != GitHub user
    login?: string;
    id?: number;
    avatar_url?: string;
    html_url?: string;
}
interface CommitDetails {
    author?: CommitAuthorInfo;
    committer?: CommitAuthorInfo;
    message: string;
    // tree: { sha: string; url: string; };
    // url: string; // API URL for the commit details
    comment_count: number;
}
interface CommitType {
    sha: string;
    node_id: string;
    commit: CommitDetails;
    url: string; // API URL for the commit
    html_url: string; // URL to view commit on GitHub.com
    comments_url: string;
    author: GitHubUserMini | null;
    committer: GitHubUserMini | null;
    // parents: { sha: string; url: string; html_url: string; }[];
}


// --- Utility Functions ---
// (Keep isErrorWithMessage, getErrorMessage, safeDecodeBase64)
function isErrorWithMessage(error: unknown): error is ErrorWithMessageType { return ( typeof error === 'object' && error !== null && 'message' in error && typeof (error as Record<string, unknown>).message === 'string'); }
function getErrorMessage(error: unknown): string { if (isErrorWithMessage(error)) return error.message; if (error instanceof Error) return error.message; return String(error); }
function safeDecodeBase64(base64String: string): string { try { if (typeof base64String !== 'string' || !/^[A-Za-z0-9+/]*={0,2}$/.test(base64String) || base64String.length % 4 !== 0) { /* console.warn("Invalid base64 input string"); return '[Invalid Base64 String]'; */ } return atob(base64String); } catch (e) { console.error("Base64 decoding failed:", e, "Input:", base64String.substring(0, 50) + '...'); return `[Error decoding content: ${getErrorMessage(e)}]`; } }

// --- Centralized API Fetching Logic with Auth ---
// (Keep rateLimitInfo, githubApiFetch - including auth)
let rateLimitInfo = { limit: null as number | null, remaining: null as number | null, reset: null as number | null };
const githubApiFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const headers: HeadersInit = { 'Accept': 'application/vnd.github.v3+json', ...options.headers, };
    const token = "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"; // <-- VERY INSECURE - FOR DEMO ONLY
    if (token) { headers['Authorization'] = `Bearer ${token}`; } else { if (!(githubApiFetch as any).hasWarnedNoToken) { console.warn("GitHub API requests need authentication for create/modify operations..."); (githubApiFetch as any).hasWarnedNoToken = true; } }
    (githubApiFetch as any).hasWarnedNoToken = (githubApiFetch as any).hasWarnedNoToken || false;

    const response = await fetch(url.startsWith('https://') ? url : `https://api.github.com${url}`, { ...options, headers, });

    const limit = response.headers.get('X-RateLimit-Limit'); const remaining = response.headers.get('X-RateLimit-Remaining'); const reset = response.headers.get('X-RateLimit-Reset');
    rateLimitInfo = { limit: limit ? parseInt(limit, 10) : null, remaining: remaining ? parseInt(remaining, 10) : null, reset: reset ? parseInt(reset, 10) : null, };
    if (rateLimitInfo.remaining === 0 && rateLimitInfo.reset) { console.warn(`GitHub API rate limit reached. Resets at ${new Date(rateLimitInfo.reset * 1000).toLocaleTimeString()}`); }

    if (!response.ok) {
        let errorMessage = `GitHub API Error: ${response.status} ${response.statusText} for ${options.method || 'GET'} ${url}`; let errorJson;
        try { errorJson = await response.json(); errorMessage = errorJson.message || errorMessage; if (errorJson.errors && Array.isArray(errorJson.errors)) { errorMessage += ` Details: ${errorJson.errors.map((e: any) => `${e.resource}/${e.field}: ${e.message || e.code}`).join(', ')}`; } if (response.status === 403 && errorJson.message?.toLowerCase().includes('api rate limit exceeded')) { /*...*/ } else if (response.status === 404) { errorMessage = `Resource not found (${response.status}): ${errorJson.message || `Could not find ${url}`}`; } else if (response.status === 403) { errorMessage = `Permission denied (${response.status}): ${errorJson.message || 'Check PAT scopes or repository permissions.'}`; } else if (response.status === 422) { errorMessage = `Validation failed (${response.status}): ${errorMessage}`; }
        } catch (e) { console.error("Could not parse error response body as JSON", e); } throw new Error(errorMessage);
    }
    return response;
};


// --- Refactored API Functions ---
// (Keep fetchRepoContents, fetchFileContent, fetchCollaborators)
const fetchRepoContents = async (owner: string, repo: string, path: string = ''): Promise<RepoContentType[]> => { const encodedPath = path.split('/').map(encodeURIComponent).join('/'); const response = await githubApiFetch(`/repos/${owner}/${repo}/contents/${encodedPath}?per_page=100`); const data = await response.json(); const contentsArray = Array.isArray(data) ? data : [data]; if (!contentsArray.every(item => typeof item === 'object' && item !== null && 'name' in item && 'type' in item && 'path' in item)) { throw new Error("Received unexpected data format for repository contents."); } contentsArray.sort((a, b) => { if (a.type === b.type) return a.name.localeCompare(b.name); const typeOrder = { dir: 0, file: 1, symlink: 2, submodule: 3 }; return (typeOrder[a.type as keyof typeof typeOrder] ?? 99) - (typeOrder[b.type as keyof typeof typeOrder] ?? 99); }); return contentsArray as RepoContentType[]; };
const fetchFileContent = async (owner: string, repo: string, path: string): Promise<string> => { const encodedPath = path.split('/').map(encodeURIComponent).join('/'); const response = await githubApiFetch(`/repos/${owner}/${repo}/contents/${encodedPath}`); const data: RepoContentType = await response.json(); if (data.type !== 'file' || typeof data.content === 'undefined' || data.encoding !== 'base64') { if (Array.isArray(data)) throw new Error(`Path "${path}" refers to a directory, not a file.`); throw new Error(`Path "${path}" might not be a file, or content is missing/not base64. Type received: ${data.type}`); } return safeDecodeBase64(data.content); };
const fetchCollaborators = async (owner: string, repo: string): Promise<CollaboratorType[]> => { const response = await githubApiFetch(`/repos/${owner}/${repo}/collaborators?per_page=100`); const data = await response.json(); if (!Array.isArray(data)) { throw new Error("Unexpected response format when fetching collaborators."); } if (data.length > 0 && !( 'login' in data[0] && 'avatar_url' in data[0] && 'id' in data[0])) { /* Warning or stricter check possible */ } return data as CollaboratorType[]; };

// (Keep fetchAuthenticatedUser, createRepository, addCollaborator)
const fetchAuthenticatedUser = async (): Promise<AuthenticatedUser> => { const response = await githubApiFetch('/user'); const data = await response.json(); if (!data || typeof data.login !== 'string' || typeof data.id !== 'number') { throw new Error("Unexpected response format when fetching authenticated user."); } return data as AuthenticatedUser; };
const createRepository = async (name: string, description: string, isPrivate: boolean): Promise<CreatedRepository> => { const response = await githubApiFetch('/user/repos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name, description: description, private: isPrivate, /* auto_init: true */ }), }); if (response.status !== 201) { throw new Error(`Unexpected status code ${response.status} when creating repository.`); } const data = await response.json(); return data as CreatedRepository; };
const addCollaborator = async (owner: string, repo: string, username: string): Promise<void> => { const response = await githubApiFetch(`/repos/${owner}/${repo}/collaborators/${username}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, /* body: JSON.stringify({ permission: 'push' }) */ }); if (response.status !== 201 && response.status !== 204) { throw new Error(`Unexpected status code ${response.status} when adding collaborator.`); } };

// --- NEW API Function: Fetch Commits ---
const fetchCommits = async (owner: string, repo: string, perPage: number = 30): Promise<CommitType[]> => {
    // GET /repos/{owner}/{repo}/commits
    const effectivePerPage = Math.min(perPage, 100); // GitHub max is 100
    const response = await githubApiFetch(`/repos/${owner}/${repo}/commits?per_page=${effectivePerPage}`);
    const data = await response.json();
    if (!Array.isArray(data)) {
        throw new Error("Unexpected response format when fetching commits.");
    }
    // Optional: Add more robust validation for commit structure
    if (data.length > 0 && !(data[0].sha && data[0].commit && data[0].commit.message)) {
        console.warn("Received commit data structure might be incomplete.");
    }
    return data as CommitType[];
};


// --- The Expanded Component ---
interface GitHubRepoExplorerProps {
    username: string; // Username of the repo owner to BROWSE
    repositoryName: string; // Name of the repo to BROWSE
}

function GitHubRepoExplorer({ username: browseUsername, repositoryName: browseRepoName }: GitHubRepoExplorerProps) {
    // Demo defaults (consider removing or making conditional)
    browseUsername = "Dhruvil099";
    browseRepoName = "CodeDIV_Hack2infinity";

  // --- State for Repo Management ---
  const [authenticatedUser, setAuthenticatedUser] = useState<AuthenticatedUser | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [newRepoName, setNewRepoName] = useState<string>("");
  const [newRepoDescription, setNewRepoDescription] = useState<string>("");
  const [newRepoIsPrivate, setNewRepoIsPrivate] = useState<boolean>(false);
  const [isCreatingRepo, setIsCreatingRepo] = useState<boolean>(false);
  const [createRepoStatus, setCreateRepoStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [targetRepoForCollab, setTargetRepoForCollab] = useState<string>("");
  const [collaboratorUsername, setCollaboratorUsername] = useState<string>("");
  const [isAddingCollaborator, setIsAddingCollaborator] = useState<boolean>(false);
  const [addCollabStatus, setAddCollabStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // --- State for Repo Browsing (Existing) ---
  const [isLoading, setIsLoading] = useState<boolean>(true); // Initial load for browser section
  const [error, setError] = useState<string | null>(null); // Error for browser section initial load
  const [currentPath, setCurrentPath] = useState<string>('');
  const [repoContents, setRepoContents] = useState<RepoContentType[]>([]);
  const [isContentLoading, setIsContentLoading] = useState<boolean>(false); // Loading subdirectories
  const [contentError, setContentError] = useState<string | null>(null); // Error loading subdirectories
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [isFileContentLoading, setIsFileContentLoading] = useState<boolean>(false);
  const [fileContentError, setFileContentError] = useState<string | null>(null);
  const [currentRateLimit, setCurrentRateLimit] = useState(rateLimitInfo);
  const [collaborators, setCollaborators] = useState<CollaboratorType[]>([]);
  const [isCollaboratorsLoading, setIsCollaboratorsLoading] = useState<boolean>(true);
  const [collaboratorsError, setCollaboratorsError] = useState<string | null>(null);

  // --- State for Commit History ---
  const [commits, setCommits] = useState<CommitType[]>([]);
  const [isCommitsLoading, setIsCommitsLoading] = useState<boolean>(true);
  const [commitsError, setCommitsError] = useState<string | null>(null);

  // --- Utility and Callback Functions ---
  const updateRateLimitDisplay = useCallback(() => {
      setCurrentRateLimit({ ...rateLimitInfo });
  }, []);

  // --- Repo Management Handlers ---
  const handleCreateRepo = useCallback(async () => { /* ... existing handleCreateRepo logic ... */ if (!newRepoName.trim()) { setCreateRepoStatus({ type: 'error', message: "Repository name cannot be empty." }); return; } if (!authenticatedUser) { setCreateRepoStatus({ type: 'error', message: "Cannot create repository: Authenticated user not identified." }); return; } setIsCreatingRepo(true); setCreateRepoStatus(null); try { const createdRepo = await createRepository(newRepoName.trim(), newRepoDescription.trim(), newRepoIsPrivate); setCreateRepoStatus({ type: 'success', message: `Repository '${createdRepo.full_name}' created successfully!` }); setNewRepoName(""); setNewRepoDescription(""); setNewRepoIsPrivate(false); } catch (err) { setCreateRepoStatus({ type: 'error', message: `Failed to create repository: ${getErrorMessage(err)}` }); } finally { setIsCreatingRepo(false); updateRateLimitDisplay(); } }, [newRepoName, newRepoDescription, newRepoIsPrivate, authenticatedUser, updateRateLimitDisplay]);
  const handleAddCollaborator = useCallback(async () => { /* ... existing handleAddCollaborator logic ... */ const targetRepo = targetRepoForCollab.trim(); const collabUser = collaboratorUsername.trim(); if (!targetRepo || !collabUser) { setAddCollabStatus({ type: 'error', message: "Both repository name and collaborator username are required." }); return; } if (!authenticatedUser) { setAddCollabStatus({ type: 'error', message: "Cannot add collaborator: Authenticated user not identified." }); return; } setIsAddingCollaborator(true); setAddCollabStatus(null); try { await addCollaborator(authenticatedUser.login, targetRepo, collabUser); setAddCollabStatus({ type: 'success', message: `Invitation sent to '${collabUser}' for repository '${authenticatedUser.login}/${targetRepo}'. They need to accept it.` }); setTargetRepoForCollab(""); setCollaboratorUsername(""); } catch (err) { const errMsg = getErrorMessage(err); if (errMsg.includes('404') || errMsg.toLowerCase().includes('not found')) { setAddCollabStatus({ type: 'error', message: `Failed to add collaborator: Repository '${authenticatedUser.login}/${targetRepo}' not found or collaborator '${collabUser}' does not exist. ${errMsg}` }); } else { setAddCollabStatus({ type: 'error', message: `Failed to add collaborator: ${errMsg}` }); } } finally { setIsAddingCollaborator(false); updateRateLimitDisplay(); } }, [targetRepoForCollab, collaboratorUsername, authenticatedUser, updateRateLimitDisplay]);

  // --- Repo Browsing Callbacks (Existing) ---
  const loadContents = useCallback(async (path: string) => { /* ... existing loadContents logic ... */ const setLoading = path === '' ? setIsLoading : setIsContentLoading; setLoading(true); setContentError(null); setFileContent(null); setFileContentError(null); setRepoContents([]); try { const contents = await fetchRepoContents(browseUsername, browseRepoName, path); setRepoContents(contents); setCurrentPath(path); setError(null); } catch (err) { const errMsg = getErrorMessage(err); console.error(`Error loading contents for path "${path}":`, errMsg); if (path === '') setError(`Failed to load initial repository contents: ${errMsg}`); else setContentError(`Failed to load directory contents: ${errMsg}`); } finally { updateRateLimitDisplay(); setLoading(false); } }, [browseUsername, browseRepoName, updateRateLimitDisplay]);
  const handleContentItemClick = useCallback(async (item: RepoContentType) => { /* ... existing handleContentItemClick logic ... */ const { type, path } = item; if (type === 'dir') { loadContents(path); } else if (type === 'file') { setIsFileContentLoading(true); setFileContentError(null); setFileContent(null); try { const content = await fetchFileContent(browseUsername, browseRepoName, path); setFileContent(content); setCurrentPath(path); setContentError(null); } catch (err) { const errMsg = getErrorMessage(err); console.error(`Error loading file content for path "${path}":`, errMsg); setFileContentError(`Failed to load file: ${errMsg}`); } finally { updateRateLimitDisplay(); setIsFileContentLoading(false); } } else { setContentError(`Viewing content for type "${type}" is not supported.`); } }, [browseUsername, browseRepoName, loadContents, updateRateLimitDisplay]);
  const handleGoBack = useCallback(() => { /* ... existing handleGoBack logic ... */ const targetPath = currentPath.includes('/') ? currentPath.substring(0, currentPath.lastIndexOf('/')) : ''; setFileContent(null); setFileContentError(null); loadContents(targetPath); }, [currentPath, loadContents]);


  // --- Initial Load Effect (Fetch Auth User AND Repo Browse Data including Commits) ---
  useEffect(() => {
    // Fetch Authenticated User (no change)
    setIsAuthLoading(true); setAuthError(null); setAuthenticatedUser(null);
    fetchAuthenticatedUser()
        .then(user => { setAuthenticatedUser(user); setAuthError(null); })
        .catch(err => { const errMsg = getErrorMessage(err); console.error("Authentication Error:", errMsg); setAuthError(`Failed to verify authentication token: ${errMsg}. Management actions disabled.`); setAuthenticatedUser(null); })
        .finally(() => { setIsAuthLoading(false); updateRateLimitDisplay(); });

    // Reset browser state and load initial data for the browsed repo
    if (!browseUsername || !browseRepoName) {
        setError("Username and Repository Name props are required for browsing.");
        setIsLoading(false); setIsCollaboratorsLoading(false); setIsCommitsLoading(false); // Also set commit loading false
        return;
    }

    // Reset all browsing related states
    setError(null); setContentError(null); setCollaboratorsError(null); setCommitsError(null); // Reset commit error
    setIsLoading(true); setIsCollaboratorsLoading(true); setIsCommitsLoading(true); // Set commit loading true
    setCurrentPath('');
    setRepoContents([]); setCollaborators([]); setCommits([]); // Reset commits

    const fetchBrowseData = async () => {
        // Use Promise.allSettled to fetch contents, collaborators, and commits concurrently
        // allSettled ensures all promises complete, even if some fail.
        const results = await Promise.allSettled([
            fetchRepoContents(browseUsername, browseRepoName, ''),
            fetchCollaborators(browseUsername, browseRepoName),
            fetchCommits(browseUsername, browseRepoName, 30) // Fetch recent 30 commits
        ]);

        // Process Repo Contents result
        if (results[0].status === 'fulfilled') {
            setRepoContents(results[0].value);
            setError(null); // Clear general error if contents load
        } else {
            const errMsg = getErrorMessage(results[0].reason);
            console.error("Error loading initial repository contents:", errMsg);
            setError(`Failed to load repository contents: ${errMsg}`);
            setRepoContents([]);
        }

        // Process Collaborators result
        if (results[1].status === 'fulfilled') {
            setCollaborators(results[1].value);
            setCollaboratorsError(null);
        } else {
            const errMsg = getErrorMessage(results[1].reason);
            console.error("Error fetching collaborators:", errMsg);
            setCollaboratorsError(`Failed to load collaborators: ${errMsg}`);
            setCollaborators([]);
        }

        // Process Commits result
        if (results[2].status === 'fulfilled') {
            setCommits(results[2].value);
            setCommitsError(null);
        } else {
            const errMsg = getErrorMessage(results[2].reason);
            console.error("Error fetching commits:", errMsg);
            setCommitsError(`Failed to load commit history: ${errMsg}`);
            setCommits([]);
        }

        // Update loading states and rate limit
        setIsLoading(false); // Overall browser loading done
        setIsCollaboratorsLoading(false);
        setIsCommitsLoading(false);
        updateRateLimitDisplay();
    };

    fetchBrowseData();

  }, [browseUsername, browseRepoName, updateRateLimitDisplay]); // Rerun if props change


  // --- Inline Styles (Add styles for commit history) ---
   const styles: { [key: string]: React.CSSProperties } = {
    // ... (keep all existing styles: container, loading, error, success, infoText, section, ...)
    container: { fontFamily: 'sans-serif', maxWidth: '900px', margin: '20px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#fff' },
    loading: { textAlign: 'center', padding: '20px', color: '#555', fontSize: '1.1em' },
    error: { textAlign: 'center', padding: '15px', margin: '15px 0', color: 'red', border: '1px solid red', backgroundColor: '#ffebee', borderRadius: '4px' },
    success: { textAlign: 'center', padding: '15px', margin: '15px 0', color: 'green', border: '1px solid green', backgroundColor: '#e8f5e9', borderRadius: '4px' },
    infoText: { fontSize: '0.9em', color: '#666', margin: '5px 0' },
    section: { marginBottom: '25px', padding: '20px', border: '1px solid #eee', borderRadius: '6px', backgroundColor: '#fcfcfc' },
    sectionHeader: { marginTop: '0', marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px', fontSize: '1.3em', color: '#333' },
    inputGroup: { marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '4px' },
    label: { fontWeight: 500, fontSize: '0.9em', color: '#444' },
    input: { padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '1em' },
    textarea: { padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '1em', minHeight: '60px', resize: 'vertical' },
    checkboxGroup: { display: 'flex', alignItems: 'center', gap: '8px', margin: '10px 0' },
    checkbox: { marginRight: '5px'},
    button: { padding: '10px 18px', cursor: 'pointer', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', fontSize: '1em', transition: 'background-color 0.2s ease' },
    buttonDisabled: { backgroundColor: '#ccc', cursor: 'not-allowed' },
    statusMessage: { marginTop: '15px', padding: '10px', borderRadius: '4px', textAlign: 'center' },
    statusError: { backgroundColor: '#ffebee', color: '#c62828', border: '1px solid #ffcdd2' },
    statusSuccess: { backgroundColor: '#e8f5e9', color: '#2e7d32', border: '1px solid #c8e6c9' },
    divider: { border: 0, borderTop: '1px dashed #ccc', margin: '30px 0' },
    mainHeader: { marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px solid #ccc', color: '#333', fontSize: '1.5em' },
    repoNameLink: { fontWeight: 600, color: '#0366d6', textDecoration: 'none', '&:hover': { textDecoration: 'underline'} },
    topSection: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px', marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px dashed #eee', flexWrap: 'wrap' },
    collaboratorsSection: { flex: '1 1 300px', minWidth: '250px' },
    collaboratorsHeader: { margin: '0 0 8px 0', fontSize: '0.9em', color: '#586069', fontWeight: 600 },
    collaboratorsList: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexWrap: 'wrap', gap: '8px' },
    collaboratorItem: { display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.85em' },
    collaboratorAvatar: { width: '24px', height: '24px', borderRadius: '50%', border: '1px solid #eee' },
    rateLimitInfo: { textAlign: 'right', fontSize: '0.8em', color: '#666', flexShrink: 0, whiteSpace: 'nowrap', paddingTop: '5px' },
    contentSection: { marginTop: '15px' },
    contentHeader: { margin: '0 0 10px 0', fontSize: '1.2em', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '15px' },
    repoPathContainer: { display: 'flex', alignItems: 'center', gap: '0px', overflowWrap: 'break-word', flexGrow: 1, minWidth: 0 },
    breadcrumbSeparator: { margin: '0 4px', color: '#6a737d' },
    breadcrumbLink: { color: '#0366d6', textDecoration: 'none', '&:hover': { textDecoration: 'underline'} },
    breadcrumbCurrent: { color: '#111', fontWeight: 500},
    backButton: { padding: '6px 12px', cursor: 'pointer', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.9em', flexShrink: 0 },
    contentList: { listStyle: 'none', paddingLeft: '0', margin: '0' },
    contentItem: { padding: '8px 5px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95em', borderBottom: '1px solid #f0f0f0', '&:last-child': { borderBottom: 'none'} },
    contentItemLink: { cursor: 'pointer', textDecoration: 'none', color: '#0366d6', wordBreak: 'break-all', '&:hover': { textDecoration: 'underline'} },
    contentItemName: { flexGrow: 1 },
    contentItemNonLink: { color: '#333', wordBreak: 'break-all' },
    contentIcon: { width: '18px', height: '18px', flexShrink: 0, color: '#6a737d', textAlign: 'center'},
    fileContentDisplay: { marginTop: '15px', border: '1px solid #ddd', borderRadius: '4px', background: '#f6f8fa', maxHeight: '600px', overflow: 'auto' },
    fileHeader: {padding: '10px 15px', borderBottom: '1px solid #ddd', backgroundColor: '#efefef', fontSize: '0.9em', fontWeight: 500},
    preStyle: { margin: '0', padding: '15px', whiteSpace: 'pre-wrap', wordWrap: 'break-word', fontSize: '0.85em', lineHeight: 1.45 },
    codeStyle: { fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace', color: '#24292e' },
    contentError: { color: 'red', fontStyle: 'italic', margin: '10px 0', padding: '10px', backgroundColor: '#fff0f0', border: '1px solid #ffcccc', borderRadius: '4px' },

    // --- NEW: Commit History Styles ---
    commitsSection: { marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '20px' },
    commitsHeader: { margin: '0 0 15px 0', fontSize: '1.2em', color: '#333'},
    commitsList: { listStyle: 'none', padding: 0, margin: 0 },
    commitItem: {
        display: 'flex',
        gap: '15px',
        padding: '12px 5px',
        borderBottom: '1px solid #f0f0f0',
        '&:last-child': { borderBottom: 'none' },
        alignItems: 'flex-start',
    },
    commitAvatarContainer: { flexShrink: 0 },
    commitAvatar: {
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        backgroundColor: '#eee', // Placeholder bg
    },
    commitDetails: { flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 /* Prevent overflow issues */ },
    commitMessage: {
        fontWeight: 500,
        color: '#111',
        fontSize: '0.95em',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        cursor: 'default', // Indicate it's not clickable text itself, link is separate
    },
    commitMeta: {
        fontSize: '0.85em',
        color: '#586069',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '5px',
        alignItems: 'center',
    },
    commitAuthorLink: {
        fontWeight: 600,
        color: '#0366d6',
        textDecoration: 'none',
        '&:hover': { textDecoration: 'underline' },
    },
    commitShaLink: {
        fontFamily: 'monospace',
        fontSize: '0.9em',
        color: '#0366d6',
        textDecoration: 'none',
        '&:hover': { textDecoration: 'underline' },
        marginLeft: 'auto', // Push SHA to the right
        paddingLeft: '10px', // Space before SHA
        flexShrink: 0,
    },
     commitDate: { whiteSpace: 'nowrap' }, // Prevent date wrapping awkwardly
     commitError: { color: 'orange', fontStyle: 'italic', margin: '10px 0', padding: '10px', backgroundColor: '#fff8e1', border: '1px solid #ffecb3', borderRadius: '4px' },

  };

  // --- Helper Functions (Keep existing: getItemIcon, isBrowsable, renderBreadcrumbs) ---
  const getItemIcon = (type: RepoContentType['type']): string => { switch (type) { case 'dir': return '📁'; case 'file': return '📄'; case 'symlink': return '🔗'; case 'submodule': return '📦'; default: return '❓'; } };
  const isBrowsable = (type: RepoContentType['type']) => type === 'dir' || type === 'file';
  const renderBreadcrumbs = () => { /* ... existing renderBreadcrumbs logic ... */ const pathParts = currentPath ? currentPath.split('/') : []; const isFileView = fileContent !== null; return ( <> <span style={styles.breadcrumbSeparator}>/</span> {pathParts.map((part, index) => { const currentPartPath = pathParts.slice(0, index + 1).join('/'); const isLastPart = index === pathParts.length - 1; return ( <React.Fragment key={index}> {isLastPart ? ( <span style={styles.breadcrumbCurrent}>{part}</span> ) : ( <a href="#" onClick={(e) => { e.preventDefault(); loadContents(currentPartPath); }} style={styles.breadcrumbLink} > {part} </a> )} {!isLastPart && <span style={styles.breadcrumbSeparator}>/</span>} </React.Fragment> ); })} </> ); };

  // --- Helper Function: Format Date ---
  const formatCommitDate = (dateString?: string): string => {
    if (!dateString) return 'Unknown date';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
      });
    } catch (e) {
      return dateString; // Fallback to original string if parsing fails
    }
  };


  // --- JSX Rendering ---
  return (
    <div style={styles.container}>

        {/* --- Authentication Status --- */}
        {/* ... existing auth status JSX ... */}
        {isAuthLoading && <p style={styles.infoText}>Verifying authentication...</p>}
        {authError && <p style={{...styles.error, textAlign: 'left'}}>{authError}</p>}
        {authenticatedUser && !isAuthLoading && ( <p style={styles.infoText}>Authenticated as: <strong>{authenticatedUser.login}</strong></p> )}
        <p style={{...styles.infoText, color: 'red', fontWeight: 'bold'}}> ⚠️ Security Warning: Using a hardcoded PAT in frontend code is insecure. Use environment variables or a backend proxy in production. </p>

        <hr style={styles.divider} />

        {/* --- Section: Create New Repository --- */}
        {/* ... existing create repo JSX ... */}
        <div style={styles.section}> <h2 style={styles.sectionHeader}>Create New Repository</h2> {(!authenticatedUser && !isAuthLoading) && <p style={styles.infoText}>Authentication required to create repositories.</p>} {authenticatedUser && ( <> <div style={styles.inputGroup}> <label htmlFor="newRepoName" style={styles.label}>Repository Name *</label> <input id="newRepoName" type="text" value={newRepoName} onChange={(e) => setNewRepoName(e.target.value)} style={styles.input} placeholder="my-awesome-project" aria-required="true" disabled={isCreatingRepo} /> </div> <div style={styles.inputGroup}> <label htmlFor="newRepoDesc" style={styles.label}>Description (Optional)</label> <textarea id="newRepoDesc" value={newRepoDescription} onChange={(e) => setNewRepoDescription(e.target.value)} style={styles.textarea} placeholder="A short description of your project" disabled={isCreatingRepo} /> </div> <div style={styles.checkboxGroup}> <input id="newRepoPrivate" type="checkbox" checked={newRepoIsPrivate} onChange={(e) => setNewRepoIsPrivate(e.target.checked)} style={styles.checkbox} disabled={isCreatingRepo} /> <label htmlFor="newRepoPrivate" style={styles.label}> Make Private </label> </div> <button onClick={handleCreateRepo} disabled={isCreatingRepo || !authenticatedUser || isAuthLoading} style={{ ...styles.button, ...(isCreatingRepo || !authenticatedUser || isAuthLoading ? styles.buttonDisabled : {}) }} > {isCreatingRepo ? 'Creating...' : 'Create Repository'} </button> {createRepoStatus && ( <div style={{ ...styles.statusMessage, ...(createRepoStatus.type === 'error' ? styles.statusError : styles.statusSuccess) }}> {createRepoStatus.message} </div> )} </> )} </div>

        {/* --- Section: Add Collaborator --- */}
        {/* ... existing add collaborator JSX ... */}
        <div style={styles.section}> <h2 style={styles.sectionHeader}>Add Collaborator</h2> {(!authenticatedUser && !isAuthLoading) && <p style={styles.infoText}>Authentication required to add collaborators.</p>} {authenticatedUser && ( <> <p style={styles.infoText}>Add a collaborator to a repository owned by <strong>{authenticatedUser.login}</strong>.</p> <div style={styles.inputGroup}> <label htmlFor="targetRepo" style={styles.label}>Repository Name *</label> <input id="targetRepo" type="text" value={targetRepoForCollab} onChange={(e) => setTargetRepoForCollab(e.target.value)} style={styles.input} placeholder="repository-to-share" aria-required="true" disabled={isAddingCollaborator} /> </div> <div style={styles.inputGroup}> <label htmlFor="collabUsername" style={styles.label}>Collaborator's GitHub Username *</label> <input id="collabUsername" type="text" value={collaboratorUsername} onChange={(e) => setCollaboratorUsername(e.target.value)} style={styles.input} placeholder="github-friend" aria-required="true" disabled={isAddingCollaborator} /> </div> <button onClick={handleAddCollaborator} disabled={isAddingCollaborator || !authenticatedUser || isAuthLoading} style={{ ...styles.button, ...(isAddingCollaborator || !authenticatedUser || isAuthLoading ? styles.buttonDisabled : {}) }} > {isAddingCollaborator ? 'Adding...' : 'Add Collaborator'} </button> {addCollabStatus && ( <div style={{ ...styles.statusMessage, ...(addCollabStatus.type === 'error' ? styles.statusError : styles.statusSuccess) }}> {addCollabStatus.message} </div> )} </> )} </div>

        <hr style={styles.divider} />

        {/* --- Section: Repository Browser (Existing Component Logic) --- */}
        <h1 style={styles.mainHeader}>
            Browsing: <a href={`https://github.com/${browseUsername}/${browseRepoName}`} target="_blank" rel="noopener noreferrer" style={styles.repoNameLink}>{browseUsername}/{browseRepoName}</a>
        </h1>

        {/* Top Section: Collaborators & Rate Limit */}
        {/* ... existing top section JSX ... */}
        <div style={styles.topSection}> <div style={styles.collaboratorsSection}> <h4 style={styles.collaboratorsHeader}>Collaborators (Browsed Repo)</h4> {isCollaboratorsLoading && <p style={styles.infoText}>Loading collaborators...</p>} {collaboratorsError && <p style={{...styles.infoText, color: 'orange'}}>{collaboratorsError}</p>} {!isCollaboratorsLoading && !collaboratorsError && ( collaborators.length > 0 ? ( <ul style={styles.collaboratorsList}> {collaborators.map(collab => ( <li key={collab.id} style={styles.collaboratorItem} title={collab.login}> <a href={collab.html_url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: '#0366d6' }}> <img src={collab.avatar_url} alt={`${collab.login} avatar`} style={styles.collaboratorAvatar} /> {collab.login}</a> </li> ))} </ul> ) : ( <p style={styles.infoText}>No collaborators found or accessible for browsed repo.</p> ) )} </div> {currentRateLimit.limit !== null && ( <div style={styles.rateLimitInfo}> API Rate Limit: {currentRateLimit.remaining} / {currentRateLimit.limit} remaining. {currentRateLimit.remaining === 0 && currentRateLimit.reset && ` Resets at ${new Date(currentRateLimit.reset * 1000).toLocaleTimeString()}.`} </div> )} </div>

       {/* Initial Loading/Error for Browser Section */}
       {isLoading && <div style={styles.loading}>Loading repository data...</div>}
       {error && <div style={styles.error}>Error loading repository: {error}</div>}

       {/* Content Browsing UI (File/Directory Listing) */}
       {!isLoading && !error && (
           <div style={styles.contentSection}>
                {/* Header with Path Breadcrumbs and Back Button */}
                {/* ... existing content header JSX ... */}
                <div style={styles.contentHeader}> <div style={styles.repoPathContainer}> <a href="#" onClick={(e) => { e.preventDefault(); loadContents(''); }} title={`Back to root of ${browseRepoName}`} style={styles.breadcrumbLink}> {browseRepoName} </a> {renderBreadcrumbs()} </div> {(currentPath || fileContent !== null) && !isContentLoading && !isFileContentLoading && ( <button onClick={handleGoBack} style={styles.backButton} title="Go to parent directory"> ← Back </button> )} </div>

                {/* Subsequent Loading/Error Indicators */}
                {/* ... existing content loading/error JSX ... */}
                {isContentLoading && <div style={styles.loading}>Loading contents...</div>} {contentError && <div style={styles.contentError}>{contentError}</div>} {isFileContentLoading && <div style={styles.loading}>Loading file content...</div>} {fileContentError && <div style={styles.contentError}>{fileContentError}</div>}

                {/* File Content Display */}
                {/* ... existing file content display JSX ... */}
                {fileContent !== null && !isFileContentLoading && ( <div style={styles.fileContentDisplay}> <div style={styles.fileHeader}> Viewing: {currentPath.split('/').pop()} </div> <pre style={styles.preStyle}><code style={styles.codeStyle}>{fileContent}</code></pre> </div> )}

                {/* Directory Listing */}
                {/* ... existing directory listing JSX ... */}
                {!isContentLoading && !contentError && fileContent === null && !isFileContentLoading && !fileContentError && ( <ul style={styles.contentList}> {repoContents.length === 0 && currentPath && !isContentLoading && <li>Directory is empty.</li>} {repoContents.length === 0 && !currentPath && !isContentLoading && <li>Repository is empty or root contents failed to load.</li>} {repoContents.map((item) => ( <li key={item.sha} style={styles.contentItem}> <span style={styles.contentIcon}>{getItemIcon(item.type)}</span> {isBrowsable(item.type) ? ( <span style={styles.contentItemLink} onClick={() => handleContentItemClick(item)} onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') handleContentItemClick(item); }} role="button" tabIndex={0} title={item.path} className="content-item-name"> {item.name} </span> ) : ( <span style={styles.contentItemNonLink} className="content-item-name" title={item.path}> {item.name} <span style={{fontSize: '0.8em', color: '#888'}}>({item.type})</span> </span> )} </li> ))} </ul> )}
            </div>
       )}

        {/* --- NEW Section: Commit History --- */}
        {!isLoading && !error && ( // Only show commits section if initial repo load succeeded
            <div style={styles.commitsSection}>
                <h3 style={styles.commitsHeader}>Recent Commit History</h3>
                {isCommitsLoading && <div style={styles.loading}>Loading commit history...</div>}
                {commitsError && <div style={styles.commitError}>Error: {commitsError}</div>}
                {!isCommitsLoading && !commitsError && (
                    commits.length > 0 ? (
                        <ul style={styles.commitsList}>
                            {commits.map((commit) => {
                                // Try to get GitHub user info, fallback to git commit author info
                                const authorLogin = commit.author?.login;
                                const authorAvatar = commit.author?.avatar_url;
                                const authorHtmlUrl = commit.author?.html_url;
                                const authorName = commit.commit.author?.name ?? 'Unknown Author';
                                const commitDate = formatCommitDate(commit.commit.author?.date);
                                const commitMessage = commit.commit.message.split('\n')[0]; // First line only

                                return (
                                    <li key={commit.sha} style={styles.commitItem}>
                                        <div style={styles.commitAvatarContainer}>
                                            {authorAvatar ? (
                                                <a href={authorHtmlUrl ?? '#'} target="_blank" rel="noopener noreferrer" title={`View ${authorLogin || authorName} on GitHub`}>
                                                   <img src={authorAvatar} alt={`${authorLogin || authorName} avatar`} style={styles.commitAvatar} />
                                                </a>
                                            ) : (
                                                // Placeholder avatar maybe? Or just leave empty?
                                                <div style={styles.commitAvatar}></div>
                                            )}
                                        </div>
                                        <div style={styles.commitDetails}>
                                            <span style={styles.commitMessage} title={commit.commit.message}>
                                                {commitMessage}
                                            </span>
                                            <span style={styles.commitMeta}>
                                                {authorHtmlUrl ? (
                                                    <a href={authorHtmlUrl} target="_blank" rel="noopener noreferrer" style={styles.commitAuthorLink}>
                                                        {authorLogin || authorName}
                                                    </a>
                                                ) : (
                                                    <span style={{fontWeight: 600}}>{authorName}</span>
                                                )}
                                                <span>committed on</span>
                                                <span style={styles.commitDate}>{commitDate}</span>
                                            </span>
                                        </div>
                                         <a href={commit.html_url} target="_blank" rel="noopener noreferrer" style={styles.commitShaLink} title={`View commit ${commit.sha.substring(0,7)} on GitHub`}>
                                             {commit.sha.substring(0, 7)}
                                         </a>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <p style={styles.infoText}>No commit history found or accessible for this repository.</p>
                    )
                )}
                 {!isCommitsLoading && commits.length >= 30 && (
                     <p style={styles.infoText}>Showing the latest 30 commits. Full history available on GitHub.</p>
                 )}
            </div>
        )}

    </div> // End container
  );
}

export default GitHubRepoExplorer;
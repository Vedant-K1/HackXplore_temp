import { useRef, useState, useEffect } from "react";
import "./App.scss";
import { LiveAPIProvider } from "../contexts/LiveAPIContext";
import { Altair } from "../components/altair/Altair";
import InterviewControlTray from "../components/control-tray/IterviewControlTray";
import cn from "classnames";
import axios from "axios";
import { TfiCamera } from "react-icons/tfi";
import { useNavigate } from 'react-router-dom';
import { useToast, Box, Image, Flex, Text } from '@chakra-ui/react';
import jsonData from '../data/scenarios.json'
import img1 from '../assets/scenario/scenario1.png'
import img2 from '../assets/scenario/scenario2.jpg'
import img3 from '../assets/scenario/scenario3.jpg'
import img4 from '../assets/scenario/scenario4.jpg'
import img5 from '../assets/scenario/scenario5.jpg'
import img6 from '../assets/scenario/scenario6.jpg'
import human from '../assets/human.png'
import { TfiTimer } from "react-icons/tfi";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const host = "generativelanguage.googleapis.com";
const uri = `wss://${host}/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent`;

const imagePaths = [
    img1, img2, img3, img4, img5, img6,
];
const MultimodalLive = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [selectedScenario, setSelectedScenario] = useState(jsonData[0]);
    const [selectedImage, setSelectedImage] = useState(imagePaths[0]);
    const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
    const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
    const navigate = useNavigate();
    const toast = useToast();
    const [startTime, setStartTime] = useState<number>(0);
    const [elapsedTime, setElapsedTime] = useState<number>(0);
    const [timerRunning, setTimerRunning] = useState<boolean>(false);
    const timerRef = useRef<number | null>(null);

    const getRandomScenario = () => {
        const randomIndex = Math.floor(Math.random() * jsonData.length);
        const randomImageIndex = Math.floor(Math.random() * imagePaths.length);
        setSelectedScenario(jsonData[randomIndex]);
        setSelectedImage(imagePaths[randomImageIndex]);
    };

    useEffect(() => {
        getRandomScenario(); // Select a random scenario on load
    }, []);


    const startTimer = () => {
        setStartTime(Date.now());
        setTimerRunning(true);

        timerRef.current = window.setInterval(() => {
            setElapsedTime(prevTime => prevTime + 1000);
        }, 1000);
    };

    const stopTimer = () => {
        if (timerRef.current !== null) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        setTimerRunning(false);
    };

    const formatTime = (milliseconds: number) => {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    useEffect(() => {
        return () => {
            if (timerRef.current !== null) {
                clearInterval(timerRef.current);
            }
        };
    }, []);


    const startRecording = async () => {
        try {
            // Capture screen video and audio (including system audio)
            const screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: true, // System audio is captured if supported
            });
            setScreenStream(screenStream); // Save screen stream for later stopping

            // Capture microphone audio and video
            const userMediaStream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: true,
            });
            setVideoStream(userMediaStream);

            if (videoRef.current) {
                videoRef.current.srcObject = userMediaStream;
                videoRef.current.muted = true; // Prevent feedback
            }

            // Combine the screen and user microphone streams
            const audioContext = new AudioContext();
            const destination = audioContext.createMediaStreamDestination();

            // Create audio sources for both screen and microphone
            const screenAudioSource = audioContext.createMediaStreamSource(screenStream);
            const micAudioSource = audioContext.createMediaStreamSource(userMediaStream);

            // Connect the audio sources to the audio context's destination
            screenAudioSource.connect(destination);
            micAudioSource.connect(destination);

            // Now, the mixed audio is available in the destination.stream
            const combinedStream = new MediaStream([
                ...screenStream.getVideoTracks(), // Screen video
                ...userMediaStream.getVideoTracks(), // User video
                ...destination.stream.getAudioTracks(), // Mixed audio (screen + microphone)
            ]);

            // Initialize the media recorder
            const recorder = new MediaRecorder(combinedStream);
            setMediaRecorder(recorder);

            const chunks: Blob[] = [];
            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunks.push(event.data);
                }
            };

            recorder.onstop = async () => {
                const blob = new Blob(chunks, { type: "video/webm" });
                setRecordedBlob(blob);
                await sendVideoToBackend(blob);
                downloadVideo(blob);
            };

            recorder.start();
            setIsRecording(true);
            startTimer();
        } catch (error) {
            console.error("Error starting recording:", error);
        }
    };

    const stopRecording = () => {
        if (mediaRecorder && mediaRecorder.state === "recording") {
            mediaRecorder.stop();
        }

        if (screenStream) {
            screenStream.getTracks().forEach((track) => track.stop());
        }

        if (videoStream) {
            videoStream.getTracks().forEach((track) => track.stop());
        }
        setIsRecording(false);
        stopTimer();
    };

    const sendVideoToBackend = async (videoBlob: Blob) => {
        const formData = new FormData();
        formData.append("video_file", videoBlob, "recording.webm");

        try {
            const response = await axios.post("/api/student/analyze-conversation", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            // Check if the response status is 200 (successful)
            if (response.status === 200) {
                navigate('/');
                toast({
                    title: "Successfully analyzed",
                    description: "Your video was analyzed successfully.",
                    status: "success",
                    duration: 5000,
                    isClosable: true,
                });
            }
        } catch (error) {
            console.error("Error uploading video:", error);
            toast({
                title: "Error uploading video",
                description: "There was an issue uploading the video. Please try again.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        }
    };

    const downloadVideo = (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "recording.webm";
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="App">
            <LiveAPIProvider url={uri} apiKey={API_KEY}>
                <div className="streaming-console">
                    <main>
                        <div className="main-app-area" style={{ "fontFamily": "Jost" }}>
                            <Altair />
                            {/* Display video stream */}
                            <Flex>
                                <Box as="section" color="white" backgroundColor="#18181b" height="98vh" borderRadius="2xl" border="1px" style={{ "fontFamily": "Jost" }} width="32.33vw">
                                    <Box as="section" color="white" backgroundColor="#18181b" padding="30px" borderRadius="2xl" textAlign="center" fontSize="2xl">
                                        <h2 >{selectedScenario.title}</h2>
                                    </Box>
                                    <Box as="section" padding="12px" textAlign="center">
                                        <Image
                                            src={selectedImage}
                                            alt="Scenario Visual"
                                            boxSize="300px"
                                            objectFit="cover"
                                            borderRadius="lg"
                                            mx="auto"
                                        />
                                    </Box>
                                    <Box as="section" color="white" backgroundColor="#27272a" padding="12px" borderRadius="2xl" border="1px" margin="10px">
                                        <p color="white"><strong>Scenario:</strong> {selectedScenario.scenario}</p>
                                    </Box>
                                    <Box as="section" color="white" backgroundColor="#27272a" padding="12px" borderRadius="2xl" border="1px" margin="10px">
                                        <p color="white"><strong>AI Role:</strong> {selectedScenario.ai_role}</p>
                                    </Box>
                                    <Box as="section" color="white" backgroundColor="#27272a" padding="12px" borderRadius="2xl" border="1px" margin="10px">
                                        <p color="white"><strong>Student Role:</strong> {selectedScenario.student_role}</p>
                                    </Box>
                                </Box>
                                <Box as="section" color="white" backgroundColor="#27272a" borderRadius="2xl" height="98vh" border="1px" width="32.33vw" marginLeft="7px" marginRight="7px">
                                    <Box margin="15px" marginLeft="50px" display="flex" alignItems="center" justifyContent="center" height="100%">
                                        {videoStream ? (
                                            <video
                                                ref={videoRef}
                                                className={cn("stream", { hidden: !videoStream })}
                                                autoPlay
                                                playsInline
                                            />
                                        ) : (
                                            <Box border="1px" borderRadius="full" padding="20px" backgroundColor="#27272a" shadow="2xl">  
                                            <TfiCamera size="50px" color="gray"/>
                                            </Box>
                                        )}
                                    </Box>
                                </Box>

                                <Box as="section" color="white" backgroundColor="#27272a" height="98vh" borderRadius="2xl" border="1px" width="32.33vw">
                                    <Box as="section" color="white" backgroundColor="#27272a" padding="10px" borderRadius="2xl" border="1px" margin="10px">
                                        <Box as="section" padding="12px" textAlign="center">
                                            <Image
                                                src={human}
                                                alt="Scenario Visual"
                                                boxSize="150px"
                                                objectFit="cover"
                                                borderRadius="full"
                                                mx="auto"
                                            />
                                            <Text padding="30px" style={{ "fontFamily": "Jost" }}>Athena</Text>
                                        </Box>
                                    </Box>
                                    <Box as="section" color="white" backgroundColor="#27272a" padding="10px" borderRadius="2xl" border="1px" margin="10px">
                                        <Text>Guidelines : </Text>
                                        <Text color="white">
                                            1. AI analyzes tone, clarity, and confidence, so articulate your answers at a steady pace.<br />
                                            2.  Maintain eye contact with the camera and respond as if speaking to a human interviewer.<br />
                                            3. Express enthusiasm and confidence in your voice to make a positive impression.<br />
                                            4. Avoid using profanity or offensive language.<br />
                                            5. Ensure a stable internet connection, a working camera, microphone, and proper lighting. Use a quiet space for the interview.<br />
                                        </Text>
                                    </Box>

                                    <Box as="section" color="white" backgroundColor="#27272a" padding="10px" borderRadius="2xl" border="1px" margin="10px">
                                        <Flex>
                                            <Box margin="20px">
                                                <TfiTimer size="80px"
                                                /></Box>
                                            {/* <button onClick={startTimer} disabled={timerRunning}>Start Timer</button>
                                    <button onClick={stopTimer} disabled={!timerRunning}>Stop Timer</button> */}
                                            <Box marginTop="30px">
                                                <Text fontSize="3xl">Elapsed Time: {formatTime(elapsedTime)}</Text>
                                            </Box>
                                        </Flex>
                                    </Box>
                                </Box>
                            </Flex>

                        </div>

                        {/* Control tray */}
                        <InterviewControlTray
                            isRecording={isRecording}
                            startRecording={startRecording}
                            stopRecording={stopRecording}
                        />
                    </main>
                </div>
            </LiveAPIProvider>
        </div>
    );
};

export default MultimodalLive;

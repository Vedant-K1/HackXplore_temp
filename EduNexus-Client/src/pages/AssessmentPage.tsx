import { useEffect, useState } from "react";
import {
  Button,
  Flex,
  Heading,
  Text,
  VStack,
  Icon,
  Spinner,
  Box,
  Progress,
} from "@chakra-ui/react";
import { CheckCircleIcon, WarningIcon } from "@chakra-ui/icons";
import { useNavigate } from "react-router-dom";
import { RiRobot3Fill } from "react-icons/ri";
import axios from "axios";

const AssessmentPage = () => {
  const [phases, setPhases] = useState({
    TechnicalAssessment: false,
    SoftSkillAssessment: false,
    ScenarioBasedAssessment: false,
  });
  const [loading, setLoading] = useState(false);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [showPopup, setShowPopup] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAssessmentStatus = async () => {
      setLoading(true);
      try {
        const response = await axios.get("/api/job_seeker/assessment-status");
        const assessmentStatus = response.data;
        setPhases({
          TechnicalAssessment: assessmentStatus.technical_assessment.status === "Completed",
          SoftSkillAssessment: assessmentStatus.soft_skill_assessment.status === "Completed",
          ScenarioBasedAssessment: assessmentStatus.scenario_based_assessment.status === "Completed",
        });
      } catch (error) {
        console.error("Error fetching assessment status:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssessmentStatus();
  }, []);

  useEffect(() => {
    if (Object.values(phases).every((phase) => phase)) {
      navigate("/job-seeker/job-roles");
    }
  }, [phases, navigate]);

  useEffect(() => {
    const incompletePhaseIndex = Object.values(phases).findIndex((phase) => !phase);
    if (incompletePhaseIndex !== -1) {
      setCurrentPhaseIndex(incompletePhaseIndex);
    }
  }, [phases]);

  const phaseDescriptions = [
    {
      name: "TechnicalAssessment",
      description: "A multiple-choice question assessment designed to evaluate your technical knowledge.",
    },
    {
      name: "SoftSkillAssessment",
      description: "A test aimed at evaluating essential soft skills for your career.",
    },
    {
      name: "ScenarioBasedAssessment",
      description: "An AI-driven interactive assessment using real-world scenarios.",
    },
  ];

  const aiMessages = [
    "Let's get started with your Technical Assessment!",
    "Next, complete the Soft Skill Assessment to proceed.",
    "Finally, finish the Scenario Based Assessment to complete your journey!",
  ];

  const handleCompletePhase = (phaseName) => {
    if (phaseName === "TechnicalAssessment") {
      navigate("/job-seeker/technical-quiz");
    } else if (phaseName === "SoftSkillAssessment") {
      navigate("/job-seeker/soft-skill-quiz");
    } else if (phaseName === "ScenarioBasedAssessment") {
      navigate("/job-seeker/roleplay-exercise");
    }
  };

  const renderPhase = (phase, index) => {
    const isCompleted = phases[phase.name];
    const isActive = index === currentPhaseIndex;

    return (
      <Box
        key={phase.name}
        bg={isCompleted ? "purple.100" : isActive ? "purple.200" : "purple.50"}
        p={5}
        borderRadius="lg"
        shadow="md"
        w="100%"
        mb={4}
        opacity={isActive || isCompleted ? 1 : 0.5}
      >
        <Text fontSize="2xl" fontWeight="bold" color="purple.700" mb={2}>
          Phase {index + 1}: {phase.name.replace(/([A-Z])/g, " $1")}
        </Text>
        <Text color="gray.600" mb={4}>
          {phase.description}
        </Text>
        <Flex align="center" justify="space-between">
          {isCompleted ? (
            <>
              <Icon as={CheckCircleIcon} color="green.500" boxSize={6} />
              <Text color="green.500" fontWeight="bold">
                Completed
              </Text>
            </>
          ) : (
            <>
              <Icon as={WarningIcon} color="red.500" boxSize={6} />
              <Text color="red.500" fontWeight="bold">
                Not Completed
              </Text>
            </>
          )}
          {!isCompleted && (
            <Button colorScheme="purple" size="sm" onClick={() => handleCompletePhase(phase.name)}>
              Complete Now
            </Button>
          )}
        </Flex>
      </Box>
    );
  };

  if (loading) {
    return (
      <Flex direction="column" align="center" justify="center" minHeight="100vh" bg="purple.50">
        <Progress hasStripe isIndeterminate size="lg" colorScheme="purple" width="80%" mb={6} />
        <Text fontSize="lg" color="purple.700">
          Fetching your assessment details...
        </Text>
      </Flex>
    );
  }

  const completedPhases = Object.values(phases).filter((phase) => phase).length;
  const totalPhases = Object.keys(phases).length;

  return (
    <Flex direction="column" align="center" p={6} bg="purple.50" minHeight="100vh">
      <Heading mb={6} color="purple.700">
        Assessment Phases
      </Heading>
      <Progress
        hasStripe
        value={(completedPhases / totalPhases) * 100}
        size="lg"
        colorScheme="purple"
        width="100%"
        mb={6}
      />
      {showPopup && (
        <Box
          position="fixed"
          right="0"
          top="20%"
          bg="purple.600"
          color="white"
          p={4}
          borderTopLeftRadius="md"
          borderBottomLeftRadius="md"
          boxShadow="lg"
          zIndex="1000"
        >
          <Flex align="center">
            <Icon as={RiRobot3Fill} color="white" boxSize={6} mr={2} />
            <Text fontSize="lg" fontWeight="bold">
              {aiMessages[currentPhaseIndex]}
            </Text>
          </Flex>
        </Box>
      )}
      <VStack w="full" maxW="600px">
        {phaseDescriptions.map((phase, index) => renderPhase(phase, index))}
      </VStack>
    </Flex>
  );
};

export default AssessmentPage;

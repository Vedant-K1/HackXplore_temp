import React, { useState } from 'react';
import {
  Box,
  Text,
  Stack,
  Heading,
  Image,
  Card,
  CardBody,
  CardFooter,
  Button,
  useColorModeValue,
  Divider,
  ButtonGroup,
  Flex,
} from '@chakra-ui/react';
import { StarIcon } from '@chakra-ui/icons';
import image1 from '../../../assets/cards/image1.jpg';
import image2 from '../../../assets/cards/image2.jpg';
import image3 from '../../../assets/cards/image3.jpg';
import image4 from '../../../assets/cards/image4.jpg';
import image5 from '../../../assets/cards/image5.jpg';
import image6 from '../../../assets/cards/image6.jpg';
import image7 from '../../../assets/cards/image7.jpg';
import image8 from '../../../assets/cards/image8.jpg';
import image9 from '../../../assets/cards/image9.jpg';
import image10 from '../../../assets/cards/image10.jpg';

interface CourseCardProps {
  moduleTopic: string;
  moduleSummary: string;
}

const RecommendedCard: React.FC<CourseCardProps> = ({ moduleTopic, moduleSummary }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isFilled, setIsFilled] = useState(false);

  const images = [image1, image2, image3, image4, image5, image6, image7, image8, image9, image10];
  const randomImage = images[Math.floor(Math.random() * images.length)];

  const handleIconClick = () => {
    setIsFilled(!isFilled);
  };

  const StarRating: React.FC<{ rating: number }> = ({ rating }) => {
    return (
      <Flex>
        {[...Array(5)].map((_, i) => (
          <StarIcon key={i} color={i < rating ? 'yellow.500' : 'gray.200'} boxSize={5} mr={1} />
        ))}
      </Flex>
    );
  };

  return (
    <Box boxShadow="lg" rounded="md" overflow="hidden">
      <Card onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
        <CardBody position="relative">
          <Image
            src={randomImage}
            alt="Random"
            borderRadius="lg"
            objectFit="cover"
            h="290px"
            w="100%"
          />
          <Stack mt="6" spacing="3">
            <Flex justify="space-between" align="center">
              <Heading size="md">{moduleTopic}</Heading>
              <StarRating rating={4} />
            </Flex>
            <Text>{moduleSummary}</Text>
          </Stack>
          {isHovered && (
            <Box
              position="absolute"
              bottom="0"
              left="50%"
              width="100%"
              height="6px"
              bg="purple.400"
              transform="translateX(-50%)"
              transition="width 0.5s ease, transform 0.5s ease"
            />
          )}
        </CardBody>
        <Divider />
        <CardFooter>
          <ButtonGroup spacing="2" justifyContent="center">
            <Button
              variant="solid"
              bg="purple.400"
              color={useColorModeValue('white', 'white')}
              _hover={{
                bg: useColorModeValue('purple.600', 'purple.600'),
                transform: 'scale(1.05)',
              }}
            >
              Get Started
            </Button>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="30"
              height="30"
              fill={isFilled ? 'red' : 'gray'}
              onClick={handleIconClick}
              style={{ cursor: 'pointer' }}
              viewBox="0 0 16 16"
            >
              <path
                fillRule="evenodd"
                d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314z"
              />
            </svg>
          </ButtonGroup>
        </CardFooter>
      </Card>
    </Box>
  );
};

export default RecommendedCard;

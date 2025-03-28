import React, { useState } from 'react';
import {
  Box, Stack, Heading, Image, Card, CardBody, CardFooter, Button, Divider, ButtonGroup, Flex, Center, Grid
} from '@chakra-ui/react';
import { useColorModeValue } from '@chakra-ui/react';
import courseraLogo from '../assets/cards/coursera.png'; // Import Coursera icon
import upgradLogo from '../assets/cards/upgrad.jpg'; // Import upGrad icon
import image1 from '../assets/cards/image1.jpg';
import image2 from '../assets/cards/image2.jpg';
import image3 from '../assets/cards/image3.jpg';
import image4 from '../assets/cards/image4.jpg';
import image5 from '../assets/cards/image5.jpg';
import image6 from '../assets/cards/image6.jpg';
import image7 from '../assets/cards/image7.jpg';
import image8 from '../assets/cards/image8.jpg';
import image9 from '../assets/cards/image9.jpg';
import image10 from '../assets/cards/image10.jpg';

interface CourseCardProps {
  source: string;
  title: string;
  link: string;
}

const RecommendedCard: React.FC<CourseCardProps> = ({ source, title, link }) => {
  const [isHovered, setIsHovered] = useState(false);

  const images = [image1, image2, image3, image4, image5, image6, image7, image8, image9, image10];
  const randomIndex = Math.floor(Math.random() * images.length);
  const randomImage = images[randomIndex];

  // Map source names to their corresponding icons
  const sourceIcons: { [key: string]: string } = {
    Coursera: courseraLogo,
    upGrad: upgradLogo,
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);

  return (
    <Box boxShadow='lg' rounded='md' position="relative" w="85%" overflow="hidden">
      <Card onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        <CardBody>
          <Flex direction="column" justify="space-between">
            <Image
              src={randomImage}
              alt='Random Image'
              borderRadius='lg'
              h="230px"
            />
            <Stack mt='3' spacing='3'>
              <Stack direction="row" align="center" spacing="2">
                <Image
                  src={courseraLogo}
                  alt={`${source} logo`}
                  boxSize="30px"
                />
                <Heading size='md'>{title}</Heading>
              </Stack>
            </Stack>
          </Flex>
        </CardBody>
        <Divider />
        <CardFooter>
          <ButtonGroup spacing='2' justifyContent="center">
            <Button
              as="a"
              href={link}
              target="_blank"
              variant='solid'
              bg={'purple.400'}
              color={useColorModeValue('white', 'white')}
              _hover={{
                bg: useColorModeValue('purple.600', 'purple.600'),
                color: useColorModeValue('white', 'white'),
                transform: "scale(1.05)",
              }}
            >
              Start Learning
            </Button>
          </ButtonGroup>
        </CardFooter>
      </Card>
    </Box>
  );
};

export default RecommendedCard;

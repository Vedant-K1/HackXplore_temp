import React, { useState } from 'react';
import { Image, Button, Box } from "@chakra-ui/react";

// Define the props type
interface SlideshowProps {
  images: string[];
}

const Slideshow: React.FC<SlideshowProps> = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToNextImage = () => {
    setCurrentIndex((prevIndex) => (prevIndex === images.length - 1 ? 0 : prevIndex + 1));
  };

  const goToPreviousImage = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? images.length - 1 : prevIndex - 1));
  };

  return (
    <Box p={5}>
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height={{ base: '200px', md: '400px', lg: '500px' }}  // Adjust height as needed
        mb={4}
      >
        {images.map((image, index) => (
          <Image
            key={index}
            src={image}
            boxSize={{ base: '100px', md: '300px', lg: '500px' }}  // Adjust size as needed
            alt={`Slide ${index}`}
            display={index === currentIndex ? 'block' : 'none'}
            objectFit="cover"  // Ensure the image fits the container
          />
        ))}
      </Box>

      <Button
        mt={2}
        onClick={goToPreviousImage}
        color="white"
        rounded="md"
        _hover={{
          transform: "translateY(-2px)",
          boxShadow: "md",
          transition: "transform 0.3s ease",
          bg: "purple.600"
        }}
        bg="purple.400"
      >
        Previous
      </Button>

      <Button
        mt={2}
        onClick={goToNextImage}
        style={{ float: "right" }}
        color="white"
        rounded="md"
        _hover={{
          transform: "translateY(-2px)",
          boxShadow: "md",
          transition: "transform 0.3s ease",
          bg: "purple.600"
        }}
        bg="purple.400"
      >
        Next
      </Button>
    </Box>
  );
};

export default Slideshow;

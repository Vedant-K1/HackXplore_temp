import {
    Heading,
    SlideFade,
    Grid,
    Center,
} from '@chakra-ui/react';
import RecommendedCard from '../../components/RecommendedCard';

export const RecommendCourses = ({ recommendedCourses }) => {

    return (
        <>
        <Center><Heading mb={4}>Top Recommendations for You</Heading></Center>
        <Grid templateColumns={{ base: "repeat(1, 1fr)", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" }} gap={6}>
          {recommendedCourses.map((course, index) => (
            <SlideFade in={true} transition={{ enter: { duration: 0.7 } }} offsetY='50px' key={index}>
              <RecommendedCard
                source={course.source}
                title={course.title}
                link={course.link}
              />
            </SlideFade>
          ))}
        </Grid>
      </>
    );
};
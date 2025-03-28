import { Box} from '@chakra-ui/react';
import { LabrenderMarkdown } from '../renderMarkdown';

interface LabManualContentProps {
  markdownText: string;
  imageList: string[];
}

const LabManualContent: React.FC<LabManualContentProps> = ({ markdownText, imageList }) => {
  console.log(imageList.length)
  return (
    <Box p={8} width={'full'} display="flex" overflow={"scroll"}>
      <Box bg={'white'} p={8} borderRadius={"30"}>
        {LabrenderMarkdown(markdownText, imageList)}
      </Box>
    </Box>
  );
};

export default LabManualContent;
